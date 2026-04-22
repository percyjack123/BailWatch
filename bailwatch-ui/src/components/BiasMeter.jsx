import { useEffect, useRef } from 'react'
import { featureLabel, featureDesc, flagColor, flagBg, flagBorder, meterPct, getFlag } from '../utils/biasUtils'

const SCALE_MAX = 5.0
const TICKS = [
  { value: 1.0, label: '1×'   },
  { value: 1.5, label: '1.5×' },
  { value: 2.0, label: '2×'   },
  { value: 3.0, label: '3×'   },
  { value: 5.0, label: '5×'   },
]

// Props:
//   feature    — key string e.g. "incomeLevel"       (from Object.keys(biasScores))
//   score      — ratio number e.g. 3.2               (from biasScores[feature])
//   flag       — optional override; auto-derived if omitted
//   animDelay  — stagger delay in ms
export default function BiasMeter({ feature, score, flag, animDelay = 0 }) {
  const fillRef = useRef(null)

  // Derive flag from score if not passed in
  const resolvedFlag = flag || getFlag(score)

  useEffect(() => {
    if (!fillRef.current) return
    fillRef.current.style.setProperty('--target-width', meterPct(score, SCALE_MAX))
    fillRef.current.style.animationDelay = `${animDelay}ms`
    // Reset then re-animate when score changes (new dataset loaded)
    fillRef.current.classList.remove('animate')
    const t = setTimeout(() => {
      fillRef.current?.classList.add('animate')
    }, animDelay)
    return () => clearTimeout(t)
  }, [score, animDelay])

  const pctOf = (v) => ((v / SCALE_MAX) * 100).toFixed(2) + '%'
  const color = flagColor(resolvedFlag)

  return (
    <div style={{ animation: `fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) ${animDelay}ms both` }}>
      {/* Top row */}
      <div className="flex items-baseline justify-between mb-2">
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.4rem',
            fontWeight: 700,
            fontStyle: 'italic',
            color: 'var(--white)',
            letterSpacing: '0.01em',
          }}
        >
          {featureLabel(feature)}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '1.5rem',
            fontWeight: 700,
            color,
            letterSpacing: '-0.02em',
          }}
        >
          {score.toFixed(3)}×
        </div>
      </div>

      {/* Flag + description */}
      <div className="flex items-center gap-3 mb-4">
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            letterSpacing: '0.18em',
            padding: '3px 10px',
            borderRadius: 2,
            textTransform: 'uppercase',
            background: flagBg(resolvedFlag),
            color,
            border: `1px solid ${flagBorder(resolvedFlag)}`,
          }}
        >
          {resolvedFlag}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.68rem',
            color: 'var(--white-ghost)',
            letterSpacing: '0.04em',
          }}
        >
          {featureDesc(feature)}
        </span>
      </div>

      {/* Meter track */}
      <div
        style={{
          height: 6,
          background: 'var(--surface-2)',
          borderRadius: 1,
          position: 'relative',
          overflow: 'visible',
        }}
      >
        <div
          ref={fillRef}
          className="meter-fill"
          style={{
            background: `linear-gradient(90deg, ${color}99, ${color})`,
            borderRadius: 1,
          }}
        />

        {/* Threshold lines */}
        {TICKS.map(({ value }) => (
          <div
            key={value}
            style={{
              position: 'absolute',
              left: pctOf(value),
              top: -3,
              bottom: -3,
              width: 1,
              background: value === 1.5 || value === 2.0
                ? 'rgba(255,255,255,0.25)'
                : 'rgba(255,255,255,0.08)',
              zIndex: 2,
            }}
          />
        ))}
      </div>

      {/* Tick labels */}
      <div style={{ position: 'relative', height: 20, marginTop: 4 }}>
        {TICKS.map(({ value, label }) => (
          <span
            key={value}
            style={{
              position: 'absolute',
              left: pctOf(value),
              transform: 'translateX(-50%)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.55rem',
              color: value === 1.5 || value === 2.0
                ? 'rgba(232,228,220,0.35)'
                : 'rgba(232,228,220,0.15)',
              letterSpacing: '0.04em',
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}