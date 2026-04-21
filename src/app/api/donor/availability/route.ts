import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { query } from '@/lib/db'

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { available } = await req.json()
  await query('UPDATE profiles SET available = $1 WHERE id = $2', [available, session.id])
  return NextResponse.json({ ok: true })
}
