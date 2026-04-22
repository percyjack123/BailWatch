import { useEffect, useRef } from 'react'

export default function VerdictStamp({ verdict }) {
  const ref = useRef(null)

  // verdict comes directly from API: "BIASED" | "FAIR"
  const isBiased = verdict === 'BIASED'
  const color    = isBiased ? '#DC2626' : '#16A34A'
  const label    = verdict || 'UNKNOWN'

  useEffect(() => {
    if (!ref.current) return
    // Reset then re-trigger so animation replays on new data
    ref.current.classList.remove('animate')
    const t = setTimeout(() => {
      ref.current?.classList.add('animate')
    }, 400)
    return () => clearTimeout(t)
  }, [verdict]) // re-runs when verdict changes

  return (
    <div
      ref={ref}
      className="verdict-stamp hidden lg:flex items-center justify-center"
      style={{
        border: `4px solid ${color}`,
        borderRadius: 4,
        padding: '14px 36px',
        color,
        userSelect: 'none',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 3.5vw, 3.2rem)',
          fontWeight: 800,
          letterSpacing: '0.16em',
          lineHeight: 1,
        }}
      >
        {label}
      </span>
    </div>
  )
}