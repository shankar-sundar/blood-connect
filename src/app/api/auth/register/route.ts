import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { query, queryOne } from '@/lib/db'
import { signToken } from '@/lib/jwt'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { role, email, password, ...rest } = body

  const existing = await queryOne('SELECT id FROM profiles WHERE email = $1', [email])
  if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 400 })

  const password_hash = await bcrypt.hash(password, 10)

  let profile: { id: string; role: string }

  if (role === 'donor') {
    const rows = await query<{ id: string; role: string }>(
      `INSERT INTO profiles
         (role, email, password_hash, first_name, last_name, mobile, blood_group, city, lat, lng, dob, gender, available)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING id, role`,
      [role, email, password_hash, rest.first_name, rest.last_name, rest.mobile,
       rest.blood_group, rest.city, rest.lat || null, rest.lng || null, rest.dob, rest.gender, true]
    )
    profile = rows[0]
  } else {
    const rows = await query<{ id: string; role: string }>(
      `INSERT INTO profiles
         (role, email, password_hash, org_name, org_type, mobile, address, city, license_no)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, role`,
      [role, email, password_hash, rest.org_name, rest.org_type, rest.mobile,
       rest.address, rest.city, rest.license_no]
    )
    profile = rows[0]
  }

  const token = await signToken({ id: profile.id, role: profile.role })
  const res = NextResponse.json({ ok: true, role: profile.role })
  res.cookies.set('token', token, { httpOnly: true, sameSite: 'strict', path: '/', maxAge: 60 * 60 * 24 * 7 })
  return res
}
