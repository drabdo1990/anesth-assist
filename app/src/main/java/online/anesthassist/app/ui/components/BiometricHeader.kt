package online.anesthassist.app.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.filled.Refresh
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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import online.anesthassist.app.R
import online.anesthassist.app.calc.BiometricResult
import online.anesthassist.app.calc.MAX_HEIGHT_CM
import online.anesthassist.app.calc.MAX_WEIGHT_KG
import online.anesthassist.app.calc.MIN_HEIGHT_CM
import online.anesthassist.app.calc.Sex
import online.anesthassist.app.calc.formatKg
import online.anesthassist.app.calc.formatNumber
import online.anesthassist.app.calc.isDevineBaselineMet
import online.anesthassist.app.ui.theme.JetBrainsMonoFontFamily
import online.anesthassist.app.ui.theme.LocalClinicalColors
import online.anesthassist.app.viewmodel.AnesthUiState
import kotlin.math.round

@Composable
fun BiometricHeader(
    state: AnesthUiState,
    onWeightChange: (Double?) -> Unit,
    onHeightChange: (Double?) -> Unit,
    onSexChange: (Sex?) -> Unit,
    onAgeChange: (Double?) -> Unit,
    onNewCase: () -> Unit,
) {
    val c = LocalClinicalColors.current
    val p = state.patient
    val complete = p.tbwKg != null && p.heightCm != null && p.sex != null
    var expanded by remember { mutableStateOf(!complete) }
    var wasComplete by remember { mutableStateOf(complete) }
    var showAgeKeypad by remember { mutableStateOf(false) }

    LaunchedEffect(complete) {
        if (complete && !wasComplete) expanded = false
        if (!complete) expanded = true
        wasComplete = complete
    }

    val result = state.biometricResult
    val bio = (result as? BiometricResult.Ok)?.value
    val pediatric = p.ageYears != null && p.ageYears < 18.0

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(c.bg)
            .border(width = 0.5.dp, color = c.border)
            .padding(horizontal = 12.dp, vertical = 6.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = 44.dp)
                .clickable { expanded = !expanded }
                .testTag("biometric_header_toggle"),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            val summary = buildString {
                append(p.tbwKg?.let { "${formatKg(it)} kg" } ?: "-- kg")
                append(" · ")
                append(p.heightCm?.let { "${round(it).toInt()} cm" } ?: "-- cm")
                append(" · ")
                append(p.sex?.shortLabel ?: "--")
                if (p.ageYears != null) append(" · ${formatNumber(p.ageYears, 2)} y")
            }
            Text(
                text = summary,
                fontFamily = JetBrainsMonoFontFamily,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = c.cyan,
            )
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                Text("Patient", style = MaterialTheme.typography.labelMedium, color = c.textMuted)
                Icon(
                    imageVector = if (expanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                    contentDescription = null,
                    tint = c.textMuted,
                    modifier = Modifier.size(18.dp),
                )
            }
        }

        AnimatedVisibility(visible = expanded) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(c.card)
                    .border(1.dp, c.border, RoundedCornerShape(14.dp))
                    .padding(10.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                    NumericStepper(
                        label = "Weight (TBW)",
                        value = p.tbwKg,
                        unit = "kg",
                        step = 1.0,
                        min = 1.0,
                        max = MAX_WEIGHT_KG,
                        decimals = 1,
                        onChange = { onWeightChange(it) },
                        keypadTitle = "Actual weight (TBW)",
                        modifier = Modifier.weight(1f),
                        testTag = "patient_weight",
                    )
                    NumericStepper(
                        label = "Height",
                        value = p.heightCm,
                        unit = "cm",
                        step = 1.0,
                        min = MIN_HEIGHT_CM,
                        max = MAX_HEIGHT_CM,
                        decimals = 0,
                        allowDecimal = false,
                        onChange = { onHeightChange(round(it)) },
                        keypadTitle = "Height (cm)",
                        modifier = Modifier.weight(1f),
                        testTag = "patient_height",
                    )
                }
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        text = "BIOLOGICAL SEX",
                        style = MaterialTheme.typography.labelSmall,
                        color = c.textMuted,
                        letterSpacing = 0.6.sp,
                    )
                    SegmentedControl(
                        options = listOf(Sex.MALE to "Male", Sex.FEMALE to "Female"),
                        selected = p.sex,
                        onSelect = { onSexChange(it) },
                        testTagPrefix = "patient_sex",
                    )
                }
            }
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (bio != null) {
                val (bmiTag, bmiColor) = when {
                    bio.bmi < 18.5 -> "Underwt" to c.cyan
                    bio.bmi < 25.0 -> "Normal" to c.emerald
                    bio.bmi < 30.0 -> "Overwt" to c.amber
                    else -> "Obese" to c.red
                }
                ScalarPill("BMI", formatNumber(bio.bmi, 1), bmiTag, bmiColor)
                ScalarPill("PBW", formatKg(bio.pbw), "kg", c.purple)
                ScalarPill("IBW", formatKg(bio.ibw), "kg", c.amber)
                ScalarPill("LBW", formatKg(bio.lbw), "kg", c.cyan)
                ScalarPill("ABW40", formatKg(bio.abw40), "kg", c.emerald)
            }
            Box(
                modifier = Modifier
                    .heightIn(min = 44.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(if (p.ageYears == null) c.amberBg else c.card)
                    .border(1.dp, if (p.ageYears == null) c.amberBorder else c.borderLight, RoundedCornerShape(10.dp))
                    .clickable { showAgeKeypad = true }
                    .padding(horizontal = 10.dp)
                    .testTag("patient_age_button"),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = if (p.ageYears != null) "Age ${formatNumber(p.ageYears, 2)} y" else "Age (required)",
                    style = MaterialTheme.typography.labelMedium,
                    color = if (p.ageYears == null) c.amber else c.textPrimary,
                )
            }
            if (p.ageYears != null) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(c.card)
                        .border(1.dp, c.borderLight, RoundedCornerShape(10.dp))
                        .clickable { onAgeChange(null) }
                        .testTag("clear_age_button"),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.Default.Close, contentDescription = stringResource(R.string.cd_clear), tint = c.textMuted, modifier = Modifier.size(16.dp))
                }
            }
            Row(
                modifier = Modifier
                    .heightIn(min = 44.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(c.card)
                    .border(1.dp, c.borderLight, RoundedCornerShape(10.dp))
                    .clickable { onNewCase() }
                    .padding(horizontal = 10.dp)
                    .testTag("new_case_button"),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.Default.Refresh, contentDescription = stringResource(R.string.cd_new_case), tint = c.textSecondary, modifier = Modifier.size(15.dp))
                Spacer(Modifier.width(4.dp))
                Text("New case", style = MaterialTheme.typography.labelMedium, color = c.textSecondary)
            }
        }

        if (result is BiometricResult.Err && p.tbwKg != null && p.heightCm != null && p.sex == null) {
            WarningBanner(
                level = WarningLevel.AMBER,
                title = "Select biological sex",
                body = "Predicted, ideal and lean body weights depend on sex and are never assumed.",
            )
        } else if (result is BiometricResult.Err && p.sex != null && (p.tbwKg != null || p.heightCm != null)) {
            WarningBanner(
                level = WarningLevel.RED,
                title = "Invalid input",
                body = "${result.error} Calculations stay blank until fixed.",
            )
        }

        if (pediatric) {
            WarningBanner(
                level = WarningLevel.AMBER,
                title = "Pediatric patient",
                body = "PBW and IBW use the adult Devine formula, which is not valid for children. Pediatric dosing uses TBW.",
            )
        } else if (p.heightCm != null && !isDevineBaselineMet(p.heightCm)) {
            WarningBanner(
                level = WarningLevel.AMBER,
                title = "Height below Devine 152.4 cm baseline",
                body = "Devine formula hit its floor (${if (p.sex == Sex.MALE) "50 kg" else "45.5 kg"}) and does not scale below 152.4 cm.",
            )
        }
    }

    if (showAgeKeypad) {
        KeypadDialog(
            title = "Enter age (years)",
            initialValue = p.ageYears,
            unit = "y",
            min = 0.0,
            max = 120.0,
            allowDecimal = true,
            onDismiss = { showAgeKeypad = false },
            onConfirm = {
                onAgeChange(round(it * 100.0) / 100.0)
                showAgeKeypad = false
            },
        )
    }
}

@Composable
private fun ScalarPill(label: String, value: String, unit: String, tone: Color) {
    val c = LocalClinicalColors.current
    Row(
        modifier = Modifier
            .heightIn(min = 44.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(c.card)
            .border(1.dp, c.border, RoundedCornerShape(10.dp))
            .padding(horizontal = 8.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Text(label, style = MaterialTheme.typography.labelSmall, color = c.textMuted)
        Text(
            text = value,
            fontFamily = JetBrainsMonoFontFamily,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            color = tone,
        )
        Text(unit, style = MaterialTheme.typography.labelSmall, color = c.textMuted)
    }
}
