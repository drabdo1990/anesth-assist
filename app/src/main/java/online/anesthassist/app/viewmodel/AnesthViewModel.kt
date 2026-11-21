package online.anesthassist.app.viewmodel

import android.app.Application
import android.media.AudioManager
import android.media.ToneGenerator
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import online.anesthassist.app.calc.BiometricResult
import online.anesthassist.app.calc.HandoffInput
import online.anesthassist.app.calc.Sex
import online.anesthassist.app.calc.computePatientBiometrics
import online.anesthassist.app.data.ClinicalBundle
import online.anesthassist.app.data.ClinicalRepository
import online.anesthassist.app.data.CreatinineUnit
import online.anesthassist.app.data.PersistedPrefs
import online.anesthassist.app.data.PrefsRepository
import online.anesthassist.app.data.ThemePreference
import java.util.UUID

enum class AppTab(val key: String) {
    PREOP("preop"),
    PLANS("plans"),
    INTRAOP("intraop"),
    POSTOP("postop"),
    CONDITIONS("conditions"),
}

enum class IntraopView(val label: String) {
    DOSING("Dosing"),
    AIRWAY("Airway"),
    VENT("Vent"),
    LISTS("Lists"),
}

enum class EmergencyKind(val label: String) {
    LAST("LAST"),
    MH("MH"),
    CICO("CICO"),
}

data class PatientInput(
    val tbwKg: Double? = null,
    val heightCm: Double? = null,
    val sex: Sex? = null,
    val ageYears: Double? = null,
    val creatinineUmolL: Double? = null,
)

data class LaAdmin(
    val id: String = UUID.randomUUID().toString(),
    val anestheticId: String,
    val percent: Double,
    val volumeMl: Double = 0.0,
    val withEpi: Boolean = false,
)

data class VentState(
    val scenarioId: String = "ards",
    val mlPerKgPbw: Double? = 6.0,
    val respiratoryRate: Double? = null,
    val peepCmH2O: Double? = null,
    val plateauCmH2O: Double? = null,
    val fio2Percent: Double? = null,
)

data class TimerState(
    val running: Boolean = false,
    val startedAtMs: Long = 0L,
    val accumulatedMs: Long = 0L,
) {
    fun elapsedMs(nowMs: Long): Long =
        accumulatedMs + if (running && startedAtMs > 0L) (nowMs - startedAtMs).coerceAtLeast(0L) else 0L
}

data class AnesthUiState(
    // Persisted non-PHI preferences
    val themePreference: ThemePreference = ThemePreference.SYSTEM,
    val preferredScalar: String = "auto",
    val concentrationChoice: Map<String, Double> = emptyMap(),
    val recents: List<String> = emptyList(),
    val mhContact: String = "",
    val checks: Map<String, Boolean> = emptyMap(),
    val audioEnabled: Boolean = true,
    val creatinineUnit: CreatinineUnit = CreatinineUnit.MGDL,

    // In-memory only (cleared on process kill or New Case)
    val patient: PatientInput = PatientInput(),
    val activeTab: AppTab = AppTab.INTRAOP,
    val intraopView: IntraopView = IntraopView.DOSING,
    val scoreAnswers: Map<String, Boolean> = emptyMap(),
    val medsTaken: Map<String, Boolean> = emptyMap(),
    val choiceAnswers: Map<String, Int> = emptyMap(),
    val asaClass: String? = null,
    val asaEmergency: Boolean = false,
    val fastingStatus: String? = null,
    val handoff: HandoffInput = HandoffInput(),

    val emergencyOpen: Boolean = false,
    val emergencyKind: EmergencyKind = EmergencyKind.LAST,
    val settingsOpen: Boolean = false,
    val referencesOpen: Boolean = false,

    val doseValues: Map<String, Double> = emptyMap(),
    val selectedDose: Map<String, String> = emptyMap(),
    val scalarOverrides: Map<String, String> = emptyMap(),
    val doseAdminLogs: Map<String, List<Double>> = emptyMap(),
    val laAdmins: List<LaAdmin> = emptyList(),

    val lipidGivenMl: Double = 0.0,
    val dantroleneGivenMg: Double = 0.0,
    val emergencyChecks: Map<String, Boolean> = emptyMap(),
    val cicoPlan: String = "A",
    val cicoHelpCalled: Boolean = false,
    val cicoAlertEverySec: Int = 0,
    val timers: Map<String, TimerState> = emptyMap(),
    val nowMs: Long = System.currentTimeMillis(),

    val vent: VentState = VentState(),
) {
    val biometricResult: BiometricResult
        get() = computePatientBiometrics(patient.tbwKg, patient.heightCm, patient.sex)

    val needsBiometrics: Boolean
        get() = activeTab == AppTab.PREOP ||
            activeTab == AppTab.POSTOP ||
            (activeTab == AppTab.INTRAOP && intraopView != IntraopView.LISTS)
}

