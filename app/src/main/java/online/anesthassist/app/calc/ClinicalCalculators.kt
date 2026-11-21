package online.anesthassist.app.calc

import online.anesthassist.app.data.AbsoluteMax
import online.anesthassist.app.data.AdultAirwayRule
import online.anesthassist.app.data.AirwayData
import online.anesthassist.app.data.BladeBand
import online.anesthassist.app.data.ChoiceScore
import online.anesthassist.app.data.ClinicalSource
import online.anesthassist.app.data.ConditionRecord
import online.anesthassist.app.data.CreatinineUnit
import online.anesthassist.app.data.LmaSizeBand
import online.anesthassist.app.data.LocalAnestheticLimitRecord
import online.anesthassist.app.data.MedicationDose
import online.anesthassist.app.data.PeriopDrug
import online.anesthassist.app.data.PeriopMedRule
import online.anesthassist.app.data.PeriopTiming
import online.anesthassist.app.data.RiskBand
import online.anesthassist.app.data.RiskScore
import online.anesthassist.app.data.RiskScoreItem
import java.text.Normalizer
import java.util.Locale
import kotlin.math.ceil
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.round

enum class Sex(val key: String, val label: String, val shortLabel: String) {
    MALE("male", "Male", "M"),
    FEMALE("female", "Female", "F"),
}

const val MIN_HEIGHT_CM = 30.0
const val MAX_HEIGHT_CM = 250.0
const val MAX_WEIGHT_KG = 500.0
const val DEVINE_BASELINE_HEIGHT_CM = 152.4
const val UMOL_PER_MGDL = 88.42
const val PLATEAU_LIMIT_CMH2O = 30.0
const val CAUTION_TOXICITY_FRACTION = 0.7
const val LIPID_WEIGHT_THRESHOLD_KG = 70.0
const val LIPID_MAX_CUMULATIVE_ML_PER_KG = 12.0
const val DANTROLENE_INITIAL_MG_PER_KG = 2.5
const val DANTROLENE_CUMULATIVE_CAUTION_MG_PER_KG = 10.0
const val MIN_CG_AGE = 18.0

data class Biometrics(
    val tbw: Double,
    val bmi: Double,
    val pbw: Double,
    val ibw: Double,
    val abw40: Double,
    val lbw: Double,
)

sealed interface BiometricResult {
    data class Ok(val value: Biometrics) : BiometricResult
    data class Err(val error: String) : BiometricResult
}

fun isDevineBaselineMet(heightCm: Double): Boolean = heightCm >= DEVINE_BASELINE_HEIGHT_CM

fun calculateBmi(weightKg: Double, heightCm: Double): Double =
    weightKg / (heightCm / 100.0).pow(2)

fun calculateDevineIbw(sex: Sex, heightCm: Double): Double {
    val base = if (sex == Sex.MALE) 50.0 else 45.5
    return base + 0.905 * max(0.0, heightCm - DEVINE_BASELINE_HEIGHT_CM)
}

fun calculateAbw40(tbwKg: Double, ibwKg: Double): Double =
    if (tbwKg > ibwKg) ibwKg + 0.4 * (tbwKg - ibwKg) else tbwKg

fun calculateJanmahasatianLbw(sex: Sex, tbwKg: Double, bmi: Double): Double {
    val raw = if (sex == Sex.MALE) {
        (9270.0 * tbwKg) / (6680.0 + 216.0 * bmi)
    } else {
        (9270.0 * tbwKg) / (8780.0 + 244.0 * bmi)
    }
    return min(raw, tbwKg)
}

fun computePatientBiometrics(tbwKg: Double?, heightCm: Double?, sex: Sex?): BiometricResult {
    if (tbwKg == null || heightCm == null || sex == null) {
        val missing = buildList {
            if (tbwKg == null) add("actual weight")
            if (heightCm == null) add("height")
            if (sex == null) add("biological sex")
        }
        val joined = if (missing.size <= 1) missing.joinToString("") else
            missing.dropLast(1).joinToString(", ") + " and " + missing.last()
        return BiometricResult.Err("Enter $joined.")
    }
    if (!tbwKg.isFinite() || tbwKg <= 0.0) return BiometricResult.Err("Weight must be greater than 0 kg.")
    if (tbwKg > MAX_WEIGHT_KG) return BiometricResult.Err("Weight must be ${MAX_WEIGHT_KG.toInt()} kg or less.")
    if (!heightCm.isFinite() || heightCm <= 0.0) return BiometricResult.Err("Height must be greater than 0 cm.")
    if (heightCm < MIN_HEIGHT_CM || heightCm > MAX_HEIGHT_CM) {
        return BiometricResult.Err("Height must be between ${MIN_HEIGHT_CM.toInt()} and ${MAX_HEIGHT_CM.toInt()} cm.")
    }
    val bmi = calculateBmi(tbwKg, heightCm)
    val pbw = calculateDevineIbw(sex, heightCm)
    val ibw = min(tbwKg, pbw)
    return BiometricResult.Ok(
        Biometrics(
            tbw = tbwKg,
            bmi = bmi,
            pbw = pbw,
            ibw = ibw,
            abw40 = calculateAbw40(tbwKg, ibw),
            lbw = calculateJanmahasatianLbw(sex, tbwKg, bmi),
        )
    )
}

