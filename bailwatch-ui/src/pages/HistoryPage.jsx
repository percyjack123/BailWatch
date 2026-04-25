import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Toast from '../components/Toast'

const BASE = import.meta.env.VITE_API_BASE 

const COUNTRY_FLAG = { INDIA: '🇮🇳', UK: '🇬🇧', USA: '🇺🇸' }

export default function HistoryPage() {
  const navigate = useNavigate()
  const [history, setHistory]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [running, setRunning]   = useState(null)   // datasetId currently being re-audited
  const [toast, setToast]       = useState({ message: '', type: 'error' })

  const showToast  = (msg, type = 'error') => setToast({ message: msg, type })
  const clearToast = () => setToast({ message: '', type: 'error' })

  useEffect(() => {
    fetch(`${BASE}/api/audit/stats/history`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setHistory(data); setLoading(false) })
      .catch(() => { setLoading(false); showToast('Could not load audit history.') })
  }, [])

  const reRunAudit = async (datasetId) => {
    setRunning(datasetId)
    try {
      const res = await fetch(`${BASE}/api/audit/run/${datasetId}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Audit failed (${res.status})`)
      }
      const result = await res.json()
      sessionStorage.setItem('bailwatchResult', JSON.stringify(result))
      navigate('/results')
    } catch (err) {
      showToast(err.message)
    } finally {
      setRunning(null)
    }
  }

  return (
    <>
      <Toast message={toast.message} type={toast.type} onClose={clearToast} />

      <main className="relative z-10 pt-16 min-h-screen">
        <section className="px-10 md:px-20 pt-16 pb-10">

          {/* Header */}
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.62rem',
              letterSpacing: '0.22em',
              color: 'var(--gold-bright)',
              textTransform: 'uppercase',
              marginBottom: 20,
              animation: 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
            }}
          >
            Past Audits
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(32px, 5vw, 64px)',
              fontWeight: 800,
              lineHeight: 0.95,
              color: 'var(--white)',
              marginBottom: 12,
              animation: 'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s both',
            }}
          >
            Audit <em style={{ color: 'var(--gold-bright)', fontStyle: 'italic' }}>History</em>
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.9rem',
              fontWeight: 300,
              color: 'var(--white-dim)',
              marginBottom: 40,
              animation: 'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.18s both',
            }}
          >
            All previously ingested datasets. Click any row to re-run its bias audit.
          </p>

          {/* Table */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              overflow: 'hidden',
              animation: 'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.25s both',
            }}
          >
            {/* Table header */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: '80px 1fr 140px 160px',
                padding: '12px 24px',
                borderBottom: '1px solid var(--border)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.58rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'rgba(232,228,220,0.28)',
              }}
            >
              <span>#</span>
              <span>Jurisdiction</span>
              <span style={{ textAlign: 'right' }}>Records</span>
              <span style={{ textAlign: 'right' }}>Action</span>
            </div>

            {/* Loading state */}
            {loading && (
              <div
                style={{
                  padding: '48px 24px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  color: 'var(--white-ghost)',
                  letterSpacing: '0.1em',
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    border: '2px solid var(--border-lit)',
                    borderTopColor: 'var(--gold)',
                    borderRadius: '50%',
                    animation: 'spin 0.9s linear infinite',
                    margin: '0 auto 12px',
                  }}
                />
                Loading history…
              </div>
            )}

            {/* Empty state */}
            {!loading && history.length === 0 && (
              <div
                style={{
                  padding: '48px 24px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.74rem',
                  color: 'var(--white-ghost)',
                  letterSpacing: '0.08em',
                }}
              >
                No audits found. Upload a CSV to get started.
              </div>
            )}

            {/* Rows */}
            {!loading && history.map((item, i) => {
              const flag    = COUNTRY_FLAG[item.country] || '🌐'
              const isRunning = running === item.datasetId
              return (
                <div
                  key={item.datasetId}
                  className="grid"
                  style={{
                    gridTemplateColumns: '80px 1fr 140px 160px',
                    padding: '16px 24px',
                    borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none',
                    alignItems: 'center',
                    background: i % 2 === 1 ? 'rgba(255,255,255,0.012)' : 'transparent',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(184,134,11,0.04)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 1 ? 'rgba(255,255,255,0.012)' : 'transparent')}
                >
                  {/* Index */}
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.6rem',
                      color: 'var(--white-ghost)',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  {/* Country */}
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: '1.1rem' }}>{flag}</span>
                    <div>
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '1rem',
                          fontWeight: 700,
                          fontStyle: 'italic',
                          color: 'var(--white)',
                        }}
                      >
                        {item.country === 'UNKNOWN' ? 'Unknown' : item.country.charAt(0) + item.country.slice(1).toLowerCase()}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.6rem',
                          color: 'var(--white-ghost)',
                          letterSpacing: '0.08em',
                        }}
                      >
                        Dataset {item.datasetId}
                      </div>
                    </div>
                  </div>

                  {/* Record count */}
                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.82rem',
                        color: 'var(--white)',
                        fontWeight: 500,
                      }}
                    >
                      {Number(item.recordCount).toLocaleString('en-US')}
                    </span>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.58rem',
                        color: 'var(--white-ghost)',
                        letterSpacing: '0.08em',
                      }}
                    >
                      records
                    </div>
                  </div>

                  {/* Re-run button */}
                  <div style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => reRunAudit(item.datasetId)}
                      disabled={isRunning || running !== null}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.62rem',
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: isRunning ? 'var(--gold-bright)' : 'var(--white-dim)',
                        border: `1px solid ${isRunning ? 'var(--gold)' : 'var(--border-lit)'}`,
                        borderRadius: 2,
                        padding: '6px 14px',
                        background: isRunning ? 'var(--gold-dim)' : 'transparent',
                        cursor: running !== null ? 'not-allowed' : 'pointer',
                        opacity: running !== null && !isRunning ? 0.4 : 1,
                        transition: 'all 0.2s',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                      onMouseEnter={(e) => {
                        if (running === null) {
                          e.currentTarget.style.borderColor = 'var(--gold)'
                          e.currentTarget.style.color = 'var(--gold-bright)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isRunning) {
                          e.currentTarget.style.borderColor = 'var(--border-lit)'
                          e.currentTarget.style.color = 'var(--white-dim)'
                        }
                      }}
                    >
                      {isRunning ? (
                        <>
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              border: '1.5px solid var(--gold)',
                              borderTopColor: 'transparent',
                              borderRadius: '50%',
                              animation: 'spin 0.8s linear infinite',
                            }}
                          />
                          Running…
                        </>
                      ) : (
                        <>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="5,3 19,12 5,21 5,3" />
                          </svg>
                          Re-run
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Summary footer */}
          {!loading && history.length > 0 && (
            <div
              style={{
                marginTop: 16,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.62rem',
                color: 'var(--white-ghost)',
                letterSpacing: '0.1em',
              }}
            >
              {history.length} dataset{history.length !== 1 ? 's' : ''} · {history.reduce((sum, h) => sum + Number(h.recordCount), 0).toLocaleString('en-US')} total records
            </div>
          )}
        </section>

        <footer
          className="flex items-center justify-between px-10 md:px-20 py-8 mt-8"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(232,228,220,0.2)', letterSpacing: '0.1em' }}>
            BAILWATCH AUDIT SYSTEM · BUILD 2.4.1
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(232,228,220,0.2)' }}>
            DATA IS NOT LEGAL ADVICE
          </span>
        </footer>
      </main>
    </>
  )
}
