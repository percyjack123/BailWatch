import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BiasMeter from '../components/BiasMeter'
import BreakdownTable from '../components/BreakdownTable'
import VerdictStamp from '../components/VerdictStamp'
import { featureLabel, formatDate, generateFallbackExplanation, shouldUseFallback, getFlag, flagColor } from '../utils/biasUtils'
import { exportJSON, exportTXT } from '../utils/exportReport'
import BiasChart from '../components/BiasChart'

export default function ResultsPage() {
  const [data, setData] = useState(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('bailwatchResult')
    if (raw) {
      try { setData(JSON.parse(raw)) } catch (_) {}
    }
  }, [])

  if (!data) return <EmptyState />

  const verdict         = (data.overallVerdict || 'FAIR').toUpperCase()
  const isBiased        = verdict === 'BIASED'
  const scores          = data.biasScores     || {}
  const breakdown       = data.breakdown      || []
  const datasetId       = data.datasetId
  // ── New fields wired from fixed backend ──────────────────────────────────
  const country         = data.country        || ''
  const keyFindings     = data.keyFindings     || []
  const recommendations = data.recommendations || []
  const severity        = data.severity        || verdict
  const sdgRelevance    = data.sdgRelevance    || ''
  const engine          = data.engine          || 'local_engine'
  const keySentence     = data.keySentence     || ''

  const explanation = shouldUseFallback(data.explanation)
    ? generateFallbackExplanation(breakdown)
    : data.explanation

  const verdictColor = isBiased ? 'var(--red)' : 'var(--green)'
  const verdictGlow  = isBiased ? 'var(--red-glow)' : 'var(--green-glow)'

  const verdictSentence = isBiased
    ? 'This dataset reveals statistically significant disparities in bail outcomes across demographic groups.'
    : 'Bail outcomes across demographic groups fall within acceptable disparity thresholds.'

  return (
    <div className="relative z-10 pt-16 min-h-screen">

      {/* ── RESULTS HEADER ──────────────────────── */}
      <div
        className="relative px-10 md:px-20 pt-16 pb-14 overflow-hidden"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {/* Glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 65% 50%, ${verdictGlow} 0%, transparent 60%)`,
            pointerEvents: 'none',
          }}
        />

        {/* Meta row */}
        <div
          className="flex items-center gap-4 mb-6"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.62rem',
            letterSpacing: '0.2em',
            color: 'var(--white-ghost)',
            textTransform: 'uppercase',
            animation: 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
          }}
        >
          <span>Audit Report</span>
          <span style={{ opacity: 0.3 }}>/</span>
          <span>{formatDate()}</span>
          <span style={{ opacity: 0.3 }}>/</span>
          <span>Dataset {datasetId}</span>
          {country && (
            <>
              <span style={{ opacity: 0.3 }}>/</span>
              <span>{country}</span>
            </>
          )}
        </div>

        {/* Title */}
        <div style={{ animation: 'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s both' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(36px, 6vw, 80px)',
              fontWeight: 900,
              lineHeight: 0.95,
              color: 'var(--white)',
              marginBottom: 12,
            }}
          >
            Bias Audit
            <br />
            <em style={{ color: verdictColor, fontStyle: 'italic' }}>
              {isBiased ? 'Systemic Bias Detected' : 'No Severe Bias Found'}
            </em>
          </h1>
        </div>

        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.95rem',
            fontWeight: 300,
            color: 'var(--white-dim)',
            maxWidth: 460,
            lineHeight: 1.8,
            animation: 'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s both',
          }}
        >
          {verdictSentence}
        </p>

        {/* keySentence — strongest finding in one line */}
        {keySentence && (
          <div
            style={{
              marginTop: 16,
              padding: '12px 18px',
              background: isBiased ? 'var(--red-dim)' : 'var(--green-dim)',
              border: `1px solid ${isBiased ? 'rgba(220,38,38,0.25)' : 'rgba(22,163,74,0.25)'}`,
              borderRadius: 3,
              maxWidth: 560,
              animation: 'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.28s both',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.74rem',
                color: isBiased ? '#FCA5A5' : '#86EFAC',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {keySentence}
            </p>
          </div>
        )}

        {/* Country badge */}
        {country && country !== 'UNKNOWN' && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 16,
              padding: '6px 14px',
              background: 'var(--gold-dim)',
              border: '1px solid rgba(184,134,11,0.3)',
              borderRadius: 2,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--gold-bright)',
              animation: 'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.35s both',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            Jurisdiction: {country}
          </div>
        )}

        {/* Verdict stamp */}
        <VerdictStamp verdict={verdict} />
      </div>

      {/* ── BODY ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px]">

        {/* Main column */}
        <div
          className="px-10 md:px-20 py-14"
          style={{ borderRight: '1px solid var(--border)' }}
        >
          {/* Bias Score Summary */}
          <div className="section-label mb-10">Bias Score Summary</div>

          <div className="flex flex-col gap-10 mb-16">
            {Object.entries(scores).map(([feature, score], i) => (
              <BiasMeter
                key={feature}
                feature={feature}
                score={score}
                flag={getFlag(score)}
                animDelay={600 + i * 120}
              />
            ))}
          </div>

          {/* Bail Rate Chart */}
          <div className="section-label mb-6" style={{ marginTop: 8 }}>Bail Rate by Group</div>
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              padding: '24px 28px',
              marginBottom: 48,
            }}
          >
            <BiasChart breakdown={breakdown} />
          </div>

          {/* Full Breakdown */}
          <div className="section-label mb-8">Full Group Breakdown</div>
          <BreakdownTable breakdown={breakdown} />

          {/* Key Findings — rendered only when backend provides them */}
          {keyFindings.length > 0 && (
            <div style={{ marginTop: 56 }}>
              <div className="section-label mb-8">Key Findings</div>
              <div className="flex flex-col gap-3">
                {keyFindings.map((finding, i) => {
                  const isHigh = finding.startsWith('CRITICAL')
                  const isMod  = finding.startsWith('MODERATE')
                  const accentColor = isHigh ? 'var(--red)' : isMod ? 'var(--amber)' : 'var(--green)'
                  return (
                    <div
                      key={i}
                      style={{
                        borderLeft: `2px solid ${accentColor}`,
                        paddingLeft: 18,
                        paddingTop: 12,
                        paddingBottom: 12,
                        background: 'var(--surface)',
                        borderRadius: '0 3px 3px 0',
                      }}
                    >
                      <p
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.74rem',
                          color: 'var(--white-dim)',
                          lineHeight: 1.7,
                          margin: 0,
                        }}
                      >
                        {finding}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Recommendations — rendered only when backend provides them */}
          {recommendations.length > 0 && (
            <div style={{ marginTop: 56 }}>
              <div className="section-label mb-8">Recommendations</div>
              <div className="flex flex-col gap-3">
                {recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="flex gap-4"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 3,
                      padding: '14px 18px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.6rem',
                        color: 'var(--gold)',
                        opacity: 0.6,
                        flexShrink: 0,
                        paddingTop: 3,
                        letterSpacing: '0.06em',
                      }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.84rem',
                        fontWeight: 300,
                        color: 'var(--white-dim)',
                        lineHeight: 1.8,
                        margin: 0,
                      }}
                    >
                      {rec}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SDG Relevance — rendered only when backend provides it */}
          {sdgRelevance && (
            <div
              style={{
                marginTop: 56,
                borderLeft: '2px solid rgba(184,134,11,0.35)',
                paddingLeft: 20,
                paddingTop: 16,
                paddingBottom: 16,
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.58rem',
                  letterSpacing: '0.22em',
                  color: 'var(--gold-bright)',
                  textTransform: 'uppercase',
                  marginBottom: 10,
                  opacity: 0.7,
                }}
              >
                SDG 16.3 — Equal Access to Justice
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.84rem',
                  fontWeight: 300,
                  color: 'var(--white-dim)',
                  lineHeight: 1.9,
                  margin: 0,
                }}
              >
                {sdgRelevance}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div
          className="px-8 py-14 flex flex-col gap-5"
          style={{ animation: 'fadeIn 0.6s cubic-bezier(0.16,1,0.3,1) 1.1s both' }}
        >

          {/* Audit Finding */}
          <SideCard label="Audit Finding">
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.88rem',
                fontWeight: 300,
                color: 'var(--white-dim)',
                lineHeight: 1.9,
              }}
            >
              {explanation}
            </p>
          </SideCard>

          {/* Dataset Info */}
          <SideCard label="Dataset Info">
            <div className="flex flex-col gap-0">
              {[
                { key: 'Dataset ID', val: String(datasetId) },
                { key: 'Audit Date', val: formatDate() },
                ...(country ? [{ key: 'Country', val: country }] : []),
                { key: 'Records',   val: `${breakdown.length} groups` },
                { key: 'Severity',  val: severity },
                { key: 'Verdict',   val: verdict },
              ].map(({ key, val }, i, arr) => (
                <div
                  key={key}
                  className="flex justify-between items-center py-3"
                  style={{
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.74rem',
                  }}
                >
                  <span style={{ color: 'rgba(232,228,220,0.3)', letterSpacing: '0.08em' }}>{key}</span>
                  <span
                    style={{
                      color: (key === 'Verdict' || key === 'Severity')
                        ? flagColor(severity)
                        : 'var(--white)',
                      fontWeight: (key === 'Verdict' || key === 'Severity') ? 700 : 400,
                      letterSpacing: (key === 'Verdict' || key === 'Severity') ? '0.12em' : 0,
                    }}
                  >
                    {val}
                  </span>
                </div>
              ))}
            </div>
          </SideCard>

          {/* Score Overview */}
          <SideCard label="Score Overview">
            <div className="flex flex-col gap-3">
              {Object.entries(scores).map(([feature, score]) => {
                const flag  = getFlag(score)
                const color = { HIGH: '#DC2626', MODERATE: '#D97706', LOW: '#16A34A' }[flag]
                return (
                  <div key={feature} className="flex justify-between items-center" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                    <span style={{ color: 'var(--white-dim)' }}>{featureLabel(feature)}</span>
                    <div className="flex items-center gap-2">
                      <span style={{ color, fontWeight: 700 }}>{score.toFixed(3)}×</span>
                      <span style={{ color, fontSize: '0.58rem', letterSpacing: '0.12em', opacity: 0.8 }}>{flag}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </SideCard>

          {/* Engine badge */}
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.56rem',
              letterSpacing: '0.14em',
              color: 'rgba(232,228,220,0.18)',
              textTransform: 'uppercase',
              textAlign: 'center',
            }}
          >
            Engine: {engine}
          </div>


          {/* ── Export Report ── */}
          <div className="section-label" style={{ marginBottom: 10 }}>Export Report</div>
          <div className="flex gap-2">
            <button
              onClick={() => exportJSON(data)}
              className="flex items-center justify-center gap-2 py-3 flex-1 transition-all duration-200"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--white-dim)',
                border: '1px solid var(--border-lit)',
                borderRadius: 3,
                background: 'transparent',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--gold)'
                e.currentTarget.style.color = 'var(--gold-bright)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-lit)'
                e.currentTarget.style.color = 'var(--white-dim)'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              JSON
            </button>
            <button
              onClick={() => exportTXT(data)}
              className="flex items-center justify-center gap-2 py-3 flex-1 transition-all duration-200"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--white-dim)',
                border: '1px solid var(--border-lit)',
                borderRadius: 3,
                background: 'transparent',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--gold)'
                e.currentTarget.style.color = 'var(--gold-bright)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-lit)'
                e.currentTarget.style.color = 'var(--white-dim)'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              TXT
            </button>
          </div>

          {/* Run again */}
          <Link
            to="/"
            className="flex items-center justify-center gap-2 py-4 w-full transition-all duration-200"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--white-dim)',
              border: '1px solid var(--border-lit)',
              borderRadius: 3,
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--gold)'
              e.currentTarget.style.color = 'var(--gold-bright)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-lit)'
              e.currentTarget.style.color = 'var(--white-dim)'
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1,4 1,10 7,10" />
              <path d="M3.51 15a9 9 0 1 0 .49-3.53" />
            </svg>
            Run Another Audit
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer
        className="flex flex-col sm:flex-row items-center justify-between px-10 md:px-20 py-8 gap-2"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(232,228,220,0.2)', letterSpacing: '0.1em' }}>
          BAILWATCH AUDIT SYSTEM · BUILD 2.4.1
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(232,228,220,0.2)' }}>
          FOR RESEARCH &amp; ACCOUNTABILITY PURPOSES ONLY
        </span>
      </footer>
    </div>
  )
}

