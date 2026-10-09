import { useState } from 'react'
import { BiometricBar } from './components/BiometricBar'
import { BottomNav, type TabId } from './components/BottomNav'
import { Disclaimer } from './components/Disclaimer'
import { CalculatorView } from './views/CalculatorView'
import { ChecklistsView } from './views/ChecklistsView'
import { CrisisView } from './views/CrisisView'
import { LocalMaxView } from './views/LocalMaxView'

export default function App() {
  const [tab, setTab] = useState<TabId>('calc')
  return (
    <div className="mx-auto flex h-dvh max-w-xl flex-col bg-base">
      {(tab === 'calc' || tab === 'local') && <BiometricBar />}
      {tab === 'crisis' && <BiometricBar compact />}
      <main className="min-h-0 flex-1 overflow-y-auto p-3">
        {/* all views stay mounted so timers, ticks and entries survive tab switches */}
        <div className={tab === 'calc' ? '' : 'hidden'}><CalculatorView /></div>
        <div className={tab === 'local' ? '' : 'hidden'}><LocalMaxView /></div>
        <div className={tab === 'crisis' ? '' : 'hidden'}><CrisisView /></div>
        <div className={tab === 'lists' ? '' : 'hidden'}><ChecklistsView /></div>
      </main>
      <Disclaimer />
      <BottomNav tab={tab} onChange={setTab} />
    </div>
  )
}
