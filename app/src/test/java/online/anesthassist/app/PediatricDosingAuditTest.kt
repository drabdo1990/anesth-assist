package online.anesthassist.app

import kotlinx.serialization.json.Json
import online.anesthassist.app.calc.BiometricResult
import online.anesthassist.app.calc.Sex
import online.anesthassist.app.calc.computeMedicationDose
import online.anesthassist.app.calc.computePatientBiometrics
import online.anesthassist.app.data.ClinicalBundle
import online.anesthassist.app.data.Medication
import online.anesthassist.app.data.MedicationDose
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

/**
 * Port of upstream commit 388a860 (`e2e/pediatric.spec.ts`):
 * Verifies all 27 pediatric dose entries, adult single-dose caps, age-bracket auto-matching,
 * and pediatric default-concentration draw-up volumes against bundled `clinical_data.json`.
 */
class PediatricDosingAuditTest {

    private data class AuditRow(
        val name: String,
        val indication: String,
        val perKg: Double,
        val cap: Double?,
        val unit: String,
    )

    private val rows = listOf(
        AuditRow("midazolam IV", "Preoperative sedation IV (pediatric 6 mo – 12 yr)", 0.05, 2.0, "mg"),
        AuditRow("midazolam PO", "Preoperative sedation Oral (pediatric)", 0.5, 15.0, "mg"),
        AuditRow("atropine", "Pediatric vagolysis / bradycardia premedication IV", 15.0, 500.0, "mcg"),
        AuditRow("propofol infant", "Pediatric induction IV, infant (< 2 yr)", 3.0, 200.0, "mg"),
        AuditRow("propofol child", "Pediatric induction IV, child (2–12 yr)", 2.5, 200.0, "mg"),
        AuditRow("propofol adolescent", "Pediatric induction IV, adolescent (12–18 yr)", 2.0, 200.0, "mg"),
        AuditRow("etomidate", "Pediatric induction IV (≥ 2 yr)", 0.2, 20.0, "mg"),
        AuditRow("ketamine IV", "Pediatric induction IV", 1.5, 100.0, "mg"),
        AuditRow("ketamine IM", "Pediatric induction / sedation IM", 5.0, null, "mg"),
        AuditRow("fentanyl", "Pediatric analgesia / induction bolus IV", 1.0, 100.0, "mcg"),
        AuditRow("morphine", "Pediatric analgesia IV", 0.05, 4.0, "mg"),
        AuditRow("acetaminophen", "Pediatric analgesia / antipyresis IV", 15.0, 1000.0, "mg"),
        AuditRow("ketorolac", "Pediatric analgesia IV (≥ 2 yr)", 0.5, 15.0, "mg"),
        AuditRow("rocuronium routine", "Pediatric routine intubation IV", 0.6, 50.0, "mg"),
        AuditRow("rocuronium RSI", "Pediatric rapid sequence intubation (RSI) IV", 1.2, 100.0, "mg"),
        AuditRow("succinylcholine infant", "Infant intubation IV (< 1 yr)", 2.0, 150.0, "mg"),
        AuditRow("succinylcholine child", "Child intubation IV (1–12 yr)", 1.0, 150.0, "mg"),
        AuditRow("succinylcholine IM", "Emergency IM intubation (no IV / CICO)", 3.0, 150.0, "mg"),
        AuditRow("sugammadex moderate", "Pediatric moderate block reversal (reappearance of T2, ≥ 2 yr)", 2.0, null, "mg"),
        AuditRow("sugammadex deep", "Pediatric deep block reversal (1–2 post-tetanic counts, ≥ 2 yr)", 4.0, null, "mg"),
        AuditRow("neostigmine", "Pediatric reversal of neuromuscular blockade IV", 0.05, 5.0, "mg"),
        AuditRow("glycopyrrolate reversal", "Pediatric reversal companion IV (with neostigmine)", 5.0, 200.0, "mcg"),
        AuditRow("phenylephrine", "Pediatric hypotension bolus IV", 2.0, 100.0, "mcg"),
        AuditRow("epinephrine arrest", "PALS IV/IO (cardiac arrest / symptomatic bradycardia)", 10.0, 1000.0, "mcg"),
        AuditRow("epinephrine anaphylaxis IM", "Pediatric anaphylaxis IM (anterolateral thigh)", 10.0, 500.0, "mcg"),
        AuditRow("ondansetron", "Pediatric PONV prophylaxis IV (over 2–5 min)", 0.1, 4.0, "mg"),
        AuditRow("dexamethasone", "Pediatric PONV prophylaxis IV (after induction)", 0.15, 8.0, "mg"),
    )

    private val bundle: ClinicalBundle by lazy {
        val candidates = listOf(
            File("src/main/assets/clinical_data.json"),
            File("app/src/main/assets/clinical_data.json"),
        )
        val file = candidates.firstOrNull { it.exists() }
            ?: error("Could not locate clinical_data.json from ${File(".").absolutePath}")
        Json { ignoreUnknownKeys = true; isLenient = true }
            .decodeFromString<ClinicalBundle>(file.readText())
    }