class AnesthViewModel(application: Application) : AndroidViewModel(application) {
    val repository = ClinicalRepository(application)
    val clinical: ClinicalBundle get() = repository.bundle
    private val prefsRepo = PrefsRepository(application)

    private val _state = MutableStateFlow(initialState())
    val state: StateFlow<AnesthUiState> = _state.asStateFlow()

    private var lastCicoBeepBucket = 0

    init {
        viewModelScope.launch {
            while (true) {
                delay(500L)
                val s = _state.value
                val anyRunning = s.timers.values.any { it.running }
                if (anyRunning) {
                    val now = System.currentTimeMillis()
                    _state.update { it.copy(nowMs = now) }
                    checkCicoBeep(s, now)
                }
            }
        }
    }

    private fun checkCicoBeep(s: AnesthUiState, now: Long) {
        val cico = s.timers["cico"] ?: return
        if (!cico.running || s.cicoAlertEverySec <= 0 || !s.audioEnabled) return
        val elapsedSec = (cico.elapsedMs(now) / 1000L).toInt()
        val bucket = elapsedSec / s.cicoAlertEverySec
        if (bucket > lastCicoBeepBucket && elapsedSec > 0) {
            lastCicoBeepBucket = bucket
            playBeep()
        }
    }

    private fun playBeep() {
        runCatching {
            val tg = ToneGenerator(AudioManager.STREAM_NOTIFICATION, 80)
            tg.startTone(ToneGenerator.TONE_PROP_BEEP2, 220)
        }
    }

    private fun initialState(): AnesthUiState {
        val saved = prefsRepo.load()
        val theme = runCatching { ThemePreference.valueOf(saved.themePreference) }.getOrDefault(ThemePreference.SYSTEM)
        val crUnit = runCatching { CreatinineUnit.valueOf(saved.creatinineUnit) }.getOrDefault(CreatinineUnit.MGDL)
        val scenario = clinical.ventilation.scenarios.find { it.id == saved.ventScenarioId }
        val defaultVt = scenario?.tidalVolumeMlPerKgPbw?.target
        return AnesthUiState(
            themePreference = theme,
            preferredScalar = saved.preferredScalar,
            concentrationChoice = saved.concentrationChoice,
            recents = saved.recents,
            mhContact = saved.mhContact,
            checks = saved.checks,
            audioEnabled = saved.audioEnabled,
            creatinineUnit = crUnit,
            vent = VentState(scenarioId = saved.ventScenarioId, mlPerKgPbw = defaultVt),
        )
    }

    private fun persistPrefs(s: AnesthUiState) {
        prefsRepo.save(
            PersistedPrefs(
                themePreference = s.themePreference.name,
                preferredScalar = s.preferredScalar,
                concentrationChoice = s.concentrationChoice,
                ventScenarioId = s.vent.scenarioId,
                recents = s.recents,
                mhContact = s.mhContact,
                checks = s.checks,
                audioEnabled = s.audioEnabled,
                creatinineUnit = s.creatinineUnit.name,
            )
        )
    }

    private fun updateAndPersist(block: (AnesthUiState) -> AnesthUiState) {
        var next: AnesthUiState? = null
        _state.update { current ->
            block(current).also { next = it }
        }
        next?.let(::persistPrefs)
    }

    // Navigation & Sheets
    fun setActiveTab(tab: AppTab) = _state.update { it.copy(activeTab = tab) }
    fun setIntraopView(view: IntraopView) = _state.update { it.copy(intraopView = view) }
    fun openEmergency(kind: EmergencyKind? = null) = _state.update {
        it.copy(emergencyOpen = true, emergencyKind = kind ?: it.emergencyKind)
    }
    fun closeEmergency() = _state.update { it.copy(emergencyOpen = false) }
    fun setEmergencyKind(kind: EmergencyKind) = _state.update { it.copy(emergencyKind = kind) }
    fun setSettingsOpen(open: Boolean) = _state.update { it.copy(settingsOpen = open) }
    fun setReferencesOpen(open: Boolean) = _state.update { it.copy(referencesOpen = open) }

