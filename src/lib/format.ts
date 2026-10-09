const trim = (s: string) => (s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s)

export function fmtNum(n: number): string {
  if (n >= 100) return String(Math.round(n))
  if (n >= 10) return trim(n.toFixed(1))
  return trim(n.toFixed(2))
}

export function fmtVol(ml: number): string {
  return ml < 1 ? trim(ml.toFixed(2)) : trim(ml.toFixed(1))
}

export function fmtRange(
  low: number,
  high: number | null,
  fmt: (n: number) => string = fmtNum,
): string {
  return high === null ? fmt(low) : `${fmt(low)}–${fmt(high)}`
}
