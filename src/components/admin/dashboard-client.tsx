'use client'

import { useState } from 'react'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

type Row = { city: string }
type DonorRow = { city: string; available: boolean; blood_group: string }

type CityStats = {
  city: string
  totalDonors: number
  availableDonors: number
  hospitals: number
  openRequests: number
  completedRequests: number
}

function buildCityStats(
  donorRows: DonorRow[],
  hospitalRows: Row[],
  openRequestRows: Row[],
  completedRequestRows: Row[],
): CityStats[] {
  const map: Record<string, CityStats> = {}

  const get = (city: string) => {
    const key = city || 'Unknown'
    if (!map[key]) map[key] = { city: key, totalDonors: 0, availableDonors: 0, hospitals: 0, openRequests: 0, completedRequests: 0 }
    return map[key]
  }

  for (const r of donorRows) { const s = get(r.city); s.totalDonors++; if (r.available) s.availableDonors++ }
  for (const r of hospitalRows) get(r.city).hospitals++
  for (const r of openRequestRows) get(r.city).openRequests++
  for (const r of completedRequestRows) get(r.city).completedRequests++

  return Object.values(map).sort((a, b) => a.city.localeCompare(b.city))
}

export function AdminDashboardClient({ donorRows, hospitalRows, openRequestRows, completedRequestRows }: {
  donorRows: DonorRow[]
  hospitalRows: Row[]
  openRequestRows: Row[]
  completedRequestRows: Row[]
}) {
  const cities = buildCityStats(donorRows, hospitalRows, openRequestRows, completedRequestRows)

  const platform = {
    totalDonors: donorRows.length,
    availableDonors: donorRows.filter((d) => d.available).length,
    hospitals: hospitalRows.length,
    openRequests: openRequestRows.length,
    completedRequests: completedRequestRows.length,
  }

  const available = donorRows.filter((d) => d.available)
  const supplyDemand = BLOOD_GROUPS.map((bg) => ({
    bg,
    supply: available.filter((d) => d.blood_group === bg).length,
    demand: openRequestRows.filter((r: any) => r.blood_group === bg).length,
  }))
  const maxBar = Math.max(...supplyDemand.map((d) => Math.max(d.supply, d.demand)), 1)

  const statCards = [
    { label: 'Total Donors', value: platform.totalDonors },
    { label: 'Available Now', value: platform.availableDonors },
    { label: 'Total Hospitals', value: platform.hospitals },
    { label: 'Open Requests', value: platform.openRequests },
    { label: 'Completed Requests', value: platform.completedRequests },
  ]

  const [cityOpen, setCityOpen] = useState(false)
  const cols = ['City', 'Hospitals', 'Total Donors', 'Available', 'Open Requests', 'Completed']

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <main className="p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">Admin Overview</h1>
            <p className="text-sm text-[#86868b] mt-0.5">Platform analytics</p>
          </div>

          {/* Platform totals */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
            {statCards.map(({ label, value }) => (
              <div key={label} className="bg-white rounded-2xl border border-[#e5e5ea] p-5">
                <p className="text-xs text-[#86868b] mb-1">{label}</p>
                <p className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">{value}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-4 mb-8">
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
                {cities.length === 0 ? <p className="text-xs text-[#aeaeb2] text-center py-6">No data.</p> : cities.slice(0, 8).map(({ city, openRequests: req, totalDonors: don }) => (
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

          {/* City breakdown */}
          <div className="bg-white rounded-2xl border border-[#e5e5ea] overflow-hidden">
            <button onClick={() => setCityOpen(o => !o)}
              className="w-full px-6 py-4 flex items-center justify-between border-b border-[#f5f5f7] cursor-pointer bg-transparent text-left">
              <h2 className="text-sm font-semibold text-[#1d1d1f]">By City</h2>
              <svg className={`w-3 h-3 text-[#86868b] transition-transform ${cityOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className={`overflow-x-auto ${cityOpen ? '' : 'hidden'}`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[#e5e5ea]">
                    {cols.map((col) => (
                      <th key={col} className="px-6 py-3 text-left text-xs font-medium text-[#86868b] whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5f5f7]">
                  {cities.map((c) => (
                    <tr key={c.city} className="hover:bg-[#fafafa] transition-colors">
                      <td className="px-6 py-3 font-medium text-[#1d1d1f] whitespace-nowrap">{c.city}</td>
                      <td className="px-6 py-3 text-[#1d1d1f]">{c.hospitals}</td>
                      <td className="px-6 py-3 text-[#1d1d1f]">{c.totalDonors}</td>
                      <td className="px-6 py-3">
                        <span className="text-green-600 font-medium">{c.availableDonors}</span>
                      </td>
                      <td className="px-6 py-3">
                        {c.openRequests > 0
                          ? <span className="text-orange-600 font-medium">{c.openRequests}</span>
                          : <span className="text-[#aeaeb2]">0</span>}
                      </td>
                      <td className="px-6 py-3">
                        {c.completedRequests > 0
                          ? <span className="text-blue-600 font-medium">{c.completedRequests}</span>
                          : <span className="text-[#aeaeb2]">0</span>}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-[#e5e5ea] font-medium">
                    <td className="px-6 py-3 text-[#1d1d1f]">Total</td>
                    <td className="px-6 py-3 text-[#1d1d1f]">{platform.hospitals}</td>
                    <td className="px-6 py-3 text-[#1d1d1f]">{platform.totalDonors}</td>
                    <td className="px-6 py-3 text-green-600">{platform.availableDonors}</td>
                    <td className="px-6 py-3 text-orange-600">{platform.openRequests}</td>
                    <td className="px-6 py-3 text-blue-600">{platform.completedRequests}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
