package online.anesthassist.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.Emergency
import androidx.compose.material.icons.filled.FactCheck
import androidx.compose.material.icons.filled.Healing
import androidx.compose.material.icons.filled.LocalHospital
import androidx.compose.material.icons.filled.Medication
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import online.anesthassist.app.ui.components.BiometricHeader
import online.anesthassist.app.ui.components.DisclaimerBanner
import online.anesthassist.app.ui.components.EmergencyOverlay
import online.anesthassist.app.ui.components.ReferencesOverlay
import online.anesthassist.app.ui.components.SegmentedControl
import online.anesthassist.app.ui.components.SettingsOverlay
import online.anesthassist.app.ui.screens.ConditionsScreen
import online.anesthassist.app.ui.screens.IntraopAirwayScreen
import online.anesthassist.app.ui.screens.IntraopDosingScreen
import online.anesthassist.app.ui.screens.IntraopListsScreen
import online.anesthassist.app.ui.screens.IntraopVentScreen
import online.anesthassist.app.ui.screens.PlansScreen
import online.anesthassist.app.ui.screens.PostopScreen
import online.anesthassist.app.ui.screens.PreopScreen
import online.anesthassist.app.ui.theme.AnesthAssistTheme
import online.anesthassist.app.ui.theme.LocalClinicalColors
import online.anesthassist.app.viewmodel.AnesthUiState
import online.anesthassist.app.viewmodel.AnesthViewModel
import online.anesthassist.app.viewmodel.AppTab
import online.anesthassist.app.viewmodel.IntraopView

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val vm: AnesthViewModel = viewModel()
            val state by vm.state.collectAsStateWithLifecycle()

            AnesthAssistTheme(preference = state.themePreference) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = LocalClinicalColors.current.bg,
                ) {
                    AnesthAssistApp(state = state, viewModel = vm)
                }
            }
        }
    }
}

@Composable
private fun AnesthAssistApp(
    state: AnesthUiState,
    viewModel: AnesthViewModel,
) {
    val c = LocalClinicalColors.current
    val repo = viewModel.repository

    // Navigate back to Intra-op Dosing before exiting the app.
    val canGoBackInTabs = !state.emergencyOpen && !state.settingsOpen && !state.referencesOpen &&
        (state.activeTab != AppTab.INTRAOP || state.intraopView != IntraopView.DOSING)

    BackHandler(enabled = canGoBackInTabs) {
        if (state.activeTab != AppTab.INTRAOP) {
            viewModel.setActiveTab(AppTab.INTRAOP)
        } else {
            viewModel.setIntraopView(IntraopView.DOSING)
        }
    }

    Box(modifier = Modifier.fillMaxSize().background(c.bg)) {
        Column(modifier = Modifier.fillMaxSize()) {
            TopAppHeader(
                onOpenReferences = { viewModel.setReferencesOpen(true) },
                onOpenSettings = { viewModel.setSettingsOpen(true) },
            )

            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                contentAlignment = Alignment.TopCenter,
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .widthIn(max = 760.dp),
                ) {
                    if (state.needsBiometrics) {
                        BiometricHeader(
                            state = state,
                            onWeightChange = viewModel::setWeight,
                            onHeightChange = viewModel::setHeight,
                            onSexChange = viewModel::setSex,
                            onAgeChange = viewModel::setAge,
                            onNewCase = viewModel::newCase,
                        )
                    }

                    if (state.activeTab == AppTab.INTRAOP) {
                        SegmentedControl(
                            options = IntraopView.entries.map { it to it.label },
                            selected = state.intraopView,
                            onSelect = viewModel::setIntraopView,
                            testTagPrefix = "intraop_sub",
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        )
                    }

                    Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
                        when (state.activeTab) {
                            AppTab.PREOP -> PreopScreen(state = state, viewModel = viewModel, repository = repo)
                            AppTab.PLANS -> PlansScreen(state = state, viewModel = viewModel, repository = repo)
                            AppTab.INTRAOP -> when (state.intraopView) {
                                IntraopView.DOSING -> IntraopDosingScreen(state = state, viewModel = viewModel, repository = repo)
                                IntraopView.AIRWAY -> IntraopAirwayScreen(state = state, viewModel = viewModel, repository = repo)
                                IntraopView.VENT -> IntraopVentScreen(state = state, viewModel = viewModel, repository = repo)
                                IntraopView.LISTS -> IntraopListsScreen(state = state, viewModel = viewModel, repository = repo)
                            }
                            AppTab.POSTOP -> PostopScreen(state = state, viewModel = viewModel, repository = repo)
                            AppTab.CONDITIONS -> ConditionsScreen(viewModel = viewModel, repository = repo)
                        }
                    }
                }
            }

            BottomNavigationBarWithDisclaimer(
                activeTab = state.activeTab,
                onSelectTab = viewModel::setActiveTab,
                onOpenSos = { viewModel.openEmergency() },
            )
        }

        if (state.referencesOpen) {
            ReferencesOverlay(viewModel = viewModel, repository = repo)
        }
        if (state.settingsOpen) {
            SettingsOverlay(state = state, viewModel = viewModel, repository = repo)
        }
        if (state.emergencyOpen) {
            EmergencyOverlay(state = state, viewModel = viewModel, repository = repo)
        }
    }
}

