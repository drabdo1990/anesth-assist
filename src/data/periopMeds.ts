// Perioperative medication instructions. The label cards below (SGLT2 inhibitors, DOACs) cite a manufacturer label and quote its
// wording. The ASRA and cardiac cards live in periopAsra.ts and periopCardiac.ts and quote their guidelines. Nothing is rounded,
// merged or inferred.

import { ASRA_RULES } from './periopAsra';
import { CARDIAC_RULES } from './periopCardiac';

export type PeriopAction = 'continue' | 'hold' | 'modify' | 'individualise';

export interface PeriopTiming {
  /** The condition the label attaches, when it has one. */
  when?: string;
  /** The instruction as the label words it. */
  text: string;
  /** Applies when creatinine clearance (mL/min) is at least this. */
  crclMin?: number;
  /** Applies when creatinine clearance (mL/min) is below this. */
  crclBelow?: number;
}

export interface PeriopDrug {
  id: string;
  name: string;
  timings: PeriopTiming[];
  /** Label statements about epidural or intrathecal catheters and punctures. */
  catheter?: string[];
  /** What the source says about restarting, or the first dose after the block. Absent when the source gives none. */
  restart?: string;
  sourceId: string;
}

export interface PeriopMedRule {
  id: string;
  drugClass: string;
  /** Heading that the card's tick box sits under in the Medications list. */
  section: string;
  action: PeriopAction;
  summary: string;
  /** One-sentence rationale for trainees. */
  why?: string;
  cautions?: string[];
  drugs: PeriopDrug[];
  sourceIds: string[];
}

const SGLT2_RESTART = 'Resume when the patient is clinically stable and has resumed oral intake.';

const sglt2 = (id: string, name: string, days: 3 | 4): PeriopDrug => ({
  id,
  name,
  timings: [{ text: `Withhold for at least ${days} days, if possible, prior to surgery or procedures associated with prolonged fasting.` }],
  restart: SGLT2_RESTART,
  sourceId: `label-${id}`,
});

export const SGLT2_RULE: PeriopMedRule = {
  id: 'sglt2i',
  drugClass: 'SGLT2 inhibitors',
  section: "Manufacturers' labels",
  action: 'hold',
  summary: 'Withhold before surgery or procedures with prolonged fasting, if possible.',
  why: 'The labels list surgery and reduced caloric intake among the conditions that precipitate ketoacidosis.',
  drugs: [
    sglt2('empagliflozin', 'Empagliflozin (Jardiance)', 3),
    sglt2('dapagliflozin', 'Dapagliflozin (Farxiga)', 3),
    sglt2('canagliflozin', 'Canagliflozin (Invokana)', 3),
    sglt2('ertugliflozin', 'Ertugliflozin (Steglatro)', 4),
  ],
  sourceIds: ['label-empagliflozin', 'label-dapagliflozin', 'label-canagliflozin', 'label-ertugliflozin'],
};

