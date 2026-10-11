import { Pause, Play, RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

const mmss = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`

export function Timer({
  title,
  label,
  cycleSeconds,
}: {
  title: string
  label: string
  cycleSeconds?: number
}) {
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [flash, setFlash] = useState(false)
  const ctx = useRef<AudioContext | null>(null)
  const startedAt = useRef(0)
  const lastCycle = useRef(0)
  const flashTimer = useRef<number | null>(null)

  const beep = useCallback(() => {
    try {
      const c = ctx.current
      if (!c) return
      const o = c.createOscillator()
      const g = c.createGain()
      o.frequency.value = 880
      g.gain.value = 0.2
      o.connect(g).connect(c.destination)
      o.start()
      o.stop(c.currentTime + 0.4)
    } catch {
      // audio unavailable: the visual alert still works
    }
  }, [])

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      const e = (Date.now() - startedAt.current) / 1000
      setElapsed(e)
      if (cycleSeconds) {
        const cycles = Math.floor(e / cycleSeconds)
        if (cycles > lastCycle.current) {
          lastCycle.current = cycles
          beep()
          setFlash(true)
          if (flashTimer.current !== null) window.clearTimeout(flashTimer.current)
          flashTimer.current = window.setTimeout(() => setFlash(false), 4000)
        }
      }
    }, 250)
    return () => window.clearInterval(id)
  }, [running, cycleSeconds, beep])

  // Release the flash timer and audio context when the component unmounts.
  useEffect(
    () => () => {
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current)
      ctx.current?.close().catch(() => {})
    },
    [],
  )

  const start = () => {
    // created inside the tap so the browser permits audio
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (Ctor) {
      ctx.current ??= new Ctor()
      void ctx.current.resume()
    }
    startedAt.current = Date.now() - elapsed * 1000
    setRunning(true)
  }
  const reset = () => {
    setRunning(false)
    setElapsed(0)
    lastCycle.current = 0
    if (flashTimer.current !== null) window.clearTimeout(flashTimer.current)
    setFlash(false)
  }

  const remaining = cycleSeconds ? cycleSeconds - (elapsed % cycleSeconds) : null

  return (
    <div
      className={`rounded-xl border p-3 ${flash ? 'animate-pulse border-crimson bg-crimson/30' : 'border-line bg-card'}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      <div className="flex items-end justify-between gap-2">
        <div>
          {remaining !== null && (
            <p className="font-mono text-4xl font-bold tabular-nums text-accent">
              {mmss(remaining)}
            </p>
          )}
          <p
            className={`font-mono tabular-nums ${remaining !== null ? 'text-sm text-muted' : 'text-4xl font-bold text-accent'}`}
          >
            {remaining !== null ? 'Elapsed ' : ''}
            {mmss(elapsed)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={running ? () => setRunning(false) : start}
            className="flex min-h-14 min-w-14 items-center justify-center gap-1 rounded-xl bg-accent px-4 font-bold text-base"
            aria-label={running ? `Pause ${label} timer` : `Start ${label} timer`}
          >
            {running ? <Pause size={22} /> : <Play size={22} />}
          </button>
          <button
            type="button"
            onClick={reset}
            aria-label={`Reset ${label} timer`}
            className="flex min-h-14 min-w-14 items-center justify-center rounded-xl border border-line"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>
      {flash && <p className="mt-1 font-bold text-crimson">RHYTHM / PULSE CHECK NOW</p>}
    </div>
  )
}
