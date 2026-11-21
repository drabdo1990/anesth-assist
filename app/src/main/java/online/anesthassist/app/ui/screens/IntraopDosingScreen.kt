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
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
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
import online.anesthassist.app.calc.Biometrics
import online.anesthassist.app.calc.MaxDoseStatus
import online.anesthassist.app.calc.ToxicityStatus
import online.anesthassist.app.calc.combinedToxicityFraction
import online.anesthassist.app.calc.computeMedicationDose
import online.anesthassist.app.calc.doseAppliesToWeight
import online.anesthassist.app.calc.formatDoseMass
import online.anesthassist.app.calc.formatNumber
import online.anesthassist.app.calc.formatVolumeMl
import online.anesthassist.app.calc.isWeightBased
import online.anesthassist.app.calc.localAnestheticDoseMg
import online.anesthassist.app.calc.maxAllowedLocalMg
import online.anesthassist.app.data.ClinicalRepository
import online.anesthassist.app.data.LocalAnesthetic
import online.anesthassist.app.data.Medication
import online.anesthassist.app.data.MedicationDose
import online.anesthassist.app.data.NeuraxialRegimen
import online.anesthassist.app.data.ReferenceDrug
import online.anesthassist.app.ui.components.BigValueCard
import online.anesthassist.app.ui.components.ClinicalPanel
import online.anesthassist.app.ui.components.NoSourceBox
import online.anesthassist.app.ui.components.NumericStepper
import online.anesthassist.app.ui.components.SegmentedControl
import online.anesthassist.app.ui.components.SourceTagsRow
import online.anesthassist.app.ui.components.WarningBanner
import online.anesthassist.app.ui.components.WarningLevel
import online.anesthassist.app.ui.theme.JetBrainsMonoFontFamily
import online.anesthassist.app.ui.theme.LocalClinicalColors
import online.anesthassist.app.viewmodel.AnesthUiState
import online.anesthassist.app.viewmodel.AnesthViewModel

