import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { query } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { request_id } = await req.json()

  const existing = await query(
    `SELECT id FROM acceptances WHERE donor_id = $1 AND status = 'accepted'`,
    [session.id]
  )
  if (existing.length > 0) {
    return NextResponse.json({ error: 'You already have an accepted request.' }, { status: 409 })
  }

  const rows = await query<{ id: string }>(
    `INSERT INTO acceptances (request_id, donor_id, status)
     VALUES ($1, $2, 'accepted')
     ON CONFLICT (request_id, donor_id) DO UPDATE SET status = EXCLUDED.status
     RETURNING id`,
    [request_id, session.id]
  )
  return NextResponse.json({ ok: true, acceptance_id: rows[0]?.id })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { acceptance_id } = await req.json()
  await query(
    `DELETE FROM acceptances WHERE id = $1 AND donor_id = $2 AND status = 'accepted'`,
    [acceptance_id, session.id]
  )
  return NextResponse.json({ ok: true })
}
