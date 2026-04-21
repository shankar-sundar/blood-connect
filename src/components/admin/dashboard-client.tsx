'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

type Donor = { blood_group: string; city: string; available: boolean }
type OpenRequest = { blood_group: string; urgency: string; hospitals?: { city: string } | null }
type RecentDonation = { created_at: string; blood_requests: { blood_group: string; hospitals: { org_name: string; city: string } | null } | null } | null
type CriticalRequest = { id: string; blood_group: string; units: number; component: string; urgency: string; created_at: string; hospitals: { org_name: string; city: string } | null }

const URGENCY_STYLES: Record<string, string> = {
  critical: 'bg-red-50 text-red-600 border border-red-100',
  urgent: 'bg-orange-50 text-orange-600 border border-orange-100',
}

export function AdminDashboardClient({ donors, hospitalCount, openRequests, recentDonations, criticalRequests }: {
  donors: Donor[]; hospitalCount: number; openRequests: OpenRequest[]; recentDonations: RecentDonation[]; criticalRequests: CriticalRequest[]
}) {
  const router = useRouter()

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/sign-in')
  }

  const available = donors.filter((d) => d.available)
  const supplyDemand = BLOOD_GROUPS.map((bg) => ({
    bg,
    supply: available.filter((d) => d.blood_group === bg).length,
    demand: openRequests.filter((r) => r.blood_group === bg).length,
  }))
  const maxBar = Math.max(...supplyDemand.map((d) => Math.max(d.supply, d.demand)), 1)

  const cityMap: Record<string, { req: number; don: number }> = {}
  for (const r of openRequests) { const c = r.hospitals?.city ?? 'Unknown'; cityMap[c] = { req: (cityMap[c]?.req ?? 0) + 1, don: cityMap[c]?.don ?? 0 } }
  for (const d of donors) { const c = d.city ?? 'Unknown'; cityMap[c] = { req: cityMap[c]?.req ?? 0, don: (cityMap[c]?.don ?? 0) + 1 } }
  const cities = Object.entries(cityMap).map(([city, { req, don }]) => ({ city, req, don })).sort((a, b) => (b.req - b.don) - (a.req - a.don)).slice(0, 8)

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex">
      <aside className="w-52 bg-white border-r border-[#e5e5ea] flex flex-col fixed inset-y-0 left-0 z-20 hidden lg:flex">
        <div className="px-5 h-12 border-b border-[#e5e5ea] flex items-center">
          <Link href="/" className="text-sm font-semibold text-[#1d1d1f] tracking-tight">BloodConnect</Link>
        </div>
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          <Link href="/admin/dashboard" className="flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-[#f5f5f7] text-[#1d1d1f]">Overview</Link>
          <Link href="/donor/dashboard" className="flex items-center px-3 py-2 rounded-lg text-sm text-[#6e6e73] hover:bg-[#f5f5f7] hover:text-[#1d1d1f] transition-colors">Donor view</Link>
        </nav>
        <div className="px-3 py-3 border-t border-[#e5e5ea]">
          <div className="px-3 py-1.5 mb-1 flex items-center gap-2">
            <span className="text-xs text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full font-medium">Admin</span>
          </div>
          <button onClick={() => signOut()} className="w-full flex items-center px-3 py-2 rounded-lg text-sm text-[#86868b] hover:bg-[#f5f5f7] transition-colors">Sign out</button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-52 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">Admin Overview</h1>
            <p className="text-sm text-[#86868b] mt-0.5">Platform analytics</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Donors', value: donors.length },
              { label: 'Available Now', value: available.length },
              { label: 'Hospitals', value: hospitalCount },
              { label: 'Open Requests', value: openRequests.length },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-2xl border border-[#e5e5ea] p-5">
                <p className="text-xs text-[#86868b] mb-1">{label}</p>
                <p className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5">
              <h2 className="text-sm font-semibold text-[#1d1d1f] mb-4">Supply vs Demand</h2>
              <div className="flex items-end gap-2 h-36">
                {supplyDemand.map(({ bg, supply, demand }) => (
                  <div key={bg} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex gap-0.5 items-end h-28">
                      <div className="flex-1 bg-green-300 rounded-t" style={{ height: `${(supply / maxBar) * 100}%`, minHeight: supply > 0 ? '3px' : '0' }} />
                      <div className="flex-1 bg-red-300 rounded-t" style={{ height: `${(demand / maxBar) * 100}%`, minHeight: demand > 0 ? '3px' : '0' }} />
                    </div>
                    <span className="text-xs text-[#86868b]">{bg}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-[#86868b]"><span className="w-3 h-2 bg-green-300 rounded-sm block" />Donors</div>
                <div className="flex items-center gap-1.5 text-xs text-[#86868b]"><span className="w-3 h-2 bg-red-300 rounded-sm block" />Requests</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5">
              <h2 className="text-sm font-semibold text-[#1d1d1f] mb-4">City-wise Gap</h2>
              <div className="space-y-2.5">
                {cities.length === 0 ? <p className="text-xs text-[#aeaeb2] text-center py-6">No data.</p> : cities.map(({ city, req, don }) => (
                  <div key={city} className="flex items-center gap-3">
                    <span className="text-xs text-[#6e6e73] w-24 truncate">{city}</span>
                    <div className="flex-1 bg-[#f5f5f7] rounded-full h-1.5">
                      <div className={`h-full rounded-full ${req > don ? 'bg-red-300' : 'bg-green-300'}`} style={{ width: `${Math.min(100, (req / Math.max(req, don, 1)) * 100)}%` }} />
                    </div>
                    <span className="text-xs text-[#aeaeb2] w-14 text-right"><span className="text-green-500">{don}</span> / <span className="text-red-400">{req}</span></span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#e5e5ea]">
              <div className="px-5 py-4 border-b border-[#f5f5f7]"><h2 className="text-sm font-semibold text-[#1d1d1f]">Critical & Urgent</h2></div>
              {criticalRequests.length === 0 ? <p className="text-xs text-[#aeaeb2] text-center py-8">No critical requests.</p> : (
                <div className="divide-y divide-[#f5f5f7]">
                  {criticalRequests.map((r) => (
                    <div key={r.id} className="px-5 py-3 flex items-center gap-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${URGENCY_STYLES[r.urgency] ?? ''}`}>{r.urgency}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1d1d1f]">{r.blood_group} · {r.units}u {r.component}</p>
                        <p className="text-xs text-[#aeaeb2] truncate">{r.hospitals?.org_name} · {r.hospitals?.city}</p>
                      </div>
                      <span className="text-xs text-[#aeaeb2]">{new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-[#e5e5ea]">
              <div className="px-5 py-4 border-b border-[#f5f5f7]"><h2 className="text-sm font-semibold text-[#1d1d1f]">Recent Donations</h2></div>
              {recentDonations.filter(Boolean).length === 0 ? <p className="text-xs text-[#aeaeb2] text-center py-8">No donations yet.</p> : (
                <div className="divide-y divide-[#f5f5f7]">
                  {recentDonations.filter(Boolean).map((d, i) => (
                    <div key={i} className="px-5 py-3 flex items-center gap-3">
                      <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center text-xs font-semibold text-red-500">{d!.blood_requests?.blood_group ?? '?'}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1d1d1f] truncate">{d!.blood_requests?.hospitals?.org_name ?? 'Hospital'}</p>
                        <p className="text-xs text-[#aeaeb2]">{d!.blood_requests?.hospitals?.city}</p>
                      </div>
                      <span className="text-xs text-[#aeaeb2]">{new Date(d!.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      <span className="text-xs font-medium text-green-500">+3 lives</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
