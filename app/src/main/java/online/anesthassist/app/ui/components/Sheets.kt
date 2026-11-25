package online.anesthassist.app.ui.components

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.SystemUpdate
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import online.anesthassist.app.BuildConfig
import online.anesthassist.app.R
import online.anesthassist.app.data.ClinicalRepository
import online.anesthassist.app.data.ThemePreference
import online.anesthassist.app.data.UpdateChecker
import online.anesthassist.app.data.UpdateStatus
import online.anesthassist.app.ui.theme.JetBrainsMonoFontFamily
import online.anesthassist.app.ui.theme.LocalClinicalColors
import online.anesthassist.app.viewmodel.AnesthUiState
import online.anesthassist.app.viewmodel.AnesthViewModel

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun SettingsOverlay(
    state: AnesthUiState,
    viewModel: AnesthViewModel,
    repository: ClinicalRepository,
) {
    BackHandler { viewModel.setSettingsOpen(false) }
    val c = LocalClinicalColors.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(c.bg)
            .statusBarsPadding()
            .navigationBarsPadding(),
    ) {
        SheetHeader(title = "Settings", onClose = { viewModel.setSettingsOpen(false) })
        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            ClinicalPanel(title = "Appearance", subtitle = "System follows your device. SOS screen always stays dark.") {
                SegmentedControl(
                    options = listOf(
                        ThemePreference.SYSTEM to "System",
                        ThemePreference.LIGHT to "Light",
                        ThemePreference.DARK to "Dark",
                    ),
                    selected = state.themePreference,
                    onSelect = viewModel::setThemePreference,
                    testTagPrefix = "theme_pref",
                )
            }

            ClinicalPanel(
                title = "Preferred Weight Scalar",
                subtitle = "Applies only to weight-based doses whose label does not specify a weight scalar.",
            ) {
                val options = listOf("auto" to "Source default", "TBW" to "TBW", "IBW" to "IBW", "LBW" to "LBW", "ABW40" to "ABW40")
                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    options.forEach { (key, label) ->
                        val active = state.preferredScalar == key
                        Box(
                            modifier = Modifier
                                .heightIn(min = 44.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (active) c.cyan else c.cardInset)
                                .border(1.dp, if (active) c.cyan else c.border, RoundedCornerShape(10.dp))
                                .clickable { viewModel.setPreferredScalar(key) }
                                .padding(horizontal = 12.dp)
                                .testTag("scalar_pref_$key"),
                            contentAlignment = Alignment.Center,
                        ) {
                            Text(
                                text = label,
                                style = MaterialTheme.typography.labelMedium,
                                color = if (active) (if (c.isDark) Color.Black else Color.White) else c.textSecondary,
                            )
                        }
                    }
                }
            }

            ClinicalPanel(
                title = "MH Hotline / Local Contact",
                subtitle = "Saved on this device only. Displayed on the SOS > MH screen.",
            ) {
                OutlinedTextField(
                    value = state.mhContact,
                    onValueChange = viewModel::setMhContact,
                    placeholder = { Text("Enter your local MH hotline or number") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("mh_contact_input"),
                )
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(c.card)
                    .border(1.dp, c.border, RoundedCornerShape(14.dp))
                    .padding(horizontal = 14.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("Timer Sounds", style = MaterialTheme.typography.titleSmall, color = c.textPrimary)
                    Text("Audio tone alerts for CICO timer intervals", style = MaterialTheme.typography.bodySmall, color = c.textMuted)
                }
                Switch(
                    checked = state.audioEnabled,
                    onCheckedChange = viewModel::setAudioEnabled,
                    modifier = Modifier.testTag("audio_toggle"),
                )
            }

            val context = LocalContext.current
            fun openSafeUrl(url: String) {
                if (UpdateChecker.isSafeGitHubUrl(url)) {
                    runCatching {
                        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                    }
                }
            }

            ClinicalPanel(
                title = "App Updates",
                subtitle = "Installed: v${BuildConfig.VERSION_NAME} (build ${BuildConfig.VERSION_CODE}). Manual check only — no background network traffic and zero patient data sent.",
            ) {
                OutlinedTextField(
                    value = state.updateRepo,
                    onValueChange = viewModel::setUpdateRepo,
                    label = { Text("GitHub Repository (owner/repo)") },
                    placeholder = { Text("drabdo1990/anesth-helper") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("update_repo_input"),
                )

                Button(
                    onClick = { viewModel.checkForUpdates() },
                    enabled = state.updateStatus !is UpdateStatus.Checking,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = c.cyan,
                        contentColor = if (c.isDark) Color.Black else Color.White,
                    ),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).testTag("check_updates_button"),
                ) {
                    if (state.updateStatus is UpdateStatus.Checking) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(18.dp),
                            strokeWidth = 2.dp,
                            color = if (c.isDark) Color.Black else Color.White,
                        )
                        Spacer(Modifier.width(8.dp))
                        Text("Checking GitHub Releases...", fontWeight = FontWeight.Bold)
                    } else {
                        Icon(Icons.Default.SystemUpdate, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("Check for Updates", fontWeight = FontWeight.Bold)
                    }
                }

                when (val status = state.updateStatus) {
                    is UpdateStatus.Idle -> {}
                    is UpdateStatus.Checking -> {}
                    is UpdateStatus.UpToDate -> {
                        WarningBanner(
                            level = WarningLevel.EMERALD,
                            title = "Up to date (v${status.currentVersion})",
                            body = "Latest GitHub release is ${status.latestTag}.",
                        )
                        if (status.apkUrl != null) {
                            Button(
                                onClick = { openSafeUrl(status.apkUrl) },
                                colors = ButtonDefaults.buttonColors(containerColor = c.cardInset, contentColor = c.cyan),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).testTag("redownload_apk_button"),
                            ) {
                                Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(Modifier.width(8.dp))
                                Text("Re-download ${status.latestTag} APK")
                            }
                        }
                    }
                    is UpdateStatus.UpdateAvailable -> {
                        WarningBanner(
                            level = WarningLevel.INFO,
                            title = "Update available: v${status.latestVersion}",
                            body = status.notes.ifBlank { "${status.releaseName} is ready to download (current: v${status.currentVersion})." },
                        )
                        Button(
                            onClick = { openSafeUrl(status.downloadUrl) },
                            colors = ButtonDefaults.buttonColors(containerColor = c.emerald, contentColor = Color.White),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).testTag("download_update_button"),
                        ) {
                            Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(8.dp))
                            Text(
                                text = if (status.isDirectApk) "Download v${status.latestVersion} APK" else "Open Release Page",
                                fontWeight = FontWeight.Bold,
                            )
                        }
                    }
                    is UpdateStatus.NoReleases -> {
                        WarningBanner(
                            level = WarningLevel.AMBER,
                            title = "No GitHub Releases published yet",
                            body = "Push your native Android project to ${status.repo} (main branch) so GitHub Actions publishes the APK release automatically.",
                        )
                        Button(
                            onClick = { openSafeUrl(status.releasesPageUrl) },
                            colors = ButtonDefaults.buttonColors(containerColor = c.cardInset, contentColor = c.cyan),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).testTag("open_releases_page_button"),
                        ) {
                            Text("Open GitHub Releases Page")
                        }
                    }
                    is UpdateStatus.Error -> {
                        WarningBanner(
                            level = WarningLevel.RED,
                            title = "Update check failed",
                            body = status.message,
                        )
                    }
                }
            }

            WarningBanner(
                level = WarningLevel.AMBER,
                title = "Clinical data ${repository.bundle.dataVersion}",
                body = repository.bundle.dataStatus,
            )

            ClinicalPanel(
                title = "Zero-PHI Device Storage",
                subtitle = "Only these settings and anonymous checklist ticks are saved on this device. Patient biometrics, doses, and emergency logs stay in RAM only and clear on exit.",
            ) {
                Button(
                    onClick = {
                        viewModel.clearSavedSettings()
                        viewModel.setSettingsOpen(false)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = c.redBg, contentColor = c.red),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).testTag("erase_settings_button"),
                ) {
                    Text("Erase Saved Settings & Reset", fontWeight = FontWeight.Bold)
                }
            }
        }
        DisclaimerBanner()
    }
}

