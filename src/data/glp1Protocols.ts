// Published conflicting perioperative GLP-1 protocols, kept separate so no protocol's fasting times are mixed with another's.
// Every row cites a source in sources.ts. Local rules are intentionally not included here.

export interface Glp1ProtocolReference {
  id: string;
  label: string;
  year: string;
  sourceId: string;
  drugRule: string;
  fastingRule: string;
  distinction: string;
}

export const GLP1_PROTOCOLS: Glp1ProtocolReference[] = [
  {
    id: 'asa-glp1-2023',
    label: 'ASA 2023',
    year: '2023 (updated 2024)',
    sourceId: 'asa-glp1-2023',
    drugRule: 'Consider holding daily GLP-1 on the day of the procedure and weekly GLP-1 for 1 week before, regardless of indication, dose or procedure.',
    fastingRule: 'No GLP-1-specific interval. Follow standard ASA fasting; treat urgent or emergent cases as full stomach.',
    distinction: 'Superseded: the ASA page now points to the 2024 multisociety guidance, which ASA co-authored. Precautionary withholding; the source notes there is no evidence for an optimal GLP-1 fasting duration.',
  },
  {
    id: 'multisociety-glp1-2024',
    label: 'Multisociety 2024',
    year: '2024',
    sourceId: 'glp1-multisociety-2024',
    drugRule: 'Most patients continue. Defer elective care during dose escalation or until significant GI symptoms resolve; document a team decision.',
    fastingRule: 'Low risk: standard fasting. Higher risk: consider a 24 h liquid-only diet, aspiration-plan changes and trained gastric ultrasound; selected cases may be delayed.',
    distinction: 'Risk-stratified: no universal 24 h diet for every patient on a GLP-1.',
  },
  {
    id: 'spaqi-glp1-2025',
    label: 'SPAQI 2025',
    year: '2025',
    sourceId: 'glp1-spaqi-2025',
    drugRule: 'Continue if there are no significant GI symptoms. Severe nausea, vomiting or inability to tolerate oral intake needs prescriber review before elective care.',
    fastingRule: 'Solids 24 h (clear liquids only); clear liquids <10% glucose 4 h and ≥10% glucose 8 h.',
    distinction: 'A distinct fixed fasting protocol for all GLP-1 patients without significant GI symptoms.',
  },
  {
    id: 'uk-glp1-2025',
    label: 'UK 2025',
    year: '2025',
    sourceId: 'glp1-uk-2025',
    drugRule: 'Continue GLP-1 and dual GIP/GLP-1 therapy throughout the perioperative period.',
    fastingRule: 'Follow standard recommended fasting; no GLP-1-specific extended fast. Use individualized aspiration-risk mitigation and consider gastric ultrasound.',
    distinction: 'Most permissive fasting; rejects extra fasting for the drug alone.',
  },
  {
    id: 'anzca-glp1-2025',
    label: 'ADS / ANZCA / GESA / NACOS 2025',
    year: '2025',
    sourceId: 'glp1-anzca-2025',
    drugRule: 'Do not routinely stop GLP-1 or dual GIP/GLP-1 therapy before the procedure.',
    fastingRule: '24 h clear-fluid diet, then a standard 6 h fast before the procedure, for all patients on these drugs.',
    distinction: 'A universal 24 h clear-fluid day for every patient on these drugs.',
  },
];
