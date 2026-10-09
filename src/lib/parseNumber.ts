// Shared by weight/height fields: strictly positive decimals, comma or dot.
export function parseDecimalInput(text: string): { value: number | null; invalid: boolean } {
  const t = text.trim().replace(',', '.')
  if (t === '') return { value: null, invalid: false }
  const n = Number(t)
  if (!Number.isFinite(n) || n <= 0) return { value: null, invalid: true }
  return { value: n, invalid: false }
}

// Volumes: like parseDecimalInput but 0 is a valid volume.
export function parseVolume(text: string): { value: number | null; invalid: boolean } {
  const t = text.trim().replace(',', '.')
  if (t === '') return { value: null, invalid: false }
  const n = Number(t)
  if (!Number.isFinite(n) || n < 0) return { value: null, invalid: true }
  return { value: n, invalid: false }
}
