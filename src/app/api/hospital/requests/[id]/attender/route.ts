import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { query, queryOne } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { donor_id } = await req.json()

  const request = await queryOne<{ urgency: string; hospital_id: string }>(
    `SELECT urgency, hospital_id FROM blood_requests WHERE id = $1 AND status = 'open'`,
    [id]
  )
  if (!request || request.hospital_id !== session.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (!donor_id) {
    await query(`UPDATE blood_requests SET attender_id = NULL WHERE id = $1`, [id])
    return NextResponse.json({ ok: true })
  }

  if (request.urgency === 'scheduled') {
    return NextResponse.json({ error: 'Cannot assign attender to scheduled requests' }, { status: 400 })
  }

  const donor = await queryOne<{ role: string }>(
    `SELECT role FROM profiles WHERE id = $1`,
    [donor_id]
  )
  if (!donor || donor.role !== 'donor') {
    return NextResponse.json({ error: 'Donor not found' }, { status: 404 })
  }

  const conflict = await queryOne(
    `SELECT id FROM blood_requests WHERE attender_id = $1 AND status = 'open' AND id != $2`,
    [donor_id, id]
  )
  if (conflict) {
    return NextResponse.json({ error: 'Donor is already an attender on another active request' }, { status: 409 })
  }

  await query(`UPDATE blood_requests SET attender_id = $1 WHERE id = $2`, [donor_id, id])
  return NextResponse.json({ ok: true })
}
