export function getFlag(ratio) {
  if (ratio >= 2.0) return 'HIGH'
  if (ratio >= 1.5) return 'MODERATE'
  return 'LOW'
}

export function featureLabel(key) {
  const map = {
    incomeLevel: 'Income Level',
    legalRepresentation: 'Legal Representation',
    region: 'Location Type',
    socialGroup: 'Social / Ethnic Group',
    ethnicity: 'Ethnicity',
    religion: 'Religion',
    raceEthnicity: 'Race / Ethnicity',
  }
  // Fallback: convert camelCase to Title Case words
  if (map[key]) return map[key]
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim()
}

export function featureDesc(key) {
  const map = {
    incomeLevel: 'Disparity in bail grants across low, medium, and high income defendants',
    legalRepresentation: 'Disparity between defendants with and without legal counsel',
    region: 'Disparity between urban and rural court locations',
    socialGroup: 'Disparity across social, ethnic, or religious group categories',
    ethnicity: 'Disparity in bail rates across ethnic groups',
    religion: 'Disparity in bail rates across religious communities',
    raceEthnicity: 'Disparity in bail rates across racial and ethnic groups',
  }
  return map[key] || `Disparity across groups for: ${featureLabel(key)}`
}

export function flagColor(flag) {
  return { HIGH: '#DC2626', MODERATE: '#D97706', LOW: '#16A34A' }[flag] || '#E8E4DC'
}

export function flagBg(flag) {
  return { HIGH: 'var(--red-dim)', MODERATE: 'var(--amber-dim)', LOW: 'var(--green-dim)' }[flag] || 'transparent'
}

export function flagBorder(flag) {
  return {
    HIGH: 'rgba(220,38,38,0.3)',
    MODERATE: 'rgba(217,119,6,0.3)',
    LOW: 'rgba(22,163,74,0.3)',
  }[flag] || 'transparent'
}

export function meterPct(ratio, max = 5.0) {
  return Math.min((ratio / max) * 100, 100).toFixed(1) + '%'
}

export function formatDate() {
  return new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

// Generates a rule-based plain-English explanation from breakdown data
// Used when the API explanation is null, blank, or a fallback placeholder
export function generateFallbackExplanation(breakdown) {
  if (!breakdown || breakdown.length === 0) return 'No breakdown data available.'

  const PLACEHOLDERS = [
    'explanation was not provided',
    'ai explanation unavailable',
    'no explanation',
    'explanation could not',
    'gemini',
  ]

  const lines = []
  const features = [...new Set(breakdown.map((r) => r.feature))]

  features.forEach((feature) => {
    const rows = breakdown.filter((r) => r.feature === feature)
    const worst = rows.reduce((a, b) => (a.ratio > b.ratio ? a : b))
    const best = rows.reduce((a, b) => (a.bail_rate > b.bail_rate ? a : b))

    if (worst.ratio >= 1.5) {
      const worstPct = Math.round(worst.bail_rate * 100)
      const bestPct = Math.round(best.bail_rate * 100)
      lines.push(
        `${featureLabel(feature)}: The "${worst.group_name}" group received bail ${worstPct}% of the time` +
          ` versus ${bestPct}% for the "${best.group_name}" group — a ${worst.ratio}× disparity` +
          ` flagged as ${worst.flag} severity.`
      )
    }
  })

  if (lines.length === 0)
    return 'No statistically significant bias was detected across the measured dimensions in this dataset.'

  return lines.join(' ')
}

export function shouldUseFallback(explanation) {
  if (!explanation) return true
  const lower = explanation.toLowerCase()
  const PLACEHOLDERS = [
    'explanation was not provided',
    'ai explanation unavailable',
    'no explanation',
    'explanation could not',
    'gemini',
    'unavailable',
  ]
  return PLACEHOLDERS.some((p) => lower.includes(p))
}