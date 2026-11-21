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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import online.anesthassist.app.calc.buildHandoffSummary
import online.anesthassist.app.data.ClinicalRepository
import online.anesthassist.app.ui.components.ChecklistCard
import online.anesthassist.app.ui.components.ClinicalPanel
import online.anesthassist.app.ui.theme.JetBrainsMonoFontFamily
import online.anesthassist.app.ui.theme.LocalClinicalColors
import online.anesthassist.app.viewmodel.AnesthUiState
import online.anesthassist.app.viewmodel.AnesthViewModel

@Composable
fun IntraopListsScreen(
    state: AnesthUiState,
    viewModel: AnesthViewModel,
    repository: ClinicalRepository,
) {
    val c = LocalClinicalColors.current
    val lists = remember { repository.listsForPhase("intraop") }
    val groups = remember(lists) { lists.map { it.group }.distinct() }
    var selectedGroup by remember { mutableStateOf("All") }

    val shown = remember(lists, selectedGroup) {
        if (selectedGroup == "All") lists else lists.filter { it.group == selectedGroup }
    }

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
                listOf("All").plus(groups).forEach { grp ->
                    val active = selectedGroup == grp
                    val isCrisis = grp == "Crises"
                    Box(
                        modifier = Modifier
                            .heightIn(min = 44.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(
                                when {
                                    active && isCrisis -> c.red
                                    active -> c.cyan
                                    isCrisis -> c.redBg
                                    else -> c.card
                                }
                            )
                            .border(1.dp, if (isCrisis) c.redBorder else if (active) c.cyan else c.border, RoundedCornerShape(10.dp))
                            .clickable { selectedGroup = grp }
                            .padding(horizontal = 12.dp)
                            .testTag("list_group_${grp.lowercase()}"),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            text = grp,
                            style = MaterialTheme.typography.labelMedium,
                            color = when {
                                active && isCrisis -> Color.White
                                active -> if (c.isDark) Color.Black else Color.White
                                isCrisis -> c.red
                                else -> c.textSecondary
                            },
                        )
                    }
                }
            }
        }

        items(shown, key = { it.id }) { checklist ->
            ChecklistCard(
                checklist = checklist,
                checks = state.checks,
                sourceTagsFor = repository::sourceTags,
                onToggle = viewModel::toggleCheck,
                onReset = { viewModel.resetChecks(checklist.items.map { it.id }) },
            )
        }

        item { Spacer(Modifier.height(16.dp)) }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun HandoffGeneratorCard(
    state: AnesthUiState,
    viewModel: AnesthViewModel,
    repository: ClinicalRepository,
) {
    val c = LocalClinicalColors.current
    val ctx = LocalContext.current
    val opts = repository.bundle.handoffOptions
    val h = state.handoff
    var copied by remember { mutableStateOf(false) }

    val summaryText = remember(h) { buildHandoffSummary(h) }

    ClinicalPanel(
        title = "Anonymous PACU Handoff Summary",
        subtitle = "Fixed pick-lists and numbers only — no free-text patient identifiers.",
    ) {
        Text("Procedure category", style = MaterialTheme.typography.labelMedium, color = c.textMuted)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            opts.procedureCategories.forEach { cat ->
                ChipToggle(cat, h.procedureCategory == cat) {
                    viewModel.updateHandoff { it.copy(procedureCategory = if (it.procedureCategory == cat) "" else cat) }
                }
            }
        }

        Text("ASA status", style = MaterialTheme.typography.labelMedium, color = c.textMuted)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            opts.asaStatus.forEach { asa ->
                ChipToggle(asa, h.asaStatus == asa) {
                    viewModel.updateHandoff { it.copy(asaStatus = if (it.asaStatus == asa) "" else asa) }
                }
            }
        }

        Text("Airway", style = MaterialTheme.typography.labelMedium, color = c.textMuted)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            opts.airway.forEach { aw ->
                ChipToggle(aw, h.airway == aw) {
                    viewModel.updateHandoff { it.copy(airway = if (it.airway == aw) "" else aw) }
                }
            }
        }

        Text("Maintenance", style = MaterialTheme.typography.labelMedium, color = c.textMuted)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            opts.maintenance.forEach { m ->
                ChipToggle(m, h.maintenance == m) {
                    viewModel.updateHandoff { it.copy(maintenance = if (it.maintenance == m) "" else m) }
                }
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
            OutlinedTextField(
                value = h.fluidsMl,
                onValueChange = { v -> viewModel.updateHandoff { it.copy(fluidsMl = v.filter { ch -> ch.isDigit() }) } },
                label = { Text("Fluids (mL)") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                singleLine = true,
                modifier = Modifier.weight(1f),
            )
            OutlinedTextField(
                value = h.bloodLossMl,
                onValueChange = { v -> viewModel.updateHandoff { it.copy(bloodLossMl = v.filter { ch -> ch.isDigit() }) } },
                label = { Text("EBL (mL)") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                singleLine = true,
                modifier = Modifier.weight(1f),
            )
        }

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(10.dp))
                .background(c.cardInset)
                .border(1.dp, c.border, RoundedCornerShape(10.dp))
                .padding(10.dp),
        ) {
            Text(
                text = summaryText,
                fontFamily = JetBrainsMonoFontFamily,
                style = MaterialTheme.typography.bodySmall,
                color = c.textPrimary,
            )
        }

        Button(
            onClick = {
                val cm = ctx.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                cm.setPrimaryClip(ClipData.newPlainText("Anesthesia Handoff", summaryText))
                copied = true
            },
            colors = ButtonDefaults.buttonColors(containerColor = c.cyan, contentColor = if (c.isDark) Color.Black else Color.White),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).testTag("copy_handoff_button"),
        ) {
            Icon(Icons.Default.ContentCopy, contentDescription = null)
            Spacer(Modifier.width(8.dp))
            Text(if (copied) "Copied Handoff Summary" else "Copy Anonymous Handoff", fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun ChipToggle(label: String, active: Boolean, onClick: () -> Unit) {
    val c = LocalClinicalColors.current
    Box(
        modifier = Modifier
            .heightIn(min = 38.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(if (active) c.cyan else c.cardInset)
            .border(1.dp, if (active) c.cyan else c.border, RoundedCornerShape(8.dp))
            .clickable { onClick() }
            .padding(horizontal = 10.dp, vertical = 6.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = if (active) (if (c.isDark) Color.Black else Color.White) else c.textSecondary,
        )
    }
}
