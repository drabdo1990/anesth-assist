package online.anesthassist.app.ui.screens

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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
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
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import online.anesthassist.app.data.ClinicalRepository
import online.anesthassist.app.data.PlanCard
import online.anesthassist.app.ui.components.NoSourceBox
import online.anesthassist.app.ui.components.SourceTagsRow
import online.anesthassist.app.ui.theme.LocalClinicalColors
import online.anesthassist.app.viewmodel.AnesthUiState
import online.anesthassist.app.viewmodel.AnesthViewModel
import online.anesthassist.app.viewmodel.AppTab
import online.anesthassist.app.viewmodel.IntraopView

private val PLAN_PHASES = listOf(
    "preop" to "Pre-op",
    "induction" to "Induction",
    "maintenance" to "Maintenance",
    "emergence" to "Emergence",
    "redFlags" to "Red Flags",
)

@Composable
fun PlansScreen(
    state: AnesthUiState,
    viewModel: AnesthViewModel,
    repository: ClinicalRepository,
) {
    val c = LocalClinicalColors.current
    val cards = repository.bundle.planCards
    var selectedCardId by remember { mutableStateOf<String?>(null) }
    val shown = remember(cards, selectedCardId) {
        if (selectedCardId == null) cards else cards.filter { it.id == selectedCardId }
    }

    LazyColumn(
        modifier = Modifier.fillMaxWidth(),
        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item(key = "plans_filter") {
            Row(
                modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                PlanFilterChip("All Plans", selectedCardId == null, "plan_filter_all") {
                    selectedCardId = null
                }
                cards.forEach { card ->
                    PlanFilterChip(
                        label = card.title,
                        active = selectedCardId == card.id,
                        testTag = "plan_filter_${card.id}",
                    ) {
                        selectedCardId = if (selectedCardId == card.id) null else card.id
                    }
                }
            }
        }

        items(shown, key = { it.id }) { card ->
            PlanCardPanel(
                card = card,
                initiallyExpanded = selectedCardId == card.id || cards.firstOrNull()?.id == card.id,
                state = state,
                viewModel = viewModel,
                repository = repository,
            )
        }

        item { Spacer(Modifier.height(16.dp)) }
    }
}

