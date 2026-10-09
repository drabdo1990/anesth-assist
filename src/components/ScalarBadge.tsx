import type { ScalarKey } from '../lib/biometrics'

export function ScalarBadge({ kind, kg }: { kind: ScalarKey | 'abw40'; kg: number }) {
  return (
    <span className="inline-flex items-center rounded-md border border-accent/50 bg-accent/10 px-2 py-1 font-mono text-xs font-bold tabular-nums text-accent">
      [{kind.toUpperCase()}: {kg.toFixed(1)} kg]
    </span>
  )
}
