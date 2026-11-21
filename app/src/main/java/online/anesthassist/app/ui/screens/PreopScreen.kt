package online.anesthassist.app.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import online.anesthassist.app.calc.BiometricResult
import online.anesthassist.app.calc.CrclResult
import online.anesthassist.app.calc.RiskScoreResult
import online.anesthassist.app.calc.ScoreContext
import online.anesthassist.app.calc.TimingMatch
import online.anesthassist.app.calc.buildPreopNote
import online.anesthassist.app.calc.calculateCrcl
import online.anesthassist.app.calc.creatinineFromUmol
import online.anesthassist.app.calc.creatinineToUmol
import online.anesthassist.app.calc.derivedValue
import online.anesthassist.app.calc.evaluateRiskScore
import online.anesthassist.app.calc.formatNumber
import online.anesthassist.app.calc.matchTiming
import online.anesthassist.app.calc.riskItemChecked
import online.anesthassist.app.data.ClinicalRepository
import online.anesthassist.app.data.CreatinineUnit
import online.anesthassist.app.data.PeriopMedRule
import online.anesthassist.app.data.RiskScore
import online.anesthassist.app.ui.components.BigValueCard
import online.anesthassist.app.ui.components.ChecklistCard
import online.anesthassist.app.ui.components.ClinicalPanel
import online.anesthassist.app.ui.components.NumericStepper
import online.anesthassist.app.ui.components.SegmentedControl
import online.anesthassist.app.ui.components.SourceTagsRow
import online.anesthassist.app.ui.components.WarningBanner
import online.anesthassist.app.ui.components.WarningLevel
import online.anesthassist.app.ui.theme.JetBrainsMonoFontFamily
import online.anesthassist.app.ui.theme.LocalClinicalColors
import online.anesthassist.app.viewmodel.AnesthUiState
import online.anesthassist.app.viewmodel.AnesthViewModel
import kotlin.math.round

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun PreopScreen(
    state: AnesthUiState,
    viewModel: AnesthViewModel,
    repository: ClinicalRepository,
) {
    val c = LocalClinicalColors.current
    val bundle = repository.bundle
    val p = state.patient
    val bio = (state.biometricResult as? BiometricResult.Ok)?.value
    val scoreCtx = remember(p.ageYears, p.sex, bio?.bmi, p.creatinineUmolL) {
        ScoreContext(p.ageYears, p.sex, bio?.bmi, p.creatinineUmolL)
    }
    val crcl = remember(p.ageYears, p.tbwKg, p.sex, p.creatinineUmolL) {
        calculateCrcl(p.ageYears, p.tbwKg, p.sex, p.creatinineUmolL)
    }
    val crclMl = (crcl as? CrclResult.Ok)?.mlPerMin

    val sections = remember(bundle.periopRules) {
        bundle.periopRules.map { it.section }.distinct()
    }
    var selectedSection by remember { mutableStateOf("All") }
    val filteredRules = remember(bundle.periopRules, selectedSection) {
        if (selectedSection == "All") bundle.periopRules
        else bundle.periopRules.filter { it.section == selectedSection }
    }
    val preopChecklists = remember { repository.listsForPhase("preop") }

    LazyColumn(
        modifier = Modifier.fillMaxWidth(),
        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        // 1. Renal function / Cockcroft-Gault CrCl
        item(key = "crcl") {
            ClinicalPanel(
                title = "Renal Function (Cockcroft-Gault CrCl)",
                subtitle = "Uses actual body weight (adults ≥ 18 y). Auto-matches DOAC & neuraxial hold windows below.",
                sourceTags = repository.sourceTags(listOf("cockcroft-gault-1976", "app-generic")),
                headerAction = {
                    if (p.creatinineUmolL != null) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .clickable { viewModel.setCreatinineUmolL(null) }
                                .testTag("clear_creatinine"),
                            contentAlignment = Alignment.Center,
                        ) {
                            Icon(Icons.Default.Close, contentDescription = "Clear creatinine", tint = c.textMuted)
                        }
                    }
                },
            ) {
                SegmentedControl(
                    options = listOf(
                        CreatinineUnit.MGDL to "mg/dL",
                        CreatinineUnit.UMOL to "µmol/L",
                    ),
                    selected = state.creatinineUnit,
                    onSelect = viewModel::setCreatinineUnit,
                    testTagPrefix = "cr_unit",
                )

                val displayVal = p.creatinineUmolL?.let { creatinineFromUmol(it, state.creatinineUnit) }
                NumericStepper(
                    label = "Serum Creatinine",
                    value = displayVal,
                    unit = if (state.creatinineUnit == CreatinineUnit.MGDL) "mg/dL" else "µmol/L",
                    step = if (state.creatinineUnit == CreatinineUnit.MGDL) 0.1 else 10.0,
                    min = if (state.creatinineUnit == CreatinineUnit.MGDL) 0.2 else 18.0,
                    max = if (state.creatinineUnit == CreatinineUnit.MGDL) 20.0 else 1800.0,
                    decimals = if (state.creatinineUnit == CreatinineUnit.MGDL) 1 else 0,
                    emptyText = "Tap to enter",
                    onChange = { v -> viewModel.setCreatinineUmolL(creatinineToUmol(v, state.creatinineUnit)) },
                    testTag = "stepper_creatinine",
                )

                when (crcl) {
                    is CrclResult.Ok -> {
                        val accent = when {
                            crcl.mlPerMin < 30.0 -> c.red
                            crcl.mlPerMin < 50.0 -> c.amber
                            else -> c.emerald
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                            BigValueCard(
                                label = "Estimated CrCl",
                                value = "${round(crcl.mlPerMin).toInt()}",
                                unit = "mL/min",
                                accentColor = accent,
                                modifier = Modifier.weight(1f),
                            )
                            val altText = p.creatinineUmolL?.let { umol ->
                                if (state.creatinineUnit == CreatinineUnit.MGDL) "${round(umol).toInt()} µmol/L"
                                else "${formatNumber(creatinineFromUmol(umol, CreatinineUnit.MGDL), 2)} mg/dL"
                            } ?: "--"
                            BigValueCard(
                                label = "Equivalent SCr",
                                value = altText,
                                accentColor = c.cyan,
                                modifier = Modifier.weight(1f),
                            )
                        }
                    }
                    is CrclResult.Incomplete -> {
                        WarningBanner(
                            level = WarningLevel.INFO,
                            body = "CrCl needs: ${crcl.missing.joinToString(", ")}.",
                        )
                    }
                }
            }
        }

        // 2. Pre-op Risk Scores (RCRI, STOP-Bang)
        items(bundle.riskScores, key = { "score_${it.id}" }) { score ->
            RiskScorePanel(
                score = score,
                answers = state.scoreAnswers,
                ctx = scoreCtx,
                sourceTags = repository.sourceTags(score.sourceIds),
                onToggle = viewModel::toggleScoreItem,
            )
        }

        // 3. Perioperative Medications Header & Filter
        item(key = "periop_meds_header") {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "Perioperative Medications",
                    style = MaterialTheme.typography.titleMedium,
                    color = c.textPrimary,
                )
                Text(
                    text = "Tick medications the patient takes to include hold/restart guidance in the anonymous Pre-op Note.",
                    style = MaterialTheme.typography.bodySmall,
                    color = c.textMuted,
                )
                Row(
                    modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    (listOf("All") + sections).forEach { sec ->
                        val active = selectedSection == sec
                        Box(
                            modifier = Modifier
                                .heightIn(min = 44.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (active) c.cyan else c.card)
                                .border(1.dp, if (active) c.cyan else c.border, RoundedCornerShape(10.dp))
                                .clickable { selectedSection = sec }
                                .padding(horizontal = 12.dp)
                                .testTag("periop_sec_${sec.lowercase().replace(' ', '_')}"),
                            contentAlignment = Alignment.Center,
                        ) {
                            Text(
                                text = sec,
                                style = MaterialTheme.typography.labelMedium,
                                color = if (active) (if (c.isDark) Color.Black else Color.White) else c.textSecondary,
                            )
                        }
                    }
                }
            }
        }

        items(filteredRules, key = { "periop_${it.id}" }) { rule ->
            PeriopMedRuleCard(
                rule = rule,
                taken = state.medsTaken[rule.id] == true,
                crclMl = crclMl,
                sourceTags = repository.sourceTags(rule.sourceIds),
                sourceTagFor = { id -> repository.sourceById[id]?.tag ?: id },
                onToggleTaken = { viewModel.toggleMedTaken(rule.id) },
                onOpenGlp1Protocols = { viewModel.setReferencesOpen(true) },
            )
        }

        // 4. Fasting / NPO Checklist
        items(preopChecklists, key = { "preop_list_${it.id}" }) { checklist ->
            ChecklistCard(
                checklist = checklist,
                checks = state.checks,
                sourceTagsFor = repository::sourceTags,
                onToggle = viewModel::toggleCheck,
                onReset = { viewModel.resetChecks(checklist.items.map { it.id }) },
            )
        }

        // 5. Anonymous Pre-op Note Builder
        item(key = "preop_note") {
            PreopNoteBuilderCard(
                state = state,
                viewModel = viewModel,
                repository = repository,
            )
        }

        item { Spacer(Modifier.height(16.dp)) }
    }
}

