'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const inputCls = 'w-full bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl px-4 py-3 text-sm text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#0071e3] focus:bg-white transition-colors'

const DEMO_PASSWORD = 'Test@1234'

export default function SignInPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [demoOpen, setDemoOpen] = useState(false)
  const [demoRole, setDemoRole] = useState<'hospital' | 'donor' | null>(null)

  const DEMO_ACCOUNTS = {
    hospital: [
      { city: 'Hyderabad', email: 'hospital1.hyderabad@test.com' },
      { city: 'Bangalore', email: 'hospital5.bangalore@test.com' },
      { city: 'Kolkata', email: 'hospital2.kolkata@test.com' },
    ],
    donor: [
      { city: 'Hyderabad', email: 'donor5.hyderabad@test.com' },
      { city: 'Bangalore', email: 'donor23.bangalore@test.com' },
      { city: 'Kolkata', email: 'donor11.kolkata@test.com' },
    ],
  }

  async function login(e: string, p: string) {
    setPending(true)
    setError(null)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: e, password: p }),
    })

    const data = await res.json()
    setPending(false)

    if (!res.ok) { setError(data.error ?? 'Sign in failed'); return }
    router.push(data.role === 'hospital' ? '/hospital/dashboard' : '/donor/dashboard')
  }

  async function fillDemo(demoEmail: string) {
    setEmail(demoEmail)
    setPassword(DEMO_PASSWORD)
    await login(demoEmail, DEMO_PASSWORD)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    await login(email, password)
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-sm font-semibold text-[#1d1d1f] tracking-tight">BloodConnect</Link>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1d1d1f] mt-3 mb-1">Sign in</h1>
          <p className="text-sm text-[#86868b]">Use your BloodConnect account</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e5ea] shadow-sm p-8">
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input name="email" type="email" placeholder="Email" required className={inputCls}
              value={email} onChange={e => setEmail(e.target.value)} />
            <input name="password" type="password" placeholder="Password" required className={inputCls}
              value={password} onChange={e => setPassword(e.target.value)} />
            <button type="submit" disabled={pending}
              className="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white py-3 rounded-xl font-medium text-sm transition-colors disabled:opacity-50">
              {pending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-[#e5e5ea]">
            <button onClick={() => { setDemoOpen(o => !o); setDemoRole(null) }}
              className="flex items-center justify-center gap-1 w-full text-xs text-[#86868b] hover:text-[#1d1d1f] transition-colors bg-transparent border-none cursor-pointer">
              Demo accounts
              <svg className={`w-3 h-3 transition-transform ${demoOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {demoOpen && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {(['hospital', 'donor'] as const).map((role) => (
                    <button key={role} onClick={() => setDemoRole(r => r === role ? null : role)}
                      className={`text-xs font-medium px-3 py-2 rounded-lg border transition-colors cursor-pointer capitalize ${
                        demoRole === role
                          ? 'bg-[#0071e3] text-white border-[#0071e3]'
                          : 'bg-[#f5f5f7] text-[#1d1d1f] border-[#e5e5ea] hover:bg-[#e5e5ea]'
                      }`}>
                      {role === 'hospital' ? 'Hospital' : 'Donor'}
                    </button>
                  ))}
                </div>
                {demoRole && (
                  <div className="flex flex-col gap-1">
                    {DEMO_ACCOUNTS[demoRole].map(({ city, email }) => (
                      <button key={email} onClick={() => fillDemo(email)}
                        className="group flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border border-transparent hover:bg-rose-50 hover:border-rose-100 transition-colors bg-transparent cursor-pointer w-full">
                        <span className="shrink-0 text-[#86868b] group-hover:text-rose-400">{city}</span>
                        <span className="truncate text-[#0071e3] group-hover:text-rose-600 group-hover:font-medium">{email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-[#86868b] mt-5">
          No account?{' '}
          <Link href="/register" className="text-[#0071e3] hover:underline">Create yours now</Link>
        </p>
      </div>
    </div>
  )
}