    // Patient
    fun setWeight(kg: Double?) = _state.update { it.copy(patient = it.patient.copy(tbwKg = kg)) }
    fun setHeight(cm: Double?) = _state.update { it.copy(patient = it.patient.copy(heightCm = cm)) }
    fun setSex(sex: Sex?) = _state.update { it.copy(patient = it.patient.copy(sex = sex)) }
    fun setAge(years: Double?) = _state.update { it.copy(patient = it.patient.copy(ageYears = years)) }
    fun setCreatinineUmolL(umol: Double?) = _state.update { it.copy(patient = it.patient.copy(creatinineUmolL = umol)) }

    fun newCase() {
        lastCicoBeepBucket = 0
        updateAndPersist { s ->
            val scenario = clinical.ventilation.scenarios.find { it.id == s.vent.scenarioId }
            s.copy(
                patient = PatientInput(),
                scoreAnswers = emptyMap(),
                medsTaken = emptyMap(),
                choiceAnswers = emptyMap(),
                asaClass = null,
                asaEmergency = false,
                fastingStatus = null,
                handoff = HandoffInput(),
                doseValues = emptyMap(),
                selectedDose = emptyMap(),
                scalarOverrides = emptyMap(),
                doseAdminLogs = emptyMap(),
                laAdmins = emptyList(),
                lipidGivenMl = 0.0,
                dantroleneGivenMg = 0.0,
                emergencyChecks = emptyMap(),
                cicoPlan = "A",
                cicoHelpCalled = false,
                cicoAlertEverySec = 0,
                timers = emptyMap(),
                checks = emptyMap(),
                vent = VentState(scenarioId = s.vent.scenarioId, mlPerKgPbw = scenario?.tidalVolumeMlPerKgPbw?.target),
            )
        }
    }

    // Persisted Preferences
    fun setThemePreference(pref: ThemePreference) = updateAndPersist { it.copy(themePreference = pref) }
    fun setPreferredScalar(scalar: String) = updateAndPersist { it.copy(preferredScalar = scalar) }
    fun setConcentrationChoice(doseId: String, mgPerMl: Double) = updateAndPersist {
        it.copy(concentrationChoice = it.concentrationChoice + (doseId to mgPerMl))
    }
    fun setMhContact(contact: String) = updateAndPersist { it.copy(mhContact = contact.take(60)) }
    fun setAudioEnabled(enabled: Boolean) = updateAndPersist { it.copy(audioEnabled = enabled) }
    fun setCreatinineUnit(unit: CreatinineUnit) = updateAndPersist { it.copy(creatinineUnit = unit) }
    fun touchRecent(medId: String) = updateAndPersist {
        it.copy(recents = (listOf(medId) + it.recents.filter { r -> r != medId }).take(6))
    }
    fun clearSavedSettings() {
        prefsRepo.clearAll()
        lastCicoBeepBucket = 0
        _state.value = AnesthUiState()
    }

    // Dosing
    fun setSelectedDose(medId: String, doseId: String) {
        touchRecent(medId)
        _state.update { it.copy(selectedDose = it.selectedDose + (medId to doseId)) }
    }
    fun setDoseValue(medId: String, doseId: String, value: Double) {
        touchRecent(medId)
        _state.update { it.copy(doseValues = it.doseValues + (doseId to value)) }
    }
    fun setScalarOverride(doseId: String, scalar: String?) = _state.update {
        val next = it.scalarOverrides.toMutableMap()
        if (scalar == null) next.remove(doseId) else next[doseId] = scalar
        it.copy(scalarOverrides = next)
    }
    fun logDose(medId: String, massMg: Double) = _state.update {
        val current = it.doseAdminLogs[medId].orEmpty()
        it.copy(doseAdminLogs = it.doseAdminLogs + (medId to (current + massMg)))
    }
    fun undoDose(medId: String) = _state.update {
        val current = it.doseAdminLogs[medId].orEmpty()
        it.copy(doseAdminLogs = it.doseAdminLogs + (medId to current.dropLast(1)))
    }
    fun resetDoseLog(medId: String) = _state.update {
        it.copy(doseAdminLogs = it.doseAdminLogs - medId)
    }