@Composable
fun RiskScorePanel(
    score: RiskScore,
    answers: Map<String, Boolean>,
    ctx: ScoreContext,
    sourceTags: List<String>,
    onToggle: (String) -> Unit,
) {
    val c = LocalClinicalColors.current
    val result = remember(score, answers, ctx) { evaluateRiskScore(score, answers, ctx) }

    ClinicalPanel(
        title = score.name,
        subtitle = score.why,
        sourceTags = sourceTags,
        headerAction = {
            when (result) {
                is RiskScoreResult.Ok -> {
                    val ratio = if (result.max > 0) result.points.toFloat() / result.max else 0f
                    val (bg, border, fg) = when {
                        ratio >= 0.6f -> Triple(c.redBg, c.redBorder, c.red)
                        ratio >= 0.3f -> Triple(c.amberBg, c.amberBorder, c.amber)
                        else -> Triple(c.emeraldBg, c.emeraldBorder, c.emerald)
                    }
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .background(bg)
                            .border(1.dp, border, RoundedCornerShape(10.dp))
                            .padding(horizontal = 10.dp, vertical = 6.dp),
                    ) {
                        Text(
                            text = "${result.points}/${result.max}",
                            fontFamily = JetBrainsMonoFontFamily,
                            fontWeight = FontWeight.Black,
                            fontSize = 15.sp,
                            color = fg,
                        )
                    }
                }
                else -> {}
            }
        },
    ) {
        when (result) {
            is RiskScoreResult.Ok -> {
                val ratio = if (result.max > 0) result.points.toFloat() / result.max else 0f
                val level = when {
                    ratio >= 0.6f -> WarningLevel.RED
                    ratio >= 0.3f -> WarningLevel.AMBER
                    else -> WarningLevel.EMERALD
                }
                WarningBanner(
                    level = level,
                    title = "${result.band.label} (${result.points} / ${result.max})",
                    body = result.band.detail ?: "Calculated from ticked items and patient biometrics.",
                )
            }
            is RiskScoreResult.Incomplete -> {
                WarningBanner(
                    level = WarningLevel.INFO,
                    title = "Needs patient data",
                    body = "Enter ${result.missing.joinToString(", ")} to calculate ${score.name}.",
                )
            }
            is RiskScoreResult.NotApplicable -> {
                WarningBanner(
                    level = WarningLevel.AMBER,
                    title = "Not applicable",
                    body = result.reason,
                )
            }
        }

        if (result !is RiskScoreResult.NotApplicable) {
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                score.items.forEach { item ->
                    val isDerived = item.derive != null
                    val checked = riskItemChecked(item, answers, ctx)
                    val derivedMissing = isDerived && derivedValue(item.derive!!, ctx).second == null

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(min = 48.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (checked) c.cyanBg else c.cardInset)
                            .border(
                                1.dp,
                                if (checked) c.cyanBorder else c.border,
                                RoundedCornerShape(10.dp),
                            )
                            .then(
                                if (!isDerived) Modifier.clickable { onToggle(item.id) } else Modifier
                            )
                            .padding(horizontal = 10.dp, vertical = 8.dp)
                            .testTag("risk_item_${item.id}"),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        Box(
                            modifier = Modifier
                                .size(22.dp)
                                .clip(RoundedCornerShape(6.dp))
                                .background(if (checked) c.cyan else Color.Transparent)
                                .border(1.5.dp, if (checked) c.cyan else c.borderLight, RoundedCornerShape(6.dp)),
                            contentAlignment = Alignment.Center,
                        ) {
                            if (checked) {
                                Icon(
                                    Icons.Default.Check,
                                    contentDescription = null,
                                    tint = if (c.isDark) Color.Black else Color.White,
                                    modifier = Modifier.size(15.dp),
                                )
                            } else if (isDerived) {
                                Icon(
                                    Icons.Default.Lock,
                                    contentDescription = "Auto-derived",
                                    tint = c.textMuted,
                                    modifier = Modifier.size(12.dp),
                                )
                            }
                        }
                        Text(
                            text = item.label,
                            style = MaterialTheme.typography.bodyMedium,
                            color = c.textPrimary,
                            modifier = Modifier.weight(1f),
                        )
                        if (isDerived) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(c.card)
                                    .border(1.dp, c.border, RoundedCornerShape(6.dp))
                                    .padding(horizontal = 6.dp, vertical = 2.dp),
                            ) {
                                Text(
                                    text = if (derivedMissing) "needs data" else if (checked) "auto: yes" else "auto: no",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = if (checked) c.cyan else c.textMuted,
                                    fontFamily = JetBrainsMonoFontFamily,
                                )
                            }
                        }
                    }
                }
            }
        }

        if (!score.note.isNullOrBlank()) {
            Text(score.note, style = MaterialTheme.typography.bodySmall, color = c.textMuted)
        }
    }
}

