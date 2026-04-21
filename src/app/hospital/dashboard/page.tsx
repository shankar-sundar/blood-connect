import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { query, queryOne } from '@/lib/db'
import { HospitalDashboardClient } from '@/components/hospital/dashboard-client'

export default async function HospitalDashboardPage() {
  const session = await getSession()
  if (!session) redirect('/sign-in')
  if (session.role !== 'hospital') redirect('/donor/dashboard')

  const profile = await queryOne<{ id: string; org_name: string; org_type: string; city: string }>(
    'SELECT id, org_name, org_type, city FROM profiles WHERE id = $1',
    [session.id]
  )
  if (!profile) redirect('/sign-in')

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

  return <HospitalDashboardClient profile={profile} requests={requests as any} />
}
