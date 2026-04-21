import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { query, queryOne } from '@/lib/db'
import { AdminDashboardClient } from '@/components/admin/dashboard-client'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean)

export default async function AdminDashboardPage() {
  const session = await getSession()
  if (!session) redirect('/sign-in')

  const profile = await queryOne<{ email: string }>(
    'SELECT email FROM profiles WHERE id = $1',
    [session.id]
  )

  if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(profile?.email ?? '')) {
    redirect('/donor/dashboard')
  }

  const [donors, hospitals, openRequests, recentDonations, criticalRequests] = await Promise.all([
    query('SELECT blood_group, city, available FROM profiles WHERE role = $1', ['donor']),
    query('SELECT id FROM profiles WHERE role = $1', ['hospital']),
    query(
      `SELECT br.blood_group, br.urgency, json_build_object('city', p.city) AS hospitals
       FROM blood_requests br JOIN profiles p ON p.id = br.hospital_id
       WHERE br.status = 'open'`
    ),
    query(
      `SELECT a.created_at,
         json_build_object(
           'blood_group', br.blood_group,
           'hospitals', json_build_object('org_name', p.org_name, 'city', p.city)
         ) AS blood_requests
       FROM acceptances a
       JOIN blood_requests br ON br.id = a.request_id
       JOIN profiles p ON p.id = br.hospital_id
       WHERE a.status = 'donated'
       ORDER BY a.created_at DESC LIMIT 10`
    ),
    query(
      `SELECT br.id, br.blood_group, br.units, br.component, br.urgency, br.created_at,
         json_build_object('org_name', p.org_name, 'city', p.city) AS hospitals
       FROM blood_requests br JOIN profiles p ON p.id = br.hospital_id
       WHERE br.status = 'open' AND br.urgency IN ('critical','urgent')
       ORDER BY br.urgency_rank ASC, br.created_at DESC LIMIT 20`
    ),
  ])

  return (
    <AdminDashboardClient
      donors={donors as any}
      hospitalCount={hospitals.length}
      openRequests={openRequests as any}
      recentDonations={recentDonations as any}
      criticalRequests={criticalRequests as any}
    />
  )
}
