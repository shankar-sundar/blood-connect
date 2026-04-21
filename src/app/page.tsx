import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="bg-[#1d1d1f] text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#1d1d1f]/80 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-white/90 tracking-tight">BloodConnect</Link>
          <div className="flex items-center gap-5">
            <Link href="/register" className="text-sm text-white/60 hover:text-white/90 transition-colors">Register</Link>
            <Link href="/sign-in" className="text-sm text-white/60 hover:text-white/90 transition-colors">Sign in</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-28 pb-32 text-center max-w-5xl mx-auto">
        <p className="text-sm font-medium text-red-400 tracking-widest uppercase mb-6">BloodConnect</p>
        <h1 className="text-7xl sm:text-8xl font-semibold tracking-tight leading-none mb-6">
          The end of<br />
          <span className="text-red-500">blood shortage.</span>
        </h1>
        <p className="text-xl text-white/60 max-w-xl mx-auto mb-10 leading-relaxed">
          4.3 million Indians die every year from lack of timely blood. BloodConnect connects donors and hospitals instantly.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register" className="bg-red-500 hover:bg-red-600 text-white font-medium text-sm px-7 py-3 rounded-full transition-colors">
            Donate blood
          </Link>
          <Link href="/register" className="bg-white/10 hover:bg-white/20 text-white font-medium text-sm px-7 py-3 rounded-full transition-colors">
            I&apos;m a hospital
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 pb-28">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: '4.3M', label: 'Preventable deaths\nper year in India' },
            { value: '3', label: 'Lives saved with\nevery donation' },
            { value: '90', label: 'Days between\nsafe donations' },
            { value: '0', label: 'Our target for\npreventable deaths' },
          ].map(({ value, label }) => (
            <div key={label} className="bg-white/5 rounded-3xl p-6 border border-white/10">
              <div className="text-4xl font-semibold tracking-tight mb-2">{value}</div>
              <div className="text-sm text-white/40 leading-snug whitespace-pre-line">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works — light section */}
      <section className="bg-[#f5f5f7] text-[#1d1d1f] px-6 py-28">
        <div className="max-w-5xl mx-auto">
          <p className="text-sm font-medium text-red-500 tracking-widest uppercase text-center mb-4">How it works</p>
          <h2 className="text-5xl font-semibold tracking-tight text-center mb-16">
            Three steps.<br />One life saved.
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { n: '01', title: 'Register', body: 'Donors sign up with blood group and city. Hospitals register to post urgent requests.' },
              { n: '02', title: 'Get matched', body: 'When blood is needed, matching donors are notified instantly — by blood group and proximity.' },
              { n: '03', title: 'Donate', body: 'Accept a request, visit the hospital, and donate. Track every life you save.' },
            ].map(({ n, title, body }) => (
              <div key={n}>
                <p className="text-xs font-semibold text-[#86868b] tracking-widest uppercase mb-4">{n}</p>
                <h3 className="text-2xl font-semibold tracking-tight mb-3">{title}</h3>
                <p className="text-[#6e6e73] text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Split cards */}
      <section className="px-6 py-10 bg-[#1d1d1f]">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-10 flex flex-col">
            <p className="text-xs font-semibold text-red-400 tracking-widest uppercase mb-3">For donors</p>
            <h3 className="text-3xl font-semibold tracking-tight mb-3">Be someone&apos;s hero.</h3>
            <p className="text-white/50 text-sm leading-relaxed mb-8 flex-1">
              Register once. Get notified when your blood type is urgently needed nearby. Accept, donate, save lives. Every 90 days.
            </p>
            <Link href="/register" className="self-start bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-6 py-2.5 rounded-full transition-colors">
              Register as donor
            </Link>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-10 flex flex-col">
            <p className="text-xs font-semibold text-blue-400 tracking-widest uppercase mb-3">For hospitals</p>
            <h3 className="text-3xl font-semibold tracking-tight mb-3">Blood when you need it.</h3>
            <p className="text-white/50 text-sm leading-relaxed mb-8 flex-1">
              Post a blood request in 30 seconds. Donors matching your blood type and city are notified immediately.
            </p>
            <Link href="/register" className="self-start bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-6 py-2.5 rounded-full transition-colors">
              Register your hospital
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#f5f5f7] text-[#1d1d1f] px-6 py-28 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-5xl font-semibold tracking-tight mb-4">Ready to save a life?</h2>
          <p className="text-[#6e6e73] mb-8 text-lg">Join BloodConnect. It&apos;s free, and it matters.</p>
          <Link href="/register" className="inline-block bg-red-500 hover:bg-red-600 text-white font-medium text-sm px-8 py-3 rounded-full transition-colors">
            Get started
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8 bg-[#1d1d1f]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs">© 2026 BloodConnect. Built to save lives.</p>
          <div className="flex gap-6">
            <Link href="/sign-in" className="text-xs text-white/30 hover:text-white/60 transition-colors">Sign in</Link>
            <Link href="/register" className="text-xs text-white/30 hover:text-white/60 transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
