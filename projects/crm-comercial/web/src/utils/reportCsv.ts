import type { ReportRunResponse } from '@/api/types'

function csvEscape(cell: unknown): string {
  const t = String(cell ?? '')
  if (/[",\n\r]/.test(t)) {
    return `"${t.replace(/"/g, '""')}"`
  }
  return t
}

export function reportRunToCsvString(r: ReportRunResponse): string {
  const lines: string[] = [r.columns.map(csvEscape).join(',')]
  for (const row of r.rows) {
    lines.push(row.map(csvEscape).join(','))
  }
  return `${lines.join('\r\n')}\r\n`
}

/** Descarrega o resultado do relatório como CSV UTF-8 (BOM para Excel). */
export function downloadReportAsCsv(r: ReportRunResponse): void {
  const content = `\ufeff${reportRunToCsvString(r)}`
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${r.report_id}-${new Date().toISOString().slice(0, 10)}.csv`
  a.rel = 'noopener'
  a.click()
  URL.revokeObjectURL(url)
}