function SideCard({ label, children }) {
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
      <div className="section-label" style={{ marginBottom: 14 }}>{label}</div>
      {children}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="relative z-10 pt-16 min-h-screen flex flex-col items-center justify-center px-8 text-center">
      <svg
        width="72"
        height="72"
        viewBox="0 0 80 80"
        fill="none"
        stroke="rgba(232,228,220,0.12)"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginBottom: 28 }}
      >
        <line x1="40" y1="10" x2="40" y2="70" />
        <line x1="16" y1="10" x2="64" y2="10" />
        <line x1="16" y1="10" x2="16" y2="34" />
        <line x1="64" y1="10" x2="64" y2="34" />
        <path d="M4 34 Q16 42 28 34" />
        <path d="M52 34 Q64 26 76 34" />
        <line x1="30" y1="70" x2="50" y2="70" />
      </svg>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2rem',
          fontWeight: 700,
          color: 'rgba(232,228,220,0.25)',
          marginBottom: 12,
        }}
      >
        No Audit Results
      </h2>
      <p style={{ fontSize: '0.88rem', color: 'rgba(232,228,220,0.18)', marginBottom: 36, maxWidth: 320, lineHeight: 1.8, fontWeight: 300 }}>
        Upload a bail records dataset and run the audit first.
        Results will appear here automatically.
      </p>
      <Link
        to="/"
        className="flex items-center gap-2 px-7 py-3 transition-all duration-200"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--white-dim)',
          border: '1px solid var(--border-lit)',
          borderRadius: 3,
          textDecoration: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--gold)'
          e.currentTarget.style.color = 'var(--gold-bright)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-lit)'
          e.currentTarget.style.color = 'var(--white-dim)'
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12,19 5,12 12,5" />
        </svg>
        Go to Upload
      </Link>
    </div>
  )
}