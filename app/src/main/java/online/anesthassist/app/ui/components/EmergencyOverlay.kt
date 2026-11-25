package online.anesthassist.app.ui.components

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import online.anesthassist.app.R
import online.anesthassist.app.calc.DANTROLENE_CUMULATIVE_CAUTION_MG_PER_KG
import online.anesthassist.app.calc.DANTROLENE_INITIAL_MG_PER_KG
import online.anesthassist.app.calc.MAX_WEIGHT_KG
import online.anesthassist.app.calc.calculateLipidPlan
import online.anesthassist.app.calc.dantroleneVialPlans
import online.anesthassist.app.calc.formatNumber
import online.anesthassist.app.data.ClinicalRepository
import online.anesthassist.app.data.EmergencyStep
import online.anesthassist.app.ui.theme.AnesthAssistTheme
import online.anesthassist.app.ui.theme.JetBrainsMonoFontFamily
import online.anesthassist.app.ui.theme.LocalClinicalColors
import online.anesthassist.app.viewmodel.AnesthUiState
import online.anesthassist.app.viewmodel.AnesthViewModel
import online.anesthassist.app.viewmodel.EmergencyKind
import online.anesthassist.app.viewmodel.TimerState
import java.util.Locale

@Composable
fun EmergencyOverlay(
    state: AnesthUiState,
    viewModel: AnesthViewModel,
    repository: ClinicalRepository,
) {
    BackHandler { viewModel.closeEmergency() }

    // Crisis overlay stays dark in all themes for high red-on-dark OR contrast without glare.
    AnesthAssistTheme(forceDark = true) {
        val c = LocalClinicalColors.current
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(c.bg)
                .statusBarsPadding()
                .navigationBarsPadding(),
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF450A0A))
                    .border(width = 2.dp, color = c.red)
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "EMERGENCY SUPPORT",
                    style = MaterialTheme.typography.headlineSmall,
                    color = Color(0xFFFEE2E2),
                    letterSpacing = 1.sp,
                )
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color(0xFF7F1D1D))
                        .border(1.dp, c.red, RoundedCornerShape(12.dp))
                        .clickable { viewModel.closeEmergency() }
                        .testTag("emergency_close_top"),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.Default.Close, contentDescription = stringResource(R.string.cd_close), tint = Color.White)
                }
            }

            Box(modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)) {
                SegmentedControl(
                    options = EmergencyKind.entries.map { it to it.label },
                    selected = state.emergencyKind,
                    onSelect = viewModel::setEmergencyKind,
                    redTone = true,
                    testTagPrefix = "emergency_kind",
                )
            }

            Column(
                modifier = Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 12.dp, vertical = 6.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                if (state.emergencyKind != EmergencyKind.CICO) {
                    NumericStepper(
                        label = "Actual body weight (protocol weight)",
                        value = state.patient.tbwKg,
                        unit = "kg",
                        step = 1.0,
                        min = 1.0,
                        max = MAX_WEIGHT_KG,
                        decimals = 1,
                        emptyText = "Tap to enter actual weight",
                        onChange = { viewModel.setWeight(it) },
                        keypadTitle = "Actual body weight (kg)",
                        testTag = "emergency_weight",
                    )
                }

                when (state.emergencyKind) {
                    EmergencyKind.LAST -> LastEmergencyContent(state, viewModel, repository)
                    EmergencyKind.MH -> MhEmergencyContent(state, viewModel, repository)
                    EmergencyKind.CICO -> CicoEmergencyContent(state, viewModel, repository)
                }
                Spacer(Modifier.height(12.dp))
            }

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(c.bg)
                    .border(0.5.dp, c.border),
            ) {
                Button(
                    onClick = { viewModel.closeEmergency() },
                    colors = ButtonDefaults.buttonColors(containerColor = c.card, contentColor = c.textPrimary),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 8.dp)
                        .heightIn(min = 52.dp)
                        .testTag("emergency_back_button"),
                ) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                    Spacer(Modifier.width(8.dp))
                    Text("BACK TO APP", fontWeight = FontWeight.Black)
                }
                DisclaimerBanner()
            }
        }
    }
}

