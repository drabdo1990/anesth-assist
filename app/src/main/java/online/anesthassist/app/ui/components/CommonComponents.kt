package online.anesthassist.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Backspace
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import online.anesthassist.app.R
import online.anesthassist.app.calc.formatNumber
import online.anesthassist.app.data.ChecklistRecord
import online.anesthassist.app.data.NO_SOURCE_VALUE
import online.anesthassist.app.ui.theme.JetBrainsMonoFontFamily
import online.anesthassist.app.ui.theme.LocalClinicalColors
import kotlin.math.round

enum class WarningLevel { INFO, AMBER, RED, EMERALD }

@Composable
fun DisclaimerBanner(modifier: Modifier = Modifier) {
    val c = LocalClinicalColors.current
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(c.card.copy(alpha = 0.95f))
            .border(width = 0.5.dp, color = c.cyan.copy(alpha = 0.25f))
            .padding(horizontal = 10.dp, vertical = 5.dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(
            imageVector = Icons.Default.ErrorOutline,
            contentDescription = null,
            tint = c.amber,
            modifier = Modifier.size(13.dp),
        )
        Spacer(Modifier.width(5.dp))
        Text(
            text = "${stringResource(R.string.disclaimer_author)} · ${stringResource(R.string.disclaimer_text)}",
            style = MaterialTheme.typography.labelSmall,
            color = c.textSecondary,
            textAlign = TextAlign.Center,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

@Composable
fun WarningBanner(
    level: WarningLevel,
    title: String? = null,
    modifier: Modifier = Modifier,
    body: String,
) {
    val c = LocalClinicalColors.current
    val (bg, border, accent, icon) = when (level) {
        WarningLevel.RED -> Quad(c.redBg, c.redBorder, c.red, Icons.Default.Warning)
        WarningLevel.AMBER -> Quad(c.amberBg, c.amberBorder, c.amber, Icons.Default.Warning)
        WarningLevel.EMERALD -> Quad(c.emeraldBg, c.emeraldBorder, c.emerald, Icons.Default.Check)
        WarningLevel.INFO -> Quad(c.cyanBg, c.cyanBorder, c.cyan, Icons.Default.Info)
    }
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(bg)
            .border(1.dp, border, RoundedCornerShape(12.dp))
            .padding(10.dp),
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Icon(icon, contentDescription = null, tint = accent, modifier = Modifier.size(18.dp).padding(top = 1.dp))
        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
            if (!title.isNullOrBlank()) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.labelLarge,
                    color = accent,
                    fontWeight = FontWeight.Bold,
                )
            }
            Text(
                text = body,
                style = MaterialTheme.typography.bodySmall,
                color = c.textPrimary,
            )
        }
    }
}

private data class Quad<A, B, C, D>(val first: A, val second: B, val third: C, val fourth: D)

@Composable
fun <T> SegmentedControl(
    options: List<Pair<T, String>>,
    selected: T?,
    onSelect: (T) -> Unit,
    modifier: Modifier = Modifier,
    redTone: Boolean = false,
    testTagPrefix: String = "seg",
) {
    val c = LocalClinicalColors.current
    val activeBg = if (redTone) c.red else c.cyan
    val activeFg = if (redTone) Color.White else if (c.isDark) Color.Black else Color.White
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(c.cardInset)
            .border(1.dp, c.border, RoundedCornerShape(12.dp))
            .padding(3.dp),
        horizontalArrangement = Arrangement.spacedBy(3.dp),
    ) {
        options.forEach { (value, label) ->
            val active = value == selected
            Box(
                modifier = Modifier
                    .weight(1f)
                    .heightIn(min = 44.dp)
                    .clip(RoundedCornerShape(9.dp))
                    .background(if (active) activeBg else Color.Transparent)
                    .clickable { onSelect(value) }
                    .testTag("${testTagPrefix}_${label.lowercase().replace(' ', '_')}"),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = label,
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold,
                    color = if (active) activeFg else c.textMuted,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.padding(horizontal = 4.dp),
                )
            }
        }
    }
}

