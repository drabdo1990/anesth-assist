// Digits with at most one dot, anywhere: accepts mid-typing states ("5.", ".5")
// but rejects JS-only formats Number() would silently take (hex "0x10",
// scientific "1e2", "Infinity", signs, multiple dots).
const DECIMAL = /^\d*\.?\d*$/

// Shared by weight/height fields: strictly positive decimals, comma or dot.
export function parseDecimalInput(text: string): { value: number | null; invalid: boolean } {
  const t = text.trim().replace(',', '.')
  if (t === '') return { value: null, invalid: false }
  if (!DECIMAL.test(t)) return { value: null, invalid: true }
  const n = Number(t)
  if (!Number.isFinite(n) || n <= 0) return { value: null, invalid: true }
  return { value: n, invalid: false }
}

// Volumes: like parseDecimalInput but 0 is a valid volume.
export function parseVolume(text: string): { value: number | null; invalid: boolean } {
  const t = text.trim().replace(',', '.')
  if (t === '') return { value: null, invalid: false }
  if (!DECIMAL.test(t)) return { value: null, invalid: true }
  const n = Number(t)
  if (!Number.isFinite(n) || n < 0) return { value: null, invalid: true }
  return { value: n, invalid: false }
}
