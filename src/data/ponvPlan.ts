// What the ASER 2025 consensus advises for PONV. Wording follows the appendix (read in full 2026-11-17).
// No doses: the guideline's dose table was not available to this build.

export const PONV_PLAN = {
  sourceIds: ['aser-ponv-5th-2025'],
  adults: {
    headline: 'Give PONV prophylaxis using 2 interventions in adults at any risk for PONV (ASER 2025, Guideline 3).',
    /** Guideline 2: strategies recommended to reduce baseline risk. */
    riskReduction: [
      'Minimization of perioperative opioids with the use of multimodal analgesic regimens',
      'Preferential use of regional anesthesia',
      'Preferential use of propofol infusions as the primary anesthetic',
      'Avoidance of volatile anesthetics',
      'Adequate hydration in patients undergoing surgery',
    ],
    doseNote: 'Doses are not shown here: the guideline dose table was not available to this build. Check the Drug reference and your local protocol.',
  },
  children:
    'Pediatric postoperative vomiting (POV/PONV) is assessed with different models and a different prophylaxis approach (ASER 2025, Guideline 5). It is not encoded in this app.',
};
