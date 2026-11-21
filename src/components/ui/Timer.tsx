import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { playCycleAlertGong, unlockAudio } from '../../lib/audioAlerts';

interface TimerProps {
  id: string;
  label: string;
  /** Audible + visual alert every N seconds while running. 0 or omitted = off. */
  alertEverySeconds?: number;
  /** Let the user pick the alert interval (seconds). */
  alertOptions?: number[];
  onAlertChange?: (seconds: number) => void;
}

const fmt = (totalSeconds: number): string => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const Timer: React.FC<TimerProps> = ({ id, label, alertEverySeconds = 0, alertOptions, onAlertChange }) => {
  const timer = useAppStore((s) => s.timers[id]);
  const start = useAppStore((s) => s.timerStart);
  const pause = useAppStore((s) => s.timerPause);
  const reset = useAppStore((s) => s.timerReset);
  const audioEnabled = useAppStore((s) => s.audioEnabled);
  const setAudioEnabled = useAppStore((s) => s.setAudioEnabled);
  const [now, setNow] = useState(() => Date.now());
  // null until the first effect run, so re-mounting a timer that is already running does not replay an old alert.
  const lastAlertBucket = useRef<number | null>(null);

  const running = timer?.running ?? false;
  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(t);
  }, [running]);

  useEffect(() => {
    const resync = () => setNow(Date.now());
    document.addEventListener('visibilitychange', resync);
    window.addEventListener('focus', resync);
    return () => {
      document.removeEventListener('visibilitychange', resync);
      window.removeEventListener('focus', resync);
    };
  }, []);

  const elapsedMs = (timer?.accumulatedMs ?? 0) + (running && timer ? now - timer.startedAtMs : 0);
  const seconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const bucket = alertEverySeconds > 0 ? Math.floor(seconds / alertEverySeconds) : 0;
  const flashing = running && alertEverySeconds > 0 && seconds > 0 && seconds % alertEverySeconds < 2;

  useEffect(() => {
    if (!running || alertEverySeconds <= 0 || lastAlertBucket.current === null) {
      lastAlertBucket.current = bucket;
      return;
    }
    if (bucket > lastAlertBucket.current) {
      lastAlertBucket.current = bucket;
      if (audioEnabled) playCycleAlertGong();
    }
  }, [bucket, running, alertEverySeconds, audioEnabled]);

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">{label}</span>
        <button
          type="button"
          onClick={() => setAudioEnabled(!audioEnabled)}
          aria-label={audioEnabled ? 'Mute timer sound' : 'Unmute timer sound'}
          className="min-h-[48px] min-w-[48px] rounded-xl border border-slate-700 bg-slate-800 text-slate-300 flex items-center justify-center"
        >
          {audioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </button>
      </div>
      <div
        className={`rounded-xl border py-3 text-center font-mono text-5xl font-black tabular-nums ${
          flashing ? 'animate-pulse border-red-500 bg-red-500/20 text-red-200' : 'border-slate-800 bg-slate-950 text-cyan-300'
        }`}
        aria-live="off"
      >
        {fmt(seconds)}
      </div>
      {alertOptions && onAlertChange && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-400">Alert every</span>
          {[0, ...alertOptions].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onAlertChange(opt)}
              className={`min-h-[48px] rounded-xl border px-3 text-xs font-bold ${
                alertEverySeconds === opt ? 'border-cyan-400 bg-cyan-500 text-black' : 'border-slate-700 bg-slate-800 text-slate-300'
              }`}
            >
              {opt === 0 ? 'Off' : opt < 60 ? `${opt}s` : `${opt / 60} min`}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {running ? (
          <button type="button" onClick={() => pause(id)} className="min-h-[48px] rounded-xl bg-amber-500 font-black uppercase text-black flex items-center justify-center gap-1.5">
            <Pause className="h-5 w-5" /> Pause
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              unlockAudio();
              start(id);
            }}
            className="min-h-[48px] rounded-xl bg-emerald-500 font-black uppercase text-black flex items-center justify-center gap-1.5"
          >
            <Play className="h-5 w-5" /> {seconds > 0 ? 'Resume' : 'Start'}
          </button>
        )}
        <button type="button" onClick={() => reset(id)} className="min-h-[48px] rounded-xl border border-slate-700 bg-slate-800 font-bold uppercase text-slate-300 flex items-center justify-center gap-1.5">
          <RotateCcw className="h-4 w-4" /> Reset
        </button>
      </div>
    </div>
  );
};