    // Local Anesthetics
    fun addLaAdmin(anestheticId: String, percent: Double) = _state.update {
        it.copy(laAdmins = it.laAdmins + LaAdmin(anestheticId = anestheticId, percent = percent))
    }
    fun updateLaAdmin(id: String, transform: (LaAdmin) -> LaAdmin) = _state.update {
        it.copy(laAdmins = it.laAdmins.map { a -> if (a.id == id) transform(a) else a })
    }
    fun removeLaAdmin(id: String) = _state.update {
        it.copy(laAdmins = it.laAdmins.filterNot { a -> a.id == id })
    }
    fun clearLaAdmins() = _state.update { it.copy(laAdmins = emptyList()) }

    // Pre-op / Post-op Scores, Meds, Handoff
    fun toggleScoreItem(id: String) = _state.update {
        it.copy(scoreAnswers = it.scoreAnswers + (id to !(it.scoreAnswers[id] ?: false)))
    }
    fun toggleMedTaken(id: String) = _state.update {
        it.copy(medsTaken = it.medsTaken + (id to !(it.medsTaken[id] ?: false)))
    }
    fun setChoiceAnswer(itemId: String, optionIndex: Int) = _state.update {
        it.copy(choiceAnswers = it.choiceAnswers + (itemId to optionIndex))
    }
    fun setAsaClass(asa: String?) = _state.update { it.copy(asaClass = asa) }
    fun setAsaEmergency(emergency: Boolean) = _state.update { it.copy(asaEmergency = emergency) }
    fun setFastingStatus(status: String?) = _state.update { it.copy(fastingStatus = status) }
    fun updateHandoff(transform: (HandoffInput) -> HandoffInput) = _state.update {
        it.copy(handoff = transform(it.handoff))
    }

    // Checklists
    fun toggleCheck(id: String) = updateAndPersist {
        it.copy(checks = it.checks + (id to !(it.checks[id] ?: false)))
    }
    fun resetChecks(ids: List<String>? = null) = updateAndPersist {
        if (ids == null) it.copy(checks = emptyMap())
        else it.copy(checks = it.checks - ids.toSet())
    }

    // Ventilation
    fun selectVentScenario(scenarioId: String) {
        val scenario = clinical.ventilation.scenarios.find { it.id == scenarioId }
        updateAndPersist {
            it.copy(
                vent = it.vent.copy(
                    scenarioId = scenarioId,
                    mlPerKgPbw = scenario?.tidalVolumeMlPerKgPbw?.target,
                )
            )
        }
    }
    fun updateVent(transform: (VentState) -> VentState) = _state.update {
        it.copy(vent = transform(it.vent))
    }

    // Emergencies & Timers
    fun addLipid(ml: Double) = _state.update { it.copy(lipidGivenMl = (it.lipidGivenMl + ml).coerceAtLeast(0.0)) }
    fun resetLipid() = _state.update { it.copy(lipidGivenMl = 0.0) }
    fun addDantrolene(mg: Double) = _state.update { it.copy(dantroleneGivenMg = (it.dantroleneGivenMg + mg).coerceAtLeast(0.0)) }
    fun resetDantrolene() = _state.update { it.copy(dantroleneGivenMg = 0.0) }
    fun toggleEmergencyCheck(id: String) = _state.update {
        it.copy(emergencyChecks = it.emergencyChecks + (id to !(it.emergencyChecks[id] ?: false)))
    }
    fun setCicoPlan(plan: String) = _state.update { it.copy(cicoPlan = plan) }
    fun setCicoHelpCalled(called: Boolean) = _state.update { it.copy(cicoHelpCalled = called) }
    fun setCicoAlertEvery(sec: Int) {
        lastCicoBeepBucket = 0
        _state.update { it.copy(cicoAlertEverySec = sec) }
    }

    fun timerStart(id: String) = _state.update { s ->
        val cur = s.timers[id] ?: TimerState()
        if (cur.running) s
        else s.copy(
            nowMs = System.currentTimeMillis(),
            timers = s.timers + (id to cur.copy(running = true, startedAtMs = System.currentTimeMillis())),
        )
    }
    fun timerPause(id: String) = _state.update { s ->
        val cur = s.timers[id] ?: return@update s
        if (!cur.running) s
        else {
            val now = System.currentTimeMillis()
            s.copy(
                nowMs = now,
                timers = s.timers + (id to TimerState(running = false, startedAtMs = 0L, accumulatedMs = cur.elapsedMs(now))),
            )
        }
    }
    fun timerReset(id: String) {
        if (id == "cico") lastCicoBeepBucket = 0
        _state.update { s -> s.copy(timers = s.timers + (id to TimerState())) }
    }
}
