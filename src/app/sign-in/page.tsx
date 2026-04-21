'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const inputCls = 'w-full bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl px-4 py-3 text-sm text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#0071e3] focus:bg-white transition-colors'

export default function SignInPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const fd = new FormData(e.currentTarget)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') }),
    })

    const data = await res.json()
    setPending(false)

    if (!res.ok) { setError(data.error ?? 'Sign in failed'); return }
    router.push(data.role === 'hospital' ? '/hospital/dashboard' : '/donor/dashboard')
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
            <input name="email" type="email" placeholder="Email" required className={inputCls} />
            <input name="password" type="password" placeholder="Password" required className={inputCls} />
            <button type="submit" disabled={pending}
              className="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white py-3 rounded-xl font-medium text-sm transition-colors disabled:opacity-50">
              {pending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#86868b] mt-5">
          No account?{' '}
          <Link href="/register" className="text-[#0071e3] hover:underline">Create yours now</Link>
        </p>
      </div>
    </div>
  )
}
