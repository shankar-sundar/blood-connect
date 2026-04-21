import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/jwt'

const PROTECTED = ['/donor', '/hospital', '/admin']
const AUTH_ROUTES = ['/sign-in', '/register']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('token')?.value
  const session = token ? await verifyToken(token) : null

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p))
  const isAuth = AUTH_ROUTES.some((p) => pathname.startsWith(p))

  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  if (isAuth && session) {
    return NextResponse.redirect(
      new URL(session.role === 'hospital' ? '/hospital/dashboard' : '/donor/dashboard', req.url)
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/donor/:path*', '/hospital/:path*', '/admin/:path*', '/sign-in', '/register'],
}
