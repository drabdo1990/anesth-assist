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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.FactCheck
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import online.anesthassist.app.R
import online.anesthassist.app.calc.searchConditions
import online.anesthassist.app.data.ClinicalRepository
import online.anesthassist.app.data.ConditionRecord
import online.anesthassist.app.ui.components.NoSourceBox
import online.anesthassist.app.ui.components.SourceTagsRow
import online.anesthassist.app.ui.components.WarningBanner
import online.anesthassist.app.ui.components.WarningLevel
import online.anesthassist.app.ui.theme.JetBrainsMonoFontFamily
import online.anesthassist.app.ui.theme.LocalClinicalColors
import online.anesthassist.app.viewmodel.AnesthViewModel
import online.anesthassist.app.viewmodel.EmergencyKind

private const val EMERGENCY_CATEGORY = "Acute Intraoperative Emergencies"

private enum class ConditionScope(val label: String) {
    ALL("All"),
    EMERGENCIES("Emergencies"),
    SUBSPECIALTY("Subspecialty"),
    STOELTING("Stoelting 8e"),
}

@Composable
fun ConditionsScreen(
    viewModel: AnesthViewModel,
    repository: ClinicalRepository,
) {
    val c = LocalClinicalColors.current
    val bundle = repository.bundle
    var query by remember { mutableStateOf("") }
    var scope by remember { mutableStateOf(ConditionScope.ALL) }
    var selectedChapter by remember { mutableStateOf<Int?>(null) }
    var selectedCategory by remember { mutableStateOf<String?>(null) }
    var expandedId by remember { mutableStateOf<String?>(null) }

    val emergencyCount = remember(bundle.conditions) {
        bundle.conditions.count { it.category == EMERGENCY_CATEGORY }
    }
    val stoeltingCount = remember(bundle.conditions) {
        bundle.conditions.count { it.chapter != null }
    }
    val subspecialtyCount = remember(bundle.conditions) {
        bundle.conditions.count { it.chapter == null && it.category != EMERGENCY_CATEGORY }
    }

    val chapters = remember(bundle.conditions) {
        bundle.conditions.mapNotNull { it.chapter }.distinct().sorted()
    }
    val subspecialtyCategories = remember(bundle.conditions) {
        bundle.conditions
            .filter { it.chapter == null && it.category != null && it.category != EMERGENCY_CATEGORY }
            .mapNotNull { it.category }
            .distinct()
            .sorted()
    }

    val filtered = remember(query, scope, selectedChapter, selectedCategory, bundle.conditions) {
        val searched = searchConditions(bundle.conditions, bundle.stoeltingChapters, query)
        val scoped = when (scope) {
            ConditionScope.ALL -> searched
            ConditionScope.EMERGENCIES -> searched.filter { it.category == EMERGENCY_CATEGORY }
            ConditionScope.SUBSPECIALTY -> searched.filter { it.chapter == null && it.category != EMERGENCY_CATEGORY }
            ConditionScope.STOELTING -> searched.filter { it.chapter != null }
        }
        when {
            scope == ConditionScope.STOELTING && selectedChapter != null ->
                scoped.filter { it.chapter == selectedChapter }
            scope == ConditionScope.SUBSPECIALTY && selectedCategory != null ->
                scoped.filter { it.category == selectedCategory }
            else -> scoped
        }
    }

    LazyColumn(
        modifier = Modifier.fillMaxWidth(),
        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item(key = "cond_search") {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "Stoelting 8e rare diseases ($stoeltingCount), Acute Intraoperative Emergencies ($emergencyCount), and Subspecialty board cards ($subspecialtyCount). Offline search; nothing you type is stored.",
                    style = MaterialTheme.typography.bodySmall,
                    color = c.textMuted,
                )

                OutlinedTextField(
                    value = query,
                    onValueChange = { query = it },
                    placeholder = { Text("Search ${bundle.conditions.size} conditions, emergencies, aliases...") },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = stringResource(R.string.cd_search)) },
                    trailingIcon = {
                        if (query.isNotEmpty()) {
                            IconButton(
                                onClick = { query = "" },
                                modifier = Modifier.testTag("clear_conditions_search"),
                            ) {
                                Icon(Icons.Default.Close, contentDescription = stringResource(R.string.cd_clear))
                            }
                        }
                    },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("conditions_search_input"),
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = "Showing ${filtered.size} of ${bundle.conditions.size} conditions",
                        style = MaterialTheme.typography.labelSmall,
                        color = c.textMuted,
                    )
                    Text(
                        text = "185 Cards · Offline",
                        style = MaterialTheme.typography.labelSmall,
                        fontFamily = JetBrainsMonoFontFamily,
                        color = c.cyan,
                    )
                }

                // Primary scope filter chips
                Row(
                    modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    FilterChip(
                        label = "All (${bundle.conditions.size})",
                        active = scope == ConditionScope.ALL,
                        amberTone = false,
                        testTag = "scope_all",
                    ) {
                        scope = ConditionScope.ALL
                        selectedChapter = null
                        selectedCategory = null
                    }
                    FilterChip(
                        label = "Emergencies ($emergencyCount)",
                        active = scope == ConditionScope.EMERGENCIES,
                        amberTone = true,
                        testTag = "scope_emergencies",
                    ) {
                        scope = ConditionScope.EMERGENCIES
                        selectedChapter = null
                        selectedCategory = null
                    }
                    FilterChip(
                        label = "Subspecialty ($subspecialtyCount)",
                        active = scope == ConditionScope.SUBSPECIALTY,
                        amberTone = false,
                        testTag = "scope_subspecialty",
                    ) {
                        scope = ConditionScope.SUBSPECIALTY
                        selectedChapter = null
                        selectedCategory = null
                    }
                    FilterChip(
                        label = "Stoelting 8e ($stoeltingCount)",
                        active = scope == ConditionScope.STOELTING,
                        amberTone = false,
                        testTag = "scope_stoelting",
                    ) {
                        scope = ConditionScope.STOELTING
                        selectedChapter = null
                        selectedCategory = null
                    }
                }

                // Contextual secondary filter row
                if (scope == ConditionScope.STOELTING) {
                    Row(
                        modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        FilterChip("All Chapters", selectedChapter == null, false, "chap_all") {
                            selectedChapter = null
                        }
                        chapters.forEach { ch ->
                            val title = bundle.stoeltingChapters[ch.toString()] ?: "Ch $ch"
                            FilterChip(
                                label = "Ch $ch · $title",
                                active = selectedChapter == ch,
                                amberTone = false,
                                testTag = "chap_$ch",
                            ) {
                                selectedChapter = if (selectedChapter == ch) null else ch
                            }
                        }
                    }
                } else if (scope == ConditionScope.SUBSPECIALTY) {
                    Row(
                        modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        FilterChip("All Subspecialties", selectedCategory == null, false, "subcat_all") {
                            selectedCategory = null
                        }
                        subspecialtyCategories.forEach { cat ->
                            FilterChip(
                                label = cat,
                                active = selectedCategory == cat,
                                amberTone = false,
                                testTag = "subcat_${cat.lowercase().replace(' ', '_')}",
                            ) {
                                selectedCategory = if (selectedCategory == cat) null else cat
                            }
                        }
                    }
                }
            }
        }

        if (filtered.isEmpty()) {
            item(key = "cond_empty") {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(c.card)
                        .border(1.dp, c.border, RoundedCornerShape(14.dp))
                        .padding(20.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Text("No conditions match \"$query\".", style = MaterialTheme.typography.bodyMedium, color = c.textMuted)
                }
            }
        } else {
            items(filtered, key = { it.id }) { condition ->
                val expanded = expandedId == condition.id
                val subtitleLine = if (condition.chapter != null) {
                    val chName = bundle.stoeltingChapters[condition.chapter.toString()] ?: "Chapter ${condition.chapter}"
                    "Ch ${condition.chapter} · $chName"
                } else {
                    condition.category ?: "Clinical Reference"
                }
                val summaryAttribution = if (condition.chapter != null) {
                    val chName = bundle.stoeltingChapters[condition.chapter.toString()] ?: "Chapter ${condition.chapter}"
                    "Stoelting's Anesthesia and Co-Existing Disease, 8th edition (2022), chapter ${condition.chapter}: $chName."
                } else {
                    "Anesthesia Considerations for Oral Board Exam — ${condition.category ?: "Clinical Reference"}."
                }
                ConditionCard(
                    condition = condition,
                    subtitleLine = subtitleLine,
                    summaryAttribution = summaryAttribution,
                    expanded = expanded,
                    sourceTags = repository.sourceTags(condition.sourceIds),
                    onToggleExpand = { expandedId = if (expanded) null else condition.id },
                    onOpenEmergency = { kind -> viewModel.openEmergency(kind) },
                    onOpenChecklist = { id -> viewModel.openChecklist(id) },
                )
            }
        }

        item { Spacer(Modifier.height(16.dp)) }
    }
}