// ---- Formatting helpers ----

fun formatKg(v: Double): String = String.format(Locale.US, "%.1f", v)

fun formatNumber(v: Double, decimals: Int = 1): String {
    if (!v.isFinite()) return "--"
    val formatted = String.format(Locale.US, "%.${decimals}f", v)
    return if (decimals > 0) formatted.trimEnd('0').trimEnd('.') else formatted
}

fun formatDoseMass(value: Double, unit: String): String {
    val dec = when {
        value < 1.0 -> 2
        value < 10.0 -> 2
        value < 100.0 -> 1
        else -> 0
    }
    return "${formatNumber(value, dec)} $unit"
}

fun formatVolumeMl(ml: Double): String {
    val dec = when {
        ml < 1.0 -> 2
        ml < 10.0 -> 2
        ml < 100.0 -> 1
        else -> 0
    }
    return "${formatNumber(ml, dec)} mL"
}

fun creatinineFromUmol(umolL: Double, unit: CreatinineUnit): Double =
    if (unit == CreatinineUnit.MGDL) umolL / UMOL_PER_MGDL else umolL

fun creatinineToUmol(value: Double, unit: CreatinineUnit): Double =
    if (unit == CreatinineUnit.MGDL) value * UMOL_PER_MGDL else value

// ---- Medication dosing ----

enum class MaxDoseStatus { OK, AT_LIMIT, EXCEEDS }

data class DoseComputation(
    val isInfusion: Boolean,
    val doseValue: Double,
    val unit: String,
    val scalar: String?,
    val scalarKg: Double?,
    val mass: Double = 0.0,
    val massUnit: String = "mg",
    val massMg: Double = 0.0,
    val volumeMl: Double = 0.0,
    val mcgPerMin: Double = 0.0,
    val mlPerHr: Double = 0.0,
    val maxStatus: MaxDoseStatus = MaxDoseStatus.OK,
    val percentOfMax: Double? = null,
    val absoluteMax: AbsoluteMax? = null,
    val isCapped: Boolean = false,
    val cappedMessage: String? = null,
    val isFloorEnforced: Boolean = false,
    val floorMessage: String? = null,
    val companionName: String? = null,
    val companionMassMg: Double? = null,
    val companionVolumeMl: Double? = null,
)

private val PER_KG_UNITS = setOf("mg/kg", "mcg/kg", "mcg/kg/min")

fun isWeightBased(dose: MedicationDose): Boolean = dose.unit in PER_KG_UNITS

fun scalarWeightKg(b: Biometrics, scalar: String): Double = when (scalar) {
    "IBW" -> b.ibw
    "LBW" -> b.lbw
    "ABW40" -> b.abw40
    else -> b.tbw
}

fun doseAppliesToWeight(dose: MedicationDose, tbwKg: Double): Boolean {
    val band = dose.weightBandKg ?: return true
    if (band.min != null && tbwKg < band.min) return false
    if (band.max != null && tbwKg > band.max) return false
    if (band.maxExclusive != null && tbwKg >= band.maxExclusive) return false
    return true
}