@Composable
private fun TopAppHeader(
    onOpenReferences: () -> Unit,
    onOpenSettings: () -> Unit,
) {
    val c = LocalClinicalColors.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(c.card)
            .statusBarsPadding(),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.weight(1f),
            ) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(c.cyanBg)
                        .border(1.dp, c.cyanBorder, RoundedCornerShape(10.dp)),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        imageVector = Icons.Default.LocalHospital,
                        contentDescription = null,
                        tint = c.cyan,
                        modifier = Modifier.size(20.dp),
                    )
                }
                Column {
                    Text(
                        text = stringResource(R.string.app_name),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Black,
                        color = c.textPrimary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                    Text(
                        text = stringResource(R.string.app_subtitle),
                        style = MaterialTheme.typography.labelSmall,
                        color = c.textMuted,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(
                    onClick = onOpenReferences,
                    modifier = Modifier.size(48.dp).testTag("open_references_button"),
                ) {
                    Icon(
                        imageVector = Icons.Default.MenuBook,
                        contentDescription = stringResource(R.string.cd_references),
                        tint = c.textSecondary,
                    )
                }
                IconButton(
                    onClick = onOpenSettings,
                    modifier = Modifier.size(48.dp).testTag("open_settings_button"),
                ) {
                    Icon(
                        imageVector = Icons.Default.Settings,
                        contentDescription = stringResource(R.string.cd_settings),
                        tint = c.textSecondary,
                    )
                }
            }
        }
        HorizontalDivider(color = c.border, thickness = 1.dp)
    }
}

@Composable
private fun BottomNavigationBarWithDisclaimer(
    activeTab: AppTab,
    onSelectTab: (AppTab) -> Unit,
    onOpenSos: () -> Unit,
) {
    val c = LocalClinicalColors.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(c.card)
            .navigationBarsPadding(),
    ) {
        DisclaimerBanner()
        HorizontalDivider(color = c.border, thickness = 1.dp)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 4.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(2.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            NavTabItem(
                label = stringResource(R.string.tab_preop),
                icon = Icons.Default.FactCheck,
                active = activeTab == AppTab.PREOP,
                testTag = "nav_preop",
                onClick = { onSelectTab(AppTab.PREOP) },
                modifier = Modifier.weight(1f),
            )
            NavTabItem(
                label = stringResource(R.string.tab_plans),
                icon = Icons.Default.Assignment,
                active = activeTab == AppTab.PLANS,
                testTag = "nav_plans",
                onClick = { onSelectTab(AppTab.PLANS) },
                modifier = Modifier.weight(1f),
            )
            NavTabItem(
                label = stringResource(R.string.tab_intraop),
                icon = Icons.Default.Medication,
                active = activeTab == AppTab.INTRAOP,
                testTag = "nav_intraop",
                onClick = { onSelectTab(AppTab.INTRAOP) },
                modifier = Modifier.weight(1f),
            )
            NavTabItem(
                label = stringResource(R.string.tab_postop),
                icon = Icons.Default.Healing,
                active = activeTab == AppTab.POSTOP,
                testTag = "nav_postop",
                onClick = { onSelectTab(AppTab.POSTOP) },
                modifier = Modifier.weight(1f),
            )
            NavTabItem(
                label = stringResource(R.string.tab_diseases),
                icon = Icons.Default.Book,
                active = activeTab == AppTab.CONDITIONS,
                testTag = "nav_conditions",
                onClick = { onSelectTab(AppTab.CONDITIONS) },
                modifier = Modifier.weight(1f),
            )
            // Dedicated always-reachable red SOS button
            Column(
                modifier = Modifier
                    .weight(1f)
                    .heightIn(min = 52.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(c.red)
                    .clickable { onOpenSos() }
                    .padding(vertical = 5.dp)
                    .testTag("nav_sos"),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) {
                Icon(
                    imageVector = Icons.Default.Emergency,
                    contentDescription = stringResource(R.string.cd_emergency),
                    tint = Color.White,
                    modifier = Modifier.size(19.dp),
                )
                Text(
                    text = stringResource(R.string.tab_sos),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White,
                    maxLines = 1,
                )
            }
        }
    }
}

@Composable
private fun NavTabItem(
    label: String,
    icon: ImageVector,
    active: Boolean,
    testTag: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val c = LocalClinicalColors.current
    Column(
        modifier = modifier
            .heightIn(min = 52.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(if (active) c.cyanBg else Color.Transparent)
            .clickable { onClick() }
            .padding(vertical = 5.dp, horizontal = 2.dp)
            .testTag(testTag),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Icon(
            imageVector = icon,
            contentDescription = label,
            tint = if (active) c.cyan else c.textMuted,
            modifier = Modifier.size(19.dp),
        )
        Text(
            text = label,
            fontSize = 10.sp,
            fontWeight = if (active) FontWeight.Bold else FontWeight.Medium,
            color = if (active) c.cyan else c.textMuted,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}
