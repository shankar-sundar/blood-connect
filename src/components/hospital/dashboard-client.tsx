'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Check, X } from 'lucide-react'
import Toast from '@/components/shared/toast'

type Profile = { id: string; org_name: string; org_type: string; city: string }
type Acceptance = { id: string; status: 'pending' | 'accepted' | 'donated' | 'rejected'; donor: { first_name: string; last_name: string; mobile: string } | null }
type BloodRequest = { id: string; blood_group: string; units: number; component: string; urgency: 'critical' | 'urgent' | 'scheduled'; urgency_rank: number; description: string; patient_name: string | null; status: string; created_at: string; acceptances: Acceptance[] }
type ToastMsg = { id: number; message: string; type: 'success' | 'info' | 'warning' }

const URGENCY_STYLES = {
  critical: 'bg-red-50 text-red-600 border border-red-100',
  urgent: 'bg-orange-50 text-orange-600 border border-orange-100',
  scheduled: 'bg-blue-50 text-blue-600 border border-blue-100',
}

const DONATED_COMMENT = 'Thank you for your generous donation. Your contribution is truly lifesaving and deeply appreciated by our team and the patients you have helped.'

export function HospitalDashboardClient({ profile, requests: initialRequests }: { profile: Profile; requests: BloodRequest[] }) {
  const [requests, setRequests] = useState(initialRequests)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [toasts, setToasts] = useState<ToastMsg[]>([])
  const [rejectModal, setRejectModal] = useState<{ acceptanceId: string } | null>(null)
  const [rejectComment, setRejectComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const addToast = useCallback((message: string, type: ToastMsg['type'] = 'info') => {
    const id = Date.now()
    setToasts((p) => [...p, { id, message, type }])
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 5000)
  }, [])

  async function updateAcceptance(id: string, status: 'donated' | 'rejected', comment?: string) {
    const res = await fetch(`/api/hospital/requests/current/acceptances`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acceptance_id: id, status, comment: comment ?? null }),
    })
    if (res.ok) {
      setRequests((p) => p.map((r) => ({ ...r, acceptances: r.acceptances.map((a) => a.id === id ? { ...a, status } : a) })))
      addToast(status === 'donated' ? 'Donation recorded' : 'Donor rejected', 'success')
    }
  }

  async function confirmReject() {
    if (!rejectModal) return
    setSubmitting(true)
    await updateAcceptance(rejectModal.acceptanceId, 'rejected', rejectComment.trim())
    setSubmitting(false)
    setRejectModal(null)
    setRejectComment('')
  }

  function reqCategory(req: BloodRequest): 'pending' | 'partial' | 'completed' {
    const collected = req.acceptances.filter((a) => a.status === 'donated').length
    if (collected >= req.units) return 'completed'
    if (collected > 0) return 'partial'
    return 'pending'
  }

  const grouped = {
    pending: requests.filter((r) => reqCategory(r) === 'pending').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    partial: requests.filter((r) => reqCategory(r) === 'partial').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    completed: requests.filter((r) => reqCategory(r) === 'completed').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  }

  const stats = {
    total: requests.length,
    pending: grouped.pending.length,
    partial: grouped.partial.length,
    completed: grouped.completed.length,
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
        {toasts.map((t) => <Toast key={t.id} message={t.message} type={t.type} onClose={() => setToasts((p) => p.filter((x) => x.id !== t.id))} />)}
      </div>

      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">{profile.org_name}</h1>
            <p className="text-sm text-[#86868b] mt-0.5">{profile.city}</p>
          </div>
          <Link href="/hospital/blood-request" className="text-xs font-medium bg-[#0071e3] hover:bg-[#0077ed] text-white px-5 py-2 rounded-full transition-colors">
            + New request
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-8">
          <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5">
            <p className="text-xs text-[#86868b] mb-1">Total Requests</p>
            <p className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">{stats.total}</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5">
            <p className="text-xs text-[#86868b] mb-1">Pending</p>
            <p className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-2xl border border-orange-100 bg-orange-50 p-5">
            <p className="text-xs text-orange-600 mb-1">Partial</p>
            <p className="text-2xl font-semibold tracking-tight text-orange-700">{stats.partial}</p>
          </div>
          <div className="bg-white rounded-2xl border border-green-100 bg-[#f0fdf4] p-5">
            <p className="text-xs text-green-600 mb-1">Completed</p>
            <p className="text-2xl font-semibold tracking-tight text-green-700">{stats.completed}</p>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e5e5ea] py-16 text-center">
            <p className="text-sm text-[#86868b] mb-4">No active requests.</p>
            <Link href="/hospital/blood-request" className="text-xs font-medium bg-[#0071e3] text-white px-5 py-2 rounded-full hover:bg-[#0077ed] transition-colors">
              Post your first request
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {([
              { key: 'pending' as const, label: 'Pending', labelCls: 'text-[#86868b]', headerCls: 'border-[#e5e5ea]' },
              { key: 'partial' as const, label: 'Partial', labelCls: 'text-orange-600', headerCls: 'border-orange-100' },
              { key: 'completed' as const, label: 'Completed', labelCls: 'text-green-600', headerCls: 'border-green-100' },
            ]).map(({ key, label, labelCls, headerCls }) => {
              const group = grouped[key]
              if (group.length === 0) return null
              return (
                <div key={key} className="bg-white rounded-2xl border border-[#e5e5ea]">
                  <div className={`px-5 py-3 border-b ${headerCls} flex items-center gap-2 cursor-pointer select-none`} onClick={() => setCollapsed((p) => { const n = new Set(p); n.has(key) ? n.delete(key) : n.add(key); return n })}>
                    <h2 className={`text-xs font-semibold uppercase tracking-wider ${labelCls}`}>{label}</h2>
                    <span className={`text-xs font-medium ${labelCls} opacity-60`}>{group.length}</span>
                    <span className={`ml-auto text-[#aeaeb2] text-xs transition-transform inline-block ${collapsed.has(key) ? '' : 'rotate-180'}`}>▼</span>
                  </div>
                  {!collapsed.has(key) && <div className="divide-y divide-[#f5f5f7]">
                    {group.map((req) => {
                      const rejectedCount = req.acceptances.filter((a) => a.status === 'rejected').length
                      const matchedCount = req.acceptances.filter((a) => a.status === 'accepted').length
                      const collectedCount = req.acceptances.filter((a) => a.status === 'donated').length
                      const isOpen = expanded === req.id
                      return (
                        <div key={req.id}>
                          <div className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-[#fafafa] transition-colors" onClick={() => setExpanded(isOpen ? null : req.id)}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3">
                                {req.patient_name && <span className="text-sm font-semibold text-[#1d1d1f]">{req.patient_name}</span>}
                                <span className="text-sm text-[#86868b]">({req.blood_group})</span>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${URGENCY_STYLES[req.urgency]}`}>{req.urgency}</span>
                              </div>
                              <p className="text-xs text-[#86868b] mt-0.5 truncate">{req.description}</p>
                            </div>
                            <div className="flex flex-col items-center gap-1 shrink-0">
                              <span className="text-xs text-[#86868b]">{req.units}u · {req.component}</span>
                              <div className="flex items-center gap-2">
                              <span className="text-xs text-red-600 bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-full">{rejectedCount} rejected</span>
                              <span className="text-xs text-green-700 bg-[#f0fdf4] border border-green-100 px-2.5 py-0.5 rounded-full">{matchedCount} matched</span>
                              <span className="text-xs text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">{collectedCount}/{req.units} collected</span>
                              <span className="text-xs text-[#aeaeb2]">{new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                              <span className={`text-[#aeaeb2] text-xs transition-transform inline-block ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                              </div>
                            </div>
                          </div>

                          {isOpen && (
                            <div className="px-5 pb-4 bg-[#fafafa] border-t border-[#f5f5f7]">
                              {req.acceptances.length === 0 ? (
                                <p className="text-xs text-[#aeaeb2] py-3">No donors yet. They will be notified automatically.</p>
                              ) : (
                                <div className="space-y-2 pt-3">
                                  {req.acceptances.map((acc) => (
                                    <div key={acc.id} className="flex items-center justify-between gap-3 bg-white rounded-xl p-3 border border-[#e5e5ea]">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 bg-[#f5f5f7] rounded-full flex items-center justify-center text-xs font-semibold text-[#1d1d1f]">
                                          {acc.donor?.first_name?.[0] ?? '?'}
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-[#1d1d1f]">{acc.donor ? `${acc.donor.first_name} ${acc.donor.last_name}` : 'Unknown'}</p>
                                          <p className="text-xs text-[#86868b]">{acc.donor?.mobile}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {(acc.status === 'accepted' || acc.status === 'pending') && (
                                          <>
                                            <button onClick={() => updateAcceptance(acc.id, 'donated', DONATED_COMMENT)} className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-[#f0fdf4] border border-green-100 px-3 py-1.5 rounded-full hover:bg-green-100 transition-colors"><Check size={11} strokeWidth={2.5} />Mark donated</button>
                                            <button onClick={() => { setRejectModal({ acceptanceId: acc.id }); setRejectComment('') }} className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors"><X size={11} strokeWidth={2.5} />Reject</button>
                                          </>
                                        )}
                                        {acc.status === 'donated' && <span className="text-xs text-green-700 bg-[#f0fdf4] border border-green-100 px-3 py-1.5 rounded-full font-medium">Donated</span>}
                                        {acc.status === 'rejected' && <span className="text-xs font-medium text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-full">Rejected</span>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-[#e5e5ea] shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-sm font-semibold text-[#1d1d1f] mb-1">Reject donor</h3>
            <p className="text-xs text-[#86868b] mb-4">Provide a reason for the donor.</p>
            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="e.g. We already have enough donors for this request."
              rows={3}
              className="w-full text-sm text-[#1d1d1f] border border-[#e5e5ea] rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3]"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setRejectModal(null)} className="text-xs font-medium text-[#86868b] border border-[#e5e5ea] px-4 py-2 rounded-full hover:bg-[#f5f5f7] transition-colors">Cancel</button>
              <button onClick={confirmReject} disabled={submitting || !rejectComment.trim()} className="text-xs font-medium text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-full transition-colors disabled:opacity-50">
                {submitting ? '…' : 'Confirm reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
