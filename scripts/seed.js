// Run: npm run seed
const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
const { randomUUID } = require('crypto')
const fs = require('fs')
const path = require('path')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

const BG         = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
const URGENCIES  = [{ urgency: 'critical', rank: 1 }, { urgency: 'urgent', rank: 2 }, { urgency: 'scheduled', rank: 3 }]
const COMPONENTS = ['Whole Blood', 'Packed RBCs', 'Platelets', 'Fresh Frozen Plasma']
const daysAgo    = (n) => new Date(Date.now() - n * 86_400_000)

// ─── City configuration ────────────────────────────────────────────────────
//  D = donations per test donor (shows as donation history count)
//  Partial requests: units=2, gets 1 donated acceptance → partial (1 < 2)
//  Completed requests: units=1, gets 1 donated acceptance → completed (1 >= 1)
//  "Pending donor" requirement: first partial of every hospital gets one
//    status='accepted' entry from a dedicated test donor (verified no conflict).
//  When test donation budget < open request slots, "sys" filler donors are
//  created to populate remaining completed requests (Bangalore only).
const CITIES = [
  { name: 'Hyderabad', numH: 3,  numD: 25, D: 1, noMatch: 2, partial: 3, completed: 4  },
  { name: 'Bangalore', numH: 10, numD: 30, D: 3, noMatch: 5, partial: 7, completed: 14 },
  { name: 'Kolkata',   numH: 4,  numD: 30, D: 2, noMatch: 3, partial: 4, completed: 8  },
]

async function seedCity(client, cfg, hash) {
  const { name, numH, numD, D, noMatch, partial: P, completed: C } = cfg
  const slug = name.toLowerCase()

  // ── Hospitals ──────────────────────────────────────────────────────────
  const hospitalIds = []
  for (let i = 1; i <= numH; i++) {
    const id = randomUUID()
    hospitalIds.push(id)
    await client.query(
      `INSERT INTO profiles (id,role,password_hash,org_name,org_type,email,city,mobile)
       VALUES ($1,'hospital',$2,$3,'General Hospital',$4,$5,$6)`,
      [id, hash, `${name} Hospital ${i}`, `hospital${i}.${slug}@test.com`,
       name, `9${String(slug.charCodeAt(0)%10)}${String(i).padStart(8,'0')}`]
    )
  }

  // ── Test donors ────────────────────────────────────────────────────────
  const donorIds = []
  for (let i = 1; i <= numD; i++) {
    const id = randomUUID()
    donorIds.push(id)
    await client.query(
      `INSERT INTO profiles (id,role,password_hash,first_name,last_name,blood_group,email,city,available,gender,dob,mobile)
       VALUES ($1,'donor',$2,$3,$4,$5,$6,$7,true,'Male','1990-01-01',$8)`,
      [id, hash, `Donor${i}`, name, BG[(i-1)%8],
       `donor${i}.${slug}@test.com`, name,
       `8${String(slug.charCodeAt(0)%10)}${String(i).padStart(8,'0')}`]
    )
  }

  // ── Blood requests ─────────────────────────────────────────────────────
  const partialIds   = []  // open, units=2, will receive 1 donated → partial
  const completedIds = []  // open, units=1, will receive 1 donated → completed

  for (let h = 0; h < numH; h++) {
    const hId = hospitalIds[h]
    const bg   = (n) => BG[(h * 2 + n) % 8]
    const urg  = (n) => URGENCIES[(h + n) % 3]
    const comp = (n) => COMPONENTS[(h + n) % 4]

    for (let r = 0; r < noMatch; r++) {
      await client.query(
        `INSERT INTO blood_requests (id,hospital_id,blood_group,units,component,urgency,urgency_rank,description,status)
         VALUES ($1,$2,$3,4,$4,$5,$6,$7,'open')`,
        [randomUUID(), hId, bg(r), comp(r), urg(r).urgency, urg(r).rank,
         `${bg(r)} needed — ${name} Hospital ${h+1}`]
      )
    }

    for (let r = 0; r < P; r++) {
      const id = randomUUID()
      partialIds.push(id)
      await client.query(
        `INSERT INTO blood_requests (id,hospital_id,blood_group,units,component,urgency,urgency_rank,description,status)
         VALUES ($1,$2,$3,2,$4,$5,$6,$7,'open')`,
        [id, hId, bg(r+1), comp(r+1), urg(r+1).urgency, urg(r+1).rank,
         `${bg(r+1)} required for procedure — ${name} Hospital ${h+1}`]
      )
    }

    for (let r = 0; r < C; r++) {
      const id = randomUUID()
      completedIds.push(id)
      await client.query(
        `INSERT INTO blood_requests (id,hospital_id,blood_group,units,component,urgency,urgency_rank,description,status)
         VALUES ($1,$2,$3,1,$4,$5,$6,$7,'open')`,
        [id, hId, bg(r+2), comp(r+2), urg(r+2).urgency, urg(r+2).rank,
         `${bg(r+2)} critical shortage — ${name} Hospital ${h+1}`]
      )
    }
  }

  // ── Donation slot distribution ─────────────────────────────────────────
  // Budget: numD * D total test-donor donations
  // Fill partials first (all of them), then as many completeds as budget allows,
  // then historical closed requests to absorb any remaining budget.
  const budget           = numD * D
  const openNeeded       = partialIds.length + completedIds.length
  const openFromTest     = Math.min(budget, openNeeded)
  const completedFromTest = Math.max(0, openFromTest - partialIds.length)
  const historicalNeeded = budget - openFromTest

  // Create historical closed requests to absorb leftover budget
  const historicalIds = []
  for (let i = 0; i < historicalNeeded; i++) {
    const id = randomUUID()
    historicalIds.push(id)
    await client.query(
      `INSERT INTO blood_requests (id,hospital_id,blood_group,units,component,urgency,urgency_rank,description,status,created_at)
       VALUES ($1,$2,$3,1,$4,'scheduled',3,$5,'closed',$6)`,
      [id, hospitalIds[i % numH], BG[i%8], COMPONENTS[i%4],
       `Historical donation — ${name} Hospital ${(i%numH)+1}`, daysAgo(120 + i*10)]
    )
  }

  // Build the ordered slot list for round-robin assignment.
  // testSlots[d + j*numD] is the request donor[d] donates to on their j-th donation.
  // Because each request appears exactly once, no donor donates to the same request twice.
  const testSlots = [
    ...partialIds,
    ...completedIds.slice(0, completedFromTest),
    ...historicalIds,
  ]  // length === budget

  for (let d = 0; d < numD; d++) {
    for (let j = 0; j < D; j++) {
      const idx = d + j * numD
      await client.query(
        `INSERT INTO acceptances (id,request_id,donor_id,status,created_at)
         VALUES ($1,$2,$3,'donated',$4)`,
        [randomUUID(), testSlots[idx], donorIds[d], daysAgo(120 + j * 30)]
      )
    }
  }

  // ── Filler donors for remaining completed requests (Bangalore only) ────
  // These are system profiles (sys{n}.{city}@test.com) that populate
  // completed requests beyond the test-donor budget. They are marked
  // available=false and are not primary test accounts.
  let fillerCount = 0
  for (let i = completedFromTest; i < completedIds.length; i++) {
    const fillId = randomUUID()
    fillerCount++
    await client.query(
      `INSERT INTO profiles (id,role,password_hash,first_name,last_name,blood_group,email,city,available,gender,dob,mobile)
       VALUES ($1,'donor',$2,'Sys','Donor',$3,$4,$5,false,'Male','1990-01-01','0000000000')`,
      [fillId, hash, BG[i%8], `sys${fillerCount}.${slug}@test.com`, name]
    )
    await client.query(
      `INSERT INTO acceptances (id,request_id,donor_id,status,created_at)
       VALUES ($1,$2,$3,'donated',$4)`,
      [randomUUID(), completedIds[i], fillId, daysAgo(150)]
    )
  }

  // ── Pending donor per hospital (status='accepted') ─────────────────────
  // Adds one unresolved accepted acceptance to the first partial request of
  // every hospital. Uses the last test donor — analytically verified to not
  // conflict with any donated entry assigned above (for all three cities).
  const pendingDonorId = donorIds[numD - 1]
  for (let h = 0; h < numH; h++) {
    await client.query(
      `INSERT INTO acceptances (id,request_id,donor_id,status,created_at)
       VALUES ($1,$2,$3,'accepted', now() - interval '2 hours')
       ON CONFLICT (request_id,donor_id) DO NOTHING`,
      [randomUUID(), partialIds[h * P], pendingDonorId]
    )
  }

  return fillerCount
}