fun computeMedicationDose(
    dose: MedicationDose,
    doseValue: Double,
    concentrationMgPerMl: Double,
    biometrics: Biometrics?,
    tbwKg: Double,
    scalarOverride: String?,
    preferredScalar: String,
    companion: online.anesthassist.app.data.CompanionDrug?,
): DoseComputation {
    val isPed = dose.population == "pediatric"
    val weightBased = isWeightBased(dose)
    val effectiveScalar = if (!weightBased) {
        null
    } else if (isPed) {
        "TBW"
    } else {
        scalarOverride
            ?: if (dose.scalarBasis == "unspecified" && preferredScalar != "auto") preferredScalar
            else dose.scalar ?: "TBW"
    }
    val weight = when {
        isPed -> tbwKg
        effectiveScalar != null && biometrics != null -> scalarWeightKg(biometrics, effectiveScalar)
        else -> tbwKg
    }

    if (dose.unit == "mcg/kg/min" || dose.unit == "mcg/min") {
        val mcgPerMin = if (dose.unit == "mcg/kg/min") doseValue * weight else doseValue
        val mgPerHr = (mcgPerMin * 60.0) / 1000.0
        val mlPerHr = if (concentrationMgPerMl > 0) mgPerHr / concentrationMgPerMl else 0.0
        val maxAbs = dose.absoluteMax
        val maxStatus = if (maxAbs?.unit == "mcg/min") {
            when {
                mcgPerMin > maxAbs.value -> MaxDoseStatus.EXCEEDS
                mcgPerMin == maxAbs.value -> MaxDoseStatus.AT_LIMIT
                else -> MaxDoseStatus.OK
            }
        } else MaxDoseStatus.OK
        val pct = if (maxAbs?.unit == "mcg/min" && maxAbs.value > 0) (mcgPerMin / maxAbs.value) * 100.0 else null
        return DoseComputation(
            isInfusion = true,
            doseValue = doseValue,
            unit = dose.unit,
            scalar = effectiveScalar,
            scalarKg = if (weightBased) weight else null,
            mcgPerMin = mcgPerMin,
            mlPerHr = mlPerHr,
            maxStatus = maxStatus,
            percentOfMax = pct,
            absoluteMax = maxAbs,
        )
    }

    val isMcg = dose.unit == "mcg/kg" || dose.unit == "mcg"
    val massUnit = if (isMcg) "mcg" else "mg"
    val rawMass = if (weightBased) doseValue * weight else doseValue
    var finalMass = rawMass
    var isCapped = false
    var cappedMsg: String? = null
    var isFloor = false
    var floorMsg: String? = null

    if (isPed && dose.absoluteMax != null && dose.absoluteMax.unit != "mL" && dose.absoluteMax.unit != "mcg/min") {
        val maxInDoseUnit = when {
            dose.absoluteMax.unit == "mg" && isMcg -> dose.absoluteMax.value * 1000.0
            dose.absoluteMax.unit == "mcg" && !isMcg -> dose.absoluteMax.value / 1000.0
            else -> dose.absoluteMax.value
        }
        if (rawMass > maxInDoseUnit) {
            finalMass = maxInDoseUnit
            isCapped = true
            cappedMsg = "Capped at adult max (${formatNumber(dose.absoluteMax.value)} ${dose.absoluteMax.unit})"
        }
    }

    if (dose.minimumFloor != null) {
        val floorInDoseUnit = when {
            dose.minimumFloor.unit == "mg" && isMcg -> dose.minimumFloor.value * 1000.0
            dose.minimumFloor.unit == "mcg" && !isMcg -> dose.minimumFloor.value / 1000.0
            else -> dose.minimumFloor.value
        }
        if (finalMass < floorInDoseUnit) {
            finalMass = floorInDoseUnit
            isFloor = true
            floorMsg = "Minimum floor applied (${formatNumber(dose.minimumFloor.value)} ${dose.minimumFloor.unit})"
        }
    }

    val massMg = if (isMcg) finalMass / 1000.0 else finalMass
    val volumeMl = if (concentrationMgPerMl > 0) massMg / concentrationMgPerMl else 0.0

    var maxStatus = MaxDoseStatus.OK
    var pctOfMax: Double? = null
    val absMax = dose.absoluteMax
    if (absMax != null && absMax.unit != "mcg/min") {
        val rawMg = if (isMcg) rawMass / 1000.0 else rawMass
        val rawVol = if (concentrationMgPerMl > 0) rawMg / concentrationMgPerMl else 0.0
        val actual = when (absMax.unit) {
            "mL" -> rawVol
            "mcg" -> rawMg * 1000.0
            else -> rawMg
        }
        maxStatus = when {
            actual > absMax.value -> MaxDoseStatus.EXCEEDS
            actual == absMax.value -> MaxDoseStatus.AT_LIMIT
            else -> MaxDoseStatus.OK
        }
        if (absMax.value > 0) pctOfMax = (actual / absMax.value) * 100.0
    }

    val compMass = companion?.let { massMg * it.ratioMgPerMg }
    val compVol = if (companion != null && compMass != null && companion.concentrationMgPerMl > 0) {
        compMass / companion.concentrationMgPerMl
    } else null

    return DoseComputation(
        isInfusion = false,
        doseValue = doseValue,
        unit = dose.unit,
        scalar = effectiveScalar,
        scalarKg = if (weightBased) weight else null,
        mass = finalMass,
        massUnit = massUnit,
        massMg = massMg,
        volumeMl = volumeMl,
        maxStatus = maxStatus,
        percentOfMax = pctOfMax,
        absoluteMax = absMax,
        isCapped = isCapped,
        cappedMessage = cappedMsg,
        isFloorEnforced = isFloor,
        floorMessage = floorMsg,
        companionName = companion?.name,
        companionMassMg = compMass,
        companionVolumeMl = compVol,
    )
}

