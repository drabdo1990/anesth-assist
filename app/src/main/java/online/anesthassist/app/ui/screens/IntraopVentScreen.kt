package online.anesthassist.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import online.anesthassist.app.calc.BiometricResult
import online.anesthassist.app.calc.PLATEAU_LIMIT_CMH2O
import online.anesthassist.app.calc.VentSeverity
import online.anesthassist.app.calc.drivingPressure
import online.anesthassist.app.calc.formatKg
import online.anesthassist.app.calc.formatNumber
import online.anesthassist.app.calc.minuteVentilationLMin
import online.anesthassist.app.calc.plateauSeverity
import online.anesthassist.app.calc.tidalVolumeMl
import online.anesthassist.app.calc.tidalVolumeSeverity
import online.anesthassist.app.data.ClinicalRepository
import online.anesthassist.app.ui.components.BigValueCard
import online.anesthassist.app.ui.components.ClinicalPanel
import online.anesthassist.app.ui.components.NumericStepper
import online.anesthassist.app.ui.components.WarningBanner
import online.anesthassist.app.ui.components.WarningLevel
import online.anesthassist.app.ui.theme.LocalClinicalColors
import online.anesthassist.app.viewmodel.AnesthUiState
import online.anesthassist.app.viewmodel.AnesthViewModel

