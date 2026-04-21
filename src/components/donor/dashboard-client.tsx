'use client'

import { useState, useCallback } from 'react'
import { Flame, Clock, CalendarCheck } from 'lucide-react'
import { livesSaved, daysUntilEligible, nextEligibleDate } from '@/lib/donor-stats'
import SidebarLayout from '@/components/shared/sidebar-layout'
import Toast from '@/components/shared/toast'

type Profile = { id: string; first_name: string; last_name: string; blood_group: string; city: string; available: boolean }
type Request = {
  id: string; blood_group: string; units: number; component: string
  urgency: 'critical' | 'urgent' | 'scheduled'; urgency_rank: number; description: string
  created_at: string; hospitals: { org_name: string; address: string; city: string } | null
}
type Donation = {
  id: string; created_at: string; status: 'donated' | 'rejected'
  blood_requests: { hospitals: { org_name: string } | null; created_at: string; blood_group: string } | null
}
type AcceptedRequest = Request & { acceptance_id: string }
type ToastMsg = { id: number; message: string; type: 'success' | 'info' | 'warning' }

const URGENCY_STYLES = {
  critical: 'bg-red-50 text-red-600 border border-red-100',
  urgent: 'bg-orange-50 text-orange-600 border border-orange-100',
  scheduled: 'bg-blue-50 text-blue-600 border border-blue-100',
}

const NAV = [
  { label: 'Dashboard', href: '/donor/dashboard' },
]