// ---- Local Anesthetic Toxicity ----

enum class ToxicityStatus { SAFE, CAUTION, TOXIC }

fun localAnestheticDoseMg(volumeMl: Double, percent: Double): Double = volumeMl * percent * 10.0

fun maxAllowedLocalMg(limit: LocalAnestheticLimitRecord?, weightKg: Double): Double? {
    if (limit == null) return null
    val candidates = listOfNotNull(
        limit.mgPerKg?.let { it * weightKg },
        limit.absoluteMaxMg,
    )
    return candidates.minOrNull()
}

data class ToxicityResult(
    val fractions: List<Double>,
    val total: Double,
    val status: ToxicityStatus,
)

fun combinedToxicityFraction(pairs: List<Pair<Double, Double>>): ToxicityResult {
    val fracs = pairs.map { (doseMg, maxMg) -> if (maxMg > 0) doseMg / maxMg else 0.0 }
    val total = fracs.sum()
    val status = when {
        total >= 1.0 -> ToxicityStatus.TOXIC
        total >= CAUTION_TOXICITY_FRACTION -> ToxicityStatus.CAUTION
        else -> ToxicityStatus.SAFE
    }
    return ToxicityResult(fracs, total, status)
}

// ---- Airway ----

data class PedsEttResult(
    val formulaId: String,
    val idMm: Double,
    val idRoundedMm: Double,
    val depthCm: Double,
)

fun roundToHalf(n: Double): Double = round(n * 2.0) / 2.0

fun pedsEtt(airway: AirwayData, ageYears: Double, formulaId: String): PedsEttResult? {
    val formula = airway.pedsEttFormulas.find { it.id == formulaId } ?: return null
    if (!ageYears.isFinite() || ageYears < airway.pedsEttAgeMin || ageYears > airway.pedsEttAgeMax) return null
    val idMm = ageYears / 4.0 + formula.constant
    val rounded = roundToHalf(idMm)
    return PedsEttResult(
        formulaId = formulaId,
        idMm = idMm,
        idRoundedMm = rounded,
        depthCm = airway.pedsEttDepthFactor * rounded,
    )
}

data class LmaResult(val band: LmaSizeBand, val borderlineNext: LmaSizeBand?)

fun lmaSizeForWeight(airway: AirwayData, weightKg: Double): LmaResult? {
    if (!weightKg.isFinite() || weightKg <= 0.0) return null
    val idx = airway.lmaBands.indexOfFirst { b ->
        (b.fromKg == null || weightKg > b.fromKg) && (b.toKg == null || weightKg <= b.toKg)
    }
    if (idx < 0) return null
    val band = airway.lmaBands[idx]
    val next = airway.lmaBands.getOrNull(idx + 1)
    val onBoundary = band.toKg != null && weightKg == band.toKg && next != null
    return LmaResult(band, if (onBoundary) next else null)
}

fun pedsBladeForAge(airway: AirwayData, ageMonths: Double): BladeBand? {
    if (!ageMonths.isFinite() || ageMonths < 0.0) return null
    return airway.pedsBlades.find { ageMonths >= it.fromMonths && ageMonths < it.toMonths }
}

fun adultEttAndBlade(airway: AirwayData, sex: Sex?): AdultAirwayRule? =
    if (sex == null) null else airway.adultRules.find { it.sex == sex.key }

sealed interface DltResult {
    data class Ok(val sizeFr: String, val category: String, val sourceIds: List<String>) : DltResult
    data class Err(val reason: String) : DltResult
}

