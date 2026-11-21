import React from 'react';
import type { ScalarBasis, WeightScalar } from '../../data/types';
import { formatKg } from '../../lib/calc/format';

const STYLE: Record<WeightScalar, string> = {
  TBW: 'bg-slate-800 text-slate-200 border-slate-600',
  IBW: 'bg-amber-950 text-amber-300 border-amber-700/60',
  LBW: 'bg-cyan-950 text-cyan-300 border-cyan-700/60',
  ABW40: 'bg-emerald-950 text-emerald-300 border-emerald-700/60',
};

const BASIS_TEXT: Record<ScalarBasis, string> = {
  label: 'Weight basis named on the product label',
  literature: 'Label does not name a weight; scalar follows published obesity dosing guidance (Ingrande 2010, abstract-level)',
  unspecified: 'Label does not specify a weight type; TBW used by default. You can switch scalar.',
};

interface WeightScalarBadgeProps {
  scalar: WeightScalar;
  kg: number;
  basis?: ScalarBasis;
}

export const WeightScalarBadge: React.FC<WeightScalarBadgeProps> = ({ scalar, kg, basis }) => (
  <span
    title={basis ? BASIS_TEXT[basis] : undefined}
    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-mono font-bold ${STYLE[scalar]}`}
  >
    {scalar}: {formatKg(kg)} kg
    {basis === 'label' && <span className="text-[9px] font-sans uppercase opacity-80">label</span>}
  </span>
);
