'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem = { label: string; href: string }
type Props = { navItems: NavItem[]; orgName: string; role: 'donor' | 'hospital' | 'admin'; children: React.ReactNode }

export default function SidebarLayout({ navItems, orgName, children }: Props) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex">
      {/* Sidebar */}
      <aside className="w-52 bg-white border-r border-[#e5e5ea] flex flex-col fixed top-14 bottom-0 left-0 z-20 hidden lg:flex">
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
          <p className="px-3 py-1.5 text-xs text-[#86868b] truncate">{orgName}</p>
        </div>
      </aside>

      <main className="flex-1 lg:ml-52">
        {children}
      </main>
    </div>
  )
}