@Composable
private fun LastEmergencyContent(
    state: AnesthUiState,
    viewModel: AnesthViewModel,
    repository: ClinicalRepository,
) {
    val c = LocalClinicalColors.current
    val weight = state.patient.tbwKg

    WarningBanner(
        level = WarningLevel.RED,
        title = "Local anesthetic systemic toxicity",
        body = "Stop injecting. Call for help. Give 20% lipid emulsion. Do not rely on local anesthetic-related interventions alone.",
    )

    EmergencyTimerBar(
        label = "LAST Timer",
        timer = state.timers["last"] ?: TimerState(),
        nowMs = state.nowMs,
        onStart = { viewModel.timerStart("last") },
        onPause = { viewModel.timerPause("last") },
        onReset = { viewModel.timerReset("last") },
    )

    if (weight == null) {
        NeedWeightBox()
    } else {
        val plan = calculateLipidPlan(weight)
        val exceeded = state.lipidGivenMl > plan.maxCumulativeMl
        val atLimit = state.lipidGivenMl == plan.maxCumulativeMl

        ClinicalPanel(
            title = "20% Lipid Emulsion (ASRA 2020)",
            subtitle = if (plan.under70) "Stratum: < 70 kg (${formatNumber(weight, 1)} kg)" else "Stratum: >= 70 kg (${formatNumber(weight, 1)} kg)",
            sourceTags = repository.sourceTags(listOf("asra-last-2020")),
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                BigValueCard(
                    label = "Initial Bolus (2-3 min)",
                    value = formatNumber(plan.bolusMl, 0),
                    unit = "mL",
                    accentColor = c.red,
                    modifier = Modifier.weight(1f),
                )
                if (plan.under70) {
                    BigValueCard(
                        label = "Infusion (0.25 mL/kg/m)",
                        value = formatNumber(plan.infusionMlPerHr ?: 0.0, 0),
                        unit = "mL/hr",
                        accentColor = c.amber,
                        modifier = Modifier.weight(1f),
                    )
                } else {
                    BigValueCard(
                        label = "Infusion (15-20 min)",
                        value = formatNumber(plan.infusionTotalMl ?: 250.0, 0),
                        unit = "mL",
                        accentColor = c.amber,
                        modifier = Modifier.weight(1f),
                    )
                }
            }
            if (plan.under70) {
                Text(
                    text = "Infusion: ${formatNumber(plan.infusionMlPerMin ?: 0.0, 1)} mL/min (double to ${formatNumber(plan.doubledInfusionMlPerMin ?: 0.0, 1)} mL/min if unstable).",
                    style = MaterialTheme.typography.bodySmall,
                    color = c.textSecondary,
                )
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                BigValueCard(
                    label = "Given Total",
                    value = formatNumber(state.lipidGivenMl, 0),
                    unit = "mL",
                    accentColor = if (exceeded) c.red else if (atLimit) c.amber else c.cyan,
                    modifier = Modifier.weight(1f),
                )
                BigValueCard(
                    label = "Max Ceiling (12 mL/kg)",
                    value = formatNumber(plan.maxCumulativeMl, 0),
                    unit = "mL",
                    accentColor = c.textSecondary,
                    modifier = Modifier.weight(1f),
                )
            }
            if (exceeded) {
                WarningBanner(
                    level = WarningLevel.RED,
                    title = "Cumulative ceiling exceeded",
                    body = "Logged volume (${formatNumber(state.lipidGivenMl, 0)} mL) exceeds 12 mL/kg (${formatNumber(plan.maxCumulativeMl, 0)} mL).",
                )
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                Button(
                    onClick = { viewModel.addLipid(plan.bolusMl) },
                    colors = ButtonDefaults.buttonColors(containerColor = c.red, contentColor = Color.White),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.weight(1f).heightIn(min = 48.dp).testTag("log_lipid_bolus"),
                ) {
                    Text("+ Bolus (${formatNumber(plan.bolusMl, 0)} mL)", fontWeight = FontWeight.Bold)
                }
                Button(
                    onClick = { viewModel.addLipid(if (plan.under70) (plan.infusionMlPerMin ?: 0.0) * 15.0 else 250.0) },
                    colors = ButtonDefaults.buttonColors(containerColor = c.amberBg, contentColor = c.amber),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.weight(1f).heightIn(min = 48.dp).testTag("log_lipid_infusion"),
                ) {
                    val infAmt = if (plan.under70) (plan.infusionMlPerMin ?: 0.0) * 15.0 else 250.0
                    Text("+ Inf (${formatNumber(infAmt, 0)} mL)", fontWeight = FontWeight.Bold)
                }
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(c.cardInset)
                        .border(1.dp, c.border, RoundedCornerShape(10.dp))
                        .clickable { viewModel.resetLipid() }
                        .testTag("reset_lipid"),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.Default.Refresh, contentDescription = "Reset lipid total", tint = c.textMuted)
                }
            }
        }
    }

    EmergencyStepsList(
        title = "LAST Action Checklist",
        steps = repository.bundle.emergencies.lastSteps,
        checks = state.emergencyChecks,
        onToggle = viewModel::toggleEmergencyCheck,
    )
}

