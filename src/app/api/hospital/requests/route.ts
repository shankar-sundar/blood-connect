import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { query } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const requests = await query(
    `SELECT br.*,
       coalesce(
         json_agg(
           json_build_object(
             'id', a.id,
             'status', a.status,
             'donor', json_build_object(
               'first_name', p.first_name,
               'last_name', p.last_name,
               'mobile', p.mobile
             )
           )
         ) FILTER (WHERE a.id IS NOT NULL),
         '[]'
       ) AS acceptances
     FROM blood_requests br
     LEFT JOIN acceptances a ON a.request_id = br.id
     LEFT JOIN profiles p ON p.id = a.donor_id
     WHERE br.hospital_id = $1 AND br.status = 'open'
     GROUP BY br.id
     ORDER BY br.urgency_rank ASC, br.created_at DESC`,
    [session.id]
  )
  return NextResponse.json(requests)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { blood_group, units, component, urgency, description, patient_name } = await req.json()
  const urgency_rank = ({ critical: 1, urgent: 2, scheduled: 3 } as Record<string, number>)[urgency] ?? 3

  await query(
    `INSERT INTO blood_requests (hospital_id, blood_group, units, component, urgency, urgency_rank, description, patient_name, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'open')`,
    [session.id, blood_group, units, component, urgency, urgency_rank, description, patient_name]
  )
  return NextResponse.json({ ok: true })
}
