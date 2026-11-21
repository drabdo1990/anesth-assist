package online.anesthassist.app.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import online.anesthassist.app.calc.DltResult
import online.anesthassist.app.calc.adultEttAndBlade
import online.anesthassist.app.calc.dltSizeForHeight
import online.anesthassist.app.calc.formatNumber
import online.anesthassist.app.calc.lmaSizeForWeight
import online.anesthassist.app.calc.pedsBladeForAge
import online.anesthassist.app.calc.pedsEtt
import online.anesthassist.app.data.ClinicalRepository
import online.anesthassist.app.ui.components.BigValueCard
import online.anesthassist.app.ui.components.ClinicalPanel
import online.anesthassist.app.ui.components.NoSourceBox
import online.anesthassist.app.ui.components.NumericStepper
import online.anesthassist.app.ui.components.SegmentedControl
import online.anesthassist.app.ui.components.WarningBanner
import online.anesthassist.app.ui.components.WarningLevel
import online.anesthassist.app.ui.theme.LocalClinicalColors
import online.anesthassist.app.viewmodel.AnesthUiState
import online.anesthassist.app.viewmodel.AnesthViewModel
import online.anesthassist.app.viewmodel.EmergencyKind
import kotlin.math.round

@Composable
fun IntraopAirwayScreen(
    state: AnesthUiState,
    viewModel: AnesthViewModel,
    repository: ClinicalRepository,
) {
    val c = LocalClinicalColors.current
    val airway = repository.bundle.airway
    val p = state.patient

    var population by remember { mutableStateOf(if (p.ageYears != null && p.ageYears < 18.0) "pediatric" else "adult") }
    LaunchedEffect(p.ageYears) {
        if (p.ageYears != null) population = if (p.ageYears < 18.0) "pediatric" else "adult"
    }
    var ageUnit by remember { mutableStateOf("years") }
    var showReference by remember { mutableStateOf(false) }

    val ageYears = p.ageYears
    val adultAgeOk = ageYears != null && ageYears >= 18.0
    val adultRule = if (adultAgeOk) adultEttAndBlade(airway, p.sex) else null
    val pedsCuffed = if (ageYears != null) pedsEtt(airway, ageYears, "cuffed-msd") else null
    val pedsAlt = if (ageYears != null) pedsEtt(airway, ageYears, "cuffed-iowa") else null
    val pedsUncuffed = if (ageYears != null) pedsEtt(airway, ageYears, "uncuffed-msd") else null
    val pedsBlade = if (ageYears != null) pedsBladeForAge(airway, ageYears * 12.0) else null
    val lma = p.tbwKg?.let { lmaSizeForWeight(airway, it) }
    val dlt = dltSizeForHeight(airway, p.heightCm, ageYears)

    LazyColumn(
        modifier = Modifier.fillMaxWidth(),
        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            SegmentedControl(
                options = listOf("adult" to "Adult", "pediatric" to "Pediatric"),
                selected = population,
                onSelect = { population = it },
                testTagPrefix = "airway_pop",
            )
        }

        if (population == "pediatric") {
            item {
                ClinicalPanel(title = "Pediatric Age Input") {
                    SegmentedControl(
                        options = listOf("years" to "Years", "months" to "Months"),
                        selected = ageUnit,
                        onSelect = { ageUnit = it },
                        testTagPrefix = "airway_age_unit",
                    )
                    val display = ageYears?.let { if (ageUnit == "years") it else round(it * 12.0) }
                    NumericStepper(
                        label = "Age ($ageUnit)",
                        value = display,
                        unit = if (ageUnit == "years") "y" else "mo",
                        step = 1.0,
                        min = 0.0,
                        max = if (ageUnit == "years") 18.0 else 216.0,
                        decimals = if (ageUnit == "years") 1 else 0,
                        onChange = { v -> viewModel.setAge(if (ageUnit == "years") v else v / 12.0) },
                        testTag = "airway_peds_age",
                    )
                }
            }
        }

        item {
            ClinicalPanel(
                title = "Airway Summary",
                sourceTags = repository.sourceTags(
                    if (population == "adult") listOf("oxford-miller-airway", "teleflex-lma")
                    else listOf("msd-peds-ett", "wikem-peds-airway", "teleflex-lma")
                ),
            ) {
                if (population == "adult") {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        BigValueCard(
                            label = "ETT (Adult)",
                            value = adultRule?.idRangeMm ?: "--",
                            unit = if (adultRule != null) "mm ID" else "",
                            modifier = Modifier.weight(1f),
                        )
                        BigValueCard(
                            label = "Oral Depth",
                            value = adultRule?.oralDepthRangeCm ?: "--",
                            unit = if (adultRule != null) "cm" else "",
                            modifier = Modifier.weight(1f),
                        )
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        BigValueCard(
                            label = "Blade",
                            value = adultRule?.blade ?: "--",
                            modifier = Modifier.weight(1f),
                        )
                        BigValueCard(
                            label = "LMA Classic",
                            value = lma?.let { "LMA ${it.band.size}" } ?: "--",
                            unit = lma?.let { "max ${it.band.maxCuffVolumeMl} mL" } ?: "",
                            modifier = Modifier.weight(1f),
                        )
                    }
                    BigValueCard(
                        label = "Left DLT (Height)",
                        value = (dlt as? DltResult.Ok)?.sizeFr ?: "--",
                        unit = (dlt as? DltResult.Ok)?.category ?: "",
                        modifier = Modifier.fillMaxWidth(),
                    )
                    if (!adultAgeOk) {
                        WarningBanner(
                            level = WarningLevel.AMBER,
                            title = if (ageYears == null) "Age required" else "Pediatric patient",
                            body = if (ageYears == null) "Enter age in the patient bar before adult airway sizing."
                            else "Adult ETT, blade, and DLT sizing are withheld under age 18.",
                        )
                    } else if (p.sex == null) {
                        WarningBanner(level = WarningLevel.INFO, body = "Select biological sex above for adult ETT and blade sizing.")
                    }
                    if (dlt is DltResult.Err && p.heightCm != null) {
                        WarningBanner(level = WarningLevel.AMBER, title = "DLT note", body = dlt.reason)
                    }
                } else {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        BigValueCard(
                            label = "ETT Cuffed (MSD)",
                            value = pedsCuffed?.let { formatNumber(it.idRoundedMm, 1) } ?: "--",
                            unit = if (pedsCuffed != null) "mm ID" else "",
                            modifier = Modifier.weight(1f),
                        )
                        BigValueCard(
                            label = "ETT Uncuffed",
                            value = pedsUncuffed?.let { formatNumber(it.idRoundedMm, 1) } ?: "--",
                            unit = if (pedsUncuffed != null) "mm ID" else "",
                            modifier = Modifier.weight(1f),
                        )
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        BigValueCard(
                            label = "Oral Depth (3x ID)",
                            value = pedsCuffed?.let { formatNumber(it.depthCm, 1) } ?: "--",
                            unit = if (pedsCuffed != null) "cm" else "",
                            modifier = Modifier.weight(1f),
                        )
                        BigValueCard(
                            label = "Blade",
                            value = pedsBlade?.blade ?: "--",
                            modifier = Modifier.weight(1f),
                        )
                    }
                    BigValueCard(
                        label = "LMA Classic",
                        value = lma?.let { "LMA ${it.band.size}" } ?: "--",
                        unit = lma?.let { "max ${it.band.maxCuffVolumeMl} mL · <= ${airway.lmaMaxCuffPressureCmH2O} cmH2O" } ?: "",
                        modifier = Modifier.fillMaxWidth(),
                    )
                    if (pedsAlt != null) {
                        WarningBanner(
                            level = WarningLevel.AMBER,
                            title = "Cuffed formulas differ",
                            body = "Alternate cuffed formula (age/4 + 3) gives ${formatNumber(pedsAlt.idRoundedMm, 1)} mm ID. Have adjacent sizes ready.",
                        )
                    } else if (ageYears != null && (ageYears < airway.pedsEttAgeMin || ageYears > airway.pedsEttAgeMax)) {
                        WarningBanner(
                            level = WarningLevel.INFO,
                            body = "Formula covers ages ${airway.pedsEttAgeMin.toInt()} to ${airway.pedsEttAgeMax.toInt()} years. See Polish 2025 pediatric table in Reference below.",
                        )
                    }
                }
                if (lma?.borderlineNext != null) {
                    WarningBanner(
                        level = WarningLevel.AMBER,
                        title = "LMA size boundary",
                        body = "Weight sits on the boundary between LMA ${lma.band.size} and LMA ${lma.borderlineNext.size}. Choose by clinical judgment.",
                    )
                }
            }
        }

        item {
            Button(
                onClick = { viewModel.openEmergency(EmergencyKind.CICO) },
                colors = ButtonDefaults.buttonColors(containerColor = c.redBg, contentColor = c.red),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth().heightIn(min = 52.dp).testTag("open_cico_button"),
            ) {
                Icon(Icons.Default.Warning, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text("CICO / FAILED AIRWAY PATHWAY", fontWeight = FontWeight.Black)
            }
        }

        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(c.card)
                    .border(1.dp, c.border, RoundedCornerShape(16.dp))
                    .padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 44.dp)
                        .clickable { showReference = !showReference }
                        .testTag("airway_reference_toggle"),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("Airway Equipment & Guidelines Reference", style = MaterialTheme.typography.titleMedium, color = c.textPrimary)
                    Icon(
                        if (showReference) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                        contentDescription = null,
                        tint = c.textMuted,
                    )
                }
                AnimatedVisibility(visible = showReference) {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        WarningBanner(
                            level = WarningLevel.INFO,
                            title = "ASA 2022 Difficult Airway Principles",
                            body = airway.principles.joinToString("\n• ", prefix = "• ") { it.text },
                        )
                        ClinicalPanel(
                            title = "OPA / NPA Landmarks",
                            sourceTags = repository.sourceTags(listOf("rch-airway", "wikem-peds-airway")),
                        ) {
                            Text("• OPA: Centre of incisors to angle of mandible.", style = MaterialTheme.typography.bodySmall, color = c.textPrimary)
                            Text("• NPA: Tip of nose to tragus.", style = MaterialTheme.typography.bodySmall, color = c.textPrimary)
                        }
                        airway.equipmentReference.forEach { eq ->
                            ClinicalPanel(title = eq.title, sourceTags = repository.sourceTags(eq.sourceIds)) {
                                eq.points.forEach { pt ->
                                    Text("• $pt", style = MaterialTheme.typography.bodySmall, color = c.textSecondary)
                                }
                            }
                        }
                        airway.unsourced.forEach { u -> NoSourceBox(topic = u) }
                    }
                }
            }
        }

        item { Spacer(Modifier.height(16.dp)) }
    }
}