@Composable
fun IntraopDosingScreen(
    state: AnesthUiState,
    viewModel: AnesthViewModel,
    repository: ClinicalRepository,
) {
    val c = LocalClinicalColors.current
    val bundle = repository.bundle
    val ageYears = state.patient.ageYears
    val tbwKg = state.patient.tbwKg
    val biometrics = (state.biometricResult as? BiometricResult.Ok)?.value

    if (ageYears == null) {
        Box(modifier = Modifier.fillMaxWidth().padding(12.dp)) {
            WarningBanner(
                level = WarningLevel.AMBER,
                title = "Age required",
                body = "Enter patient age in the patient bar above before using the dosing calculator. This prevents adult doses being shown for a child.",
            )
        }
        return
    }

    var population by remember { mutableStateOf(if (ageYears < 18.0) "pediatric" else "adult") }
    LaunchedEffect(ageYears) {
        population = if (ageYears < 18.0) "pediatric" else "adult"
    }

    var query by remember { mutableStateOf("") }
    var situationId by remember { mutableStateOf<String?>(null) }
    var categoryFilter by remember { mutableStateOf("all") }

    val popMeds = remember(population) {
        if (population == "pediatric") {
            bundle.medications.filter { m -> m.doses.any { it.population == "pediatric" || it.population == "both" } }
        } else {
            bundle.medications.filter { m -> m.doses.any { it.population == null || it.population == "adult" || it.population == "both" } }
        }
    }

    val q = query.trim().lowercase()
    val activeSituation = bundle.situations.find { it.id == situationId }

    val displayedMeds = remember(popMeds, activeSituation, categoryFilter, q) {
        when {
            activeSituation != null -> activeSituation.drugIds.mapNotNull { id -> popMeds.find { it.id == id } }
            else -> popMeds.filter { m ->
                val catOk = categoryFilter == "all" || m.category == categoryFilter
                val qOk = q.isEmpty() || m.name.lowercase().contains(q) || m.drugClass.lowercase().contains(q)
                catOk && qOk
            }
        }
    }

    val showLocal = situationId == null && (categoryFilter == "all" || categoryFilter == "local") &&
        (q.isEmpty() || "local anesthetic".contains(q) || bundle.localAnesthetics.any { it.name.lowercase().contains(q) })

    val filteredRefDrugs = remember(q, categoryFilter, situationId) {
        if (situationId != null) emptyList()
        else bundle.referenceDrugs.filter { ref ->
            val groupCat = when (ref.group) {
                "induction" -> "induction"
                "premedication" -> "preinduction"
                "opioid" -> "opioids"
                "nmba" -> "nmba"
                "vasoactive" -> "vasoactive"
                "antiemetic" -> "postoperative"
                "analgesic-adjunct" -> "local"
                else -> "other-reference"
            }
            val catOk = categoryFilter == "all" || categoryFilter == groupCat
            val qOk = q.isEmpty() || ref.name.lowercase().contains(q) || ref.group.lowercase().contains(q)
            catOk && qOk
        }
    }

    LazyColumn(
        modifier = Modifier.fillMaxWidth(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 12.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            SegmentedControl(
                options = listOf("adult" to "Adult", "pediatric" to "Pediatric"),
                selected = population,
                onSelect = { population = it },
                testTagPrefix = "dosing_pop",
            )
        }

        if (ageYears < 18.0 && population == "adult") {
            item {
                WarningBanner(
                    level = WarningLevel.AMBER,
                    title = "Adult reference mode",
                    body = "Showing adult reference doses for a pediatric patient (${formatNumber(ageYears, 2)} y).",
                )
            }
        }

        item {
            OutlinedTextField(
                value = query,
                onValueChange = {
                    query = it
                    if (it.isNotEmpty()) situationId = null
                },
                placeholder = { Text("Search drug or class") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = stringResource(R.string.cd_search)) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth().testTag("dosing_search"),
            )
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                FilterChipButton(
                    label = "All drugs",
                    active = situationId == null,
                    onClick = { situationId = null },
                    testTag = "situation_all",
                )
                bundle.situations.forEach { sit ->
                    FilterChipButton(
                        label = sit.label,
                        active = situationId == sit.id,
                        onClick = {
                            situationId = sit.id
                            query = ""
                            categoryFilter = "all"
                        },
                        testTag = "situation_${sit.id}",
                    )
                }
            }
        }

        if (situationId == null) {
            item {
                Row(
                    modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    FilterChipButton("All", categoryFilter == "all", { categoryFilter = "all" }, "cat_all")
                    bundle.categoryOrder.forEach { cat ->
                        FilterChipButton(
                            label = bundle.categoryLabels[cat] ?: cat,
                            active = categoryFilter == cat,
                            onClick = { categoryFilter = cat },
                            testTag = "cat_$cat",
                        )
                    }
                    FilterChipButton(
                        label = "Electrolytes & emergency (ref)",
                        active = categoryFilter == "other-reference",
                        onClick = { categoryFilter = "other-reference" },
                        testTag = "cat_other_reference",
                    )
                }
            }
        } else {
            item {
                WarningBanner(
                    level = WarningLevel.AMBER,
                    body = "App grouping, not a guideline. Doses come from each card's listed sources.",
                )
            }
        }

        items(displayedMeds, key = { "${population}_${it.id}" }) { med ->
            DrugCardItem(
                med = med,
                population = population,
                ageYears = ageYears,
                tbwKg = tbwKg,
                biometrics = biometrics,
                state = state,
                viewModel = viewModel,
                repository = repository,
            )
        }

        if (showLocal) {
            item(key = "local_anesthetic_panel") {
                LocalAnestheticSection(
                    anesthetics = bundle.localAnesthetics,
                    tbwKg = tbwKg,
                    isPediatric = population == "pediatric",
                    state = state,
                    viewModel = viewModel,
                    repository = repository,
                )
            }
            item(key = "neuraxial_panel") {
                NeuraxialReferenceSection(
                    regimens = bundle.neuraxialRegimens,
                    repository = repository,
                )
            }
        }

        if (situationId == null) {
            val placeholders = bundle.categoryPlaceholders.filter {
                (categoryFilter == "all" || it.category == categoryFilter) &&
                    (q.isEmpty() || it.topic.lowercase().contains(q))
            }
            if (placeholders.isNotEmpty()) {
                item(key = "placeholders_header") {
                    Text(
                        text = "TOPICS WITHOUT CALCULATED DOSE",
                        style = MaterialTheme.typography.labelMedium,
                        color = c.textMuted,
                    )
                }
                items(placeholders, key = { it.topic }) { p ->
                    NoSourceBox(topic = p.topic)
                }
            }
        }

        if (filteredRefDrugs.isNotEmpty()) {
            item(key = "ref_drugs_header") {
                Text(
                    text = "REFERENCE DRUG LIST (NEVER CALCULATED)",
                    style = MaterialTheme.typography.labelMedium,
                    color = c.cyan,
                    fontWeight = FontWeight.Black,
                )
            }
            items(filteredRefDrugs, key = { "ref_${it.id}" }) { ref ->
                ReferenceDrugCard(ref = ref, repository = repository)
            }
        }

        item { Spacer(Modifier.height(16.dp)) }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun DrugCardItem(
    med: Medication,
    population: String,
    ageYears: Double,
    tbwKg: Double?,
    biometrics: Biometrics?,
    state: AnesthUiState,
    viewModel: AnesthViewModel,
    repository: ClinicalRepository,
) {
    val c = LocalClinicalColors.current
    val relevantDoses = remember(med, population) {
        if (population == "pediatric") {
            med.doses.filter { it.population == "pediatric" || it.population == "both" }
        } else {
            med.doses.filter { it.population == null || it.population == "adult" || it.population == "both" }
        }.ifEmpty { med.doses }
    }

    val selectedDoseId = state.selectedDose[med.id]?.takeIf { id -> relevantDoses.any { it.id == id } }
        ?: remember(relevantDoses, ageYears, tbwKg) {
            relevantDoses.firstOrNull { d ->
                val ageOk = d.ageBracket?.let { b ->
                    (b.minYears == null || ageYears >= b.minYears) && (b.maxYears == null || ageYears < b.maxYears)
                } ?: false
                ageOk
            }?.id
                ?: relevantDoses.firstOrNull { d -> tbwKg == null || doseAppliesToWeight(d, tbwKg) }?.id
                ?: relevantDoses.first().id
        }
    val activeDose: MedicationDose = relevantDoses.find { it.id == selectedDoseId } ?: relevantDoses.first()

    val defaultVal = activeDose.default ?: activeDose.min ?: 0.0
    val currentVal = state.doseValues[activeDose.id] ?: defaultVal

    val savedConc = state.concentrationChoice[activeDose.id]
    val activeConc = remember(med.concentrations, savedConc, activeDose, population) {
        med.concentrations.find { it.mgPerMl == savedConc }
            ?: activeDose.preferredConcentrationMgPerMl?.let { pref -> med.concentrations.find { it.mgPerMl == pref } }
            ?: (if (population == "pediatric") med.concentrations.find { it.isPediatricDefault == true } else null)
            ?: med.concentrations.first()
    }

    val weightNeeded = isWeightBased(activeDose)
    val canCompute = !weightNeeded || tbwKg != null
    val computation = if (canCompute) {
        computeMedicationDose(
            dose = activeDose,
            doseValue = currentVal,
            concentrationMgPerMl = activeConc.mgPerMl,
            biometrics = biometrics,
            tbwKg = tbwKg ?: 0.0,
            scalarOverride = state.scalarOverrides[activeDose.id],
            preferredScalar = state.preferredScalar,
            companion = med.companion,
        )
    } else null

    val step = when {
        currentVal < 0.1 -> 0.01
        currentVal < 1.0 -> 0.05
        currentVal < 10.0 -> 0.5
        currentVal < 100.0 -> 5.0
        else -> 25.0
    }
    val decimals = when {
        step < 0.05 -> 3
        step < 0.5 -> 2
        step < 1.0 -> 1
        else -> 0
    }

    val loggedList = state.doseAdminLogs[med.id].orEmpty()
    val loggedTotalMg = loggedList.sum()

    ClinicalPanel(
        title = med.name,
        subtitle = "${med.drugClass} · ${activeDose.indication}",
        sourceTags = repository.sourceTags(activeDose.sourceIds.ifEmpty { med.sourceIds }),
    ) {
        if (relevantDoses.size > 1) {
            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                relevantDoses.forEach { d ->
                    val selected = d.id == activeDose.id
                    Box(
                        modifier = Modifier
                            .heightIn(min = 38.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (selected) c.cyanBg else c.cardInset)
                            .border(1.dp, if (selected) c.cyan else c.border, RoundedCornerShape(8.dp))
                            .clickable { viewModel.setSelectedDose(med.id, d.id) }
                            .padding(horizontal = 8.dp, vertical = 6.dp)
                            .testTag("dose_opt_${d.id}"),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            text = d.ageBracket?.label ?: d.indication.take(36),
                            style = MaterialTheme.typography.labelSmall,
                            color = if (selected) c.cyan else c.textSecondary,
                        )
                    }
                }
            }
        }

        NumericStepper(
            label = "Selected dose (${activeDose.min?.let { formatNumber(it, 2) } ?: "?"}–${activeDose.max?.let { formatNumber(it, 2) } ?: "?"} ${activeDose.unit})",
            value = currentVal,
            unit = activeDose.unit,
            step = step,
            min = 0.0,
            max = (activeDose.max ?: currentVal.coerceAtLeast(1.0)) * 5.0,
            decimals = decimals,
            onChange = { viewModel.setDoseValue(med.id, activeDose.id, it) },
            keypadTitle = "${med.name} (${activeDose.unit})",
            testTag = "drug_stepper_${med.id}",
        )

        if (med.concentrations.size > 1) {
            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                med.concentrations.forEach { conc ->
                    val selected = conc.mgPerMl == activeConc.mgPerMl
                    Box(
                        modifier = Modifier
                            .heightIn(min = 38.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (selected) c.cyanBg else c.cardInset)
                            .border(1.dp, if (selected) c.cyan else c.border, RoundedCornerShape(8.dp))
                            .clickable { viewModel.setConcentrationChoice(activeDose.id, conc.mgPerMl) }
                            .padding(horizontal = 8.dp, vertical = 6.dp),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            text = conc.label,
                            style = MaterialTheme.typography.labelSmall,
                            color = if (selected) c.cyan else c.textSecondary,
                        )
                    }
                }
            }
        } else {
            Text(
                text = "Concentration: ${activeConc.label}",
                style = MaterialTheme.typography.labelSmall,
                color = c.textMuted,
                fontFamily = JetBrainsMonoFontFamily,
            )
        }

        if (!activeConc.pediatricInstructions.isNullOrBlank() && population == "pediatric") {
            WarningBanner(
                level = WarningLevel.INFO,
                title = "Pediatric dilution",
                body = activeConc.pediatricInstructions,
            )
        }
        if (activeConc.requiresDilution == true) {
            WarningBanner(
                level = WarningLevel.AMBER,
                title = "Requires dilution",
                body = "${activeConc.label} must be diluted before IV use.",
            )
        }

        if (weightNeeded && activeDose.population != "pediatric" && activeDose.scalarBasis != "label") {
            Row(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.horizontalScroll(rememberScrollState()),
            ) {
                Text("Scalar:", style = MaterialTheme.typography.labelSmall, color = c.textMuted)
                listOf("TBW", "IBW", "LBW", "ABW40").forEach { sc ->
                    val active = computation?.scalar == sc
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (active) c.cyan else c.cardInset)
                            .border(1.dp, if (active) c.cyan else c.border, RoundedCornerShape(6.dp))
                            .clickable { viewModel.setScalarOverride(activeDose.id, sc) }
                            .padding(horizontal = 8.dp, vertical = 4.dp),
                    ) {
                        Text(
                            text = sc,
                            style = MaterialTheme.typography.labelSmall,
                            fontFamily = JetBrainsMonoFontFamily,
                            color = if (active) (if (c.isDark) Color.Black else Color.White) else c.textMuted,
                        )
                    }
                }
            }
        }

        if (computation == null) {
            WarningBanner(level = WarningLevel.INFO, body = "Enter actual weight above to calculate dose and volume.")
        } else {
            val tone = when {
                computation.maxStatus == MaxDoseStatus.EXCEEDS -> c.red
                computation.isCapped || computation.isFloorEnforced || computation.maxStatus == MaxDoseStatus.AT_LIMIT -> c.amber
                else -> c.cyan
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                if (computation.isInfusion) {
                    BigValueCard(
                        label = "Rate${computation.scalar?.let { " ($it)" } ?: ""}",
                        value = formatNumber(computation.mcgPerMin, 1),
                        unit = "mcg/min",
                        accentColor = tone,
                        modifier = Modifier.weight(1f),
                    )
                    BigValueCard(
                        label = "Pump Setting",
                        value = formatNumber(computation.mlPerHr, 1),
                        unit = "mL/hr",
                        accentColor = c.emerald,
                        modifier = Modifier.weight(1f),
                    )
                } else {
                    BigValueCard(
                        label = "Dose${computation.scalar?.let { " ($it ${formatNumber(computation.scalarKg ?: 0.0, 1)} kg)" } ?: ""}",
                        value = formatDoseMass(computation.mass, computation.massUnit),
                        accentColor = tone,
                        modifier = Modifier.weight(1f),
                    )
                    BigValueCard(
                        label = "Volume",
                        value = formatVolumeMl(computation.volumeMl),
                        accentColor = c.emerald,
                        modifier = Modifier.weight(1f),
                    )
                }
            }

            if (computation.isCapped && computation.cappedMessage != null) {
                WarningBanner(level = WarningLevel.AMBER, title = "Adult ceiling enforced", body = computation.cappedMessage)
            }
            if (computation.isFloorEnforced && computation.floorMessage != null) {
                WarningBanner(level = WarningLevel.AMBER, title = "Minimum floor enforced", body = computation.floorMessage)
            }
            if (computation.maxStatus == MaxDoseStatus.EXCEEDS && !computation.isCapped && computation.absoluteMax != null) {
                WarningBanner(
                    level = WarningLevel.RED,
                    title = "Exceeds maximum (${formatNumber(computation.absoluteMax.value)} ${computation.absoluteMax.unit})",
                    body = "Verify dose and clinical indication before administering.",
                )
            }

            if (computation.companionName != null && computation.companionMassMg != null && computation.companionVolumeMl != null) {
                WarningBanner(
                    level = WarningLevel.INFO,
                    title = "Companion: ${computation.companionName}",
                    body = "${formatNumber(computation.companionMassMg, 2)} mg (${formatVolumeMl(computation.companionVolumeMl)})",
                )
            }

            if (!computation.isInfusion && activeDose.absoluteMax?.scope == "cumulative") {
                val limitMg = activeDose.absoluteMax.value
                val afterMg = loggedTotalMg + computation.massMg
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Button(
                        onClick = { viewModel.logDose(med.id, computation.massMg) },
                        colors = ButtonDefaults.buttonColors(containerColor = c.cyanBg, contentColor = c.cyan),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f).heightIn(min = 44.dp),
                    ) {
                        Text("Log given (${formatNumber(loggedTotalMg, 1)} / ${formatNumber(limitMg, 0)} mg)")
                    }
                    if (loggedList.isNotEmpty()) {
                        Button(
                            onClick = { viewModel.resetDoseLog(med.id) },
                            colors = ButtonDefaults.buttonColors(containerColor = c.cardInset, contentColor = c.textMuted),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.heightIn(min = 44.dp),
                        ) {
                            Text("Clear")
                        }
                    }
                }
                if (afterMg > limitMg) {
                    WarningBanner(
                        level = WarningLevel.RED,
                        title = "Cumulative ceiling alert",
                        body = "Adding this dose (${formatNumber(afterMg, 1)} mg) exceeds the ${formatNumber(limitMg, 0)} mg cumulative ceiling.",
                    )
                }
            }
        }

        activeDose.notes.forEach { note ->
            Text("• $note", style = MaterialTheme.typography.bodySmall, color = c.textSecondary)
        }
        med.cautions.forEach { caution ->
            Text("⚠ $caution", style = MaterialTheme.typography.bodySmall, color = c.amber)
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun LocalAnestheticSection(
    anesthetics: List<LocalAnesthetic>,
    tbwKg: Double?,
    isPediatric: Boolean,
    state: AnesthUiState,
    viewModel: AnesthViewModel,
    repository: ClinicalRepository,
) {
    val c = LocalClinicalColors.current
    val pairs = state.laAdmins.map { admin ->
        val la = anesthetics.find { it.id == admin.anestheticId }
        val doseMg = localAnestheticDoseMg(admin.volumeMl, admin.percent)
        val maxMg = if (tbwKg != null && la != null) {
            if (isPediatric && !admin.withEpi && la.pedsPlainMaxMgPerKg != null) {
                minOf(la.pedsPlainMaxMgPerKg * tbwKg, la.plain?.absoluteMaxMg ?: Double.MAX_VALUE)
            } else {
                maxAllowedLocalMg(if (admin.withEpi) la.withEpinephrine else la.plain, tbwKg) ?: 0.0
            }
        } else 0.0
        doseMg to maxMg
    }
    val tox = combinedToxicityFraction(pairs)

    ClinicalPanel(
        title = "Local Anesthetic Toxicity Calculator",
        subtitle = "Combined fraction of maximum dose must remain < 1.0 (100%).",
        sourceTags = repository.sourceTags(listOf("rosenberg-2004", "label-lidocaine", "asra-last-2020")),
    ) {
        if (tbwKg == null) {
            WarningBanner(level = WarningLevel.INFO, body = "Enter actual weight above to compute weight-based local anesthetic limits.")
        } else {
            val statusColor = when (tox.status) {
                ToxicityStatus.TOXIC -> c.red
                ToxicityStatus.CAUTION -> c.amber
                ToxicityStatus.SAFE -> c.emerald
            }
            BigValueCard(
                label = "Combined Toxicity Fraction",
                value = "${formatNumber(tox.total * 100.0, 0)}%",
                unit = tox.status.name,
                accentColor = statusColor,
                modifier = Modifier.fillMaxWidth(),
            )
            if (tox.status == ToxicityStatus.TOXIC) {
                WarningBanner(
                    level = WarningLevel.RED,
                    title = "MAXIMUM DOSE REACHED OR EXCEEDED",
                    body = "Combined local anesthetic load is >= 100%. If LAST is suspected, tap SOS > LAST immediately.",
                )
            }
        }

        FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            anesthetics.forEach { la ->
                Button(
                    onClick = { viewModel.addLaAdmin(la.id, la.concentrationsPercent.firstOrNull() ?: 1.0) },
                    colors = ButtonDefaults.buttonColors(containerColor = c.cardInset, contentColor = c.cyan),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.heightIn(min = 44.dp).testTag("add_la_${la.id}"),
                ) {
                    Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(4.dp))
                    Text(la.name, style = MaterialTheme.typography.labelMedium)
                }
            }
        }

        state.laAdmins.forEachIndexed { idx, admin ->
            val la = anesthetics.find { it.id == admin.anestheticId } ?: return@forEachIndexed
            val (doseMg, maxMg) = pairs[idx]
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(c.cardInset)
                    .border(1.dp, c.border, RoundedCornerShape(12.dp))
                    .padding(10.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        "${la.name} (${formatNumber(doseMg, 0)} mg / max ${if (maxMg > 0) "${formatNumber(maxMg, 0)} mg" else "--"})",
                        style = MaterialTheme.typography.titleSmall,
                        color = c.textPrimary,
                    )
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .clickable { viewModel.removeLaAdmin(admin.id) },
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.Default.Delete, contentDescription = "Remove ${la.name}", tint = c.red, modifier = Modifier.size(18.dp))
                    }
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        la.concentrationsPercent.forEach { pct ->
                            val sel = pct == admin.percent
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(if (sel) c.cyan else c.card)
                                    .border(1.dp, if (sel) c.cyan else c.border, RoundedCornerShape(6.dp))
                                    .clickable { viewModel.updateLaAdmin(admin.id) { it.copy(percent = pct) } }
                                    .padding(horizontal = 8.dp, vertical = 5.dp),
                            ) {
                                Text(
                                    "${formatNumber(pct, 2)}%",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = if (sel) (if (c.isDark) Color.Black else Color.White) else c.textSecondary,
                                )
                            }
                        }
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("+Epi", style = MaterialTheme.typography.labelSmall, color = c.textMuted)
                        Spacer(Modifier.width(4.dp))
                        Switch(
                            checked = admin.withEpi,
                            onCheckedChange = { checked -> viewModel.updateLaAdmin(admin.id) { it.copy(withEpi = checked) } },
                        )
                    }
                }
                NumericStepper(
                    label = "Volume",
                    value = admin.volumeMl,
                    unit = "mL",
                    step = 5.0,
                    min = 0.0,
                    max = 300.0,
                    decimals = 1,
                    onChange = { v -> viewModel.updateLaAdmin(admin.id) { it.copy(volumeMl = v) } },
                )
            }
        }
    }
}

