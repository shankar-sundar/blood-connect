import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { query } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { request_id } = await req.json()
  await query(
    `INSERT INTO acceptances (request_id, donor_id, status)
     VALUES ($1, $2, 'accepted')
     ON CONFLICT (request_id, donor_id) DO NOTHING`,
    [request_id, session.id]
  )
  return NextResponse.json({ ok: true })
}