@Composable
private fun MhEmergencyContent(
    state: AnesthUiState,
    viewModel: AnesthViewModel,
    repository: ClinicalRepository,
) {
    val c = LocalClinicalColors.current
    val weight = state.patient.tbwKg

    WarningBanner(
        level = WarningLevel.RED,
        title = "Malignant hyperthermia",
        body = "Stop volatile anesthetics and succinylcholine. Call for help. Hyperventilate with 100% oxygen at high flow. Give dantrolene.",
    )

    EmergencyTimerBar(
        label = "MH Timer",
        timer = state.timers["mh"] ?: TimerState(),
        nowMs = state.nowMs,
        onStart = { viewModel.timerStart("mh") },
        onPause = { viewModel.timerPause("mh") },
        onReset = { viewModel.timerReset("mh") },
    )

    if (state.mhContact.isNotBlank()) {
        WarningBanner(
            level = WarningLevel.INFO,
            title = "Local MH Hotline / Contact",
            body = state.mhContact,
        )
    } else {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = 48.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(c.card)
                .border(1.dp, c.borderLight, RoundedCornerShape(12.dp))
                .clickable {
                    viewModel.closeEmergency()
                    viewModel.setSettingsOpen(true)
                }
                .padding(horizontal = 12.dp, vertical = 10.dp)
                .testTag("configure_mh_hotline"),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = "No MH hotline configured. Tap to set one in Settings.",
                style = MaterialTheme.typography.bodySmall,
                color = c.textSecondary,
                fontWeight = FontWeight.SemiBold,
            )
        }
    }

    if (weight == null) {
        NeedWeightBox()
    } else {
        val initialMg = weight * DANTROLENE_INITIAL_MG_PER_KG
        val vialPlans = dantroleneVialPlans(initialMg)
        val givenMgPerKg = state.dantroleneGivenMg / weight
        val cautionExceeded = givenMgPerKg >= DANTROLENE_CUMULATIVE_CAUTION_MG_PER_KG

        ClinicalPanel(
            title = "Dantrolene Dosing (2.5 mg/kg TBW)",
            subtitle = "Actual weight: ${formatNumber(weight, 1)} kg",
            sourceTags = repository.sourceTags(listOf("mhaus", "label-ryanodex", "label-revonto")),
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                BigValueCard(
                    label = "Initial Bolus",
                    value = formatNumber(initialMg, 0),
                    unit = "mg IV",
                    accentColor = c.red,
                    modifier = Modifier.weight(1f),
                )
                BigValueCard(
                    label = "Cumulative Given",
                    value = formatNumber(state.dantroleneGivenMg, 0),
                    unit = "mg (${formatNumber(givenMgPerKg, 1)} mg/kg)",
                    accentColor = if (cautionExceeded) c.red else c.cyan,
                    modifier = Modifier.weight(1f),
                )
            }
            vialPlans.forEach { vp ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(c.cardInset)
                        .border(1.dp, c.border, RoundedCornerShape(10.dp))
                        .padding(10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column {
                        Text(vp.label, style = MaterialTheme.typography.labelLarge, color = c.textPrimary)
                        Text("Diluent: ${vp.diluentMl} mL sterile water", style = MaterialTheme.typography.bodySmall, color = c.textMuted)
                    }
                    Text(
                        text = "${vp.vials} vials",
                        fontFamily = JetBrainsMonoFontFamily,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = c.amber,
                    )
                }
            }
            if (cautionExceeded) {
                WarningBanner(
                    level = WarningLevel.RED,
                    title = "10 mg/kg cumulative mark reached",
                    body = "Both product labels cite 10 mg/kg as the maximum cumulative dose. Re-evaluate diagnosis if unresponsive.",
                )
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                Button(
                    onClick = { viewModel.addDantrolene(initialMg) },
                    colors = ButtonDefaults.buttonColors(containerColor = c.red, contentColor = Color.White),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.weight(1f).heightIn(min = 48.dp).testTag("log_dantrolene_bolus"),
                ) {
                    Text("+ Give ${formatNumber(initialMg, 0)} mg (2.5 mg/kg)", fontWeight = FontWeight.Bold)
                }
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(c.cardInset)
                        .border(1.dp, c.border, RoundedCornerShape(10.dp))
                        .clickable { viewModel.resetDantrolene() }
                        .testTag("reset_dantrolene"),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.Default.Refresh, contentDescription = "Reset dantrolene total", tint = c.textMuted)
                }
            }
        }
    }

    EmergencyStepsList(
        title = "Malignant Hyperthermia Checklist",
        steps = repository.bundle.emergencies.mhSteps,
        checks = state.emergencyChecks,
        onToggle = viewModel::toggleEmergencyCheck,
    )
}

