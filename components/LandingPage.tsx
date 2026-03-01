'use client';

import { SignInButton, SignUpButton } from '@clerk/nextjs';

const chips = [
  { icon: '🏡', label: 'Remote only', tag: 'Filter', style: { left: '0%', top: '20%' }, dur: '7s', delay: '0s' },
  { icon: '💰', label: '€80k–120k', tag: 'Salary', style: { left: '18%', top: '60%' }, dur: '6s', delay: '0.8s' },
  { icon: '🐍', label: 'Python · TypeScript', tag: 'Stack', style: { left: '38%', top: '10%' }, dur: '8s', delay: '0.3s' },
  { icon: '✈️', label: 'Visa sponsorship', tag: 'Filter', style: { left: '55%', top: '65%' }, dur: '6.5s', delay: '1.2s' },
  { icon: '🌱', label: 'Series A startup', tag: 'Stage', style: { left: '68%', top: '25%' }, dur: '7.5s', delay: '0.5s' },
  { icon: '🏢', label: '< 50 employees', tag: 'Size', style: { right: '0%', top: '55%' }, dur: '6s', delay: '1.5s' },
  { icon: '⚡', label: '4-day week', tag: 'Perks', style: { left: '28%', top: '78%' }, dur: '7s', delay: '0.2s' },
];

const features = [
  {
    icon: '🎯',
    title: 'Surgical filters',
    description: 'Drill down beyond job title. Filter by tech stack, team size, funding stage, remote policy, visa support, parental leave — and dozens more dimensions you won\'t find anywhere else.',
  },
  {
    icon: '📊',
    title: 'Rich job data',
    description: 'Every listing comes enriched with salary ranges, company culture signals, interview process info, and employee reviews — all in one place, no tab-switching required.',
  },
  {
    icon: '🔔',
    title: 'Smart alerts',
    description: 'Save your filter combinations and get notified the moment a matching position appears. Your ideal job comes to you, not the other way around.',
  },
];