@Composable
fun NumericStepper(
    label: String,
    value: Double?,
    unit: String,
    step: Double = 1.0,
    min: Double = 0.0,
    max: Double = 9999.0,
    decimals: Int = 1,
    emptyText: String = "--",
    onChange: (Double) -> Unit,
    modifier: Modifier = Modifier,
    keypadTitle: String = label,
    allowDecimal: Boolean = decimals > 0,
    testTag: String = "stepper_${label.lowercase().replace(' ', '_')}",
) {
    val c = LocalClinicalColors.current
    var showKeypad by remember { mutableStateOf(false) }

    Column(modifier = modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(
            text = label.uppercase(),
            style = MaterialTheme.typography.labelSmall,
            color = c.textMuted,
            letterSpacing = 0.6.sp,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(c.cardInset)
                .border(1.dp, c.borderLight, RoundedCornerShape(12.dp)),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clickable {
                        val base = value ?: min
                        val next = (round((base - step) * 1000.0) / 1000.0).coerceIn(min, max)
                        onChange(next)
                    }
                    .testTag("${testTag}_minus"),
                contentAlignment = Alignment.Center,
            ) {
                Icon(Icons.Default.Remove, contentDescription = "Decrease $label", tint = c.textSecondary)
            }
            Box(
                modifier = Modifier
                    .weight(1f)
                    .heightIn(min = 48.dp)
                    .clickable { showKeypad = true }
                    .testTag("${testTag}_value"),
                contentAlignment = Alignment.Center,
            ) {
                if (value != null) {
                    Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                        Text(
                            text = formatNumber(value, decimals),
                            fontFamily = JetBrainsMonoFontFamily,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = c.cyan,
                        )
                        if (unit.isNotEmpty()) {
                            Text(
                                text = unit,
                                style = MaterialTheme.typography.labelSmall,
                                color = c.textMuted,
                                modifier = Modifier.padding(bottom = 1.dp),
                            )
                        }
                    }
                } else {
                    Text(
                        text = emptyText,
                        style = MaterialTheme.typography.bodySmall,
                        color = c.textMuted,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clickable {
                        val base = value ?: (min - step).coerceAtLeast(0.0)
                        val next = (round((base + step) * 1000.0) / 1000.0).coerceIn(min, max)
                        onChange(next)
                    }
                    .testTag("${testTag}_plus"),
                contentAlignment = Alignment.Center,
            ) {
                Icon(Icons.Default.Add, contentDescription = "Increase $label", tint = c.textSecondary)
            }
        }
    }

    if (showKeypad) {
        KeypadDialog(
            title = keypadTitle,
            initialValue = value,
            unit = unit,
            min = min,
            max = max,
            allowDecimal = allowDecimal,
            onDismiss = { showKeypad = false },
            onConfirm = {
                onChange(it)
                showKeypad = false
            },
        )
    }
}