export function DonorDashboardClient({
  profile: initialProfile, requests: initialRequests, acceptedRequests: initialAccepted, donations,
}: { profile: Profile; requests: Request[]; acceptedRequests: AcceptedRequest[]; donations: Donation[] }) {
  const [profile, setProfile] = useState(initialProfile)
  const [requests, setRequests] = useState(initialRequests)
  const [acceptedRequests, setAcceptedRequests] = useState(initialAccepted)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [toasts, setToasts] = useState<ToastMsg[]>([])
  const [accepting, setAccepting] = useState<string | null>(null)
  const [unaccepting, setUnaccepting] = useState<string | null>(null)

  const addToast = useCallback((message: string, type: ToastMsg['type'] = 'info') => {
    const id = Date.now()
    setToasts((p) => [...p, { id, message, type }])
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 5000)
  }, [])

  async function toggleAvailability() {
    const v = !profile.available
    await fetch('/api/donor/availability', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ available: v }) })
    setProfile((p) => ({ ...p, available: v }))
  }

  async function acceptRequest(id: string) {
    setAccepting(id)
    const res = await fetch('/api/donor/acceptances', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ request_id: id }) })
    setAccepting(null)
    if (!res.ok) { addToast('Could not accept request', 'warning'); return }
    const data = await res.json()
    const req = requests.find((r) => r.id === id)!
    setRequests((p) => p.filter((r) => r.id !== id))
    setAcceptedRequests((p) => [...p, { ...req, acceptance_id: data.acceptance_id }])
  }

  async function unacceptRequest(acceptanceId: string, requestId: string) {
    setUnaccepting(acceptanceId)
    const res = await fetch('/api/donor/acceptances', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ acceptance_id: acceptanceId }) })
    setUnaccepting(null)
    if (!res.ok) { addToast('Could not withdraw acceptance', 'warning'); return }
    const req = acceptedRequests.find((r) => r.acceptance_id === acceptanceId)!
    setAcceptedRequests((p) => p.filter((r) => r.acceptance_id !== acceptanceId))
    setRequests((p) => [...p, req])
  }

  const grouped = {
    critical: requests.filter((r) => r.urgency === 'critical'),
    urgent: requests.filter((r) => r.urgency === 'urgent'),
    scheduled: requests.filter((r) => r.urgency === 'scheduled'),
  }
  const lives = livesSaved(donations)
  const daysLeft = daysUntilEligible(donations)
  const eligibleDate = nextEligibleDate(donations)
  const donatedCount = donations.filter((d) => d.status === 'donated').length

  return (
    <SidebarLayout navItems={NAV} orgName={`${profile.first_name} ${profile.last_name}`} role="donor">
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
        {toasts.map((t) => <Toast key={t.id} message={t.message} type={t.type} onClose={() => setToasts((p) => p.filter((x) => x.id !== t.id))} />)}
      </div>

      <div className="p-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">Good morning, {profile.first_name}.</h1>
            <p className="text-sm text-[#86868b] mt-0.5">{profile.city}</p>
          </div>
          <button onClick={toggleAvailability} className="flex items-center gap-2.5 group" aria-label="Toggle availability">
            <span className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${profile.available ? 'bg-green-500' : 'bg-[#d2d2d7]'}`}>
              <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${profile.available ? 'translate-x-5' : 'translate-x-0'}`} />
            </span>
            <span className={`text-xs font-medium ${profile.available ? 'text-green-700' : 'text-[#86868b]'}`}>
              {profile.available ? 'Available to donate' : 'Not available'}
            </span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Blood Group', value: profile.blood_group },
            { label: 'Lives Saved', value: String(lives) },
            { label: 'Donations', value: String(donatedCount) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-2xl border border-[#e5e5ea] p-5">
              <p className="text-xs text-[#86868b] mb-1">{label}</p>
              <p className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">{value}</p>
            </div>
          ))}
          <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5">
            <p className="text-xs text-[#86868b] mb-1">Eligible to Donate</p>
            <p className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">{daysLeft > 0 ? `In ${daysLeft}d` : 'Yes'}</p>
            {daysLeft > 0 && eligibleDate && (
              <p className="text-xs text-[#86868b] mt-1">
                {eligibleDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Accepted requests */}
          {acceptedRequests.length > 0 && (
            <div className="lg:col-span-2 space-y-3">
              <h2 className="text-sm font-semibold text-[#1d1d1f] px-1">Upcoming Donation</h2>
              <div className="bg-white rounded-2xl border border-[#e5e5ea] divide-y divide-[#f5f5f7]">
                {acceptedRequests.map((req) => (
                  <div key={req.acceptance_id} className="px-5 py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-[#1d1d1f]">{req.blood_group}</span>
                        <span className="text-xs text-[#86868b]">{req.units}u · {req.component}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${URGENCY_STYLES[req.urgency]}`}>{req.urgency}</span>
                      </div>
                      <p className="text-sm text-[#6e6e73] truncate">{req.hospitals?.org_name}</p>
                      <p className="text-xs text-[#aeaeb2]">{req.hospitals?.city}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-medium text-green-600 bg-green-50 border border-green-100 px-2.5 py-0.5 rounded-full">Accepted</span>
                      <button
                        onClick={() => unacceptRequest(req.acceptance_id, req.id)}
                        disabled={unaccepting === req.acceptance_id}
                        className="text-xs font-medium text-[#86868b] border border-[#e5e5ea] px-3 py-1.5 rounded-full hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-colors disabled:opacity-40"
                      >
                        {unaccepting === req.acceptance_id ? '…' : 'Withdraw'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Requests */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-sm font-semibold text-[#1d1d1f] px-1">Nearby Requests</h2>
            {requests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#e5e5ea] py-16 text-center">
                <p className="text-sm text-[#86868b]">No matching requests right now.</p>
                <p className="text-xs text-[#c7c7cc] mt-1">You&apos;ll be notified when one arrives.</p>
              </div>
            ) : (
              <>
                {([
                  { key: 'critical' as const, label: 'Critical', Icon: Flame, labelCls: 'text-red-600', headerBg: 'bg-red-50', headerCls: 'border-red-100' },
                  { key: 'urgent' as const, label: 'Urgent', Icon: Clock, labelCls: 'text-amber-600', headerBg: 'bg-amber-50', headerCls: 'border-amber-100' },
                  { key: 'scheduled' as const, label: 'Scheduled', Icon: CalendarCheck, labelCls: 'text-blue-600', headerBg: 'bg-blue-50', headerCls: 'border-blue-100' },
                ]).map(({ key, label, Icon, labelCls, headerBg, headerCls }) => {
                  const group = grouped[key]
                  if (group.length === 0) return null
                  const isCollapsed = collapsedGroups.has(key)
                  return (
                    <div key={key} className="bg-white rounded-2xl border border-[#e5e5ea]">
                      <div className={`px-5 py-3 border-b ${headerCls} ${headerBg} flex items-center gap-2 cursor-pointer select-none rounded-t-2xl`}
                        onClick={() => setCollapsedGroups((p) => { const n = new Set(p); n.has(key) ? n.delete(key) : n.add(key); return n })}>
                        <Icon size={13} className={labelCls} />
                        <h3 className={`text-xs font-semibold uppercase tracking-wider ${labelCls}`}>{label}</h3>
                        <span className={`text-xs font-medium ${labelCls} opacity-60`}>{group.length}</span>
                        <span className={`ml-auto text-[#aeaeb2] text-xs transition-transform inline-block ${isCollapsed ? '' : 'rotate-180'}`}>▼</span>
                      </div>
                      {!isCollapsed && (
                        <div className="divide-y divide-[#f5f5f7]">
                          {group.map((req) => (
                            <div key={req.id} className="px-5 py-4 flex items-center gap-4 hover:bg-[#fafafa] transition-colors">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-semibold text-[#1d1d1f]">{req.blood_group}</span>
                                  <span className="text-xs text-[#86868b]">{req.units}u · {req.component}</span>
                                </div>
                                <p className="text-sm text-[#6e6e73] truncate">{req.hospitals?.org_name}</p>
                                <p className="text-xs text-[#aeaeb2]">{req.hospitals?.city}</p>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-xs text-[#aeaeb2] hidden sm:block">
                                  {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </span>
                                <button
                                  onClick={() => acceptRequest(req.id)}
                                  disabled={accepting === req.id || !profile.available || daysLeft > 0 || acceptedRequests.length > 0}
                                  className="text-xs font-medium bg-[#0071e3] hover:bg-[#0077ed] text-white px-4 py-1.5 rounded-full transition-colors disabled:opacity-40"
                                  title={acceptedRequests.length > 0 ? 'Withdraw your current acceptance first' : daysLeft > 0 ? `Eligible in ${daysLeft} days` : undefined}
                                >
                                  {accepting === req.id ? '…' : 'Accept'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            )}
          </div>

          {/* Right */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5">
              <h3 className="text-sm font-semibold text-[#1d1d1f] mb-4">Donation History</h3>
              {donations.length === 0 ? (
                <p className="text-xs text-[#86868b] text-center py-4">No activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {donations.slice(0, 8).map((d) => {
                    const isDonated = d.status === 'donated'
                    return (
                      <div key={d.id} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${isDonated ? 'bg-red-50 text-red-500' : 'bg-[#f5f5f7] text-[#aeaeb2]'}`}>
                          {d.blood_requests?.blood_group ?? '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#1d1d1f] truncate">{d.blood_requests?.hospitals?.org_name ?? 'Hospital'}</p>
                          <p className="text-xs text-[#aeaeb2]">{new Date(d.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</p>
                        </div>
                        {isDonated
                          ? <span className="text-xs font-medium text-green-600">Donated</span>
                          : <span className="text-xs font-medium text-red-500">Rejected</span>
                        }
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
}
