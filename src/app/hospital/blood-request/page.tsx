'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
const COMPONENTS = ['Whole Blood', 'Packed RBCs', 'Platelets', 'FFP', 'Cryoprecipitate']

export default function BloodRequestPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const fd = new FormData(e.currentTarget)

    const res = await fetch('/api/hospital/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blood_group: fd.get('blood_group'),
        units: parseInt(fd.get('units') as string),
        component: fd.get('component'),
        urgency: fd.get('urgency'),
        description: fd.get('description'),
      }),
    })

    setSubmitting(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to post request')
      return
    }
    router.push('/hospital/dashboard')
  }

  const inputCls = 'w-full bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl px-4 py-3 text-sm text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#0071e3] focus:bg-white transition-colors'

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <nav className="sticky top-0 z-10 backdrop-blur-xl bg-[#f5f5f7]/80 border-b border-[#e5e5ea]">
        <div className="max-w-lg mx-auto px-6 h-12 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-[#1d1d1f] tracking-tight">BloodConnect</Link>
          <Link href="/hospital/dashboard" className="text-sm text-[#0071e3] hover:underline">← Dashboard</Link>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-12 pb-20">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-[#1d1d1f] mb-1">New blood request</h1>
          <p className="text-sm text-[#86868b]">Matching donors will be notified instantly.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#e5e5ea] shadow-sm p-6 space-y-5">
          {error && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 text-center">{error}</div>}

          <div>
            <p className="text-xs font-medium text-[#1d1d1f] mb-2">Blood group needed</p>
            <div className="grid grid-cols-8 gap-1.5">
              {BLOOD_GROUPS.map((bg) => (
                <label key={bg} className="cursor-pointer">
                  <input type="radio" name="blood_group" value={bg} required className="peer sr-only" />
                  <span className="block text-center bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl py-2.5 text-xs font-medium peer-checked:border-red-500 peer-checked:bg-red-500 peer-checked:text-white hover:border-[#d2d2d7] transition-all">
                    {bg}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-[#1d1d1f] mb-2">Urgency</p>
            <div className="grid grid-cols-3 gap-2">
              <label className="cursor-pointer">
                <input type="radio" name="urgency" value="critical" required className="peer sr-only" />
                <span className="block border border-[#e5e5ea] bg-[#f5f5f7] rounded-xl p-3 text-center transition-all peer-checked:border-red-500 peer-checked:bg-red-100 hover:border-[#d2d2d7]">
                  <p className="text-sm font-medium text-[#1d1d1f]">Critical</p>
                  <p className="text-xs text-[#86868b] mt-0.5">Life-threatening</p>
                </span>
              </label>
              <label className="cursor-pointer">
                <input type="radio" name="urgency" value="urgent" required className="peer sr-only" />
                <span className="block border border-[#e5e5ea] bg-[#f5f5f7] rounded-xl p-3 text-center transition-all peer-checked:border-orange-400 peer-checked:bg-orange-100 hover:border-[#d2d2d7]">
                  <p className="text-sm font-medium text-[#1d1d1f]">Urgent</p>
                  <p className="text-xs text-[#86868b] mt-0.5">Within hours</p>
                </span>
              </label>
              <label className="cursor-pointer">
                <input type="radio" name="urgency" value="scheduled" required className="peer sr-only" />
                <span className="block border border-[#e5e5ea] bg-[#f5f5f7] rounded-xl p-3 text-center transition-all peer-checked:border-[#0071e3] peer-checked:bg-blue-100 hover:border-[#d2d2d7]">
                  <p className="text-sm font-medium text-[#1d1d1f]">Scheduled</p>
                  <p className="text-xs text-[#86868b] mt-0.5">Planned</p>
                </span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-[#1d1d1f] mb-1.5">Units</p>
              <input name="units" type="number" min="1" max="20" required defaultValue="1" className={inputCls} />
            </div>
            <div>
              <p className="text-xs font-medium text-[#1d1d1f] mb-1.5">Component</p>
              <select name="component" required className={`${inputCls} bg-[#f5f5f7]`}>
                <option value="">Select</option>
                {COMPONENTS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-[#1d1d1f] mb-1.5">Description</p>
            <textarea name="description" rows={3} required placeholder="Patient condition, ward, special instructions…" className={`${inputCls} resize-none`} />
          </div>

          <button type="submit" disabled={submitting} className="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white py-3 rounded-xl font-medium text-sm transition-colors disabled:opacity-50">
            {submitting ? 'Posting…' : 'Post request'}
          </button>
        </form>
      </div>
    </div>
  )
}
