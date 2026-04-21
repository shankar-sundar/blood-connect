import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { query } from '@/lib/db'

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { acceptance_id, status, comment } = await req.json()

  await query(
    `UPDATE acceptances a
     SET status = $1, comment = $2
     FROM blood_requests br
     WHERE a.id = $3
       AND a.request_id = br.id
       AND br.hospital_id = $4`,
    [status, comment ?? null, acceptance_id, session.id]
  )
  return NextResponse.json({ ok: true })
}