@Composable
private fun CicoEmergencyContent(
    state: AnesthUiState,
    viewModel: AnesthViewModel,
    repository: ClinicalRepository,
) {
    val c = LocalClinicalColors.current
    val plans = repository.bundle.emergencies.cicoPlans
    val activePlan = plans.find { it.id == state.cicoPlan } ?: plans.first()

    EmergencyTimerBar(
        label = "Airway / CICO Timer",
        timer = state.timers["cico"] ?: TimerState(),
        nowMs = state.nowMs,
        onStart = { viewModel.timerStart("cico") },
        onPause = { viewModel.timerPause("cico") },
        onReset = { viewModel.timerReset("cico") },
    )

    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
        Button(
            onClick = { viewModel.setCicoHelpCalled(!state.cicoHelpCalled) },
            colors = ButtonDefaults.buttonColors(
                containerColor = if (state.cicoHelpCalled) c.emerald else c.red,
                contentColor = Color.White,
            ),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.weight(1f).heightIn(min = 48.dp).testTag("cico_help_button"),
        ) {
            Text(
                if (state.cicoHelpCalled) "HELP CALLED ✓" else "CALL FOR HELP",
                fontWeight = FontWeight.Black,
            )
        }
    }

    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text("AUDIO BEEP INTERVAL", style = MaterialTheme.typography.labelSmall, color = c.textMuted)
        SegmentedControl(
            options = listOf(0 to "Off", 30 to "30s", 60 to "60s", 120 to "2m"),
            selected = state.cicoAlertEverySec,
            onSelect = viewModel::setCicoAlertEvery,
            testTagPrefix = "cico_alert",
        )
    }

    SegmentedControl(
        options = plans.map { it.id to "Plan ${it.id}" },
        selected = activePlan.id,
        onSelect = viewModel::setCicoPlan,
        redTone = true,
        testTagPrefix = "cico_plan",
    )

    ClinicalPanel(
        title = activePlan.title,
        sourceTags = repository.sourceTags(listOf("asa-airway-2022")),
    ) {
        activePlan.steps.forEach { step ->
            EmergencyStepRow(
                step = step,
                checked = state.emergencyChecks[step.id] == true,
                onToggle = { viewModel.toggleEmergencyCheck(step.id) },
            )
        }
        if (activePlan.failureCriteria.isNotEmpty()) {
            WarningBanner(
                level = WarningLevel.RED,
                title = "Escalate immediately if:",
                body = activePlan.failureCriteria.joinToString("\n• ", prefix = "• "),
            )
        }
        val nextPlan = when (activePlan.id) {
            "A" -> "B"
            "B" -> "C"
            "C" -> "D"
            else -> null
        }
        if (nextPlan != null) {
            Button(
                onClick = { viewModel.setCicoPlan(nextPlan) },
                colors = ButtonDefaults.buttonColors(containerColor = c.red, contentColor = Color.White),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth().heightIn(min = 50.dp).testTag("cico_escalate_$nextPlan"),
            ) {
                Text("FAILED → ESCALATE TO PLAN $nextPlan", fontWeight = FontWeight.Black)
            }
        }
    }
}

