import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { queryOne } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await queryOne(
    'SELECT id, first_name, last_name, blood_group, city, available FROM profiles WHERE id = $1',
    [session.id]
  )
  return NextResponse.json(profile)
}
