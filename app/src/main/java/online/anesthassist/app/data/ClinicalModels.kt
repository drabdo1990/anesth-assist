package online.anesthassist.app.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ClinicalBundle(
    val dataVersion: String,
    val dataStatus: String,
    val sources: List<ClinicalSource>,
    val categoryOrder: List<String>,
    val categoryLabels: Map<String, String>,
    val categoryPlaceholders: List<CategoryPlaceholder>,
    val medications: List<Medication>,
    val localAnesthetics: List<LocalAnesthetic>,
    val situations: List<Situation>,
    val neuraxialRegimens: List<NeuraxialRegimen>,
    val referenceDrugs: List<ReferenceDrug>,
    val airway: AirwayData,
    val ventilation: VentilationData,
    val emergencies: EmergencyData,
    val checklistGroups: List<String>,
    val checklists: List<ChecklistRecord>,
    val handoffOptions: HandoffOptions,
    val riskScores: List<RiskScore>,
    val postopScores: List<RiskScore>,
    val rcri: RiskScore,
    val stopBang: RiskScore,
    val apfel: RiskScore,
    val choiceScores: List<ChoiceScore>,
    val ponvPlan: PonvPlan,
    val planCards: List<PlanCard>,
    val periopRules: List<PeriopMedRule>,
    val glp1Protocols: List<Glp1ProtocolReference>,
    val stoeltingChapters: Map<String, String>,
    val conditions: List<ConditionRecord>,
)

@Serializable
data class ClinicalSource(
    val id: String,
    val tag: String,
    val name: String,
    val publisher: String,
    val year: String,
    val version: String? = null,
    val url: String? = null,
    val tier: Int,
    val scope: List<String> = emptyList(),
    val verification: String,
    val accessNote: String? = null,
)

@Serializable
data class AbsoluteMax(
    val value: Double,
    val unit: String,
    val scope: String? = null,
)

@Serializable
data class WeightBandKg(
    val min: Double? = null,
    val max: Double? = null,
    val maxExclusive: Double? = null,
)

@Serializable
data class AgeBracket(
    val minYears: Double? = null,
    val maxYears: Double? = null,
    val label: String,
)

@Serializable
data class MinimumFloor(
    val value: Double,
    val unit: String,
)

@Serializable
data class MedicationDose(
    val id: String,
    val indication: String,
    val min: Double? = null,
    val max: Double? = null,
    val default: Double? = null,
    val unit: String,
    val preferredConcentrationMgPerMl: Double? = null,
    val scalar: String? = null,
    val scalarBasis: String? = null,
    val absoluteMax: AbsoluteMax? = null,
    val weightBandKg: WeightBandKg? = null,
    val notes: List<String> = emptyList(),
    val sourceIds: List<String> = emptyList(),
    val population: String? = null,
    val ageBracket: AgeBracket? = null,
    val minimumFloor: MinimumFloor? = null,
    val cappedAtAdultMax: Boolean? = null,
)

@Serializable
data class MedicationConcentration(
    val label: String,
    val mgPerMl: Double,
    val sourceId: String,
    val requiresDilution: Boolean? = null,
    val isPediatricDefault: Boolean? = null,
    val pediatricInstructions: String? = null,
)

@Serializable
data class CompanionDrug(
    val name: String,
    val ratioMgPerMg: Double,
    val concentrationMgPerMl: Double,
    val sourceId: String,
)

@Serializable
data class Medication(
    val id: String,
    val name: String,
    @SerialName("class") val drugClass: String,
    val category: String,
    val doses: List<MedicationDose>,
    val concentrations: List<MedicationConcentration>,
    val preparation: List<String> = emptyList(),
    val cautions: List<String> = emptyList(),
    val companion: CompanionDrug? = null,
    val sourceIds: List<String> = emptyList(),
)

@Serializable
data class CategoryPlaceholder(
    val category: String,
    val topic: String,
)

@Serializable
data class LocalAnestheticLimitRecord(
    val mgPerKg: Double? = null,
    val absoluteMaxMg: Double? = null,
    val sourceIds: List<String> = emptyList(),
    val note: String? = null,
)

@Serializable
data class LocalAnestheticAlternate(
    val label: String,
    val absoluteMaxMg: Double? = null,
    val mgPerKg: Double? = null,
    val sourceId: String,
)

@Serializable
data class LocalAnesthetic(
    val id: String,
    val name: String,
    val plain: LocalAnestheticLimitRecord? = null,
    val withEpinephrine: LocalAnestheticLimitRecord? = null,
    val alternates: List<LocalAnestheticAlternate> = emptyList(),
    val concentrationsPercent: List<Double> = emptyList(),
    val cautions: List<String> = emptyList(),
    val sourceIds: List<String> = emptyList(),
    val pedsPlainMaxMgPerKg: Double? = null,
)