fun dltSizeForHeight(airway: AirwayData, heightCm: Double?, ageYears: Double?): DltResult {
    if (heightCm == null || !heightCm.isFinite() || heightCm <= 0.0) {
        return DltResult.Err("Enter patient height to determine double-lumen tube size.")
    }
    if (ageYears == null || !ageYears.isFinite()) {
        return DltResult.Err("Enter patient age before selecting an adult double-lumen tube size.")
    }
    if (ageYears < airway.dltSafetyFloorMinAgeYears) {
        return DltResult.Err("App safety rule (no source, needs clinician review): no adult double-lumen tube size is shown for age < ${airway.dltSafetyFloorMinAgeYears.toInt()} years. Consider a bronchial blocker.")
    }
    if (heightCm < airway.dltSafetyFloorMinHeightCm) {
        return DltResult.Err("App safety rule (no source, needs clinician review): no double-lumen tube size is shown for height < ${airway.dltSafetyFloorMinHeightCm.toInt()} cm. Consider a bronchial blocker.")
    }
    val band = airway.dltBands.find { b ->
        when {
            b.minHeightCm == null && b.maxHeightCm != null -> heightCm < b.maxHeightCm
            b.minHeightCm != null && b.maxHeightCm != null -> heightCm >= b.minHeightCm && heightCm <= b.maxHeightCm
            b.minHeightCm != null && b.maxHeightCm == null -> heightCm > b.minHeightCm
            else -> false
        }
    } ?: return DltResult.Err("No DLT size found for this height.")
    return DltResult.Ok(band.sizeFr, band.category, band.sourceIds)
}

// ---- Ventilation ----

enum class VentSeverity { OK, AMBER, RED }

fun tidalVolumeMl(pbwKg: Double, mlPerKgPbw: Double): Double = pbwKg * mlPerKgPbw
fun minuteVentilationLMin(vtMl: Double, rr: Double): Double = (vtMl * rr) / 1000.0
fun drivingPressure(plateau: Double, peep: Double): Double = plateau - peep

fun tidalVolumeSeverity(mlPerKgPbw: Double, min: Double, max: Double): VentSeverity = when {
    mlPerKgPbw > max || mlPerKgPbw < min -> VentSeverity.RED
    mlPerKgPbw == max || mlPerKgPbw == min -> VentSeverity.AMBER
    else -> VentSeverity.OK
}

fun plateauSeverity(plateau: Double, limit: Double = PLATEAU_LIMIT_CMH2O, amberMargin: Double = 2.0): VentSeverity = when {
    plateau > limit -> VentSeverity.RED
    plateau >= limit - amberMargin -> VentSeverity.AMBER
    else -> VentSeverity.OK
}

// ---- Emergencies: LAST & MH ----

data class LipidPlan(
    val under70: Boolean,
    val bolusMl: Double,
    val infusionMlPerMin: Double? = null,
    val infusionMlPerHr: Double? = null,
    val doubledInfusionMlPerMin: Double? = null,
    val infusionTotalMl: Double? = null,
    val maxCumulativeMl: Double,
)

fun calculateLipidPlan(weightKg: Double): LipidPlan {
    val maxCumulative = LIPID_MAX_CUMULATIVE_ML_PER_KG * weightKg
    return if (weightKg < LIPID_WEIGHT_THRESHOLD_KG) {
        val rateMin = 0.25 * weightKg
        LipidPlan(
            under70 = true,
            bolusMl = 1.5 * weightKg,
            infusionMlPerMin = rateMin,
            infusionMlPerHr = rateMin * 60.0,
            doubledInfusionMlPerMin = rateMin * 2.0,
            maxCumulativeMl = maxCumulative,
        )
    } else {
        LipidPlan(
            under70 = false,
            bolusMl = 100.0,
            infusionTotalMl = 250.0,
            maxCumulativeMl = maxCumulative,
        )
    }
}

data class DantroleneVialPlan(
    val label: String,
    val mgPerVial: Int,
    val diluentMlPerVial: Int,
    val vials: Int,
    val diluentMl: Int,
)

fun dantroleneVialPlans(doseMg: Double): List<DantroleneVialPlan> {
    val dantriumVials = ceil(doseMg / 20.0).toInt().coerceAtLeast(1)
    val ryanodexVials = ceil(doseMg / 250.0).toInt().coerceAtLeast(1)
    return listOf(
        DantroleneVialPlan("Dantrium / Revonto (20 mg)", 20, 60, dantriumVials, dantriumVials * 60),
        DantroleneVialPlan("Ryanodex (250 mg)", 250, 5, ryanodexVials, ryanodexVials * 5),
    )
}

