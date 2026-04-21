'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

type NavItem = { label: string; href: string }
type Props = { navItems: NavItem[]; orgName: string; role: 'donor' | 'hospital' | 'admin'; children: React.ReactNode }

export default function SidebarLayout({ navItems, orgName, children }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/sign-in')
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex">
      {/* Sidebar */}
      <aside className="w-52 bg-white border-r border-[#e5e5ea] flex flex-col fixed inset-y-0 left-0 z-20 hidden lg:flex">
        <div className="px-5 h-12 border-b border-[#e5e5ea] flex items-center">
          <Link href="/" className="text-sm font-semibold text-[#1d1d1f] tracking-tight">BloodConnect</Link>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {navItems.map(({ label, href }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-[#f5f5f7] text-[#1d1d1f] font-medium'
                    : 'text-[#6e6e73] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-3 border-t border-[#e5e5ea]">
          <div className="px-3 py-1.5 mb-1">
            <p className="text-xs text-[#1d1d1f] font-medium truncate">{orgName}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center px-3 py-2 rounded-lg text-sm text-[#86868b] hover:bg-[#f5f5f7] hover:text-[#1d1d1f] transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-20 backdrop-blur-xl bg-[#f5f5f7]/80 border-b border-[#e5e5ea] h-12 flex items-center justify-between px-5">
        <Link href="/" className="text-sm font-semibold text-[#1d1d1f]">BloodConnect</Link>
        <button onClick={() => signOut()} className="text-sm text-[#0071e3]">Sign out</button>
      </div>

      <main className="flex-1 lg:ml-52">
        <div className="lg:hidden h-12" />
        {children}
      </main>
    </div>
  )
}