@Serializable
data class Situation(
    val id: String,
    val label: String,
    val drugIds: List<String>,
)

@Serializable
data class NeuraxialRegimen(
    val id: String,
    val agent: String,
    val route: String,
    val concLabel: String,
    val concPercent: List<Double>,
    val volumeMl: List<Double>,
    val totalDoseMg: List<Double>,
    val baricity: String? = null,
    val glucosePercent: Double? = null,
    val onsetMin: List<Double>? = null,
    val durationMin: List<Double>? = null,
    val discrepancy: String? = null,
    val sourceIds: List<String> = emptyList(),
)

@Serializable
data class MaxAbsoluteRef(
    val value: Double,
    val unit: String,
)

@Serializable
data class ReferenceDoseLine(
    val population: String,
    val route: String? = null,
    val min: Double,
    val max: Double? = null,
    val unit: String,
    val scalar: String? = null,
    val maxAbsolute: MaxAbsoluteRef? = null,
    val note: String? = null,
)

@Serializable
data class ReferenceInfusionLine(
    val indication: String,
    val rateMin: Double,
    val rateMax: Double? = null,
    val unit: String,
    val loadingDose: String? = null,
    val standardDilution: String? = null,
    val suggested60kgRate: String? = null,
    val notes: String? = null,
    val discrepancy: String? = null,
)

@Serializable
data class ReferenceDrug(
    val id: String,
    val name: String,
    val group: String,
    val supplementTo: String? = null,
    val scalar: String? = null,
    val concentrationsMgPerMl: List<Double> = emptyList(),
    val doses: List<ReferenceDoseLine> = emptyList(),
    val infusions: List<ReferenceInfusionLine> = emptyList(),
    val tivaTargets: Map<String, String> = emptyMap(),
    val onsetSeconds: List<Double>? = null,
    val durationMinutes: List<Double>? = null,
    val cautions: List<String> = emptyList(),
    val sideEffects: List<String> = emptyList(),
    val discrepancy: String? = null,
    val sourceIds: List<String> = emptyList(),
)

@Serializable
data class PedsEttFormula(
    val id: String,
    val label: String,
    val constant: Double,
    val cuffed: Boolean,
    val sourceId: String,
)

@Serializable
data class LmaSizeBand(
    val size: String,
    val fromKg: Double? = null,
    val toKg: Double? = null,
    val maxCuffVolumeMl: Int,
)

@Serializable
data class BladeBand(
    val label: String,
    val fromMonths: Double,
    val toMonths: Double,
    val blade: String,
)

@Serializable
data class AdultAirwayRule(
    val sex: String,
    val idRangeMm: String,
    val frenchRange: String,
    val oralDepthRangeCm: String,
    val blade: String,
    val sourceIds: List<String> = emptyList(),
)

@Serializable
data class DltBand(
    val minHeightCm: Double? = null,
    val maxHeightCm: Double? = null,
    val sizeFr: String,
    val category: String,
    val sourceIds: List<String> = emptyList(),
)

@Serializable
data class ReferenceItem(
    val title: String,
    val points: List<String>,
    val sourceIds: List<String> = emptyList(),
)

@Serializable
data class PrincipleItem(
    val text: String,
    val sourceIds: List<String> = emptyList(),
)

@Serializable
data class AirwayData(
    val pedsEttAgeMin: Double,
    val pedsEttAgeMax: Double,
    val pedsEttDepthFactor: Double,
    val pedsEttFormulas: List<PedsEttFormula>,
    val lmaBands: List<LmaSizeBand>,
    val lmaMaxCuffPressureCmH2O: Int,
    val pedsBlades: List<BladeBand>,
    val adultRules: List<AdultAirwayRule>,
    val dltBands: List<DltBand>,
    val dltSafetyFloorMinHeightCm: Double,
    val dltSafetyFloorMinAgeYears: Double,
    val equipmentReference: List<ReferenceItem>,
    val unsourced: List<String>,
    val principles: List<PrincipleItem>,
)

@Serializable
data class TidalVolumeTarget(
    val target: Double,
    val min: Double,
    val max: Double,
    val targetIsAssumed: Boolean? = null,
)

@Serializable
data class VentilationScenario(
    val id: String,
    val name: String,
    val tidalVolumeMlPerKgPbw: TidalVolumeTarget? = null,
    val plateauPressureLimit: Double? = null,
    val cautions: List<String> = emptyList(),
    val unsourced: List<String> = emptyList(),
    val sourceIds: List<String> = emptyList(),
)

