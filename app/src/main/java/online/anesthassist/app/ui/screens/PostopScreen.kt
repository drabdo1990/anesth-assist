package online.anesthassist.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import online.anesthassist.app.calc.BiometricResult
import online.anesthassist.app.calc.ChoiceScoreResult
import online.anesthassist.app.calc.ScoreContext
import online.anesthassist.app.calc.evaluateChoiceScore
import online.anesthassist.app.data.ChoiceScore
import online.anesthassist.app.data.ClinicalRepository
import online.anesthassist.app.ui.components.ChecklistCard
import online.anesthassist.app.ui.components.ClinicalPanel
import online.anesthassist.app.ui.components.WarningBanner
import online.anesthassist.app.ui.components.WarningLevel
import online.anesthassist.app.ui.theme.JetBrainsMonoFontFamily
import online.anesthassist.app.ui.theme.LocalClinicalColors
import online.anesthassist.app.viewmodel.AnesthUiState
import online.anesthassist.app.viewmodel.AnesthViewModel

@Composable
fun PostopScreen(
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
    val postopChecklists = remember { repository.listsForPhase("postop") }

    LazyColumn(
        modifier = Modifier.fillMaxWidth(),
        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        // 1. Apfel PONV risk score
        item(key = "apfel") {
            RiskScorePanel(
                score = bundle.apfel,
                answers = state.scoreAnswers,
                ctx = scoreCtx,
                sourceTags = repository.sourceTags(bundle.apfel.sourceIds),
                onToggle = viewModel::toggleScoreItem,
            )
        }

        // 2. 2025 ASER PONV Prophylaxis Plan
        item(key = "ponv_plan") {
            val plan = bundle.ponvPlan
            ClinicalPanel(
                title = "PONV Prophylaxis & Risk Reduction",
                subtitle = plan.adults.headline,
                sourceTags = repository.sourceTags(plan.sourceIds),
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
                    Text(
                        "BASELINE RISK REDUCTION (ADULTS)",
                        style = MaterialTheme.typography.labelSmall,
                        color = c.cyan,
                        fontWeight = FontWeight.Bold,
                    )
                    plan.adults.riskReduction.forEach { bullet ->
                        Text("• $bullet", style = MaterialTheme.typography.bodySmall, color = c.textPrimary)
                    }
                }
                WarningBanner(
                    level = WarningLevel.INFO,
                    title = "Antiemetic dosing",
                    body = plan.adults.doseNote,
                )
                WarningBanner(
                    level = WarningLevel.AMBER,
                    title = "Pediatric PONV",
                    body = plan.children,
                )
            }
        }

        // 3. Choice Scores: Modified Aldrete, PADSS, 4AT
        items(bundle.choiceScores, key = { "choice_${it.id}" }) { score ->
            ChoiceScorePanel(
                score = score,
                answers = state.choiceAnswers,
                sourceTags = repository.sourceTags(score.sourceIds),
                onSelect = viewModel::setChoiceAnswer,
            )
        }

        // 4. Emergence & Extubation Checklist
        items(postopChecklists, key = { "postop_list_${it.id}" }) { checklist ->
            ChecklistCard(
                checklist = checklist,
                checks = state.checks,
                sourceTagsFor = repository::sourceTags,
                onToggle = viewModel::toggleCheck,
                onReset = { viewModel.resetChecks(checklist.items.map { it.id }) },
            )
        }

        // 5. Anonymous PACU Handoff Summary
        item(key = "pacu_handoff") {
            HandoffGeneratorCard(
                state = state,
                viewModel = viewModel,
                repository = repository,
            )
        }

        item { Spacer(Modifier.height(16.dp)) }
    }
}

@Composable
private fun ChoiceScorePanel(
    score: ChoiceScore,
    answers: Map<String, Int>,
    sourceTags: List<String>,
    onSelect: (String, Int) -> Unit,
) {
    val c = LocalClinicalColors.current
    val result = remember(score, answers) { evaluateChoiceScore(score, answers) }

    ClinicalPanel(
        title = score.name,
        subtitle = score.why,
        sourceTags = sourceTags,
        headerAction = {
            if (result is ChoiceScoreResult.Ok) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(10.dp))
                        .background(c.cyanBg)
                        .border(1.dp, c.cyanBorder, RoundedCornerShape(10.dp))
                        .padding(horizontal = 10.dp, vertical = 6.dp),
                ) {
                    Text(
                        text = "${result.points}/${result.max}",
                        fontFamily = JetBrainsMonoFontFamily,
                        fontWeight = FontWeight.Black,
                        fontSize = 15.sp,
                        color = c.cyan,
                    )
                }
            }
        },
    ) {
        when (result) {
            is ChoiceScoreResult.Ok -> {
                val is4at = score.id == "4at"
                val level = if (is4at) {
                    when {
                        result.points >= 4 -> WarningLevel.RED
                        result.points >= 1 -> WarningLevel.AMBER
                        else -> WarningLevel.EMERALD
                    }
                } else {
                    if (result.points >= (result.max - 1)) WarningLevel.EMERALD else WarningLevel.AMBER
                }
                WarningBanner(
                    level = level,
                    title = "${result.band.label} (${result.points} / ${result.max})",
                    body = result.band.detail ?: "Score complete.",
                )
            }
            is ChoiceScoreResult.Incomplete -> {
                WarningBanner(
                    level = WarningLevel.INFO,
                    body = "Select all items to score (${result.missing.size} remaining: ${result.missing.joinToString(", ")}).",
                )
            }
        }

        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            score.items.forEach { item ->
                val selectedIdx = answers[item.id]
                Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
                    Text(item.label, style = MaterialTheme.typography.labelLarge, color = c.textPrimary)
                    if (!item.prompt.isNullOrBlank()) {
                        Text(item.prompt, style = MaterialTheme.typography.bodySmall, color = c.textMuted)
                    }
                    Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
                        item.options.forEachIndexed { idx, opt ->
                            val active = selectedIdx == idx
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .heightIn(min = 44.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(if (active) c.cyanBg else c.cardInset)
                                    .border(1.dp, if (active) c.cyanBorder else c.border, RoundedCornerShape(10.dp))
                                    .clickable { onSelect(item.id, idx) }
                                    .padding(horizontal = 10.dp, vertical = 8.dp)
                                    .testTag("choice_${item.id}_$idx"),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Text(
                                    text = opt.label,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = if (active) c.cyan else c.textPrimary,
                                    fontWeight = if (active) FontWeight.Bold else FontWeight.Normal,
                                    modifier = Modifier.weight(1f),
                                )
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(if (active) c.cyan else c.card)
                                        .padding(horizontal = 7.dp, vertical = 2.dp),
                                ) {
                                    Text(
                                        text = "+${opt.points}",
                                        fontFamily = JetBrainsMonoFontFamily,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 11.sp,
                                        color = if (active) (if (c.isDark) Color.Black else Color.White) else c.textMuted,
                                    )
                                }
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
