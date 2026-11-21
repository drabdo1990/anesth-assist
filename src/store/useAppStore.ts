// App state. Persistence rule: ONLY non-PHI preferences and anonymous checklist ticks are saved.
// Patient parameters, dose selections, local-anesthetic entries and emergency trackers live in
// memory only, so a new session never opens with the previous patient's weight.

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Sex } from '../lib/calc/biometrics';
import type { WeightScalar } from '../data/types';
import type { GuidelineSet } from '../data/resolve';
import type { AppTab, IntraopView } from '../lib/phases';
import type { CreatinineUnit } from '../lib/calc/units';
import type { AsaClass, FastingStatus } from '../lib/preopNote';

export type { AppTab, IntraopView };
export type EmergencyKind = 'last' | 'mh' | 'cico';
export type ScalarPreference = 'auto' | WeightScalar;

export interface PatientInput {
  tbwKg: number | null;
  heightCm: number | null;
  /** Unset until the user chooses: the app never assumes a sex. */
  sex: Sex | null;
  ageYears: number | null;
  /** Serum creatinine in micromol/L, whatever unit was typed. In memory only. */
  creatinineUmolL: number | null;
}

export interface LaAdmin {
  id: string;
  anestheticId: string;
  percent: number;
  volumeMl: number;
  withEpi: boolean;
}

export interface VentState {
  scenarioId: string;
  mlPerKgPbw: number | null;
  respiratoryRate: number | null;
  peepCmH2O: number | null;
  plateauCmH2O: number | null;
  fio2Percent: number | null;
}

export interface TimerState {
  running: boolean;
  startedAtMs: number;
  accumulatedMs: number;
}

export const EMPTY_PATIENT: PatientInput = { tbwKg: null, heightCm: null, sex: null, ageYears: null, creatinineUmolL: null };

const DEFAULT_VENT: VentState = {
  scenarioId: 'ards',
  mlPerKgPbw: 6,
  respiratoryRate: null,
  peepCmH2O: null,
  plateauCmH2O: null,
  fio2Percent: null,
};

export interface PersistedPrefs {
  guidelineSet: GuidelineSet;
  preferredScalar: ScalarPreference;
  /** doseId -> chosen concentration in mg/mL (per dose: bolus and infusion can need different strengths). */
  concentrationChoice: Record<string, number>;
  ventScenarioId: string;
  recents: string[];
  mhContact: string;
  checks: Record<string, boolean>;
  audioEnabled: boolean;
  creatinineUnit: CreatinineUnit;
}

interface AppState extends PersistedPrefs {
  // ---- in-memory only ----
  patient: PatientInput;
  activeTab: AppTab;
  intraopView: IntraopView;
  scoreAnswers: Record<string, boolean>;
  medsTaken: Record<string, boolean>;
  choiceAnswers: Record<string, number>;
  asaClass: AsaClass | null;
  asaEmergency: boolean;
  fastingStatus: FastingStatus | null;
  emergencyOpen: boolean;
  emergencyKind: EmergencyKind;
  settingsOpen: boolean;
  referencesOpen: boolean;
  updateAvailable: boolean;

  doseValues: Record<string, number>;
  selectedDose: Record<string, string>;
  scalarOverrides: Record<string, WeightScalar>;
  /** medicationId -> individual bolus masses logged for cumulative ceilings. */
  doseAdminLogs: Record<string, number[]>;
  laAdmins: LaAdmin[];

  lipidGivenMl: number;
  dantroleneGivenMg: number;
  emergencyChecks: Record<string, boolean>;
  cicoPlan: 'A' | 'B' | 'C' | 'D';
  cicoHelpCalled: boolean;
  cicoAlertEvery: number;
  timers: Record<string, TimerState>;

  vent: VentState;

  // ---- actions ----
  setPatient: (updates: Partial<PatientInput>) => void;
  newCase: () => void;

  setActiveTab: (tab: AppTab) => void;
  setIntraopView: (view: IntraopView) => void;
  openEmergency: (kind?: EmergencyKind) => void;
  closeEmergency: () => void;
  setEmergencyKind: (kind: EmergencyKind) => void;
  setSettingsOpen: (open: boolean) => void;
  setReferencesOpen: (open: boolean) => void;
  setUpdateAvailable: (available: boolean) => void;