export const DOAC_RULE: PeriopMedRule = {
  id: 'doac',
  drugClass: 'Direct oral anticoagulants (DOACs)',
  section: "Manufacturers' labels",
  action: 'hold',
  summary: 'Stop before surgery or invasive procedures. The interval depends on the drug, and for dabigatran on creatinine clearance.',
  why: 'The labels ask for interruption before procedures because of the risk of bleeding.',
  cautions: [
    "These are the manufacturers' timings for surgery and procedures. They are not the ASRA intervals for placing a spinal, epidural or deep block: tick 'DOACs: spinal, epidural or deep block (ASRA)' for those.",
  ],
  drugs: [
    {
      id: 'apixaban',
      name: 'Apixaban (Eliquis)',
      timings: [
        {
          when: 'Moderate or high risk of unacceptable or clinically significant bleeding',
          text: 'Discontinue at least 48 hours prior to elective surgery or invasive procedures.',
        },
        {
          when: 'Low risk of bleeding, or bleeding that would be non-critical in location and easily controlled',
          text: 'Discontinue at least 24 hours prior to elective surgery or invasive procedures.',
        },
      ],
      catheter: [
        'Indwelling epidural or intrathecal catheters should not be removed earlier than 24 hours after the last administration.',
        'The next dose should not be administered earlier than 5 hours after the removal of the catheter.',
      ],
      restart: 'Restart after the surgical or other procedures as soon as adequate hemostasis has been established.',
      sourceId: 'label-apixaban',
    },
    {
      id: 'rivaroxaban',
      name: 'Rivaroxaban (Xarelto)',
      timings: [
        { text: 'If anticoagulation must be discontinued to reduce the risk of bleeding with surgical or other procedures, stop at least 24 hours before the procedure.' },
      ],
      catheter: [
        'Placement or removal of an epidural catheter or lumbar puncture is best performed when the anticoagulant effect is low; however, the exact timing to reach a sufficiently low anticoagulant effect in each patient is not known.',
        'An indwelling epidural or intrathecal catheter should not be removed before at least 2 half-lives have elapsed (i.e., 18 hours in young patients aged 20 to 45 years and 26 hours in elderly patients aged 60 to 76 years), after the last administration.',
        'The next dose should not be administered earlier than 6 hours after the removal of the catheter.',
      ],
      restart:
        'Restart after the surgical or other procedures as soon as adequate hemostasis has been established, noting that the time to onset of therapeutic effect is short.',
      sourceId: 'label-rivaroxaban',
    },
    {
      id: 'edoxaban',
      name: 'Edoxaban (Savaysa)',
      timings: [{ text: 'Discontinue at least 24 hours before invasive or surgical procedures because of the risk of bleeding.' }],
      catheter: [
        'Indwelling epidural or intrathecal catheters should not be removed earlier than 12 hours after the last administration.',
        'The next dose should not be administered earlier than 2 hours after the removal of the catheter.',
      ],
      restart:
        'Can be restarted after the surgical or other procedure as soon as adequate hemostasis has been established, noting that the time to onset of pharmacodynamic effect is 1-2 hours.',
      sourceId: 'label-edoxaban',
    },
    {
      id: 'dabigatran',
      name: 'Dabigatran (Pradaxa capsules, adults)',
      timings: [
        {
          when: 'CrCl 50 mL/min or more',
          crclMin: 50,
          text: 'If possible, discontinue 1 to 2 days before invasive or surgical procedures because of the increased risk of bleeding.',
        },
        {
          when: 'CrCl below 50 mL/min',
          crclBelow: 50,
          text: 'If possible, discontinue 3 to 5 days before invasive or surgical procedures because of the increased risk of bleeding.',
        },
        { text: 'Consider longer times for patients undergoing major surgery, spinal puncture, or placement of a spinal or epidural catheter or port.' },
      ],
      restart: 'Temporarily discontinue before invasive or surgical procedures when possible, then restart promptly.',
      sourceId: 'label-dabigatran',
    },
  ],
  sourceIds: ['label-apixaban', 'label-rivaroxaban', 'label-edoxaban', 'label-dabigatran'],
};

export const GLP1_RULE: PeriopMedRule = {
  id: 'glp1ra',
  drugClass: 'GLP-1 receptor agonists',
  section: 'Published protocols',
  action: 'individualise',
  summary:
    'Published perioperative protocols conflict on both the drug instruction and the fasting instruction, so this app does not pick one. See "GLP-1 perioperative protocols" in References (the book icon) for the side-by-side comparison.',
  drugs: [],
  sourceIds: ['asa-glp1-2023', 'glp1-multisociety-2024', 'glp1-spaqi-2025', 'glp1-uk-2025', 'glp1-anzca-2025'],
};

export const PERIOP_RULES: PeriopMedRule[] = [SGLT2_RULE, DOAC_RULE, GLP1_RULE, ...ASRA_RULES, ...CARDIAC_RULES];