// ---- CrCl & Risk / Choice Scores ----

sealed interface CrclResult {
    data class Ok(val mlPerMin: Double) : CrclResult
    data class Incomplete(val missing: List<String>) : CrclResult
}

fun calculateCrcl(ageYears: Double?, tbwKg: Double?, sex: Sex?, creatinineUmolL: Double?): CrclResult {
    val missing = buildList {
        if (ageYears == null) add("age")
        else if (ageYears < MIN_CG_AGE) add("age ${MIN_CG_AGE.toInt()} or over")
        if (tbwKg == null) add("actual weight")
        if (sex == null) add("biological sex")
        if (creatinineUmolL == null || creatinineUmolL <= 0.0) add("serum creatinine")
    }
    if (missing.isNotEmpty() || ageYears == null || tbwKg == null || sex == null || creatinineUmolL == null) {
        return CrclResult.Incomplete(missing)
    }
    val mgDl = creatinineFromUmol(creatinineUmolL, CreatinineUnit.MGDL)
    val mlPerMin = (((140.0 - ageYears) * tbwKg) / (72.0 * mgDl)) * (if (sex == Sex.FEMALE) 0.85 else 1.0)
    return CrclResult.Ok(mlPerMin)
}

data class ScoreContext(
    val ageYears: Double?,
    val sex: Sex?,
    val bmi: Double?,
    val creatinineUmolL: Double?,
)

sealed interface RiskScoreResult {
    data class Ok(val points: Int, val max: Int, val band: RiskBand) : RiskScoreResult
    data class Incomplete(val missing: List<String>) : RiskScoreResult
    data class NotApplicable(val reason: String) : RiskScoreResult
}

fun derivedValue(deriveKey: String, ctx: ScoreContext): Pair<String, Boolean?> = when (deriveKey) {
    "age>50" -> "age" to ctx.ageYears?.let { it > 50.0 }
    "male" -> "biological sex" to ctx.sex?.let { it == Sex.MALE }
    "female" -> "biological sex" to ctx.sex?.let { it == Sex.FEMALE }
    "bmi>35" -> "weight and height (BMI)" to ctx.bmi?.let { it > 35.0 }
    "creatinine>2.0mgdl" -> "serum creatinine" to ctx.creatinineUmolL?.let { it > 2.0 * UMOL_PER_MGDL }
    else -> "" to null
}

fun riskItemChecked(item: RiskScoreItem, answers: Map<String, Boolean>, ctx: ScoreContext): Boolean {
    val d = item.derive
    return if (d != null) derivedValue(d, ctx).second == true else answers[item.id] == true
}

fun evaluateRiskScore(score: RiskScore, answers: Map<String, Boolean>, ctx: ScoreContext): RiskScoreResult {
    if (score.adultOnly == true) {
        if (ctx.ageYears == null) return RiskScoreResult.Incomplete(listOf("age"))
        if (ctx.ageYears < 18.0) return RiskScoreResult.NotApplicable("This score is for adults (age 18 or over).")
    }
    val missing = score.items.mapNotNull { item ->
        val d = item.derive ?: return@mapNotNull null
        val (needs, value) = derivedValue(d, ctx)
        if (value == null) needs else null
    }.distinct()
    if (missing.isNotEmpty()) return RiskScoreResult.Incomplete(missing)
    val points = score.items.count { riskItemChecked(it, answers, ctx) }
    val band = score.bands.asReversed().firstOrNull { points >= it.min } ?: score.bands.first()
    return RiskScoreResult.Ok(points, score.items.size, band)
}

sealed interface ChoiceScoreResult {
    data class Ok(val points: Int, val max: Int, val band: RiskBand) : ChoiceScoreResult
    data class Incomplete(val missing: List<String>) : ChoiceScoreResult
}

fun evaluateChoiceScore(score: ChoiceScore, answers: Map<String, Int>): ChoiceScoreResult {
    val unanswered = score.items.filter { item ->
        val idx = answers[item.id]
        idx == null || idx < 0 || idx >= item.options.size
    }
    if (unanswered.isNotEmpty()) return ChoiceScoreResult.Incomplete(unanswered.map { it.label })
    val points = score.items.sumOf { item -> item.options[answers[item.id]!!].points }
    val max = score.items.sumOf { item -> item.options.maxOf { it.points } }
    val band = score.bands.asReversed().firstOrNull { points >= it.min } ?: score.bands.first()
    return ChoiceScoreResult.Ok(points, max, band)
}

