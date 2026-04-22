import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingOverlay from '../components/LoadingOverlay'
import Toast from '../components/Toast'
import { formatBytes } from '../utils/biasUtils'

const STEPS    = ['Upload CSV', 'Ingest Records', 'Run Audit', 'View Results']
const API_BASE = import.meta.env.VITE_API_URL || ''

// Country display config — maps API country key → display name + flag emoji
const COUNTRY_META = {
  INDIA: { flag: '🇮🇳', name: 'India' },
  UK:    { flag: '🇬🇧', name: 'United Kingdom' },
  USA:   { flag: '🇺🇸', name: 'United States' },
}

export default function UploadPage() {
  const navigate    = useNavigate()
  const fileInputRef = useRef(null)
  const [file, setFile]               = useState(null)
  const [dragging, setDragging]       = useState(false)
  const [loading, setLoading]         = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [toast, setToast]             = useState({ message: '', type: 'error' })

  // Live stats fetched from backend — null while loading, object once resolved
  const [stats, setStats] = useState(null)

  const showToast  = (message, type = 'error') => setToast({ message, type })
  const clearToast = () => setToast({ message: '', type: 'error' })

  // ── Fetch live stats from Spring Boot on mount ──────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/api/audit/stats`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setStats(data) })
      .catch(() => { /* stats unavailable — UI falls back gracefully */ })
  }, [])

  const handleFile = (f) => {
    if (!f?.name.endsWith('.csv')) {
      showToast('Only CSV files are supported.', 'error')
      return
    }
    setFile(f)
    setCurrentStep(1)
  }

  const onDragOver  = useCallback((e) => { e.preventDefault(); setDragging(true) }, [])
  const onDragLeave = useCallback(() => setDragging(false), [])
  const onDrop      = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const onFileInput = (e) => {
    const f = e.target.files[0]
    if (f) handleFile(f)
  }

  const runAudit = async () => {
    if (!file) return
    setLoading(true)
    setCurrentStep(1)

    const withTimeout = (promise, ms, label) =>
      Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(
            `${label} timed out after ${ms / 1000}s. Is the server running?`
          )), ms)
        ),
      ])

    try {
      // Step 1: Upload CSV
      const form = new FormData()
      form.append('file', file)
      const uploadRes = await withTimeout(
        fetch(`${API_BASE}/api/audit/upload`, { method: 'POST', body: form }),
        15000, 'Upload'
      )
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}))
        throw new Error(err.error || `Upload failed (${uploadRes.status})`)
      }
      const datasetId = await uploadRes.json()
      setCurrentStep(2)

      // Step 2: Run audit
      const auditRes = await withTimeout(
        fetch(`${API_BASE}/api/audit/run/${datasetId}`),
        30000, 'Audit'
      )
      if (!auditRes.ok) {
        const err = await auditRes.json().catch(() => ({}))
        throw new Error(err.error || `Audit failed (${auditRes.status})`)
      }
      const result = await auditRes.json()
      setCurrentStep(3)

      sessionStorage.setItem('bailwatchResult', JSON.stringify(result))
      await new Promise((r) => setTimeout(r, 400))

      // Refresh stats after a successful upload so hero numbers update
      fetch(`${API_BASE}/api/audit/stats`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { if (data) setStats(data) })
        .catch(() => {})

      setLoading(false)
      navigate('/results')
    } catch (err) {
      setLoading(false)
      setCurrentStep(file ? 1 : 0)
      showToast(err.message, 'error')
    }
  }

  // ── Derived display values from live stats ──────────────────────────────
  // Format a number with commas e.g. 4000 → "4,000"
  const fmt = (n) => n != null ? Number(n).toLocaleString('en-US') : '—'

  const heroStats = [
    {
      num:   stats ? fmt(stats.totalRecords) : '—',
      label: 'Cases Ingested',
    },
    {
      num:   stats ? fmt(stats.totalCountries) : '—',
      label: 'Jurisdictions',
    },
    {
      num:   stats ? fmt(stats.biasDimensions) : '—',
      label: 'Bias Dimensions',
    },
  ]

  // Build jurisdiction rows from live byCountry data, falling back to known countries
  // so the card always shows something even before any CSV is uploaded.
  const jurisdictionRows = (() => {
    const byCountry = stats?.byCountry || {}
    const knownKeys = ['INDIA', 'UK', 'USA']

    // Show all countries returned by API, plus known countries not yet in DB (with count 0)
    const allKeys = [...new Set([...knownKeys, ...Object.keys(byCountry)])]

    return allKeys.map((key) => {
      const meta  = COUNTRY_META[key] || { flag: '🌐', name: key }
      const count = byCountry[key]
      return {
        flag:  meta.flag,
        name:  meta.name,
        // Only show count if we have real data; show '—' while stats are loading
        rows:  count != null ? `${fmt(count)} records` : (stats ? '0 records' : '—'),
      }
    })
  })()

  return (
    <>
      <LoadingOverlay visible={loading} />
      <Toast message={toast.message} type={toast.type} onClose={clearToast} />

      <main className="relative z-10 pt-16 min-h-screen">

        {/* ── HERO ───────────────────────────────── */}
        <section className="px-10 md:px-20 pt-20 pb-16 relative overflow-hidden">
          {/* Ambient glow */}
          <div
            style={{
              position: 'absolute',
              width: 700,
              height: 700,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(184,134,11,0.05) 0%, transparent 65%)',
              top: '50%',
              right: '-10%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          />

          {/* Eyebrow */}
          <div
            className="flex items-center gap-3 mb-10"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              letterSpacing: '0.22em',
              color: 'var(--gold-bright)',
              textTransform: 'uppercase',
              animation: 'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s both',
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--gold-bright)',
                animation: 'pulseDot 2s ease infinite',
              }}
            />
            System Active — Bias Detection Engine Ready
          </div>

          {/* Title */}
          <div style={{ animation: 'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s both' }}>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(56px, 9vw, 128px)',
                fontWeight: 800,
                lineHeight: 0.92,
                letterSpacing: '-0.02em',
                color: 'var(--white)',
                marginBottom: 16,
              }}
            >
              Exposing
              <br />
              <em style={{ color: 'var(--gold-bright)', fontStyle: 'italic' }}>Hidden Bias</em>
            </h1>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(20px, 3vw, 36px)',
                fontWeight: 400,
                fontStyle: 'italic',
                color: 'var(--white-dim)',
                marginBottom: 28,
              }}
            >
              in Bail Decisions
            </div>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1rem',
              fontWeight: 300,
              color: 'var(--white-dim)',
              maxWidth: 480,
              lineHeight: 1.8,
              marginBottom: 20,
              animation: 'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.32s both',
            }}
          >
            Upload a bail records dataset. Receive an irrefutable verdict.
            <br />
            <span style={{ color: 'var(--white-ghost)' }}>
              Systemic discrimination in courts doesn't hide from data.
            </span>
          </div>

          {/* ── Hero stats — all from live API ── */}
          <div
            className="flex items-center gap-10 mb-14"
            style={{ animation: 'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.42s both' }}
          >
            {heroStats.map((s, i) => (
              <div key={i} className="flex items-center gap-10">
                {i > 0 && (
                  <div style={{ width: 1, height: 36, background: 'var(--border)' }} />
                )}
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '2.2rem',
                      fontWeight: 700,
                      color: s.num === '—' ? 'var(--white-ghost)' : 'var(--gold-bright)',
                      lineHeight: 1,
                      transition: 'color 0.3s',
                    }}
                  >
                    {s.num}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.6rem',
                      letterSpacing: '0.18em',
                      color: 'var(--white-ghost)',
                      marginTop: 6,
                      textTransform: 'uppercase',
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Step indicator */}
          <div
            className="flex items-center gap-0"
            style={{
              animation: 'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.52s both',
              maxWidth: 540,
            }}
          >
            {STEPS.map((label, i) => {
              const done   = currentStep > i
              const active = currentStep === i
              return (
                <div key={i} className="flex items-center flex-1">
                  <div className="flex items-center gap-2 relative z-10">
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        border: `1px solid ${done ? 'var(--gold)' : active ? 'var(--gold)' : 'var(--border-lit)'}`,
                        background: done ? 'var(--gold)' : 'var(--surface)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        color: done ? 'var(--ink)' : active ? 'var(--gold-bright)' : 'var(--white-ghost)',
                        flexShrink: 0,
                        transition: 'all 0.3s',
                      }}
                    >
                      {done ? '✓' : i + 1}
                    </div>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.6rem',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: done
                          ? 'var(--gold)'
                          : active
                          ? 'var(--white-dim)'
                          : 'rgba(232,228,220,0.2)',
                        whiteSpace: 'nowrap',
                        transition: 'color 0.3s',
                      }}
                    >
                      {label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      style={{
                        flex: 1,
                        height: 1,
                        background: done ? 'var(--gold)' : 'var(--border)',
                        opacity: done ? 0.4 : 1,
                        margin: '0 8px',
                        transition: 'background 0.3s',
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* ── UPLOAD SECTION ─────────────────────── */}
        <section className="px-10 md:px-20 pb-24 relative z-10">
          <div className="section-label mb-8">Initiate Audit</div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">

            {/* Upload card */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                padding: '44px 48px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'border-color 0.25s',
              }}
            >
              {/* Top accent line */}
              <div
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0,
                  height: 2,
                  background: 'linear-gradient(90deg, var(--gold), transparent)',
                  opacity: file ? 1 : 0,
                  transition: 'opacity 0.3s',
                }}
              />

              {/* Icon */}
              <div
                style={{
                  width: 64,
                  height: 64,
                  border: '1px solid var(--border-lit)',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--surface-2)',
                  marginBottom: 24,
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>

              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.7rem',
                  fontWeight: 700,
                  color: 'var(--white)',
                  marginBottom: 8,
                }}
              >
                Submit Court Records
              </div>
              <div
                style={{
                  fontSize: '0.88rem',
                  color: 'var(--white-dim)',
                  marginBottom: 32,
                  lineHeight: 1.7,
                  fontWeight: 300,
                }}
              >
                Upload a CSV bail dataset. The system will automatically detect the jurisdiction
                and parse all records for bias analysis.
              </div>

              {/* Drop zone */}
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `1px dashed ${dragging ? 'var(--gold-bright)' : 'rgba(184,134,11,0.35)'}`,
                  borderRadius: 3,
                  padding: '44px 32px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: dragging ? 'rgba(184,134,11,0.07)' : 'rgba(184,134,11,0.03)',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={onFileInput}
                  style={{ display: 'none' }}
                />
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--gold)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ margin: '0 auto 14px' }}
                >
                  <polyline points="16,16 12,12 8,16" />
                  <line x1="12" y1="12" x2="12" y2="21" />
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                </svg>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem',
                    color: 'var(--gold)',
                    letterSpacing: '0.08em',
                    marginBottom: 6,
                  }}
                >
                  Drop CSV file here or click to browse
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    color: 'var(--white-ghost)',
                  }}
                >
                  Supports India / UK / USA bail record formats
                </div>
              </div>

              {/* File selected */}
              {file && (
                <div
                  className="flex items-center gap-3 mt-4 px-4 py-3"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border-lit)',
                    borderRadius: 3,
                    animation: 'fadeIn 0.3s ease',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.78rem',
                      color: 'var(--white)',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {file.name}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.68rem',
                      color: 'var(--white-dim)',
                      flexShrink: 0,
                    }}
                  >
                    {formatBytes(file.size)}
                  </span>
                </div>
              )}

              {/* CTA Button */}
              <button
                onClick={runAudit}
                disabled={!file || loading}
                className="w-full flex items-center justify-center gap-3 mt-6 py-4 px-8 font-bold tracking-widest uppercase text-sm transition-all duration-200"
                style={{
                  background: !file || loading ? 'rgba(184,134,11,0.3)' : 'var(--gold-bright)',
                  color: !file || loading ? 'rgba(232,228,220,0.4)' : 'var(--ink)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  letterSpacing: '0.2em',
                  borderRadius: 3,
                  cursor: !file || loading ? 'not-allowed' : 'pointer',
                  border: 'none',
                  transform: 'translateY(0)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { if (file && !loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Run Bias Audit
              </button>
            </div>

            {/* Info cards */}
            <div className="flex flex-col gap-4">

              {/* ── Jurisdictions — real record counts from DB ── */}
              <InfoCard
                label="Ingested Datasets"
                title={
                  stats
                    ? `${fmt(stats.totalCountries)} Jurisdiction${stats.totalCountries !== 1 ? 's' : ''}`
                    : 'Supported Jurisdictions'
                }
              >
                <div className="flex flex-col gap-3 mt-1">
                  {jurisdictionRows.map((c) => (
                    <div
                      key={c.name}
                      className="flex items-center gap-3"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem' }}
                    >
                      <span style={{ fontSize: '1rem' }}>{c.flag}</span>
                      <span style={{ color: 'var(--white)', flex: 1 }}>{c.name}</span>
                      <span
                        style={{
                          color: c.rows === '—' ? 'var(--white-ghost)' : 'var(--white-dim)',
                          fontStyle: c.rows === '—' ? 'italic' : 'normal',
                        }}
                      >
                        {c.rows}
                      </span>
                    </div>
                  ))}
                </div>
              </InfoCard>

              {/* Bias dimensions — these ARE the engine rules, not mock data */}
              <InfoCard label="Bias Dimensions Audited" title="What We Measure">
                <div className="flex flex-col gap-2 mt-1">
                  {[
                    'Income Level — Low / Medium / High',
                    'Legal Representation — Yes / No',
                    'Location Type — Urban / Rural',
                    'Social / Ethnic Group — where available',
                  ].map((d) => (
                    <div
                      key={d}
                      className="flex items-center gap-2"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.72rem',
                        color: 'var(--white-dim)',
                      }}
                    >
                      <div
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          background: 'var(--gold)',
                          opacity: 0.5,
                          flexShrink: 0,
                        }}
                      />
                      {d}
                    </div>
                  ))}
                </div>
              </InfoCard>

              {/* Methodology — these ARE the scoring thresholds, not mock data */}
              <InfoCard label="Methodology" title="Threshold Guide">
                <div className="flex flex-col gap-2 mt-2">
                  {[
                    { flag: 'HIGH',     range: 'ratio ≥ 2.0', color: '#DC2626' },
                    { flag: 'MODERATE', range: 'ratio ≥ 1.5', color: '#D97706' },
                    { flag: 'LOW',      range: 'ratio < 1.5', color: '#16A34A' },
                  ].map((t) => (
                    <div
                      key={t.flag}
                      className="flex items-center justify-between"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}
                    >
                      <span style={{ color: t.color, letterSpacing: '0.12em' }}>{t.flag}</span>
                      <span style={{ color: 'var(--white-ghost)' }}>{t.range}</span>
                    </div>
                  ))}
                </div>
              </InfoCard>

            </div>
          </div>
        </section>

        {/* Footer */}
        <footer
          className="flex items-center justify-between px-10 md:px-20 py-8"
          style={{ borderTop: '1px solid var(--border)', position: 'relative', zIndex: 1 }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.62rem',
              color: 'rgba(232,228,220,0.2)',
              letterSpacing: '0.1em',
            }}
          >
            BAILWATCH AUDIT SYSTEM · BUILD 2.4.1
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.62rem',
              color: 'rgba(232,228,220,0.2)',
            }}
          >
            DATA IS NOT LEGAL ADVICE
          </span>
        </footer>
      </main>
    </>
  )
}

function InfoCard({ label, title, children }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 4,
        padding: '22px 24px',
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-lit)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <div className="section-label" style={{ marginBottom: 12 }}>{label}</div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.05rem',
          fontWeight: 700,
          color: 'var(--white)',
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}
