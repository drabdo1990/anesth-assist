// Anonymous handoff summary. Only fixed pick-lists and short numeric parameters are included.
// There are deliberately no free-text fields: names cannot be detected reliably.

export interface HandoffInput {
  procedureCategory: string;
  asaStatus: string;
  airway: string;
  inductionAgents: string[];
  maintenance: string;
  opioids: string[];
  neuromuscularBlockade: string[];
  fluidsMl: string;
  bloodLossMl: string;
  ventMode: string;
  ventTidalVolumeMl: string;
  ventRespiratoryRate: string;
  ventPeepCmH2O: string;
  ventFio2Percent: string;
}

export const EMPTY_HANDOFF: HandoffInput = {
  procedureCategory: '',
  asaStatus: '',
  airway: '',
  inductionAgents: [],
  maintenance: '',
  opioids: [],
  neuromuscularBlockade: [],
  fluidsMl: '',
  bloodLossMl: '',
  ventMode: '',
  ventTidalVolumeMl: '',
  ventRespiratoryRate: '',
  ventPeepCmH2O: '',
  ventFio2Percent: '',
};

const isNumeric = (s: string): boolean => s.trim() !== '' && Number.isFinite(Number(s));

const line = (label: string, value: string): string | null => (value.trim() ? `${label}: ${value.trim()}` : null);

const list = (label: string, values: string[]): string | null =>
  values.length > 0 ? `${label}: ${values.join(', ')}` : null;

/**
 * Build the summary. Fields that fail validation (non-numeric numbers, unsafe free text) are
 * omitted rather than copied. Returns the text plus the names of any omitted fields.
 */
export const buildHandoffSummary = (input: HandoffInput): { text: string; omitted: string[] } => {
  const omitted: string[] = [];

  const num = (label: string, value: string, unit: string): string | null => {
    if (value.trim() === '') return null;
    if (!isNumeric(value)) {
      omitted.push(label);
      return null;
    }
    return `${label}: ${Number(value)} ${unit}`;
  };

  const procedure = input.procedureCategory.trim();

  const vent = [
    input.ventMode.trim() ? input.ventMode.trim() : null,
    num('VT', input.ventTidalVolumeMl, 'mL'),
    num('RR', input.ventRespiratoryRate, 'breaths/min'),
    num('PEEP', input.ventPeepCmH2O, 'cmH2O'),
    num('FiO2', input.ventFio2Percent, '%'),
  ]
    .filter((s): s is string => Boolean(s))
    .join('; ');

  const lines = [
    '--- ANESTHESIA HANDOFF (anonymous) ---',
    procedure ? `Procedure: ${procedure}` : null,
    line('ASA status', input.asaStatus),
    line('Airway', input.airway),
    list('Induction agents', input.inductionAgents),
    line('Maintenance', input.maintenance),
    list('Opioids', input.opioids),
    list('Neuromuscular blockade', input.neuromuscularBlockade),
    num('Fluids', input.fluidsMl, 'mL'),
    num('Blood loss', input.bloodLossMl, 'mL'),
    vent ? `Ventilation: ${vent}` : null,
    'No patient identifiers included.',
  ].filter((s): s is string => Boolean(s));

  return { text: lines.join('\n'), omitted };
};
