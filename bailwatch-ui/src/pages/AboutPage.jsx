import { Link } from 'react-router-dom'

const SDG_STATS = [
  { num: '11M+',  label: 'People in pretrial detention worldwide' },
  { num: '70%',   label: 'Of prisoners in developing nations are awaiting trial' },
  { num: '3×',    label: 'More likely low-income defendants are denied bail' },
]

const TECH_STACK = [
  { icon: '⚡', name: 'React + Vite',    role: 'Frontend',     desc: 'Fast, responsive UI with real-time bias visualisation' },
  { icon: '☕', name: 'Spring Boot',      role: 'Backend API',  desc: 'REST API — CSV ingestion, PostgreSQL persistence, audit orchestration' },
  { icon: '🐍', name: 'Python + Flask',  role: 'ML Engine',    desc: 'Statistical bias engine — disparity ratio analysis across demographic groups' },
  { icon: '✨', name: 'Gemini API',       role: 'AI',           desc: 'Google Gemini 2.0 Flash generates plain-English audit narratives and recommendations' },
  { icon: '🗄️', name: 'PostgreSQL',      role: 'Database',     desc: 'Stores all ingested bail records and audit history with full dataset traceability' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Upload',  desc: 'Upload a CSV of bail court records. BailWatch auto-detects the jurisdiction — India, UK, or USA.' },
  { step: '02', title: 'Analyse', desc: 'The bias engine calculates disparity ratios across income level, legal representation, location, and social group.' },
  { step: '03', title: 'Explain', desc: 'Gemini AI generates a plain-English explanation of findings, key statistics, and concrete recommendations.' },
  { step: '04', title: 'Act',     desc: 'Download a full audit report. Share evidence of systemic bias with courts, policymakers, and civil society.' },
]

export default function AboutPage() {
  return (
    <main className="relative z-10 pt-16 min-h-screen">

      {/* ── HERO ── */}
      <section className="px-10 md:px-20 pt-20 pb-20 relative overflow-hidden" style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 60% 50%, rgba(184,134,11,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '7px 16px',
          background: 'var(--gold-dim)',
          border: '1px solid rgba(184,134,11,0.3)',
          borderRadius: 2,
          fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.2em',
          color: 'var(--gold-bright)', textTransform: 'uppercase',
          marginBottom: 28,
          animation: 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          UN SDG 16.3 — Equal Access to Justice for All
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 6vw, 88px)',
          fontWeight: 800, lineHeight: 0.95, color: 'var(--white)', marginBottom: 24,
          animation: 'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s both',
        }}>
          Justice should not depend<br />
          <em style={{ color: 'var(--gold-bright)', fontStyle: 'italic' }}>on your income.</em>
        </h1>

        <p style={{
          fontFamily: 'var(--font-body)', fontSize: '1.05rem', fontWeight: 300,
          color: 'var(--white-dim)', maxWidth: 580, lineHeight: 1.9, marginBottom: 40,
          animation: 'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s both',
        }}>
          Bail decisions shape whether a person waits for trial at home or in a cell.
          Across jurisdictions, these decisions are systematically skewed by income,
          access to legal counsel, and geographic location — not by the facts of the case.
          BailWatch makes this invisible bias visible and measurable.
        </p>

        <div className="flex flex-wrap gap-6 mb-12" style={{ animation: 'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.28s both' }}>
          {SDG_STATS.map((s) => (
            <div key={s.num} style={{ padding: '20px 24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, minWidth: 180 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 800, color: 'var(--gold-bright)', lineHeight: 1, marginBottom: 6 }}>{s.num}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--white-dim)', letterSpacing: '0.06em', lineHeight: 1.5 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <Link to="/audit" style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '14px 32px', background: 'var(--gold-bright)', color: 'var(--ink)',
          fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.2em',
          textTransform: 'uppercase', fontWeight: 700, borderRadius: 3, textDecoration: 'none',
          animation: 'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.34s both',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          Run a Bias Audit
        </Link>
      </section>

      {/* ── THE PROBLEM ── */}
      <section className="px-10 md:px-20 py-20" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="section-label mb-10">The Problem</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 700, color: 'var(--white)', lineHeight: 1.1, marginBottom: 20 }}>
              Pretrial detention is a<br /><em style={{ color: '#DC2626', fontStyle: 'italic' }}>justice crisis</em>
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', fontWeight: 300, color: 'var(--white-dim)', lineHeight: 1.9, marginBottom: 16 }}>
              Globally, over 11 million people are held in pretrial detention at any given moment — many for months or years before their case is heard. In India alone, over 75% of the prison population are undertrial prisoners.
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', fontWeight: 300, color: 'var(--white-dim)', lineHeight: 1.9 }}>
              Research consistently shows bail outcomes are not neutral. Low-income defendants, those without legal representation, and defendants from rural areas are systematically less likely to receive bail — independent of their actual flight risk or the severity of the alleged offence.
            </p>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '28px 32px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--gold-bright)', textTransform: 'uppercase', marginBottom: 16 }}>SDG Target 16.3</div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 600, fontStyle: 'italic', color: 'var(--white)', lineHeight: 1.6, marginBottom: 20, borderLeft: '2px solid var(--gold)', paddingLeft: 18 }}>
              "Promote the rule of law at the national and international levels and ensure equal access to justice for all."
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', fontWeight: 300, color: 'var(--white-dim)', lineHeight: 1.8 }}>
              BailWatch directly supports SDG 16.3 by providing courts, researchers, and civil society organisations with a quantitative tool to detect and document unequal access to bail — a foundational element of equal access to justice.
            </p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="px-10 md:px-20 py-20" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="section-label mb-10 mt-5">How It Works</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.step} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '28px 24px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700, color: 'rgba(184,134,11,0.15)', lineHeight: 1, marginBottom: 16 }}>{step.step}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--white)', marginBottom: 10 }}>{step.title}</div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.84rem', fontWeight: 300, color: 'var(--white-dim)', lineHeight: 1.8, margin: 0 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TECH STACK ── */}
      <section className="px-10 md:px-20 py-20" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="section-label mb-10">Technology Stack</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TECH_STACK.map((tech) => (
            <div
              key={tech.name}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '22px 24px', display: 'flex', gap: 16, alignItems: 'flex-start', transition: 'border-color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-lit)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <span style={{ fontSize: '1.5rem', flexShrink: 0, marginTop: 2 }}>{tech.icon}</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--white)' }}>{tech.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.14em', color: 'var(--gold-bright)', textTransform: 'uppercase', padding: '2px 7px', background: 'var(--gold-dim)', borderRadius: 2 }}>{tech.role}</span>
                </div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: 300, color: 'var(--white-dim)', lineHeight: 1.7, margin: 0 }}>{tech.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section className="px-10 md:px-20 py-20 text-center">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 56px)', fontWeight: 800, color: 'var(--white)', marginBottom: 16, lineHeight: 1.1 }}>
          Data doesn't lie.<br /><em style={{ color: 'var(--gold-bright)', fontStyle: 'italic' }}>Bias can't hide from it.</em>
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', fontWeight: 300, color: 'var(--white-dim)', maxWidth: 420, margin: '0 auto 36px', lineHeight: 1.9 }}>
          Upload a bail records dataset and receive an irrefutable, evidence-based verdict in seconds.
        </p>
        <Link to="/audit" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 36px', background: 'var(--gold-bright)', color: 'var(--ink)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, borderRadius: 3, textDecoration: 'none' }}>
          Start Audit →
        </Link>
      </section>

      <footer className="flex flex-col sm:flex-row items-center justify-between px-10 md:px-20 py-8 gap-2" style={{ borderTop: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(232,228,220,0.2)', letterSpacing: '0.1em' }}>BAILWATCH · GOOGLE SOLUTION CHALLENGE 2026 · SDG 16.3</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(232,228,220,0.2)' }}>DATA IS NOT LEGAL ADVICE</span>
      </footer>
    </main>
  )
}