@Composable
private fun PeriopMedRuleCard(
    rule: PeriopMedRule,
    taken: Boolean,
    crclMl: Double?,
    sourceTags: List<String>,
    sourceTagFor: (String) -> String,
    onToggleTaken: () -> Unit,
    onOpenGlp1Protocols: () -> Unit,
) {
    val c = LocalClinicalColors.current
    var expanded by remember(taken) { mutableStateOf(taken) }

    val (actionBg, actionBorder, actionFg) = when (rule.action.lowercase()) {
        "hold" -> Triple(c.redBg, c.redBorder, c.red)
        "continue" -> Triple(c.emeraldBg, c.emeraldBorder, c.emerald)
        else -> Triple(c.amberBg, c.amberBorder, c.amber)
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(if (taken) c.cyanBg else c.card)
            .border(1.dp, if (taken) c.cyanBorder else c.border, RoundedCornerShape(16.dp))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(if (taken) c.cyan else c.cardInset)
                    .border(1.dp, if (taken) c.cyan else c.borderLight, RoundedCornerShape(10.dp))
                    .clickable { onToggleTaken() }
                    .testTag("periop_tick_${rule.id}"),
                contentAlignment = Alignment.Center,
            ) {
                if (taken) {
                    Icon(
                        Icons.Default.Check,
                        contentDescription = "Patient takes ${rule.drugClass}",
                        tint = if (c.isDark) Color.Black else Color.White,
                    )
                }
            }

            Column(
                modifier = Modifier
                    .weight(1f)
                    .clickable { expanded = !expanded },
                verticalArrangement = Arrangement.spacedBy(3.dp),
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Text(
                        text = rule.drugClass,
                        style = MaterialTheme.typography.titleSmall,
                        color = c.textPrimary,
                        modifier = Modifier.weight(1f, fill = false),
                    )
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(actionBg)
                            .border(1.dp, actionBorder, RoundedCornerShape(6.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp),
                    ) {
                        Text(
                            text = rule.action.uppercase(),
                            style = MaterialTheme.typography.labelSmall,
                            color = actionFg,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                }
                Text(rule.section, style = MaterialTheme.typography.labelSmall, color = c.textMuted)
            }

            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .clickable { expanded = !expanded }
                    .testTag("periop_expand_${rule.id}"),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                    contentDescription = if (expanded) "Collapse" else "Expand",
                    tint = c.textMuted,
                )
            }
        }

        Text(rule.summary, style = MaterialTheme.typography.bodyMedium, color = c.textPrimary)

        if (expanded) {
            if (!rule.why.isNullOrBlank()) {
                Text(rule.why, style = MaterialTheme.typography.bodySmall, color = c.textSecondary)
            }
            rule.cautions.forEach { caution ->
                WarningBanner(level = WarningLevel.AMBER, body = caution)
            }
            rule.drugs.forEach { drug ->
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(c.cardInset)
                        .border(1.dp, c.border, RoundedCornerShape(12.dp))
                        .padding(10.dp),
                    verticalArrangement = Arrangement.spacedBy(5.dp),
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(drug.name, style = MaterialTheme.typography.labelLarge, color = c.cyan)
                        Text(
                            sourceTagFor(drug.sourceId),
                            style = MaterialTheme.typography.labelSmall,
                            fontFamily = JetBrainsMonoFontFamily,
                            color = c.textMuted,
                        )
                    }
                    drug.timings.forEach { t ->
                        val m = matchTiming(t, crclMl)
                        val rowBg = when (m) {
                            TimingMatch.YES -> c.emeraldBg
                            TimingMatch.UNKNOWN -> c.amberBg
                            else -> Color.Transparent
                        }
                        val rowBorder = when (m) {
                            TimingMatch.YES -> c.emeraldBorder
                            TimingMatch.UNKNOWN -> c.amberBorder
                            else -> Color.Transparent
                        }
                        val textAlpha = if (m == TimingMatch.NO) 0.45f else 1f
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(rowBg)
                                .then(if (rowBorder != Color.Transparent) Modifier.border(1.dp, rowBorder, RoundedCornerShape(8.dp)) else Modifier)
                                .padding(horizontal = if (rowBg != Color.Transparent) 8.dp else 0.dp, vertical = 4.dp),
                        ) {
                            val prefix = t.whenText?.let { "$it: " } ?: ""
                            Text(
                                text = "$prefix${t.text}",
                                style = MaterialTheme.typography.bodySmall,
                                color = c.textPrimary.copy(alpha = textAlpha),
                            )
                            if (m == TimingMatch.YES && crclMl != null) {
                                Text(
                                    text = "Matches patient CrCl (${round(crclMl).toInt()} mL/min)",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = c.emerald,
                                )
                            } else if (m == TimingMatch.UNKNOWN) {
                                Text(
                                    text = "Enter CrCl above to highlight matching renal band",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = c.amber,
                                )
                            }
                        }
                    }
                    drug.catheter.forEach { line ->
                        Text("• Catheter / block: $line", style = MaterialTheme.typography.bodySmall, color = c.textSecondary)
                    }
                    if (!drug.restart.isNullOrBlank()) {
                        Text("Restart: ${drug.restart}", style = MaterialTheme.typography.bodySmall, color = c.emerald)
                    }
                }
            }

            if (rule.id.contains("glp1", ignoreCase = true) || rule.drugClass.contains("GLP-1", ignoreCase = true)) {
                Button(
                    onClick = onOpenGlp1Protocols,
                    colors = ButtonDefaults.buttonColors(containerColor = c.cyanBg, contentColor = c.cyan),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).testTag("open_glp1_compare"),
                ) {
                    Icon(Icons.Default.MenuBook, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Compare 5 GLP-1 Society Protocols", fontWeight = FontWeight.Bold)
                }
            }

            if (sourceTags.isNotEmpty()) {
                SourceTagsRow(sourceTags)
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun PreopNoteBuilderCard(
    state: AnesthUiState,
    viewModel: AnesthViewModel,
    repository: ClinicalRepository,
) {
    val c = LocalClinicalColors.current
    val ctx = LocalContext.current
    val bundle = repository.bundle
    var copied by remember { mutableStateOf(false) }

    val noteText = remember(
        state.patient,
        state.asaClass,
        state.asaEmergency,
        state.fastingStatus,
        state.scoreAnswers,
        state.medsTaken,
    ) {
        buildPreopNote(
            ageYears = state.patient.ageYears,
            sex = state.patient.sex,
            tbwKg = state.patient.tbwKg,
            heightCm = state.patient.heightCm,
            creatinineUmolL = state.patient.creatinineUmolL,
            asaClass = state.asaClass,
            asaEmergency = state.asaEmergency,
            fastingStatus = state.fastingStatus,
            scoreAnswers = state.scoreAnswers,
            medsTaken = state.medsTaken,
            riskScores = bundle.riskScores,
            periopRules = bundle.periopRules,
            sourceById = repository.sourceById,
            dataVersion = bundle.dataVersion,
        )
    }

    ClinicalPanel(
        title = "Anonymous Pre-op Assessment Note",
        subtitle = "Zero-PHI structured summary from your current inputs. No patient identifiers included.",
    ) {
        Text("ASA Physical Status", style = MaterialTheme.typography.labelMedium, color = c.textMuted)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            listOf("I", "II", "III", "IV", "V", "VI").forEach { asa ->
                val active = state.asaClass == asa
                Box(
                    modifier = Modifier
                        .heightIn(min = 44.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(if (active) c.cyan else c.cardInset)
                        .border(1.dp, if (active) c.cyan else c.border, RoundedCornerShape(10.dp))
                        .clickable { viewModel.setAsaClass(if (active) null else asa) }
                        .padding(horizontal = 14.dp)
                        .testTag("asa_$asa"),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        text = "ASA $asa",
                        style = MaterialTheme.typography.labelMedium,
                        color = if (active) (if (c.isDark) Color.Black else Color.White) else c.textSecondary,
                    )
                }
            }
            val emActive = state.asaEmergency
            Box(
                modifier = Modifier
                    .heightIn(min = 44.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(if (emActive) c.red else c.redBg)
                    .border(1.dp, if (emActive) c.red else c.redBorder, RoundedCornerShape(10.dp))
                    .clickable { viewModel.setAsaEmergency(!emActive) }
                    .padding(horizontal = 14.dp)
                    .testTag("asa_emergency"),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = "-E (Emergency)",
                    style = MaterialTheme.typography.labelMedium,
                    color = if (emActive) Color.White else c.red,
                )
            }
        }

        Text("Fasting Status", style = MaterialTheme.typography.labelMedium, color = c.textMuted)
        val fastingOptions = listOf(
            "Meets local fasting protocol",
            "Does not meet local fasting protocol",
        )
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            fastingOptions.forEach { opt ->
                val active = state.fastingStatus == opt
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 44.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(if (active) c.cyanBg else c.cardInset)
                        .border(1.dp, if (active) c.cyanBorder else c.border, RoundedCornerShape(10.dp))
                        .clickable { viewModel.setFastingStatus(if (active) null else opt) }
                        .padding(horizontal = 12.dp, vertical = 10.dp)
                        .testTag("fasting_${if (opt.startsWith("Meets")) "ok" else "not_ok"}"),
                ) {
                    Text(
                        text = opt,
                        style = MaterialTheme.typography.bodyMedium,
                        color = if (active) c.cyan else c.textPrimary,
                        fontWeight = if (active) FontWeight.Bold else FontWeight.Normal,
                    )
                }
            }
        }

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(c.cardInset)
                .border(1.dp, c.border, RoundedCornerShape(12.dp))
                .padding(10.dp),
        ) {
            Text(
                text = noteText,
                fontFamily = JetBrainsMonoFontFamily,
                fontSize = 11.sp,
                lineHeight = 16.sp,
                color = c.textPrimary,
            )
        }

        Button(
            onClick = {
                val cm = ctx.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                cm.setPrimaryClip(ClipData.newPlainText("Pre-op Assessment Note", noteText))
                copied = true
            },
            colors = ButtonDefaults.buttonColors(
                containerColor = c.cyan,
                contentColor = if (c.isDark) Color.Black else Color.White,
            ),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).testTag("copy_preop_note"),
        ) {
            Icon(Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(8.dp))
            Text(if (copied) "Copied Pre-op Note" else "Copy Anonymous Pre-op Note", fontWeight = FontWeight.Bold)
        }
    }
}