// ---- Periop Meds CrCl timing matcher ----

enum class TimingMatch { YES, NO, UNKNOWN, ALWAYS }

fun matchTiming(t: PeriopTiming, crclMl: Double?): TimingMatch {
    if (t.crclMin == null && t.crclBelow == null) return TimingMatch.ALWAYS
    if (crclMl == null) return TimingMatch.UNKNOWN
    val minOk = t.crclMin == null || crclMl >= t.crclMin
    val belowOk = t.crclBelow == null || crclMl < t.crclBelow
    return if (minOk && belowOk) TimingMatch.YES else TimingMatch.NO
}

// ---- Pre-op Note & Handoff Builders ----

fun buildPreopNote(
    ageYears: Double?,
    sex: Sex?,
    tbwKg: Double?,
    heightCm: Double?,
    creatinineUmolL: Double?,
    asaClass: String?,
    asaEmergency: Boolean,
    fastingStatus: String?,
    scoreAnswers: Map<String, Boolean>,
    medsTaken: Map<String, Boolean>,
    riskScores: List<RiskScore>,
    periopRules: List<PeriopMedRule>,
    sourceById: Map<String, ClinicalSource>,
    dataVersion: String,
): String {
    fun tags(ids: List<String>): String =
        "[${ids.map { sourceById[it]?.tag ?: it }.distinct().joinToString(", ")}]"

    val bmi = if (tbwKg != null && heightCm != null && heightCm > 0) calculateBmi(tbwKg, heightCm) else null
    val crcl = calculateCrcl(ageYears, tbwKg, sex, creatinineUmolL)
    val crclMl = (crcl as? CrclResult.Ok)?.mlPerMin
    val ctx = ScoreContext(ageYears, sex, bmi, creatinineUmolL)

    val lines = mutableListOf("--- PRE-OP ASSESSMENT NOTE (anonymous) ---")
    lines += listOf(
        "Age: ${ageYears?.let { "${formatNumber(it, 2)} y" } ?: "not entered"}",
        "Sex: ${sex?.key ?: "not entered"}",
        "Weight: ${tbwKg?.let { "${formatKg(it)} kg" } ?: "not entered"}",
        "Height: ${heightCm?.let { "${round(it).toInt()} cm" } ?: "not entered"}",
        "BMI: ${bmi?.let { "${formatNumber(it, 1)} kg/m²" } ?: "not entered"}",
    ).joinToString("; ")

    lines += if (creatinineUmolL == null || creatinineUmolL <= 0) {
        "Creatinine: not entered"
    } else {
        "Creatinine: ${formatNumber(creatinineFromUmol(creatinineUmolL, CreatinineUnit.MGDL), 1)} mg/dL (${round(creatinineUmolL).toInt()} µmol/L)"
    }

    lines += when (crcl) {
        is CrclResult.Ok -> "Creatinine clearance: ${round(crcl.mlPerMin).toInt()} mL/min (Cockcroft-Gault, actual body weight) ${tags(listOf("cockcroft-gault-1976", "app-generic"))}"
        is CrclResult.Incomplete -> "Creatinine clearance: incomplete (needs ${crcl.missing.joinToString(", ")})"
    }

    lines += if (asaClass == null) "ASA: not recorded" else "ASA: $asaClass${if (asaEmergency) "-E" else ""}"
    lines += "Fasting: ${fastingStatus ?: "not recorded"}"

    for (score in riskScores) {
        lines += when (val r = evaluateRiskScore(score, scoreAnswers, ctx)) {
            is RiskScoreResult.Ok -> "${score.name}: ${r.points} / ${r.max} (${r.band.label}) ${tags(score.sourceIds)}"
            is RiskScoreResult.Incomplete -> "${score.name}: incomplete (needs ${r.missing.joinToString(", ")})"
            is RiskScoreResult.NotApplicable -> "${score.name}: not applicable"
        }
    }

    val taken = periopRules.filter { medsTaken[it.id] == true }
    if (taken.isEmpty()) {
        lines += "Medications ticked in the app: none (this is not a medication history; the app covers only the classes in its Medications section)"
    } else {
        lines += "Medications ticked in the app:"
        for (rule in taken) {
            val actionLabel = rule.action.replaceFirstChar { it.uppercase() }
            lines += "- ${rule.drugClass}: $actionLabel. ${rule.summary} ${tags(rule.sourceIds)}"
            rule.cautions.forEach { lines += "  Caution: $it" }
            for (d in rule.drugs) {
                val timingText = d.timings.mapNotNull { t ->
                    val m = matchTiming(t, crclMl)
                    if (m == TimingMatch.NO) return@mapNotNull null
                    val note = when {
                        m == TimingMatch.UNKNOWN -> " (CrCl not available)"
                        m == TimingMatch.YES && crclMl != null -> " (this patient: CrCl ${formatNumber(crclMl, 1)} mL/min)"
                        else -> ""
                    }
                    "${t.whenText?.let { "$it: " } ?: ""}${t.text}$note"
                }.joinToString(" ")
                lines += "  ${d.name}: $timingText${d.restart?.let { " Restart: $it" } ?: ""} ${tags(listOf(d.sourceId))}"
                d.catheter.forEach { lines += "    Catheter / post-block: $it" }
            }
        }
    }
    lines += "App data version: $dataVersion"
    lines += "No patient identifiers included."
    return lines.joinToString("\n")
}

