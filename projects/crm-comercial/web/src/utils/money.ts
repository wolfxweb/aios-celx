/** Converte texto em reais (ex.: «1.500,50») para centavos; falha se vazio ou inválido. */
export function parseReaisToCents(s: string): { ok: true; cents: number } | { ok: false; message: string } {
  const t = String(s).trim()
  if (t === '') {
    return { ok: false, message: 'Indique o valor em reais.' }
  }
  const n = Number(t.replace(/\s/g, '').replace(',', '.'))
  if (!Number.isFinite(n) || n < 0) {
    return { ok: false, message: 'Valor em reais inválido.' }
  }
  return { ok: true, cents: Math.round(n * 100) }
}
