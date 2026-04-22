import { featureLabel, getFlag, formatDate } from './biasUtils'

/**
 * Exports the full audit result as a formatted JSON file.
 * Clean, structured, readable — suitable for submission or archiving.
 */
export function exportJSON(data) {
  const report = {
    title:         'BailWatch Bias Audit Report',
    generatedAt:   new Date().toISOString(),
    auditDate:     formatDate(),
    datasetId:     data.datasetId,
    country:       data.country,
    verdict:       data.overallVerdict,
    severity:      data.severity,
    keySentence:   data.keySentence || '',
    explanation:   data.explanation || '',
    biasScores:    Object.fromEntries(
      Object.entries(data.biasScores || {}).map(([k, v]) => [
        featureLabel(k),
        { ratio: v, flag: getFlag(v) },
      ])
    ),
    breakdown:     (data.breakdown || []).map((r) => ({
      feature:    featureLabel(r.feature),
      group:      r.group_name,
      bailRate:   (r.bail_rate * 100).toFixed(1) + '%',
      ratio:      r.ratio.toFixed(3) + '×',
      difference: (r.difference * 100).toFixed(1) + 'pp',
      severity:   r.flag,
    })),
    keyFindings:     data.keyFindings     || [],
    recommendations: data.recommendations || [],
    sdgRelevance:    data.sdgRelevance    || '',
    engine:          data.engine          || 'local_engine',
    disclaimer:      'This report is for research and accountability purposes only. Data is not legal advice.',
  }

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `bailwatch_audit_${data.country || 'report'}_${data.datasetId}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Exports as a plain text report — readable without any tooling.
 */
export function exportTXT(data) {
  const line  = (n = 60) => '─'.repeat(n)
  const flag  = getFlag
  const score = (v) => `${v.toFixed(3)}× [${getFlag(v)}]`

  const sections = [
    `BAILWATCH BIAS AUDIT REPORT`,
    `Generated: ${formatDate()}   Dataset: ${data.datasetId}   Jurisdiction: ${data.country || 'Unknown'}`,
    line(),
    `VERDICT: ${data.overallVerdict}   SEVERITY: ${data.severity}`,
    '',
    data.keySentence || '',
    '',
    line(),
    'BIAS SCORES',
    ...Object.entries(data.biasScores || {}).map(
      ([k, v]) => `  ${featureLabel(k).padEnd(28)} ${score(v)}`
    ),
    '',
    line(),
    'FULL GROUP BREAKDOWN',
    `  ${'Feature'.padEnd(22)} ${'Group'.padEnd(16)} ${'Bail Rate'.padEnd(12)} ${'Ratio'.padEnd(10)} ${'Diff'.padEnd(8)} Flag`,
    `  ${line(58)}`,
    ...(data.breakdown || []).map((r) =>
      `  ${featureLabel(r.feature).padEnd(22)} ${r.group_name.padEnd(16)} ${((r.bail_rate * 100).toFixed(1) + '%').padEnd(12)} ${(r.ratio.toFixed(3) + '×').padEnd(10)} ${((r.difference * 100).toFixed(1) + 'pp').padEnd(8)} ${r.flag}`
    ),
    '',
    line(),
    'EXPLANATION',
    ...(data.explanation || '').match(/.{1,72}(\s|$)/g)?.map((l) => '  ' + l.trim()) || [],
    '',
  ]

  if ((data.keyFindings || []).length > 0) {
    sections.push(line(), 'KEY FINDINGS')
    data.keyFindings.forEach((f, i) => {
      sections.push(`  ${i + 1}. ${f}`)
    })
    sections.push('')
  }

  if ((data.recommendations || []).length > 0) {
    sections.push(line(), 'RECOMMENDATIONS')
    data.recommendations.forEach((r, i) => {
      sections.push(`  ${i + 1}. ${r}`)
    })
    sections.push('')
  }

  if (data.sdgRelevance) {
    sections.push(line(), 'SDG 16.3 RELEVANCE', `  ${data.sdgRelevance}`, '')
  }

  sections.push(
    line(),
    'BAILWATCH AUDIT SYSTEM · BUILD 2.4.1',
    'FOR RESEARCH & ACCOUNTABILITY PURPOSES ONLY · DATA IS NOT LEGAL ADVICE'
  )

  const blob = new Blob([sections.join('\n')], { type: 'text/plain' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `bailwatch_audit_${data.country || 'report'}_${data.datasetId}.txt`
  a.click()
  URL.revokeObjectURL(url)
}