  setGuidelineSet: (set: GuidelineSet) => void;
  setPreferredScalar: (pref: ScalarPreference) => void;
  setConcentrationChoice: (doseId: string, mgPerMl: number) => void;
  setMhContact: (value: string) => void;
  setAudioEnabled: (value: boolean) => void;
  setCreatinineUnit: (unit: CreatinineUnit) => void;
  toggleScoreItem: (id: string) => void;
  toggleMedTaken: (id: string) => void;
  setChoiceAnswer: (itemId: string, optionIndex: number) => void;
  setAsaClass: (value: AsaClass | null) => void;
  setAsaEmergency: (value: boolean) => void;
  setFastingStatus: (value: FastingStatus | null) => void;
  touchRecent: (id: string) => void;

  setSelectedDose: (medicationId: string, doseId: string) => void;
  setDoseValue: (doseId: string, value: number) => void;
  setScalarOverride: (doseId: string, scalar: WeightScalar | null) => void;
  logDose: (medicationId: string, massMg: number) => void;
  undoDose: (medicationId: string) => void;
  resetDoseLog: (medicationId: string) => void;

  addLaAdmin: (anestheticId: string, percent: number) => void;
  updateLaAdmin: (id: string, updates: Partial<LaAdmin>) => void;
  removeLaAdmin: (id: string) => void;
  clearLaAdmins: () => void;

  addLipid: (ml: number) => void;
  addDantrolene: (mg: number) => void;
  resetLipid: () => void;
  resetDantrolene: () => void;
  toggleEmergencyCheck: (id: string) => void;
  setCicoPlan: (plan: 'A' | 'B' | 'C' | 'D') => void;
  setCicoHelpCalled: (called: boolean) => void;
  setCicoAlertEvery: (seconds: number) => void;
  timerStart: (id: string) => void;
  timerPause: (id: string) => void;
  timerReset: (id: string) => void;

  toggleCheck: (id: string) => void;
  resetChecks: (idsOrAll?: string[]) => void;

  setVent: (updates: Partial<VentState>) => void;
}

const SCALAR_PREFS: string[] = ['auto', 'TBW', 'IBW', 'LBW', 'ABW40'];

/**
 * Upgrade path for saved data. Keeps only known-safe preference fields and DROPS everything else
 * (patient values, localAdmins, selectedTiers, disclaimerDismissed, ...). Concentration choices and
 * checklist ticks from older versions are not trusted and reset, because their meaning may have changed.
 */
