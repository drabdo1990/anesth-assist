export interface FlowStep {
  id: string;
  label: string;
  done: boolean;
  manual?: boolean; // shortcut: advisory/manual step does not block progression
  hint?: string;
  tone?: 'ok' | 'amber' | 'red';
}

/** Index of the first undone, non-manual step; steps.length when everything is done. */
export const currentStepIndex = (steps: FlowStep[]): number => {
  const i = steps.findIndex((st) => !st.done && !st.manual);
  return i === -1 ? steps.length : i;
};
