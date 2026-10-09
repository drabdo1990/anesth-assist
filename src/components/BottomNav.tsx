import { Calculator, ClipboardCheck, Siren, Syringe } from 'lucide-react'

export type TabId = 'calc' | 'crisis' | 'local' | 'lists'

const TABS = [
  { id: 'calc', label: 'Calculator', Icon: Calculator },
  { id: 'crisis', label: 'Crisis', Icon: Siren },
  { id: 'local', label: 'Local Max', Icon: Syringe },
  { id: 'lists', label: 'Checklists', Icon: ClipboardCheck },
] as const

export function BottomNav({ tab, onChange }: { tab: TabId; onChange: (t: TabId) => void }) {
  return (
    <nav className="grid grid-cols-4 border-t border-line bg-card pb-[env(safe-area-inset-bottom)]" aria-label="Main">
      {TABS.map(({ id, label, Icon }) => {
        const active = tab === id
        const color = active ? (id === 'crisis' ? 'text-crimson' : 'text-accent') : 'text-muted'
        return (
          <button key={id} type="button" onClick={() => onChange(id)} aria-current={active ? 'page' : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${color} ${active ? 'bg-base' : ''}`}>
            <Icon size={22} aria-hidden />
            {label}
          </button>
        )
      })}
    </nav>
  )
}
