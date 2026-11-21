export interface Situation { id: string; label: string; drugIds: string[] }

export const SITUATIONS: Situation[] = [
  { id: 'induction', label: 'Induction', drugIds: ['propofol', 'etomidate', 'ketamine', 'midazolam-induction'] },
  { id: 'paralysis', label: 'Paralysis', drugIds: ['rocuronium', 'succinylcholine', 'cisatracurium', 'vecuronium'] },
  { id: 'hypotension', label: 'Hypotension', drugIds: ['phenylephrine', 'ephedrine', 'norepinephrine', 'epinephrine-infusion'] },
  { id: 'hypertension', label: 'HTN / tachycardia', drugIds: ['labetalol', 'esmolol'] },
  { id: 'analgesia', label: 'Analgesia', drugIds: ['fentanyl', 'morphine', 'hydromorphone', 'remifentanil'] },
  { id: 'reversal', label: 'Reversal', drugIds: ['sugammadex', 'neostigmine'] },
];