export const migratePersisted = (persisted: unknown): PersistedPrefs => {
  const p = (typeof persisted === 'object' && persisted !== null ? persisted : {}) as Record<string, unknown>;
  return {
    guidelineSet: p.guidelineSet === 'local' ? 'local' : 'international',
    preferredScalar: SCALAR_PREFS.includes(p.preferredScalar as string) ? (p.preferredScalar as ScalarPreference) : 'auto',
    concentrationChoice: {},
    ventScenarioId: typeof p.ventScenarioId === 'string' ? p.ventScenarioId : DEFAULT_VENT.scenarioId,
    recents: [],
    mhContact: typeof p.mhContact === 'string' ? p.mhContact : '',
    checks: {},
    audioEnabled: p.audioEnabled !== false && p.cprAudioAlert !== false,
    creatinineUnit: p.creatinineUnit === 'umol' ? 'umol' : 'mgdl',
  };
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // prefs
      guidelineSet: 'international',
      preferredScalar: 'auto',
      concentrationChoice: {},
      ventScenarioId: DEFAULT_VENT.scenarioId,
      recents: [],
      mhContact: '',
      checks: {},
      audioEnabled: true,
      creatinineUnit: 'mgdl',

      // session
      patient: EMPTY_PATIENT,
      activeTab: 'intraop',
      intraopView: 'dosing',
      scoreAnswers: {},
      medsTaken: {},
      choiceAnswers: {},
      asaClass: null,
      asaEmergency: false,
      fastingStatus: null,
      emergencyOpen: false,
      emergencyKind: 'last',
      settingsOpen: false,
      referencesOpen: false,
      updateAvailable: false,

      doseValues: {},
      selectedDose: {},
      scalarOverrides: {},
      doseAdminLogs: {},
      laAdmins: [],

      lipidGivenMl: 0,
      dantroleneGivenMg: 0,
      emergencyChecks: {},
      cicoPlan: 'A',
      cicoHelpCalled: false,
      cicoAlertEvery: 0,
      timers: {},

      vent: DEFAULT_VENT,

      setPatient: (updates) => set((s) => ({ patient: { ...s.patient, ...updates } })),

      newCase: () =>
        set({
          patient: EMPTY_PATIENT,
          doseValues: {},
          selectedDose: {},
          scalarOverrides: {},
          doseAdminLogs: {},
          laAdmins: [],
          lipidGivenMl: 0,
          dantroleneGivenMg: 0,
          emergencyChecks: {},
          cicoPlan: 'A',
          cicoHelpCalled: false,
          cicoAlertEvery: 0,
          timers: {},
          vent: { ...DEFAULT_VENT, scenarioId: get().ventScenarioId },
          scoreAnswers: {},
          medsTaken: {},
          choiceAnswers: {},
          asaClass: null,
          asaEmergency: false,
          fastingStatus: null,
          checks: {},
        }),

      setActiveTab: (activeTab) => set({ activeTab }),
      setIntraopView: (intraopView) => set({ intraopView }),
      openEmergency: (kind) =>
        set((s) => ({ emergencyOpen: true, emergencyKind: kind ?? s.emergencyKind })),
      closeEmergency: () => set({ emergencyOpen: false }),
      setEmergencyKind: (emergencyKind) => set({ emergencyKind }),
      setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
      setReferencesOpen: (referencesOpen) => set({ referencesOpen }),
      setUpdateAvailable: (updateAvailable) => set({ updateAvailable }),

      setGuidelineSet: (guidelineSet) => set({ guidelineSet }),
      setPreferredScalar: (preferredScalar) => set({ preferredScalar }),
      setConcentrationChoice: (doseId, mgPerMl) =>
        set((s) => ({ concentrationChoice: { ...s.concentrationChoice, [doseId]: mgPerMl } })),
      setMhContact: (mhContact) => set({ mhContact }),
      setAudioEnabled: (audioEnabled) => set({ audioEnabled }),
      setCreatinineUnit: (creatinineUnit) => set({ creatinineUnit }),
      toggleScoreItem: (id) => set((s) => ({ scoreAnswers: { ...s.scoreAnswers, [id]: !s.scoreAnswers[id] } })),
      toggleMedTaken: (id) => set((s) => ({ medsTaken: { ...s.medsTaken, [id]: !s.medsTaken[id] } })),
      setChoiceAnswer: (itemId, optionIndex) => set((s) => ({ choiceAnswers: { ...s.choiceAnswers, [itemId]: optionIndex } })),
      setAsaClass: (asaClass) => set({ asaClass }),
      setAsaEmergency: (asaEmergency) => set({ asaEmergency }),
      setFastingStatus: (fastingStatus) => set({ fastingStatus }),
      touchRecent: (id) =>
        set((s) => ({ recents: [id, ...s.recents.filter((r) => r !== id)].slice(0, 6) })),

      setSelectedDose: (medicationId, doseId) =>
        set((s) => ({ selectedDose: { ...s.selectedDose, [medicationId]: doseId } })),
      setDoseValue: (doseId, value) =>
        set((s) => ({ doseValues: { ...s.doseValues, [doseId]: value } })),
      setScalarOverride: (doseId, scalar) =>
        set((s) => {
          const next = { ...s.scalarOverrides };
          if (scalar === null) delete next[doseId];
          else next[doseId] = scalar;
          return { scalarOverrides: next };
        }),
      logDose: (medicationId, massMg) =>
        set((s) => ({
          doseAdminLogs: {
            ...s.doseAdminLogs,
            [medicationId]: [...(s.doseAdminLogs[medicationId] ?? []), massMg],
          },
        })),
      undoDose: (medicationId) =>
        set((s) => ({
          doseAdminLogs: {
            ...s.doseAdminLogs,
            [medicationId]: (s.doseAdminLogs[medicationId] ?? []).slice(0, -1),
          },
        })),
      resetDoseLog: (medicationId) =>
        set((s) => {
          const next = { ...s.doseAdminLogs };
          delete next[medicationId];
          return { doseAdminLogs: next };
        }),

      addLaAdmin: (anestheticId, percent) =>
        set((s) => ({
          laAdmins: [
            ...s.laAdmins,
            {
              id: `la-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
              anestheticId,
              percent,
              volumeMl: 0,
              withEpi: false,
            },
          ],
        })),
      updateLaAdmin: (id, updates) =>
        set((s) => ({ laAdmins: s.laAdmins.map((a) => (a.id === id ? { ...a, ...updates } : a)) })),
      removeLaAdmin: (id) => set((s) => ({ laAdmins: s.laAdmins.filter((a) => a.id !== id) })),
      clearLaAdmins: () => set({ laAdmins: [] }),

      addLipid: (ml) => set((s) => ({ lipidGivenMl: Math.max(0, s.lipidGivenMl + ml) })),
      addDantrolene: (mg) => set((s) => ({ dantroleneGivenMg: Math.max(0, s.dantroleneGivenMg + mg) })),
      resetLipid: () => set({ lipidGivenMl: 0 }),
      resetDantrolene: () => set({ dantroleneGivenMg: 0 }),
      toggleEmergencyCheck: (id) =>
        set((s) => ({ emergencyChecks: { ...s.emergencyChecks, [id]: !s.emergencyChecks[id] } })),
      setCicoPlan: (cicoPlan) => set({ cicoPlan }),
      setCicoHelpCalled: (cicoHelpCalled) => set({ cicoHelpCalled }),
      setCicoAlertEvery: (cicoAlertEvery) => set({ cicoAlertEvery }),

      timerStart: (id) =>
        set((s) => {
          const t = s.timers[id];
          if (t?.running) return s;
          return {
            timers: {
              ...s.timers,
              [id]: { running: true, startedAtMs: Date.now(), accumulatedMs: t?.accumulatedMs ?? 0 },
            },
          };
        }),
      timerPause: (id) =>
        set((s) => {
          const t = s.timers[id];
          if (!t?.running) return s;
          return {
            timers: {
              ...s.timers,
              [id]: { running: false, startedAtMs: 0, accumulatedMs: t.accumulatedMs + (Date.now() - t.startedAtMs) },
            },
          };
        }),
      timerReset: (id) =>
        set((s) => ({ timers: { ...s.timers, [id]: { running: false, startedAtMs: 0, accumulatedMs: 0 } } })),

      toggleCheck: (id) => set((s) => ({ checks: { ...s.checks, [id]: !s.checks[id] } })),
      resetChecks: (ids) =>
        set((s) => {
          if (!ids) return { checks: {} };
          const next = { ...s.checks };
          for (const id of ids) delete next[id];
          return { checks: next };
        }),

      setVent: (updates) =>
        set((s) => {
          const vent = { ...s.vent, ...updates };
          return updates.scenarioId ? { vent, ventScenarioId: updates.scenarioId } : { vent };
        }),
    }),
    {
      name: 'anesthassist-storage',
      version: 4,
      storage: createJSONStorage(() => localStorage),
      partialize: (s): PersistedPrefs => ({
        guidelineSet: s.guidelineSet,
        preferredScalar: s.preferredScalar,
        concentrationChoice: s.concentrationChoice,
        ventScenarioId: s.ventScenarioId,
        recents: s.recents,
        mhContact: s.mhContact,
        checks: s.checks,
        audioEnabled: s.audioEnabled,
        creatinineUnit: s.creatinineUnit,
      }),
      migrate: (persisted): PersistedPrefs => migratePersisted(persisted),
    },
  ),
);
