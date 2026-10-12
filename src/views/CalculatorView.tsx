import { DrugCard } from '../components/DrugCard'
import { CATEGORIES, type Category, DRUGS } from '../lib/drugs'

// accent per clinical domain: cyan biometrics/ventilation, emerald analgesia/recovery,
// amber airway/airway-adjacent blocks, crimson emergency
const CATEGORY_ACCENT: Record<Category, string> = {
  Premed: 'text-ok',
  Induction: 'text-accent',
  NMBA: 'text-amber',
  Reversal: 'text-amber',
  Infusion: 'text-accent',
  Vasopressor: 'text-crimson',
  Analgesia: 'text-ok',
}

export function CalculatorView() {
  return (
    <div className="space-y-5">
      {CATEGORIES.map((cat) => (
        <section key={cat} className="space-y-3">
          <h2 className={`text-sm font-bold uppercase tracking-widest ${CATEGORY_ACCENT[cat]}`}>
            {cat}
          </h2>
          {DRUGS.filter((d) => d.category === cat).map((d) => (
            <DrugCard key={d.id} drug={d} />
          ))}
        </section>
      ))}
    </div>
  )
}