@Composable
private fun FilterChip(
    label: String,
    active: Boolean,
    amberTone: Boolean,
    testTag: String,
    onClick: () -> Unit,
) {
    val c = LocalClinicalColors.current
    val bg = when {
        active && amberTone -> c.amber
        active -> c.cyan
        amberTone -> c.amberBg
        else -> c.card
    }
    val border = when {
        active && amberTone -> c.amber
        active -> c.cyan
        amberTone -> c.amberBorder
        else -> c.border
    }
    val fg = when {
        active && amberTone -> Color.Black
        active -> if (c.isDark) Color.Black else Color.White
        amberTone -> c.amber
        else -> c.textSecondary
    }
    Box(
        modifier = Modifier
            .heightIn(min = 40.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(bg)
            .border(1.dp, border, RoundedCornerShape(10.dp))
            .clickable { onClick() }
            .padding(horizontal = 10.dp)
            .testTag(testTag),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = fg,
            fontWeight = if (active || amberTone) FontWeight.Bold else FontWeight.Medium,
        )
    }
}

@Composable
private fun ConditionCard(
    condition: ConditionRecord,
    subtitleLine: String,
    summaryAttribution: String,
    expanded: Boolean,
    sourceTags: List<String>,
    onToggleExpand: () -> Unit,
    onOpenEmergency: (EmergencyKind) -> Unit,
    onOpenChecklist: (String) -> Unit,
) {
    val c = LocalClinicalColors.current
    val isEmergency = condition.category == EMERGENCY_CATEGORY
    val crisisKind = when (condition.crisis) {
        "mh" -> EmergencyKind.MH
        "last" -> EmergencyKind.LAST
        else -> null
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(c.card)
            .border(
                1.dp,
                when {
                    expanded -> c.cyanBorder
                    isEmergency -> c.amberBorder
                    else -> c.border
                },
                RoundedCornerShape(14.dp),
            )
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { onToggleExpand() }
                .testTag("condition_${condition.id}"),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Text(
                        text = condition.name,
                        style = MaterialTheme.typography.titleSmall,
                        color = c.textPrimary,
                        modifier = Modifier.weight(1f, fill = false),
                    )
                    if (isEmergency) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(c.amberBg)
                                .border(1.dp, c.amberBorder, RoundedCornerShape(6.dp))
                                .padding(horizontal = 6.dp, vertical = 2.dp),
                        ) {
                            Text(
                                text = "EMERGENCY",
                                style = MaterialTheme.typography.labelSmall,
                                fontFamily = JetBrainsMonoFontFamily,
                                color = c.amber,
                                fontWeight = FontWeight.Bold,
                            )
                        }
                    }
                    if (crisisKind != null) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(c.redBg)
                                .border(1.dp, c.redBorder, RoundedCornerShape(6.dp))
                                .padding(horizontal = 6.dp, vertical = 2.dp),
                        ) {
                            Text(
                                text = "SOS: ${crisisKind.label}",
                                style = MaterialTheme.typography.labelSmall,
                                fontFamily = JetBrainsMonoFontFamily,
                                color = c.red,
                                fontWeight = FontWeight.Bold,
                            )
                        }
                    }
                }
                Text(
                    text = subtitleLine,
                    style = MaterialTheme.typography.labelSmall,
                    color = if (isEmergency) c.amber else c.textMuted,
                )
                if (condition.aliases.isNotEmpty()) {
                    Text(
                        text = condition.aliases.joinToString(" · "),
                        style = MaterialTheme.typography.bodySmall,
                        color = c.textSecondary,
                    )
                }
            }
            Box(modifier = Modifier.size(44.dp), contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                    contentDescription = if (expanded) "Collapse ${condition.name}" else "Expand ${condition.name}",
                    tint = c.textMuted,
                )
            }
        }

        if (expanded) {
            val summaryTitle = when {
                condition.chapter != null -> "Textbook summary"
                isEmergency -> "Board emergency summary"
                else -> "Board subspecialty summary"
            }
            WarningBanner(
                level = WarningLevel.INFO,
                title = summaryTitle,
                body = "A short summary of $summaryAttribution Check current society guidance and your local protocol.",
            )

            val plan = condition.plan
            if (plan == null) {
                NoSourceBox(topic = condition.name)
            } else {
                ConditionSectionBlock("Pre-op", plan.preop, c.cyan, c.cyanBg, c.cyanBorder)
                ConditionSectionBlock("Intra-op", plan.intraop, c.emerald, c.emeraldBg, c.emeraldBorder)
                ConditionSectionBlock("Avoid", plan.avoid, c.red, c.redBg, c.redBorder)
                ConditionSectionBlock("Post-op", plan.postop, c.purple, c.purpleBg, c.purpleBorder)
            }

            if (crisisKind != null) {
                Button(
                    onClick = { onOpenEmergency(crisisKind) },
                    colors = ButtonDefaults.buttonColors(containerColor = c.red, contentColor = Color.White),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).testTag("open_sos_${condition.id}"),
                ) {
                    Icon(Icons.Default.Warning, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = if (crisisKind == EmergencyKind.MH) "Open MH crisis steps" else "Open LAST crisis steps",
                        fontWeight = FontWeight.Bold,
                    )
                }
            }

            if (!condition.checklistId.isNullOrBlank()) {
                Button(
                    onClick = { onOpenChecklist(condition.checklistId) },
                    colors = ButtonDefaults.buttonColors(containerColor = c.cyanBg, contentColor = c.cyan),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 48.dp)
                        .border(1.dp, c.cyanBorder, RoundedCornerShape(10.dp))
                        .testTag("open_checklist_${condition.id}"),
                ) {
                    Icon(Icons.Default.FactCheck, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Open crisis checklist in Lists", fontWeight = FontWeight.Bold)
                }
            }

            if (sourceTags.isNotEmpty()) {
                SourceTagsRow(sourceTags)
            }
        }
    }
}

@Composable
private fun ConditionSectionBlock(
    title: String,
    items: List<String>,
    accent: Color,
    bg: Color,
    border: Color,
) {
    if (items.isEmpty()) return
    val c = LocalClinicalColors.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(bg)
            .border(1.dp, border, RoundedCornerShape(10.dp))
            .padding(10.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Text(title.uppercase(), style = MaterialTheme.typography.labelSmall, color = accent, fontWeight = FontWeight.Bold)
        items.forEach { bullet ->
            Text("• $bullet", style = MaterialTheme.typography.bodySmall, color = c.textPrimary)
        }
    }
}
