import Link from 'next/link'
import { getSession } from '@/lib/session'
import { queryOne } from '@/lib/db'
import { SignOutButton } from './sign-out-button'

export async function TopNav() {
  const session = await getSession()
  const dashboardHref = session?.role === 'hospital' ? '/hospital/dashboard' : '/donor/dashboard'

  let profile: { display_name: string; city: string } | null = null
  if (session) {
    if (session.role === 'hospital') {
      const row = await queryOne<{ org_name: string; city: string }>(
        'SELECT org_name, city FROM profiles WHERE id = $1',
        [session.id]
      )
      if (row) profile = { display_name: row.org_name, city: row.city }
    } else {
      const row = await queryOne<{ first_name: string; city: string }>(
        'SELECT first_name, city FROM profiles WHERE id = $1',
        [session.id]
      )
      if (row) profile = { display_name: row.first_name, city: row.city }
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-[#e5e5ea] shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-[#1d1d1f] tracking-tight">BloodConnect</Link>
        <div className="flex items-center gap-6">
          {session && profile ? (
            <>
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium text-[#1d1d1f] leading-tight">{profile.display_name}</span>
                <span className="text-xs text-[#86868b] leading-tight">{profile.city}</span>
              </div>
              <Link href={dashboardHref} className="text-sm text-[#0071e3] hover:underline transition-colors">Dashboard</Link>
              <SignOutButton className="text-sm text-[#86868b] hover:text-[#1d1d1f] transition-colors bg-transparent border-none cursor-pointer" />
            </>
          ) : (
            <>
              <Link href="/register" className="text-sm text-[#1d1d1f]/60 hover:text-[#1d1d1f] transition-colors">Register</Link>
              <Link href="/sign-in" className="text-sm text-[#1d1d1f]/60 hover:text-[#1d1d1f] transition-colors">Sign in</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
