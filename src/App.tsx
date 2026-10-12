import { useState } from 'react'
import { BiometricBar } from './components/BiometricBar'
import { BottomNav, type TabId } from './components/BottomNav'
import { Disclaimer } from './components/Disclaimer'
import { AirwayView } from './views/AirwayView'
import { CalculatorView } from './views/CalculatorView'
import { ChecklistsView } from './views/ChecklistsView'
import { CrisisView } from './views/CrisisView'
import { LocalMaxView } from './views/LocalMaxView'
import { VentilationView } from './views/VentilationView'

export default function App() {
  const [tab, setTab] = useState<TabId>('calc')
  return (
    <div className="mx-auto flex h-dvh max-w-xl flex-col bg-base">
      {tab !== 'crisis' && tab !== 'lists' && <BiometricBar />}
      {tab === 'crisis' && <BiometricBar compact />}
      <main className="min-h-0 flex-1 overflow-y-auto p-3">
        {/* all views stay mounted so timers, ticks and entries survive tab switches */}
        <div className={tab === 'calc' ? '' : 'hidden'}>
          <CalculatorView />
        </div>
        <div className={tab === 'airway' ? '' : 'hidden'}>
          <AirwayView />
        </div>
        <div className={tab === 'vent' ? '' : 'hidden'}>
          <VentilationView />
        </div>
        <div className={tab === 'local' ? '' : 'hidden'}>
          <LocalMaxView />
        </div>
        <div className={tab === 'crisis' ? '' : 'hidden'}>
          <CrisisView />
        </div>
        <div className={tab === 'lists' ? '' : 'hidden'}>
          <ChecklistsView />
        </div>
      </main>
      <Disclaimer />
      <BottomNav tab={tab} onChange={setTab} />
    </div>
  )
}
