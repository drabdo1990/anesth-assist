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
import online.anesthassist.app.ui.theme.JetBrainsMonoFontFamily
import online.anesthassist.app.ui.theme.LocalClinicalColors
import online.anesthassist.app.viewmodel.AnesthViewModel
import online.anesthassist.app.viewmodel.EmergencyKind

@Composable
fun ConditionsScreen(
    viewModel: AnesthViewModel,
    repository: ClinicalRepository,
) {
    val c = LocalClinicalColors.current
    val bundle = repository.bundle
    var query by remember { mutableStateOf("") }
    var selectedChapter by remember { mutableStateOf<Int?>(null) }
    var expandedId by remember { mutableStateOf<String?>(null) }

    val chapters = remember(bundle.conditions) {
        bundle.conditions.map { it.chapter }.distinct().sorted()
    }

    val filtered = remember(query, selectedChapter, bundle.conditions) {
        val searched = searchConditions(bundle.conditions, bundle.stoeltingChapters, query)
        if (selectedChapter == null) searched else searched.filter { it.chapter == selectedChapter }
    }

    LazyColumn(
        modifier = Modifier.fillMaxWidth(),
        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item(key = "cond_search") {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = query,
                    onValueChange = { query = it },
                    placeholder = { Text("Search 110 conditions, abbreviations, chapters...") },
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
                        text = "Stoelting 8e · Offline",
                        style = MaterialTheme.typography.labelSmall,
                        fontFamily = JetBrainsMonoFontFamily,
                        color = c.cyan,
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    ChapterChip("All", selectedChapter == null, "chap_all") { selectedChapter = null }
                    chapters.forEach { ch ->
                        val title = bundle.stoeltingChapters[ch.toString()] ?: "Ch $ch"
                        ChapterChip(
                            label = "Ch $ch · $title",
                            active = selectedChapter == ch,
                            testTag = "chap_$ch",
                        ) {
                            selectedChapter = if (selectedChapter == ch) null else ch
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
                val chapterName = bundle.stoeltingChapters[condition.chapter.toString()] ?: "Chapter ${condition.chapter}"
                ConditionCard(
                    condition = condition,
                    chapterName = chapterName,
                    expanded = expanded,
                    sourceTags = repository.sourceTags(condition.sourceIds),
                    onToggleExpand = { expandedId = if (expanded) null else condition.id },
                    onOpenMh = { viewModel.openEmergency(EmergencyKind.MH) },
                )
            }
        }

        item { Spacer(Modifier.height(16.dp)) }
    }
}

@Composable
private fun ChapterChip(label: String, active: Boolean, testTag: String, onClick: () -> Unit) {
    val c = LocalClinicalColors.current
    Box(
        modifier = Modifier
            .heightIn(min = 40.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(if (active) c.cyan else c.card)
            .border(1.dp, if (active) c.cyan else c.border, RoundedCornerShape(10.dp))
            .clickable { onClick() }
            .padding(horizontal = 10.dp)
            .testTag(testTag),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = if (active) (if (c.isDark) Color.Black else Color.White) else c.textSecondary,
        )
    }
}

@Composable
private fun ConditionCard(
    condition: ConditionRecord,
    chapterName: String,
    expanded: Boolean,
    sourceTags: List<String>,
    onToggleExpand: () -> Unit,
    onOpenMh: () -> Unit,
) {
    val c = LocalClinicalColors.current
    val hasMhCrisis = condition.crisis == "mh"

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(c.card)
            .border(1.dp, if (expanded) c.cyanBorder else c.border, RoundedCornerShape(14.dp))
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
                    if (hasMhCrisis) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(c.redBg)
                                .border(1.dp, c.redBorder, RoundedCornerShape(6.dp))
                                .padding(horizontal = 6.dp, vertical = 2.dp),
                        ) {
                            Text("MH TRIGGER", style = MaterialTheme.typography.labelSmall, color = c.red, fontWeight = FontWeight.Bold)
                        }
                    }
                }
                Text(
                    text = "Ch ${condition.chapter} · $chapterName",
                    style = MaterialTheme.typography.labelSmall,
                    color = c.textMuted,
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
            if (hasMhCrisis) {
                Button(
                    onClick = onOpenMh,
                    colors = ButtonDefaults.buttonColors(containerColor = c.red, contentColor = Color.White),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).testTag("open_mh_${condition.id}"),
                ) {
                    Icon(Icons.Default.Warning, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Open SOS · Malignant Hyperthermia Protocol", fontWeight = FontWeight.Bold)
                }
            }

            val plan = condition.plan
            if (plan == null) {
                NoSourceBox(topic = condition.name)
            } else {
                ConditionSectionBlock("Pre-op", plan.preop, c.cyan, c.cyanBg, c.cyanBorder)
                ConditionSectionBlock("Intra-op", plan.intraop, c.emerald, c.emeraldBg, c.emeraldBorder)
                ConditionSectionBlock("Avoid", plan.avoid, c.red, c.redBg, c.redBorder)
                ConditionSectionBlock("Post-op", plan.postop, c.purple, c.purpleBg, c.purpleBorder)
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