@Composable
fun ReferencesOverlay(
    viewModel: AnesthViewModel,
    repository: ClinicalRepository,
) {
    BackHandler { viewModel.setReferencesOpen(false) }
    val c = LocalClinicalColors.current
    var section by remember { mutableStateOf("sources") }
    var query by remember { mutableStateOf("") }

    val filteredSources = remember(query) {
        val q = query.trim().lowercase()
        if (q.isEmpty()) repository.bundle.sources
        else repository.bundle.sources.filter {
            it.name.lowercase().contains(q) ||
                it.tag.lowercase().contains(q) ||
                it.publisher.lowercase().contains(q) ||
                it.scope.any { s -> s.lowercase().contains(q) }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(c.bg)
            .statusBarsPadding()
            .navigationBarsPadding(),
    ) {
        SheetHeader(
            title = "References & GLP-1 Protocols",
            onClose = { viewModel.setReferencesOpen(false) },
        )
        Column(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            SegmentedControl(
                options = listOf(
                    "sources" to "Sources (${repository.bundle.sources.size})",
                    "glp1" to "GLP-1 Protocols",
                ),
                selected = section,
                onSelect = { section = it },
                testTagPrefix = "ref_tab",
            )
            if (section == "sources") {
                OutlinedTextField(
                    value = query,
                    onValueChange = { query = it },
                    placeholder = { Text("Search source, drug label, or guideline") },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = stringResource(R.string.cd_search)) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("references_search"),
                )
            }
        }

        if (section == "glp1") {
            LazyColumn(
                modifier = Modifier.weight(1f).padding(horizontal = 12.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                item {
                    WarningBanner(
                        level = WarningLevel.AMBER,
                        title = "Conflicting Published Protocols",
                        body = "Published perioperative GLP-1 guidance disagrees on withholding and fasting windows. Use one locally adopted protocol; never mix rules across protocols.",
                    )
                }
                items(repository.bundle.glp1Protocols, key = { it.id }) { proto ->
                    ClinicalPanel(
                        title = proto.label,
                        subtitle = proto.year,
                        sourceTags = repository.sourceTags(listOf(proto.sourceId)),
                    ) {
                        Text("Drug rule:", style = MaterialTheme.typography.labelMedium, color = c.cyan)
                        Text(proto.drugRule, style = MaterialTheme.typography.bodyMedium, color = c.textPrimary)
                        Text("Fasting rule:", style = MaterialTheme.typography.labelMedium, color = c.amber)
                        Text(proto.fastingRule, style = MaterialTheme.typography.bodyMedium, color = c.textPrimary)
                        Text("Distinction:", style = MaterialTheme.typography.labelMedium, color = c.textMuted)
                        Text(proto.distinction, style = MaterialTheme.typography.bodySmall, color = c.textSecondary)
                    }
                }
                item { Spacer(Modifier.height(16.dp)) }
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f).padding(horizontal = 12.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                item {
                    WarningBanner(
                        level = WarningLevel.INFO,
                        title = "Data version ${repository.bundle.dataVersion}",
                        body = repository.bundle.dataStatus,
                    )
                }
                items(filteredSources, key = { it.id }) { src ->
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .background(c.card)
                            .border(1.dp, c.border, RoundedCornerShape(14.dp))
                            .padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp),
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                text = "${src.tag} · Tier ${src.tier}",
                                fontFamily = JetBrainsMonoFontFamily,
                                style = MaterialTheme.typography.labelSmall,
                                color = c.cyan,
                            )
                            Text(
                                text = src.verification.uppercase(),
                                style = MaterialTheme.typography.labelSmall,
                                color = if (src.verification == "primary" || src.verification == "label") c.emerald else c.amber,
                            )
                        }
                        Text(src.name, style = MaterialTheme.typography.titleSmall, color = c.textPrimary)
                        Text("${src.publisher} (${src.year})", style = MaterialTheme.typography.bodySmall, color = c.textMuted)
                        if (src.scope.isNotEmpty()) {
                            Text("Scope: ${src.scope.joinToString(", ")}", style = MaterialTheme.typography.bodySmall, color = c.textSecondary)
                        }
                        if (!src.accessNote.isNullOrBlank()) {
                            Text(src.accessNote, style = MaterialTheme.typography.bodySmall, color = c.textMuted)
                        }
                    }
                }
                item { Spacer(Modifier.height(16.dp)) }
            }
        }
        DisclaimerBanner()
    }
}

@Composable
private fun SheetHeader(title: String, onClose: () -> Unit) {
    val c = LocalClinicalColors.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(c.card)
            .border(0.5.dp, c.border)
            .padding(horizontal = 14.dp, vertical = 10.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(title, style = MaterialTheme.typography.titleLarge, color = c.textPrimary)
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(c.cardInset)
                .border(1.dp, c.border, RoundedCornerShape(12.dp))
                .clickable { onClose() }
                .testTag("sheet_close_button"),
            contentAlignment = Alignment.Center,
        ) {
            Icon(Icons.Default.Close, contentDescription = stringResource(R.string.cd_close), tint = c.textPrimary)
        }
    }
}