    private fun findPedDose(indication: String): Pair<Medication, MedicationDose> {
        for (med in bundle.medications) {
            val match = med.doses.firstOrNull { it.population == "pediatric" && it.indication == indication }
            if (match != null) return med to match
        }
        error("Pediatric dose not found for indication: $indication")
    }

    private fun pediatricDefaultConc(med: Medication, dose: MedicationDose): Double {
        return dose.preferredConcentrationMgPerMl?.let { pref ->
            med.concentrations.find { it.mgPerMl == pref }
        }?.mgPerMl
            ?: med.concentrations.find { it.isPediatricDefault == true }?.mgPerMl
            ?: med.concentrations.first().mgPerMl
    }

    private fun verifyAll27ForPatient(weightKg: Double, heightCm: Double) {
        val bio = (computePatientBiometrics(weightKg, heightCm, Sex.MALE) as BiometricResult.Ok).value
        assertEquals(27, rows.size)

        for (row in rows) {
            val (med, dose) = findPedDose(row.indication)
            val defaultVal = dose.default ?: dose.min ?: 0.0
            val conc = pediatricDefaultConc(med, dose)
            val result = computeMedicationDose(
                dose = dose,
                doseValue = defaultVal,
                concentrationMgPerMl = conc,
                biometrics = bio,
                tbwKg = weightKg,
                scalarOverride = null,
                preferredScalar = "auto",
                companion = med.companion,
            )

            assertEquals("${row.name} must lock to TBW", "TBW", result.scalar)
            assertEquals("${row.name} mass unit", row.unit, result.massUnit)

            val raw = row.perKg * weightKg
            val expected = row.cap?.let { min(raw, it) } ?: raw
            val tol = max(0.051, expected * 0.005)
            assertTrue(
                "${row.name} at $weightKg kg: expected $expected ${row.unit}, got ${result.mass} ${result.massUnit}",
                abs(result.mass - expected) <= tol,
            )

            if (row.cap != null && raw > row.cap) {
                assertTrue("${row.name} at $weightKg kg should report isCapped=true", result.isCapped)
            }
        }
    }

    @Test
    fun p1_all27PediatricDoses_20kg_5yr() {
        verifyAll27ForPatient(weightKg = 20.0, heightCm = 110.0)
    }

    @Test
    fun p1_all27PediatricDoses_50kg_10yr_capsEnforced() {
        verifyAll27ForPatient(weightKg = 50.0, heightCm = 140.0)
    }

    @Test
    fun p2_propofolAutoMatchesAgeBrackets() {
        val propofol = bundle.medications.first { it.id == "propofol" }
        val pedDoses = propofol.doses.filter { it.population == "pediatric" }

        val cases = listOf(
            1.0 to "Infant (< 2 yr)",
            6.0 to "Child (2–12 yr)",
            15.0 to "Adolescent (12–18 yr)",
        )
        for ((age, expectedLabel) in cases) {
            val matched = pedDoses.firstOrNull { d ->
                d.ageBracket?.let { b ->
                    (b.minYears == null || age >= b.minYears) && (b.maxYears == null || age < b.maxYears)
                } == true
            }
            assertNotNull("Propofol bracket should match age $age", matched)
            assertEquals("Propofol age $age bracket", expectedLabel, matched?.ageBracket?.label)
        }
    }

    @Test
    fun p4_drawUpVolumesFor20kgChildAtPediatricDefaultConcentrations() {
        val bio = (computePatientBiometrics(20.0, 110.0, Sex.MALE) as BiometricResult.Ok).value
        val volumeChecks = listOf(
            "Preoperative sedation IV (pediatric 6 mo – 12 yr)" to 1.0, // Midazolam: 1 mg / 1 mg/mL = 1.0 mL
            "Pediatric vagolysis / bradycardia premedication IV" to 3.0, // Atropine: 0.3 mg / 0.1 mg/mL = 3.0 mL
            "Pediatric induction IV, child (2–12 yr)" to 5.0,            // Propofol: 50 mg / 10 mg/mL = 5.0 mL
            "Pediatric induction IV (≥ 2 yr)" to 2.0,                    // Etomidate: 4 mg / 2 mg/mL = 2.0 mL
            "Pediatric induction IV" to 3.0,                             // Ketamine: 30 mg / 10 mg/mL = 3.0 mL
            "Pediatric analgesia / induction bolus IV" to 2.0,           // Fentanyl: 20 mcg / 10 mcg/mL = 2.0 mL
        )
        for ((indication, expectedMl) in volumeChecks) {
            val (med, dose) = findPedDose(indication)
            val conc = pediatricDefaultConc(med, dose)
            val result = computeMedicationDose(
                dose = dose,
                doseValue = dose.default ?: dose.min ?: 0.0,
                concentrationMgPerMl = conc,
                biometrics = bio,
                tbwKg = 20.0,
                scalarOverride = null,
                preferredScalar = "auto",
                companion = med.companion,
            )
            assertEquals("Volume for ${med.name} ($indication)", expectedMl, result.volumeMl, 0.01)
        }
    }
}