@Composable
private fun PlanFilterChip(
    label: String,
    active: Boolean,
    testTag: String,
    onClick: () -> Unit,
) {
    val c = LocalClinicalColors.current
    Box(
        modifier = Modifier
            .heightIn(min = 44.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(if (active) c.cyan else c.card)
            .border(1.dp, if (active) c.cyan else c.border, RoundedCornerShape(10.dp))
            .clickable { onClick() }
            .padding(horizontal = 12.dp)
            .testTag(testTag),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = if (active) (if (c.isDark) Color.Black else Color.White) else c.textSecondary,
        )
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun PlanCardPanel(
    card: PlanCard,
    initiallyExpanded: Boolean,
    state: AnesthUiState,
    viewModel: AnesthViewModel,
    repository: ClinicalRepository,
) {
    val c = LocalClinicalColors.current
    var expanded by remember(card.id, initiallyExpanded) { mutableStateOf(initiallyExpanded) }

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
                .clickable { expanded = !expanded }
                .testTag("plan_card_${card.id}"),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(card.title, style = MaterialTheme.typography.titleMedium, color = c.textPrimary)
                Text(card.population, style = MaterialTheme.typography.labelMedium, color = c.cyan)
            }
            Box(
                modifier = Modifier.size(44.dp),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                    contentDescription = if (expanded) "Collapse ${card.title}" else "Expand ${card.title}",
                    tint = c.textMuted,
                )
            }
        }

        Text(card.why, style = MaterialTheme.typography.bodySmall, color = c.textSecondary)

        if (expanded) {
            PLAN_PHASES.forEach { (phaseKey, phaseLabel) ->
                val items = remember(card.id, phaseKey) { repository.planItems(card, phaseKey) }
                val isRedFlag = phaseKey == "redFlags"
                val headerColor = if (isRedFlag) c.red else c.cyan

                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = phaseLabel.uppercase(),
                        style = MaterialTheme.typography.labelSmall,
                        color = headerColor,
                        fontWeight = FontWeight.Bold,
                    )
                    if (items.isEmpty()) {
                        NoSourceBox(topic = "$phaseLabel items")
                    } else {
                        items.forEach { item ->
                            val checked = state.checks[item.id] == true
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .heightIn(min = 48.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(
                                        when {
                                            checked -> c.emeraldBg
                                            isRedFlag -> c.redBg
                                            else -> c.cardInset
                                        }
                                    )
                                    .border(
                                        1.dp,
                                        when {
                                            checked -> c.emeraldBorder
                                            isRedFlag -> c.redBorder
                                            else -> c.border
                                        },
                                        RoundedCornerShape(10.dp),
                                    )
                                    .clickable { viewModel.toggleCheck(item.id) }
                                    .padding(horizontal = 10.dp, vertical = 8.dp)
                                    .testTag("plan_${card.id}_item_${item.id}"),
                                verticalAlignment = Alignment.Top,
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                            ) {
                                Box(
                                    modifier = Modifier
                                        .padding(top = 2.dp)
                                        .size(20.dp)
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(if (checked) c.emerald else Color.Transparent)
                                        .border(1.5.dp, if (checked) c.emerald else c.borderLight, RoundedCornerShape(6.dp)),
                                    contentAlignment = Alignment.Center,
                                ) {
                                    if (checked) {
                                        Icon(Icons.Default.Check, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
                                    }
                                }
                                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Text(
                                        text = item.text,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = if (checked) c.textMuted else c.textPrimary,
                                        textDecoration = if (checked) TextDecoration.LineThrough else TextDecoration.None,
                                    )
                                    val tags = repository.sourceTags(item.sourceIds)
                                    if (tags.isNotEmpty()) {
                                        SourceTagsRow(tags)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Deep links
            val links = card.links
            val hasAnyLink = links.ventScenarioId != null ||
                links.airway == true ||
                links.dosing == true ||
                links.lists == true ||
                links.references == true

            if (hasAnyLink) {
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    if (links.dosing == true) {
                        PlanDeepLinkChip("Open Dosing", "link_${card.id}_dosing") {
                            viewModel.setActiveTab(AppTab.INTRAOP)
                            viewModel.setIntraopView(IntraopView.DOSING)
                        }
                    }
                    if (links.airway == true) {
                        PlanDeepLinkChip("Open Airway", "link_${card.id}_airway") {
                            viewModel.setActiveTab(AppTab.INTRAOP)
                            viewModel.setIntraopView(IntraopView.AIRWAY)
                        }
                    }
                    links.ventScenarioId?.let { scId ->
                        PlanDeepLinkChip("Open Vent ($scId)", "link_${card.id}_vent") {
                            viewModel.selectVentScenario(scId)
                            viewModel.setActiveTab(AppTab.INTRAOP)
                            viewModel.setIntraopView(IntraopView.VENT)
                        }
                    }
                    if (links.lists == true) {
                        PlanDeepLinkChip("Open Lists", "link_${card.id}_lists") {
                            viewModel.setActiveTab(AppTab.INTRAOP)
                            viewModel.setIntraopView(IntraopView.LISTS)
                        }
                    }
                    if (links.references == true) {
                        PlanDeepLinkChip("References", "link_${card.id}_refs") {
                            viewModel.setReferencesOpen(true)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PlanDeepLinkChip(label: String, testTag: String, onClick: () -> Unit) {
    val c = LocalClinicalColors.current
    Row(
        modifier = Modifier
            .heightIn(min = 44.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(c.cyanBg)
            .border(1.dp, c.cyanBorder, RoundedCornerShape(10.dp))
            .clickable { onClick() }
            .padding(horizontal = 12.dp)
            .testTag(testTag),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = c.cyan, fontWeight = FontWeight.Bold)
        Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, tint = c.cyan, modifier = Modifier.size(15.dp))
    }
}
