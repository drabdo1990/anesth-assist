import React from 'react';
import { NO_SOURCE_VALUE } from '../../data/types';

interface NoSourceValueProps {
  topic?: string;
  compact?: boolean;
}

/** Placeholder for any value the selected sources do not provide. */
export const NoSourceValue: React.FC<NoSourceValueProps> = ({ topic, compact }) => (
  <div className={`rounded-xl border border-dashed border-slate-600 bg-slate-900/60 text-slate-400 ${compact ? 'px-2 py-1 text-xs' : 'p-3 text-sm'}`}>
    {topic && <strong className="mr-1 text-slate-300">{topic}:</strong>}
    {NO_SOURCE_VALUE}.
  </div>
);