data class HandoffInput(
    val procedureCategory: String = "",
    val asaStatus: String = "",
    val airway: String = "",
    val inductionAgents: Set<String> = emptySet(),
    val maintenance: String = "",
    val opioids: Set<String> = emptySet(),
    val neuromuscularBlockade: Set<String> = emptySet(),
    val fluidsMl: String = "",
    val bloodLossMl: String = "",
    val ventMode: String = "",
    val ventTidalVolumeMl: String = "",
    val ventRespiratoryRate: String = "",
    val ventPeepCmH2O: String = "",
    val ventFio2Percent: String = "",
)

fun buildHandoffSummary(input: HandoffInput): String {
    fun num(label: String, raw: String, unit: String): String? {
        val v = raw.trim().toDoubleOrNull() ?: return null
        return "$label: ${formatNumber(v, 0)} $unit"
    }
    val vent = listOfNotNull(
        input.ventMode.trim().takeIf { it.isNotEmpty() },
        num("VT", input.ventTidalVolumeMl, "mL"),
        num("RR", input.ventRespiratoryRate, "breaths/min"),
        num("PEEP", input.ventPeepCmH2O, "cmH2O"),
        num("FiO2", input.ventFio2Percent, "%"),
    ).joinToString("; ")

    return listOfNotNull(
        "--- ANESTHESIA HANDOFF (anonymous) ---",
        input.procedureCategory.takeIf { it.isNotBlank() }?.let { "Procedure: $it" },
        input.asaStatus.takeIf { it.isNotBlank() }?.let { "ASA status: $it" },
        input.airway.takeIf { it.isNotBlank() }?.let { "Airway: $it" },
        input.inductionAgents.takeIf { it.isNotEmpty() }?.let { "Induction agents: ${it.joinToString(", ")}" },
        input.maintenance.takeIf { it.isNotBlank() }?.let { "Maintenance: $it" },
        input.opioids.takeIf { it.isNotEmpty() }?.let { "Opioids: ${it.joinToString(", ")}" },
        input.neuromuscularBlockade.takeIf { it.isNotEmpty() }?.let { "Neuromuscular blockade: ${it.joinToString(", ")}" },
        num("Fluids", input.fluidsMl, "mL"),
        num("Blood loss", input.bloodLossMl, "mL"),
        vent.takeIf { it.isNotBlank() }?.let { "Ventilation: $it" },
        "No patient identifiers included.",
    ).joinToString("\n")
}

// ---- Condition search (accent/hyphen insensitive) ----

private fun normalizeSearch(s: String): String =
    Normalizer.normalize(s, Normalizer.Form.NFD)
        .replace(Regex("\\p{InCombiningDiacriticalMarks}+"), "")
        .lowercase(Locale.US)
        .replace(Regex("[-/']"), " ")
        .replace(Regex("\\s+"), " ")
        .trim()

fun searchConditions(
    conditions: List<ConditionRecord>,
    chapters: Map<String, String>,
    query: String,
): List<ConditionRecord> {
    val q = normalizeSearch(query)
    if (q.isEmpty()) return conditions
    val tokens = q.split(" ").filter { it.isNotEmpty() }
    return conditions.filter { c ->
        val haystack = normalizeSearch(
            buildString {
                append(c.name).append(' ')
                c.aliases.forEach { append(it).append(' ') }
                append(chapters[c.chapter.toString()].orEmpty())
            }
        )
        tokens.all { haystack.contains(it) }
    }
}
