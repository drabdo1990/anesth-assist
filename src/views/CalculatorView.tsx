import { DrugCard } from '../components/DrugCard'
import { CATEGORIES, DRUGS } from '../lib/drugs'

export function CalculatorView() {
  return (
    <div className="space-y-5">
      {CATEGORIES.map((cat) => (
        <section key={cat} className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted">{cat}</h2>
          {DRUGS.filter((d) => d.category === cat).map((d) => (
            <DrugCard key={d.id} drug={d} />
          ))}
        </section>
      ))}
    </div>
  )
}