const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function LandingPage() {
  return (
    <div className="font-jakarta min-h-screen overflow-x-hidden" style={{ background: '#FAF6EF', color: '#2C1A0E' }}>
      {/* Grain overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-[1000] opacity-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-4 sm:px-6 lg:px-10 py-3 sm:py-5 backdrop-blur-[12px]" style={{ background: 'rgba(250, 246, 239, 0.85)', borderBottom: '1px solid rgba(208, 160, 112, 0.15)' }}>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" />
          <span className="font-fraunces text-lg sm:text-2xl font-bold tracking-tight truncate" style={{ color: '#D4603A' }}>
            Netherlands<span style={{ color: '#2C1A0E' }}> Jobs</span>
          </span>
        </div>
        <div className="flex gap-2 sm:gap-3 items-center flex-shrink-0">
          <SignInButton mode="modal">
            <button className="text-xs sm:text-sm font-semibold px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors cursor-pointer" style={{ color: '#6B4226' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212, 96, 58, 0.08)'; e.currentTarget.style.color = '#D4603A'; }} onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6B4226'; }}>
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="text-xs sm:text-sm font-semibold text-white px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-lg cursor-pointer transition-transform hover:-translate-y-px whitespace-nowrap" style={{ background: '#D4603A', boxShadow: '0 2px 8px rgba(212, 96, 58, 0.3)' }}>
              Get access →
            </button>
          </SignUpButton>
        </div>
      </nav>

      {/* HERO */}
      <section className="min-h-screen flex flex-col items-center justify-center px-5 pt-24 sm:pt-28 pb-16 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute w-[700px] h-[700px] rounded-full -top-[150px] -right-[200px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(232, 147, 58, 0.12) 0%, transparent 70%)' }} />
        <div className="absolute w-[500px] h-[500px] rounded-full bottom-0 -left-[150px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(212, 96, 58, 0.08) 0%, transparent 70%)' }} />

        {/* Badge */}
        <div className="landing-animate-fade inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold mb-7" style={{ background: '#FFF1E6', border: '1px solid #F0D0B0', color: '#8B5E3C' }}>
          <span className="w-1.5 h-1.5 rounded-full landing-pulse-dot" style={{ background: '#D4603A' }} />
          Now in early access · 12,400+ open positions
        </div>

        {/* Headline */}
        <h1 className="landing-animate-fade-1 font-fraunces font-bold text-center leading-[1.08] tracking-tight max-w-[780px]" style={{ fontSize: 'clamp(2.8rem, 6vw, 5rem)', letterSpacing: '-0.03em', color: '#2C1A0E' }}>
          Find the job that actually<br />
          <em className="font-light not-italic" style={{ color: '#D4603A', fontStyle: 'italic' }}>fits you.</em>
        </h1>

        {/* Subhead */}
        <p className="landing-animate-fade-2 mt-6 text-lg text-center max-w-[520px] leading-relaxed" style={{ color: '#A07850' }}>
          The most detailed job board around. Filter by salary, stack, remote policy, visa sponsorship, company size, culture — and dozens more.
        </p>

        {/* CTA */}
        <div className="landing-animate-fade-3 mt-10 flex gap-3.5 items-center flex-wrap justify-center">
          <SignUpButton mode="modal">
            <button className="text-base font-semibold text-white px-8 py-3.5 rounded-xl cursor-pointer inline-flex items-center gap-2 transition-transform hover:-translate-y-0.5" style={{ background: '#D4603A', boxShadow: '0 4px 20px rgba(212, 96, 58, 0.35)' }}>
              Create free account
              <ArrowIcon />
            </button>
          </SignUpButton>
          <a href="#features" className="text-base font-medium px-7 py-3.5 rounded-xl transition-colors no-underline" style={{ color: '#6B4226', border: '1.5px solid #F0D0B0' }}>
            See how it works
          </a>
        </div>

        {/* Floating chips */}
        <div className="landing-animate-fade-4 relative w-[min(860px,96vw)] h-[220px] sm:h-[220px] mt-14">
          {chips.map((chip, i) => (
            <div
              key={i}
              className="landing-chip absolute inline-flex items-center gap-1.5 bg-white rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap select-none"
              style={{
                ...chip.style,
                border: '1.5px solid #F0D0B0',
                color: '#6B4226',
                boxShadow: '0 2px 12px rgba(139, 94, 60, 0.1)',
                ['--dur' as string]: chip.dur,
                ['--delay' as string]: chip.delay,
              } as React.CSSProperties}
            >
              <span className="text-base">{chip.icon}</span>
              {chip.label}
              <span className="text-[0.7rem] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#FFF1E6', color: '#D4603A' }}>
                {chip.tag}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* STATS BAR */}
      <div className="flex gap-0 justify-center bg-white flex-wrap py-7 px-5" style={{ borderTop: '1px solid #F0D0B0', borderBottom: '1px solid #F0D0B0' }}>
        {[
          { number: '12,400+', label: 'Active positions' },
          { number: '60+', label: 'Filter dimensions' },
          { number: '3,200+', label: 'Companies' },
          { number: 'Daily', label: 'Fresh updates' },
        ].map((stat, i) => (
          <div key={i} className="flex-1 min-w-[160px] text-center px-6 py-2" style={{ borderRight: i < 3 ? '1px solid #F0D0B0' : 'none' }}>
            <div className="font-fraunces text-4xl font-bold leading-none" style={{ color: '#D4603A' }}>{stat.number}</div>
            <div className="mt-1 text-xs font-medium" style={{ color: '#A07850' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* FEATURES */}
      <section id="features" className="py-20 px-5 max-w-[1100px] mx-auto">
        <p className="text-center text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#D4603A' }}>
          Why this board
        </p>
        <h2 className="font-fraunces text-center font-semibold leading-tight mb-14" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.75rem)', letterSpacing: '-0.025em', color: '#2C1A0E' }}>
          Job hunting is broken.<br />
          <em className="font-light" style={{ color: '#D4603A' }}>We fixed it.</em>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-8 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-default"
              style={{ border: '1.5px solid #F0D0B0' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212, 96, 58, 0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#F0D0B0'; }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-5" style={{ background: '#FFF1E6' }}>
                {f.icon}
              </div>
              <h3 className="font-fraunces text-xl font-semibold mb-2" style={{ color: '#2C1A0E', letterSpacing: '-0.015em' }}>
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: '#A07850' }}>
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA SECTION */}
      <div className="max-w-[1100px] mx-4 lg:mx-auto mb-20 rounded-3xl py-16 px-8 text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #D4603A 0%, #E8933A 100%)' }}>
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`,
          }}
        />
        <h2 className="font-fraunces text-white font-bold leading-tight relative" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', letterSpacing: '-0.03em' }}>
          Your next role is<br />in here somewhere.
        </h2>
        <p className="text-base mt-4 mb-9 relative" style={{ color: 'rgba(255,255,255,0.8)' }}>
          Register for free and start searching with filters that actually matter.
        </p>
        <SignUpButton mode="modal">
          <button className="relative text-base font-semibold px-9 py-3.5 rounded-xl cursor-pointer inline-flex items-center gap-2 bg-white transition-transform hover:-translate-y-0.5" style={{ color: '#D4603A', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
            Get started for free
            <ArrowIcon />
          </button>
        </SignUpButton>
      </div>

      {/* FOOTER */}
      <footer className="text-center py-8 text-xs" style={{ color: '#A07850', borderTop: '1px solid #F0D0B0' }}>
        © 2026 Netherlands Job Opportunities · Built for people who know what they want.
      </footer>
    </div>
  );
}
