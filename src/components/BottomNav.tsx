import { Activity, Calculator, ClipboardCheck, Siren, Syringe, Wind } from 'lucide-react'

export type TabId = 'calc' | 'airway' | 'vent' | 'local' | 'crisis' | 'lists'

const TABS = [
  { id: 'calc', label: 'Calc', Icon: Calculator },
  { id: 'airway', label: 'Airway', Icon: Wind },
  { id: 'vent', label: 'Vent', Icon: Activity },
  { id: 'local', label: 'LA Max', Icon: Syringe },
  { id: 'crisis', label: 'Crisis', Icon: Siren },
  { id: 'lists', label: 'Lists', Icon: ClipboardCheck },
] as const

export function BottomNav({ tab, onChange }: { tab: TabId; onChange: (t: TabId) => void }) {
  return (
    <nav
      className="grid grid-cols-6 border-t border-line bg-card pb-[env(safe-area-inset-bottom)]"
      aria-label="Main"
    >
      {TABS.map(({ id, label, Icon }) => {
        const active = tab === id
        const color = active ? (id === 'crisis' ? 'text-crimson' : 'text-accent') : 'text-muted'
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${color} ${active ? 'bg-base' : ''}`}
          >
            <Icon size={22} aria-hidden />
            {label}
          </button>
        )
      })}
    </nav>
  )
}