@Composable
private fun NeuraxialReferenceSection(
    regimens: List<NeuraxialRegimen>,
    repository: ClinicalRepository,
) {
    val c = LocalClinicalColors.current
    var route by remember { mutableStateOf("spinal") }
    val shown = regimens.filter { it.route == route }

    ClinicalPanel(
        title = "Neuraxial Reference (70 kg Adult)",
        subtitle = "Reference only (Miller 6e Tables 14-7 & 14-8). Never scaled by weight.",
        sourceTags = repository.sourceTags(listOf("miller-6e", "oxford-handbook")),
    ) {
        SegmentedControl(
            options = listOf("spinal" to "Spinal", "epidural" to "Epidural"),
            selected = route,
            onSelect = { route = it },
            testTagPrefix = "neuraxial_route",
        )
        shown.forEach { r ->
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(c.cardInset)
                    .border(1.dp, c.border, RoundedCornerShape(10.dp))
                    .padding(10.dp),
                verticalArrangement = Arrangement.spacedBy(3.dp),
            ) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(
                        "${r.agent} ${r.concLabel}${r.baricity?.let { " ($it)" } ?: ""}",
                        style = MaterialTheme.typography.titleSmall,
                        color = c.cyan,
                    )
                    Text(
                        "${formatNumber(r.totalDoseMg[0], 1)}–${formatNumber(r.totalDoseMg[1], 1)} mg",
                        fontFamily = JetBrainsMonoFontFamily,
                        style = MaterialTheme.typography.labelMedium,
                        color = c.textPrimary,
                    )
                }
                Text(
                    "Vol: ${formatNumber(r.volumeMl[0], 1)}–${formatNumber(r.volumeMl[1], 1)} mL" +
                        (r.durationMin?.let { " · Dur: ${it[0].toInt()}–${it[1].toInt()} min" } ?: "") +
                        (r.onsetMin?.let { " · Onset: ${it[0].toInt()}–${it[1].toInt()} min" } ?: ""),
                    style = MaterialTheme.typography.bodySmall,
                    color = c.textSecondary,
                )
                if (!r.discrepancy.isNullOrBlank()) {
                    Text("Note: ${r.discrepancy}", style = MaterialTheme.typography.bodySmall, color = c.amber)
                }
            }
        }
    }
}