@Composable
private fun EmergencyTimerBar(
    label: String,
    timer: TimerState,
    nowMs: Long,
    onStart: () -> Unit,
    onPause: () -> Unit,
    onReset: () -> Unit,
) {
    val c = LocalClinicalColors.current
    val totalSec = (timer.elapsedMs(nowMs) / 1000L).coerceAtLeast(0L)
    val mins = totalSec / 60L
    val secs = totalSec % 60L
    val formatted = String.format(Locale.US, "%02d:%02d", mins, secs)

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(c.card)
            .border(1.dp, if (timer.running) c.red else c.border, RoundedCornerShape(14.dp))
            .padding(horizontal = 12.dp, vertical = 10.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column {
            Text(label.uppercase(), style = MaterialTheme.typography.labelSmall, color = c.textMuted)
            Text(
                text = formatted,
                fontFamily = JetBrainsMonoFontFamily,
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
                color = if (timer.running) c.red else c.textPrimary,
            )
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(if (timer.running) c.amber else c.emerald)
                    .clickable { if (timer.running) onPause() else onStart() }
                    .testTag("timer_toggle_${label.lowercase()}"),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = if (timer.running) Icons.Default.Pause else Icons.Default.PlayArrow,
                    contentDescription = if (timer.running) "Pause timer" else "Start timer",
                    tint = Color.Black,
                )
            }
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(c.cardInset)
                    .border(1.dp, c.border, RoundedCornerShape(12.dp))
                    .clickable { onReset() }
                    .testTag("timer_reset_${label.lowercase()}"),
                contentAlignment = Alignment.Center,
            ) {
                Icon(Icons.Default.Refresh, contentDescription = "Reset timer", tint = c.textSecondary)
            }
        }
    }
}

@Composable
private fun EmergencyStepsList(
    title: String,
    steps: List<EmergencyStep>,
    checks: Map<String, Boolean>,
    onToggle: (String) -> Unit,
) {
    ClinicalPanel(title = title) {
        steps.forEach { step ->
            EmergencyStepRow(
                step = step,
                checked = checks[step.id] == true,
                onToggle = { onToggle(step.id) },
            )
        }
    }
}

@Composable
private fun EmergencyStepRow(
    step: EmergencyStep,
    checked: Boolean,
    onToggle: () -> Unit,
) {
    val c = LocalClinicalColors.current
    val bg = when {
        checked -> c.emeraldBg
        step.critical == true -> c.redBg
        else -> c.cardInset
    }
    val border = when {
        checked -> c.emeraldBorder
        step.critical == true -> c.redBorder
        else -> c.border
    }
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 48.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(bg)
            .border(1.dp, border, RoundedCornerShape(10.dp))
            .clickable { onToggle() }
            .padding(10.dp)
            .testTag("em_step_${step.id}"),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalAlignment = Alignment.Top,
    ) {
        Box(
            modifier = Modifier
                .padding(top = 2.dp)
                .size(22.dp)
                .clip(RoundedCornerShape(6.dp))
                .background(if (checked) c.emerald else Color.Transparent)
                .border(1.5.dp, if (checked) c.emerald else c.borderLight, RoundedCornerShape(6.dp)),
            contentAlignment = Alignment.Center,
        ) {
            if (checked) {
                Icon(Icons.Default.Check, contentDescription = null, tint = Color.White, modifier = Modifier.size(15.dp))
            }
        }
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text(
                text = step.text,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = if (step.critical == true) FontWeight.Bold else FontWeight.Normal,
                color = if (checked) c.textMuted else c.textPrimary,
                textDecoration = if (checked) TextDecoration.LineThrough else TextDecoration.None,
            )
            if (!step.note.isNullOrBlank()) {
                Text(step.note, style = MaterialTheme.typography.bodySmall, color = c.amber)
            }
        }
    }
}

@Composable
private fun NeedWeightBox() {
    val c = LocalClinicalColors.current
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(c.redBg)
            .border(2.dp, c.red, RoundedCornerShape(16.dp))
            .padding(20.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = "Enter actual body weight above to calculate emergency doses.",
            style = MaterialTheme.typography.titleMedium,
            color = Color(0xFFFECACA),
        )
    }
}
