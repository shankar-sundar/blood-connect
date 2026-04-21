'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole] = useState<'donor' | 'hospital'>('donor')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [locating, setLocating] = useState(false)

  function getLocation() {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude.toString()); setLng(pos.coords.longitude.toString()); setLocating(false) },
      () => setLocating(false)
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const fd = new FormData(e.currentTarget)

    const body: Record<string, unknown> = { role }
    for (const [key, value] of fd.entries()) body[key] = value
    if (lat) body.lat = parseFloat(lat)
    if (lng) body.lng = parseFloat(lng)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    setPending(false)

    if (!res.ok) { setError(data.error ?? 'Registration failed'); return }
    router.push(data.role === 'hospital' ? '/hospital/dashboard' : '/donor/dashboard')
  }

  const inputCls = 'w-full bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl px-4 py-3 text-sm text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#0071e3] focus:bg-white transition-colors'

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <nav className="sticky top-0 z-10 backdrop-blur-xl bg-[#f5f5f7]/80 border-b border-[#e5e5ea]">
        <div className="max-w-2xl mx-auto px-6 h-12 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-[#1d1d1f] tracking-tight">BloodConnect</Link>
          <Link href="/sign-in" className="text-sm text-[#0071e3] hover:underline">Sign in</Link>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-12 pb-20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-[#1d1d1f] mb-1">Create your account</h1>
          <p className="text-sm text-[#86868b]">Join BloodConnect and help save lives.</p>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { value: 'donor', title: 'I want to donate', sub: 'Blood donor' },
            { value: 'hospital', title: 'We need blood', sub: 'Hospital or blood bank' },
          ].map(({ value, title, sub }) => (
            <button key={value} type="button" onClick={() => setRole(value as 'donor' | 'hospital')}
              className={`rounded-2xl p-4 text-left border transition-all ${role === value ? 'bg-white border-[#0071e3] ring-1 ring-[#0071e3]' : 'bg-white border-[#e5e5ea] hover:border-[#d2d2d7]'}`}>
              <p className="text-sm font-semibold text-[#1d1d1f]">{title}</p>
              <p className="text-xs text-[#86868b] mt-0.5">{sub}</p>
            </button>
          ))}
        </div>

        {role === 'donor' && (
          <>
            <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl p-4 mb-5">
              <p className="text-xs font-semibold text-green-800 mb-2">Eligibility requirements</p>
              <div className="grid grid-cols-2 gap-1 text-xs text-green-700">
                {['Age 18–65', 'Weight ≥ 45 kg', 'Haemoglobin ≥ 12.5', 'No donation in 90 days', 'No fever/infection', 'No recent surgery'].map(i => (
                  <div key={i} className="flex items-center gap-1.5"><span className="text-green-500">✓</span>{i}</div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#e5e5ea] shadow-sm p-6 space-y-3">
              {error && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 text-center">{error}</div>}
              <div className="grid grid-cols-2 gap-3">
                <input name="first_name" type="text" required placeholder="First name" className={inputCls} />
                <input name="last_name" type="text" required placeholder="Last name" className={inputCls} />
              </div>
              <div className="flex">
                <span className="bg-[#f5f5f7] border border-r-0 border-[#e5e5ea] rounded-l-xl px-3 flex items-center text-sm text-[#86868b]">+91</span>
                <input name="mobile" type="tel" required placeholder="Mobile number" className="flex-1 bg-[#f5f5f7] border border-[#e5e5ea] rounded-r-xl px-4 py-3 text-sm text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#0071e3] focus:bg-white transition-colors" />
              </div>
              <input name="email" type="email" required placeholder="Email" className={inputCls} />
              <div className="grid grid-cols-2 gap-3">
                <input name="dob" type="date" required className={inputCls} />
                <select name="gender" required className={`${inputCls} bg-[#f5f5f7]`}>
                  <option value="">Gender</option>
                  <option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option>
                </select>
              </div>
              <div>
                <p className="text-xs font-medium text-[#1d1d1f] mb-2">Blood group</p>
                <div className="grid grid-cols-8 gap-1.5">
                  {BLOOD_GROUPS.map((bg) => (
                    <label key={bg} className="cursor-pointer">
                      <input type="radio" name="blood_group" value={bg} required className="peer sr-only" />
                      <span className="block text-center border border-[#e5e5ea] bg-[#f5f5f7] rounded-lg py-2 text-xs font-medium peer-checked:border-red-500 peer-checked:bg-red-500 peer-checked:text-white hover:border-[#d2d2d7] transition-all">{bg}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="relative">
                <input name="city" type="text" required placeholder="City" className={`${inputCls} pr-24`} />
                <button type="button" onClick={getLocation} className="absolute right-2 top-1.5 text-xs text-[#0071e3] bg-[#f5f5f7] px-3 py-1.5 rounded-lg hover:bg-[#e8e8ed] transition-colors font-medium">
                  {locating ? 'Locating…' : 'Use GPS'}
                </button>
              </div>
              {lat && <p className="text-xs text-green-600">Location captured ✓</p>}
              <input name="password" type="password" required placeholder="Password (min. 8 characters)" className={inputCls} />
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" required className="mt-0.5 rounded border-[#d2d2d7] text-[#0071e3]" />
                <span className="text-xs text-[#86868b]">I meet the eligibility criteria and consent to being contacted for donation requests.</span>
              </label>
              <button type="submit" disabled={pending} className="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white py-3 rounded-xl font-medium text-sm transition-colors disabled:opacity-50">
                {pending ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          </>
        )}

        {role === 'hospital' && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#e5e5ea] shadow-sm p-6 space-y-3">
            {error && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 text-center">{error}</div>}
            <input name="org_name" type="text" required placeholder="Organisation name" className={inputCls} />
            <select name="org_type" required className={`${inputCls} bg-[#f5f5f7]`}>
              <option value="">Type</option>
              <option>Government Hospital</option><option>Private Hospital</option><option>Blood Bank</option><option>Clinic</option>
            </select>
            <input name="email" type="email" required placeholder="Official email" className={inputCls} />
            <input name="mobile" type="tel" required placeholder="Phone number" className={inputCls} />
            <input name="city" type="text" required placeholder="City" className={inputCls} />
            <textarea name="address" required rows={2} placeholder="Full address" className={`${inputCls} resize-none`} />
            <input name="license_no" type="text" required placeholder="Blood bank license number" className={inputCls} />
            <input name="password" type="password" required placeholder="Password (min. 8 characters)" className={inputCls} />
            <button type="submit" disabled={pending} className="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white py-3 rounded-xl font-medium text-sm transition-colors disabled:opacity-50">
              {pending ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
