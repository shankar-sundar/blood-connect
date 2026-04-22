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

  const [donorRows, hospitalRows, openRequestRows, completedRequestRows] = await Promise.all([
    query<{ city: string; available: boolean; blood_group: string }>(
      'SELECT city, available, blood_group FROM profiles WHERE role = $1',
      ['donor']
    ),
    query<{ city: string }>(
      'SELECT city FROM profiles WHERE role = $1',
      ['hospital']
    ),
    query<{ city: string; blood_group: string }>(
      `SELECT p.city, br.blood_group
       FROM blood_requests br
       JOIN profiles p ON p.id = br.hospital_id
       WHERE br.status = 'open'`
    ),
    query<{ city: string }>(
      `SELECT p.city
       FROM blood_requests br
       JOIN profiles p ON p.id = br.hospital_id
       JOIN (
         SELECT request_id, COUNT(*) AS cnt
         FROM acceptances WHERE status = 'donated'
         GROUP BY request_id
       ) dc ON dc.request_id = br.id AND dc.cnt >= br.units`
    ),
  ])

  return (
    <AdminDashboardClient
      donorRows={donorRows}
      hospitalRows={hospitalRows}
      openRequestRows={openRequestRows}
      completedRequestRows={completedRequestRows}
    />
  )
}
