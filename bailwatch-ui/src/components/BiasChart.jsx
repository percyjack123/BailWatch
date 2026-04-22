import { useEffect, useRef } from 'react'
import { featureLabel, flagColor } from '../utils/biasUtils'

/**
 * BiasChart — horizontal bar chart comparing bail rates per group per feature.
 * Pure DOM canvas — zero external dependencies.
 *
 * Props:
 *   breakdown: array of { feature, group_name, bail_rate, ratio, flag }
 */
export default function BiasChart({ breakdown }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!breakdown || breakdown.length === 0) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    // ── Layout constants ──────────────────────────────
    const BAR_H       = 28
    const BAR_GAP     = 8
    const GROUP_GAP   = 24
    const LABEL_W     = 148
    const VALUE_W     = 52
    const CHART_W     = canvas.width - LABEL_W - VALUE_W - 32
    const PADDING_TOP = 12
    const PADDING_X   = 16

    // Group rows by feature
    const features = [...new Set(breakdown.map((r) => r.feature))]

    // Calculate total canvas height needed
    let totalRows = 0
    features.forEach((f) => {
      totalRows += breakdown.filter((r) => r.feature === f).length
    })
    const sectionHeaders = features.length
    const totalH = PADDING_TOP
      + sectionHeaders * 28
      + totalRows * (BAR_H + BAR_GAP)
      + (sectionHeaders - 1) * GROUP_GAP
      + 16

    // Resize canvas to fit content
    canvas.height = totalH
    canvas.style.height = totalH + 'px'

    // ── Colors from CSS vars (read from document) ─────
    const style     = getComputedStyle(document.documentElement)
    const inkColor  = style.getPropertyValue('--ink').trim()         || '#08090E'
    const white     = style.getPropertyValue('--white').trim()       || '#E8E4DC'
    const whiteDim  = style.getPropertyValue('--white-dim').trim()   || 'rgba(232,228,220,0.5)'
    const whiteGhost = '#rgba(232,228,220,0.2)'
    const gold      = style.getPropertyValue('--gold-bright').trim() || '#D4A017'
    const border    = 'rgba(255,255,255,0.06)'

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    let y = PADDING_TOP

    features.forEach((feature, fi) => {
      const rows = breakdown.filter((r) => r.feature === feature)

      // Section header
      ctx.font = '600 11px "JetBrains Mono", monospace'
      ctx.fillStyle = gold
      ctx.letterSpacing = '1.5px'
      ctx.fillText(featureLabel(feature).toUpperCase(), PADDING_X, y + 16)
      y += 28

      rows.forEach((row) => {
        const pct     = Math.min(row.bail_rate, 1)
        const barW    = Math.max(pct * CHART_W, 2)
        const color   = flagColor(row.flag)
        const x       = PADDING_X + LABEL_W

        // Group label
        ctx.font = '400 11.5px "Lato", sans-serif'
        ctx.fillStyle = white
        ctx.letterSpacing = '0px'
        const label = row.group_name.charAt(0).toUpperCase() + row.group_name.slice(1)
        ctx.fillText(label, PADDING_X, y + BAR_H / 2 + 4)

        // Track (background)
        ctx.fillStyle = 'rgba(255,255,255,0.05)'
        ctx.beginPath()
        ctx.roundRect(x, y, CHART_W, BAR_H, 2)
        ctx.fill()

        // Bar fill
        if (barW > 0) {
          ctx.fillStyle = color + '33' // ~20% opacity fill
          ctx.beginPath()
          ctx.roundRect(x, y, barW, BAR_H, 2)
          ctx.fill()

          // Bar border stroke (full opacity)
          ctx.strokeStyle = color
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.roundRect(x, y, barW, BAR_H, 2)
          ctx.stroke()
        }

        // Percentage label inside/after bar
        const pctLabel = (row.bail_rate * 100).toFixed(1) + '%'
        ctx.font = '500 10.5px "JetBrains Mono", monospace'
        ctx.fillStyle = color
        ctx.letterSpacing = '0.5px'
        ctx.fillText(pctLabel, x + CHART_W + 8, y + BAR_H / 2 + 4)

        y += BAR_H + BAR_GAP
      })

      if (fi < features.length - 1) y += GROUP_GAP
    })
  }, [breakdown])

  if (!breakdown || breakdown.length === 0) return null

  return (
    <div style={{ animation: 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.3s both' }}>
      <canvas
        ref={canvasRef}
        width={680}
        style={{
          width: '100%',
          display: 'block',
          imageRendering: 'crisp-edges',
        }}
      />
      <div
        style={{
          display: 'flex',
          gap: 20,
          marginTop: 12,
          fontFamily: 'var(--font-mono)',
          fontSize: '0.58rem',
          letterSpacing: '0.12em',
          color: 'var(--white-ghost)',
        }}
      >
        {[
          { color: '#DC2626', label: 'HIGH  ≥ 2.0×' },
          { color: '#D97706', label: 'MODERATE  ≥ 1.5×' },
          { color: '#16A34A', label: 'LOW  < 1.5×' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: color, opacity: 0.7 }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}
