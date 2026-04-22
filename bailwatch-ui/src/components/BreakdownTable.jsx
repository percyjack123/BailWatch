import { useEffect, useRef } from 'react'
import { featureLabel, flagColor, flagBg, flagBorder } from '../utils/biasUtils'

// Receives the full breakdown array directly from API response:
// breakdown: [{ feature, group_name, bail_rate, ratio, difference, flag }, ...]
export default function BreakdownTable({ breakdown }) {
  const rowRefs = useRef([])

  useEffect(() => {
    // Reset and re-animate when new data arrives
    rowRefs.current.forEach((el, i) => {
      if (!el) return
      el.classList.remove('animate')
      el.style.animationDelay = `${900 + i * 60}ms`
      setTimeout(() => el?.classList.add('animate'), 900 + i * 60)
    })
  }, [breakdown])

  if (!breakdown || breakdown.length === 0) return null

  const thStyle = {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.6rem',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'rgba(232,228,220,0.28)',
    textAlign: 'left',
    padding: '0 16px 14px',
    borderBottom: '1px solid var(--border)',
    fontWeight: 400,
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Feature', 'Group', 'Bail Rate', 'Ratio', 'Difference', 'Severity'].map((h, i) => (
              <th
                key={h}
                style={{
                  ...thStyle,
                  paddingLeft:  i === 0 ? 0 : 16,
                  paddingRight: i === 5 ? 0 : 16,
                  textAlign: i >= 2 ? 'right' : 'left',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {breakdown.map((row, i) => {
            const color = flagColor(row.flag)
            const isAlt = i % 2 === 1
            return (
              <tr
                key={`${row.feature}-${row.group_name}-${i}`}
                ref={(el) => (rowRefs.current[i] = el)}
                className="breakdown-row"
                style={{ background: isAlt ? 'rgba(255,255,255,0.015)' : 'transparent' }}
              >
                {/* Feature */}
                <td style={{
                  padding: '15px 16px 15px 0',
                  borderBottom: '1px solid var(--border)',
                  fontFamily: 'var(--font-display)',
                  fontSize: '1rem',
                  fontStyle: 'italic',
                  color: 'var(--white)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}>
                  {featureLabel(row.feature)}
                </td>

                {/* Group */}
                <td style={{
                  padding: '15px 16px',
                  borderBottom: '1px solid var(--border)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: 'var(--white-dim)',
                  textTransform: 'capitalize',
                }}>
                  {row.group_name}
                </td>

                {/* Bail Rate */}
                <td style={{
                  padding: '15px 16px',
                  borderBottom: '1px solid var(--border)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.82rem',
                  color: 'var(--white)',
                  textAlign: 'right',
                  fontWeight: 500,
                }}>
                  {(row.bail_rate * 100).toFixed(1)}%
                </td>

                {/* Ratio */}
                <td style={{
                  padding: '15px 16px',
                  borderBottom: '1px solid var(--border)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.88rem',
                  color,
                  textAlign: 'right',
                  fontWeight: 700,
                }}>
                  {row.ratio.toFixed(3)}×
                </td>

                {/* Difference */}
                <td style={{
                  padding: '15px 16px',
                  borderBottom: '1px solid var(--border)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: 'var(--white-dim)',
                  textAlign: 'right',
                }}>
                  {(row.difference * 100).toFixed(1)}pp
                </td>

                {/* Flag */}
                <td style={{
                  padding: '15px 0 15px 16px',
                  borderBottom: '1px solid var(--border)',
                  textAlign: 'right',
                }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: 2,
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.6rem',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    background: flagBg(row.flag),
                    color,
                    border: `1px solid ${flagBorder(row.flag)}`,
                  }}>
                    {row.flag}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}