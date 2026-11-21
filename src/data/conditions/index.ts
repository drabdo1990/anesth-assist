import { CARDIOVASCULAR_CONDITIONS } from './cardiovascular';
import { RESPIRATORY_CONDITIONS } from './respiratory';
import { NEUROLOGIC_CONDITIONS } from './neurologic';
import { ENDOCRINE_CONDITIONS } from './endocrine';
import { HEMATOLOGIC_CONDITIONS } from './hematologic';
import { MULTISYSTEM_CONDITIONS } from './multisystem';
import type { ConditionRecord } from './types';

export const CONDITIONS: ConditionRecord[] = [
  ...RESPIRATORY_CONDITIONS,
  ...CARDIOVASCULAR_CONDITIONS,
  ...NEUROLOGIC_CONDITIONS,
  ...ENDOCRINE_CONDITIONS,
  ...HEMATOLOGIC_CONDITIONS,
  ...MULTISYSTEM_CONDITIONS,
];

export { CARDIOVASCULAR_CONDITIONS } from './cardiovascular';
export { RESPIRATORY_CONDITIONS } from './respiratory';
export { NEUROLOGIC_CONDITIONS } from './neurologic';
export { ENDOCRINE_CONDITIONS } from './endocrine';
export { HEMATOLOGIC_CONDITIONS } from './hematologic';
export { MULTISYSTEM_CONDITIONS } from './multisystem';

export { PLANNED_CONDITION_IDS } from './plannedIds';
export * from './types';
