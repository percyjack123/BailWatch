import { useEffect, useState } from 'react'

const STEPS = [
  'Uploading dataset…',
  'Ingesting records…',
  'Calculating disparity ratios…',
  'Generating verdict…',
]

export default function LoadingOverlay({ visible }) {
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    if (!visible) { setStepIndex(0); return }
    const interval = setInterval(() => {
      setStepIndex((i) => (i < STEPS.length - 1 ? i + 1 : i))
    }, 1800)
    return () => clearInterval(interval)
  }, [visible])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-200 flex flex-col items-center justify-center gap-8"
      style={{ background: 'rgba(6, 8, 14, 0.94)', backdropFilter: 'blur(10px)' }}
    >
      {/* Spinner */}
      <div
        style={{
          width: 56,
          height: 56,
          border: '2px solid var(--border-lit)',
          borderTopColor: 'var(--gold-bright)',
          borderRadius: '50%',
          animation: 'spin 0.9s linear infinite',
        }}
      />

      {/* Title */}
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.6rem',
          fontWeight: 700,
          color: 'var(--white)',
          letterSpacing: '0.02em',
        }}
      >
        Analysing Dataset
      </div>

      {/* Step text */}
      <div
        key={stepIndex}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          letterSpacing: '0.15em',
          color: 'var(--white-dim)',
          textTransform: 'uppercase',
          animation: 'fadeIn 0.4s ease both',
        }}
      >
        {STEPS[stepIndex]}
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {STEPS.map((_, i) => (
          <div
            key={i}
            style={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: i <= stepIndex ? 'var(--gold)' : 'var(--border-lit)',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>
    </div>
  )
}