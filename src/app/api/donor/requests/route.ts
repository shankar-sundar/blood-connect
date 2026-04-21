import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { query, queryOne } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await queryOne<{ blood_group: string; city: string }>(
    'SELECT blood_group, city FROM profiles WHERE id = $1',
    [session.id]
  )
  if (!profile) return NextResponse.json([])

  const requests = await query(
    `SELECT br.id, br.blood_group, br.units, br.component, br.urgency, br.urgency_rank,
            br.description, br.created_at,
            json_build_object('org_name', p.org_name, 'address', p.address, 'city', p.city) AS hospitals
     FROM blood_requests br
     JOIN profiles p ON p.id = br.hospital_id
     WHERE br.status = 'open'
       AND br.blood_group = $1
       AND lower(trim(p.city)) = lower(trim($2))
     ORDER BY br.urgency_rank ASC, br.created_at DESC`,
    [profile.blood_group, profile.city ?? '']
  )
  return NextResponse.json(requests)
}