@Composable
fun IntraopVentScreen(
    state: AnesthUiState,
    viewModel: AnesthViewModel,
    repository: ClinicalRepository,
) {
    val c = LocalClinicalColors.current
    val ventData = repository.bundle.ventilation
    val vent = state.vent
    val scenario = ventData.scenarios.find { it.id == vent.scenarioId } ?: ventData.scenarios.first()
    val ageYears = state.patient.ageYears
    val adultAgeOk = ageYears != null && ageYears >= 18.0
    val pbw = (state.biometricResult as? BiometricResult.Ok)?.value?.pbw

    val vtMl = if (adultAgeOk && pbw != null && vent.mlPerKgPbw != null) {
        tidalVolumeMl(pbw, vent.mlPerKgPbw)
    } else null
    val mvLMin = if (vtMl != null && vent.respiratoryRate != null) {
        minuteVentilationLMin(vtMl, vent.respiratoryRate)
    } else null
    val dp = if (vent.plateauCmH2O != null && vent.peepCmH2O != null) {
        drivingPressure(vent.plateauCmH2O, vent.peepCmH2O)
    } else null

    val plateauLimit = scenario.plateauPressureLimit ?: PLATEAU_LIMIT_CMH2O
    val pSev = vent.plateauCmH2O?.let { plateauSeverity(it, plateauLimit) }
    val vtRange = scenario.tidalVolumeMlPerKgPbw
    val vtSev = if (vtRange != null && vent.mlPerKgPbw != null) {
        tidalVolumeSeverity(vent.mlPerKgPbw, vtRange.min, vtRange.max)
    } else null

    LazyColumn(
        modifier = Modifier.fillMaxWidth(),
        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                ventData.scenarios.forEach { sc ->
                    val active = sc.id == scenario.id
                    Box(
                        modifier = Modifier
                            .heightIn(min = 44.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (active) c.cyan else c.card)
                            .border(1.dp, if (active) c.cyan else c.border, RoundedCornerShape(10.dp))
                            .clickable { viewModel.selectVentScenario(sc.id) }
                            .padding(horizontal = 12.dp)
                            .testTag("vent_scenario_${sc.id}"),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            text = sc.name,
                            style = MaterialTheme.typography.labelMedium,
                            color = if (active) (if (c.isDark) Color.Black else Color.White) else c.textSecondary,
                        )
                    }
                }
            }
        }

        if (!adultAgeOk) {
            item {
                WarningBanner(
                    level = WarningLevel.AMBER,
                    title = if (ageYears == null) "Age required for PBW tidal volume" else "Pediatric patient",
                    body = if (ageYears == null) "Enter patient age above before calculating adult PBW-based tidal volume."
                    else "Adult Devine PBW is invalid for children (< 18 y). Use pediatric-specific lung protection guidance.",
                )
            }
        }

        item {
            ClinicalPanel(
                title = scenario.name,
                subtitle = pbw?.let { "PBW ${formatKg(it)} kg (Devine — never actual weight)" } ?: "Enter height and sex for PBW",
                sourceTags = repository.sourceTags(scenario.sourceIds),
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                    val vtColor = when (vtSev) {
                        VentSeverity.RED -> c.red
                        VentSeverity.AMBER -> c.amber
                        else -> c.cyan
                    }
                    BigValueCard(
                        label = "Tidal Volume (PBW)",
                        value = vtMl?.let { formatNumber(it, 0) } ?: "--",
                        unit = "mL",
                        accentColor = vtColor,
                        modifier = Modifier.weight(1f),
                    )
                    BigValueCard(
                        label = "Minute Vent",
                        value = mvLMin?.let { formatNumber(it, 1) } ?: "--",
                        unit = "L/min",
                        accentColor = c.emerald,
                        modifier = Modifier.weight(1f),
                    )
                }

                if (dp != null) {
                    val dpColor = if (dp > 15.0) c.red else if (dp >= 14.0) c.amber else c.emerald
                    BigValueCard(
                        label = "Driving Pressure (Pplat - PEEP)",
                        value = formatNumber(dp, 0),
                        unit = "cmH2O (goal < 14–15)",
                        accentColor = dpColor,
                        modifier = Modifier.fillMaxWidth(),
                    )
                }

                NumericStepper(
                    label = "Target mL/kg PBW${vtRange?.let { " (${formatNumber(it.min, 0)}–${formatNumber(it.max, 0)})" } ?: ""}",
                    value = vent.mlPerKgPbw,
                    unit = "mL/kg",
                    step = 0.5,
                    min = 3.0,
                    max = 12.0,
                    decimals = 1,
                    onChange = { v -> viewModel.updateVent { it.copy(mlPerKgPbw = v) } },
                    testTag = "vent_vt_mlkg",
                )

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                    NumericStepper(
                        label = "Resp Rate",
                        value = vent.respiratoryRate,
                        unit = "/min",
                        step = 1.0,
                        min = 4.0,
                        max = 40.0,
                        decimals = 0,
                        allowDecimal = false,
                        onChange = { v -> viewModel.updateVent { it.copy(respiratoryRate = v) } },
                        modifier = Modifier.weight(1f),
                    )
                    NumericStepper(
                        label = "PEEP",
                        value = vent.peepCmH2O,
                        unit = "cmH2O",
                        step = 1.0,
                        min = 0.0,
                        max = 24.0,
                        decimals = 0,
                        allowDecimal = false,
                        onChange = { v -> viewModel.updateVent { it.copy(peepCmH2O = v) } },
                        modifier = Modifier.weight(1f),
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                    NumericStepper(
                        label = "Plateau Pressure",
                        value = vent.plateauCmH2O,
                        unit = "cmH2O",
                        step = 1.0,
                        min = 5.0,
                        max = 60.0,
                        decimals = 0,
                        allowDecimal = false,
                        onChange = { v -> viewModel.updateVent { it.copy(plateauCmH2O = v) } },
                        modifier = Modifier.weight(1f),
                    )
                    NumericStepper(
                        label = "FiO2",
                        value = vent.fio2Percent,
                        unit = "%",
                        step = 5.0,
                        min = 21.0,
                        max = 100.0,
                        decimals = 0,
                        allowDecimal = false,
                        onChange = { v -> viewModel.updateVent { it.copy(fio2Percent = v) } },
                        modifier = Modifier.weight(1f),
                    )
                }

                if (pSev == VentSeverity.RED) {
                    val ardsReduce = vent.plateauCmH2O != null && vent.mlPerKgPbw != null &&
                        vent.plateauCmH2O > plateauLimit && vent.mlPerKgPbw <= 6.0 && vent.mlPerKgPbw > 4.0
                    WarningBanner(
                        level = WarningLevel.RED,
                        title = "Plateau pressure above ${plateauLimit.toInt()} cmH2O",
                        body = if (ardsReduce) "Consider reducing tidal volume toward 4 mL/kg PBW and check circuit/patient compliance."
                        else "Inspect tube, circuit, compliance, and depth of neuromuscular block.",
                    )
                } else if (pSev == VentSeverity.AMBER) {
                    WarningBanner(
                        level = WarningLevel.AMBER,
                        title = "Approaching plateau limit (${plateauLimit.toInt()} cmH2O)",
                        body = "Monitor plateau and driving pressure closely.",
                    )
                }

                scenario.cautions.forEach { caution ->
                    Text("• $caution", style = MaterialTheme.typography.bodySmall, color = c.textSecondary)
                }
            }
        }

        item {
            ClinicalPanel(title = "Ventilator Modes") {
                ventData.modes.forEach { m ->
                    Text(m.title, style = MaterialTheme.typography.titleSmall, color = c.cyan)
                    m.points.forEach { pt -> Text("• $pt", style = MaterialTheme.typography.bodySmall, color = c.textSecondary) }
                }
            }
        }

        item {
            ClinicalPanel(title = "Alarms & Troubleshooting") {
                ventData.alarms.forEach { a ->
                    Text(a.title, style = MaterialTheme.typography.titleSmall, color = c.amber)
                    a.points.forEach { pt -> Text("• $pt", style = MaterialTheme.typography.bodySmall, color = c.textSecondary) }
                }
                Spacer(Modifier.height(4.dp))
                ventData.troubleshooting.forEach { t ->
                    Text(t.title, style = MaterialTheme.typography.titleSmall, color = c.cyan)
                    t.points.forEach { pt -> Text("• $pt", style = MaterialTheme.typography.bodySmall, color = c.textSecondary) }
                }
            }
        }

        item {
            ClinicalPanel(title = "Ventilation Guidelines & ARDSNet Reference") {
                ventData.advancedReference.forEach { ref ->
                    Text(ref.title, style = MaterialTheme.typography.titleSmall, color = c.cyan)
                    ref.points.forEach { pt -> Text("• $pt", style = MaterialTheme.typography.bodySmall, color = c.textSecondary) }
                    Spacer(Modifier.height(4.dp))
                }
            }
        }

        item { Spacer(Modifier.height(16.dp)) }
    }
}