@Serializable
data class VentilationData(
    val scenarios: List<VentilationScenario>,
    val modes: List<ReferenceItem>,
    val advancedReference: List<ReferenceItem>,
    val alarms: List<ReferenceItem>,
    val troubleshooting: List<ReferenceItem>,
)

@Serializable
data class EmergencyStep(
    val id: String,
    val text: String,
    val critical: Boolean? = null,
    val note: String? = null,
    val sourceIds: List<String> = emptyList(),
)

@Serializable
data class CicoPlan(
    val id: String,
    val title: String,
    val steps: List<EmergencyStep>,
    val failureCriteria: List<String> = emptyList(),
)

@Serializable
data class EmergencyData(
    val lastSteps: List<EmergencyStep>,
    val mhSteps: List<EmergencyStep>,
    val cicoPlans: List<CicoPlan>,
)

@Serializable
data class ChecklistItemRecord(
    val id: String,
    val text: String,
    val sourceIds: List<String> = emptyList(),
)

@Serializable
data class ChecklistRecord(
    val id: String,
    val title: String,
    val group: String,
    val note: String? = null,
    val items: List<ChecklistItemRecord>,
)

@Serializable
data class HandoffOptions(
    val asaStatus: List<String>,
    val airway: List<String>,
    val maintenance: List<String>,
    val procedureCategories: List<String>,
)

@Serializable
data class RiskScoreItem(
    val id: String,
    val label: String,
    val derive: String? = null,
)

@Serializable
data class RiskBand(
    val min: Int,
    val label: String,
    val detail: String? = null,
)

@Serializable
data class RiskScore(
    val id: String,
    val name: String,
    val items: List<RiskScoreItem>,
    val bands: List<RiskBand>,
    val note: String? = null,
    val adultOnly: Boolean? = null,
    val why: String? = null,
    val sourceIds: List<String> = emptyList(),
)

@Serializable
data class ChoiceOption(
    val label: String,
    val points: Int,
)

@Serializable
data class ChoiceItem(
    val id: String,
    val label: String,
    val prompt: String? = null,
    val options: List<ChoiceOption>,
)

@Serializable
data class ChoiceScore(
    val id: String,
    val name: String,
    val items: List<ChoiceItem>,
    val bands: List<RiskBand>,
    val note: String? = null,
    val why: String? = null,
    val sourceIds: List<String> = emptyList(),
)

@Serializable
data class PonvAdultsPlan(
    val headline: String,
    val riskReduction: List<String>,
    val doseNote: String,
)

@Serializable
data class PonvPlan(
    val sourceIds: List<String>,
    val adults: PonvAdultsPlan,
    val children: String,
)

@Serializable
data class PlanCardLinks(
    val ventScenarioId: String? = null,
    val airway: Boolean? = null,
    val dosing: Boolean? = null,
    val lists: Boolean? = null,
    val references: Boolean? = null,
)

@Serializable
data class PlanCard(
    val id: String,
    val title: String,
    val population: String,
    val why: String,
    val phases: Map<String, List<String>>,
    val links: PlanCardLinks,
)

@Serializable
data class PeriopTiming(
    @SerialName("when") val whenText: String? = null,
    val text: String,
    val crclMin: Double? = null,
    val crclBelow: Double? = null,
)

@Serializable
data class PeriopDrug(
    val id: String,
    val name: String,
    val timings: List<PeriopTiming> = emptyList(),
    val catheter: List<String> = emptyList(),
    val restart: String? = null,
    val sourceId: String,
)

@Serializable
data class PeriopMedRule(
    val id: String,
    val drugClass: String,
    val section: String,
    val action: String,
    val summary: String,
    val why: String? = null,
    val cautions: List<String> = emptyList(),
    val drugs: List<PeriopDrug> = emptyList(),
    val sourceIds: List<String> = emptyList(),
)

@Serializable
data class Glp1ProtocolReference(
    val id: String,
    val label: String,
    val year: String,
    val sourceId: String,
    val drugRule: String,
    val fastingRule: String,
    val distinction: String,
)

@Serializable
data class ConditionPlan(
    val preop: List<String> = emptyList(),
    val intraop: List<String> = emptyList(),
    val avoid: List<String> = emptyList(),
    val postop: List<String> = emptyList(),
)

@Serializable
data class ConditionRecord(
    val id: String,
    val name: String,
    val aliases: List<String> = emptyList(),
    val chapter: Int? = null,
    val category: String? = null,
    val plan: ConditionPlan? = null,
    val crisis: String? = null,
    val checklistId: String? = null,
    val sourceIds: List<String> = emptyList(),
)

const val NO_SOURCE_VALUE = "No high-quality source value specified"