@Composable
private fun ReferenceDrugCard(ref: ReferenceDrug, repository: ClinicalRepository) {
    val c = LocalClinicalColors.current
    ClinicalPanel(
        title = ref.name,
        subtitle = "Reference only · ${ref.group}${ref.scalar?.let { " · Scalar: $it" } ?: ""}",
        sourceTags = repository.sourceTags(ref.sourceIds),
    ) {
        ref.doses.forEach { d ->
            val range = if (d.max != null && d.max != d.min) "${formatNumber(d.min, 2)}–${formatNumber(d.max, 2)}" else formatNumber(d.min, 2)
            Text(
                text = "• [${d.population}${d.route?.let { " $it" } ?: ""}] $range ${d.unit}${d.scalar?.let { " ($it)" } ?: ""}${d.note?.let { " — $it" } ?: ""}",
                style = MaterialTheme.typography.bodySmall,
                color = c.textPrimary,
            )
        }
        ref.infusions.forEach { inf ->
            val range = if (inf.rateMax != null && inf.rateMax != inf.rateMin) "${formatNumber(inf.rateMin, 2)}–${formatNumber(inf.rateMax, 2)}" else formatNumber(inf.rateMin, 2)
            Text(
                text = "• ${inf.indication}: $range ${inf.unit}${inf.notes?.let { " (${it})" } ?: ""}",
                style = MaterialTheme.typography.bodySmall,
                color = c.textSecondary,
            )
        }
        ref.cautions.forEach { caution ->
            Text("⚠ $caution", style = MaterialTheme.typography.bodySmall, color = c.amber)
        }
        if (!ref.discrepancy.isNullOrBlank()) {
            Text("Discrepancy: ${ref.discrepancy}", style = MaterialTheme.typography.bodySmall, color = c.amber)
        }
    }
}

@Composable
private fun FilterChipButton(
    label: String,
    active: Boolean,
    onClick: () -> Unit,
    testTag: String,
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