async function seed() {
  const client = await pool.connect()
  const hash   = await bcrypt.hash('Test@1234', 10)

  try {
    await client.query('BEGIN')
    await client.query('DELETE FROM acceptances')
    await client.query('DELETE FROM blood_requests')
    await client.query('DELETE FROM profiles')
    console.log('✓ Cleared existing data\n')

    const lines = []
    const log = (line = '') => { console.log(line); lines.push(line) }

    log(`Seed run: ${new Date().toISOString()}`)
    log(`Password for all accounts: Test@1234`)
    log()

    for (const cfg of CITIES) {
      const { name, numH, numD, D, noMatch, partial: P, completed: C } = cfg
      const fillers = await seedCity(client, cfg, hash)
      const requests = numH * (noMatch + P + C)
      const hist = Math.max(0, numD * D - Math.min(numD * D, numH * (P + C)))
      log(`${name}`)
      log(`  hospitals : ${numH}  (hospital1.${name.toLowerCase()}@test.com … hospital${numH}.${name.toLowerCase()}@test.com)`)
      log(`  donors    : ${numD}  (donor1.${name.toLowerCase()}@test.com … donor${numD}.${name.toLowerCase()}@test.com)`)
      log(`  requests  : ${requests} open (${numH*noMatch} no-match, ${numH*P} partial, ${numH*C} completed)${hist > 0 ? ` + ${hist} historical closed` : ''}`)
      log(`  history   : ${D} donation(s) per donor`)
      if (fillers > 0) log(`  sys donors: ${fillers} (populate completed requests beyond donor budget)`)
      log()
    }

    await client.query('COMMIT')
    log('Seed complete.')

    const outPath = path.join(__dirname, 'seed-summary.txt')
    fs.writeFileSync(outPath, lines.join('\n') + '\n')
    console.log(`\n✓ Summary written to scripts/seed-summary.txt`)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

seed().catch((err) => { console.error(err); process.exit(1) })