@Composable
fun KeypadDialog(
    title: String,
    initialValue: Double?,
    unit: String,
    min: Double,
    max: Double,
    allowDecimal: Boolean = true,
    onDismiss: () -> Unit,
    onConfirm: (Double) -> Unit,
) {
    val c = LocalClinicalColors.current
    var text by remember {
        mutableStateOf(initialValue?.let { formatNumber(it, 2) } ?: "")
    }
    var error by remember { mutableStateOf<String?>(null) }

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(20.dp),
            color = c.card,
            border = BorderStroke(1.dp, c.borderLight),
            modifier = Modifier.fillMaxWidth().widthIn(max = 360.dp),
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Text(title, style = MaterialTheme.typography.titleMedium, color = c.textPrimary)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(c.cardInset)
                        .border(1.dp, c.cyanBorder, RoundedCornerShape(12.dp))
                        .padding(horizontal = 14.dp, vertical = 12.dp),
                    contentAlignment = Alignment.CenterEnd,
                ) {
                    Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(
                            text = text.ifEmpty { "0" },
                            fontFamily = JetBrainsMonoFontFamily,
                            fontSize = 26.sp,
                            fontWeight = FontWeight.Bold,
                            color = c.cyan,
                        )
                        if (unit.isNotEmpty()) {
                            Text(unit, style = MaterialTheme.typography.titleSmall, color = c.textMuted)
                        }
                    }
                }
                if (error != null) {
                    Text(error!!, style = MaterialTheme.typography.bodySmall, color = c.red)
                }
                val rows = listOf(
                    listOf("7", "8", "9"),
                    listOf("4", "5", "6"),
                    listOf("1", "2", "3"),
                    listOf(if (allowDecimal) "." else "C", "0", "DEL"),
                )
                rows.forEach { row ->
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        row.forEach { key ->
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .height(52.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(c.cardInset)
                                    .border(1.dp, c.border, RoundedCornerShape(12.dp))
                                    .clickable {
                                        error = null
                                        when (key) {
                                            "DEL" -> if (text.isNotEmpty()) text = text.dropLast(1)
                                            "C" -> text = ""
                                            "." -> if (!text.contains(".")) text = if (text.isEmpty()) "0." else "$text."
                                            else -> if (text.length < 8) text += key
                                        }
                                    },
                                contentAlignment = Alignment.Center,
                            ) {
                                if (key == "DEL") {
                                    Icon(Icons.AutoMirrored.Filled.Backspace, contentDescription = "Delete", tint = c.textSecondary)
                                } else {
                                    Text(
                                        text = key,
                                        fontFamily = JetBrainsMonoFontFamily,
                                        fontSize = 20.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = c.textPrimary,
                                    )
                                }
                            }
                        }
                    }
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                    Button(
                        onClick = onDismiss,
                        colors = ButtonDefaults.buttonColors(containerColor = c.cardInset, contentColor = c.textSecondary),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.weight(1f).heightIn(min = 48.dp),
                    ) {
                        Text("Cancel")
                    }
                    Button(
                        onClick = {
                            val parsed = text.toDoubleOrNull()
                            when {
                                parsed == null -> error = "Enter a valid number."
                                parsed < min || parsed > max -> error = "Must be between ${formatNumber(min, 1)} and ${formatNumber(max, 1)}."
                                else -> onConfirm(parsed)
                            }
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = c.cyan,
                            contentColor = if (c.isDark) Color.Black else Color.White,
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.weight(1f).heightIn(min = 48.dp).testTag("keypad_confirm"),
                    ) {
                        Text("Apply", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun ClinicalPanel(
    title: String,
    subtitle: String? = null,
    sourceTags: List<String> = emptyList(),
    modifier: Modifier = Modifier,
    headerAction: (@Composable () -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    val c = LocalClinicalColors.current
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(c.card)
            .border(1.dp, c.border, RoundedCornerShape(16.dp))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    color = c.textPrimary,
                )
                if (!subtitle.isNullOrBlank()) {
                    Text(
                        text = subtitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = c.textMuted,
                    )
                }
            }
            headerAction?.invoke()
        }
        content()
        if (sourceTags.isNotEmpty()) {
            SourceTagsRow(sourceTags)
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun SourceTagsRow(tags: List<String>, modifier: Modifier = Modifier) {
    val c = LocalClinicalColors.current
    FlowRow(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        tags.distinct().forEach { tag ->
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(6.dp))
                    .background(c.cardInset)
                    .border(1.dp, c.border, RoundedCornerShape(6.dp))
                    .padding(horizontal = 6.dp, vertical = 2.dp),
            ) {
                Text(
                    text = tag,
                    style = MaterialTheme.typography.labelSmall,
                    color = c.textMuted,
                    fontFamily = JetBrainsMonoFontFamily,
                )
            }
        }
    }
}

@Composable
fun BigValueCard(
    label: String,
    value: String,
    unit: String = "",
    accentColor: Color? = null,
    modifier: Modifier = Modifier,
) {
    val c = LocalClinicalColors.current
    val fg = accentColor ?: c.cyan
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(c.cardInset)
            .border(1.dp, c.border, RoundedCornerShape(12.dp))
            .padding(horizontal = 10.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(2.dp),
    ) {
        Text(
            text = label.uppercase(),
            style = MaterialTheme.typography.labelSmall,
            color = c.textMuted,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
        Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(
                text = value,
                fontFamily = JetBrainsMonoFontFamily,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = fg,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            if (unit.isNotEmpty()) {
                Text(
                    text = unit,
                    style = MaterialTheme.typography.labelSmall,
                    color = c.textMuted,
                    modifier = Modifier.padding(bottom = 2.dp),
                )
            }
        }
    }
}

@Composable
fun NoSourceBox(topic: String, modifier: Modifier = Modifier) {
    val c = LocalClinicalColors.current
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(c.cardInset)
            .border(1.dp, c.border, RoundedCornerShape(12.dp))
            .padding(10.dp),
        verticalArrangement = Arrangement.spacedBy(2.dp),
    ) {
        Text(topic, style = MaterialTheme.typography.labelLarge, color = c.textSecondary)
        Text(NO_SOURCE_VALUE, style = MaterialTheme.typography.bodySmall, color = c.textMuted)
    }
}

@Composable
fun ChecklistCard(
    checklist: ChecklistRecord,
    checks: Map<String, Boolean>,
    sourceTagsFor: (List<String>) -> List<String>,
    onToggle: (String) -> Unit,
    onReset: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val c = LocalClinicalColors.current
    val doneCount = checklist.items.count { checks[it.id] == true }
    ClinicalPanel(
        title = checklist.title,
        subtitle = "$doneCount / ${checklist.items.size} checked · ${checklist.group}",
        modifier = modifier,
        headerAction = {
            if (doneCount > 0) {
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .clickable { onReset() }
                        .testTag("reset_checklist_${checklist.id}"),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.Default.Refresh, contentDescription = "Reset ${checklist.title}", tint = c.textMuted)
                }
            }
        },
    ) {
        if (!checklist.note.isNullOrBlank()) {
            WarningBanner(level = WarningLevel.INFO, body = checklist.note)
        }
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            checklist.items.forEach { item ->
                val checked = checks[item.id] == true
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 48.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(if (checked) c.emeraldBg else c.cardInset)
                        .border(1.dp, if (checked) c.emeraldBorder else c.border, RoundedCornerShape(10.dp))
                        .clickable { onToggle(item.id) }
                        .padding(horizontal = 10.dp, vertical = 8.dp)
                        .testTag("check_${item.id}"),
                    verticalAlignment = Alignment.Top,
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
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
                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(
                            text = item.text,
                            style = MaterialTheme.typography.bodyMedium,
                            color = if (checked) c.textMuted else c.textPrimary,
                            textDecoration = if (checked) TextDecoration.LineThrough else TextDecoration.None,
                        )
                        val tags = sourceTagsFor(item.sourceIds)
                        if (tags.isNotEmpty()) {
                            SourceTagsRow(tags)
                        }
                    }
                }
            }
        }
    }
}
