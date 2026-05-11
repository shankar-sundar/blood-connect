import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { query } from '@/lib/db'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (!q) return NextResponse.json([])

  if (UUID_RE.test(q)) {
    const donors = await query(
      `SELECT id, first_name, last_name, blood_group, city
       FROM profiles
       WHERE id = $1 AND role = 'donor'`,
      [q]
    )
    return NextResponse.json(donors)
  }

  const donors = await query(
    `SELECT id, first_name, last_name, blood_group, city
     FROM profiles
     WHERE role = 'donor'
       AND (first_name ILIKE $1 OR last_name ILIKE $1
            OR (first_name || ' ' || last_name) ILIKE $1)
     LIMIT 10`,
    [`%${q}%`]
  )
  return NextResponse.json(donors)
}
