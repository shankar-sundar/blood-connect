import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { query, queryOne } from '@/lib/db'
import { DonorDashboardClient } from '@/components/donor/dashboard-client'

export default async function DonorDashboardPage() {
  const session = await getSession()
  if (!session) redirect('/sign-in')

  const profile = await queryOne<{
    id: string; first_name: string; last_name: string
    blood_group: string; city: string; available: boolean
  }>(
    'SELECT id, first_name, last_name, blood_group, city, available FROM profiles WHERE id = $1',
    [session.id]
  )
  if (!profile) redirect('/register')

  const [requests, acceptedRequests] = await Promise.all([
    query(
      `SELECT br.id, br.blood_group, br.units, br.component, br.urgency, br.urgency_rank,
              br.description, br.created_at,
              json_build_object('org_name', p.org_name, 'address', p.address, 'city', p.city) AS hospitals
       FROM blood_requests br
       JOIN profiles p ON p.id = br.hospital_id
       WHERE br.status = 'open'
         AND br.blood_group = $1
         AND lower(trim(p.city)) = lower(trim($2))
         AND br.id NOT IN (
           SELECT request_id FROM acceptances WHERE donor_id = $3 AND status = 'accepted'
         )
       ORDER BY br.urgency_rank ASC, br.created_at DESC`,
      [profile.blood_group, profile.city ?? '', session.id]
    ),
    query(
      `SELECT a.id AS acceptance_id, br.id, br.blood_group, br.units, br.component,
              br.urgency, br.urgency_rank, br.description, br.created_at,
              json_build_object('org_name', p.org_name, 'address', p.address, 'city', p.city) AS hospitals
       FROM acceptances a
       JOIN blood_requests br ON br.id = a.request_id
       JOIN profiles p ON p.id = br.hospital_id
       WHERE a.donor_id = $1 AND a.status = 'accepted' AND br.status = 'open'
       ORDER BY br.urgency_rank ASC, br.created_at DESC`,
      [session.id]
    ),
  ])

  const donations = await query(
    `SELECT a.id, a.created_at, a.status,
       json_build_object(
         'blood_group', br.blood_group,
         'created_at', br.created_at,
         'hospitals', json_build_object('org_name', p.org_name)
       ) AS blood_requests
     FROM acceptances a
     JOIN blood_requests br ON br.id = a.request_id
     JOIN profiles p ON p.id = br.hospital_id
     WHERE a.donor_id = $1 AND a.status IN ('donated', 'rejected')
     ORDER BY a.created_at DESC`,
    [session.id]
  )

  return <DonorDashboardClient profile={profile} requests={requests as any} acceptedRequests={acceptedRequests as any} donations={donations as any} />
}
