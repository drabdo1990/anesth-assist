package online.anesthassist.app.data

import android.content.Context
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

enum class ThemePreference { SYSTEM, LIGHT, DARK }
enum class CreatinineUnit { MGDL, UMOL }

/**
 * Persists ONLY non-PHI preferences and anonymous checklist ticks.
 * Patient weight, height, sex, age, creatinine, dose selections, local anesthetic entries,
 * and emergency trackers live in memory only and are NEVER written to disk.
 */
@Serializable
data class PersistedPrefs(
    val themePreference: String = ThemePreference.SYSTEM.name,
    val preferredScalar: String = "auto",
    val concentrationChoice: Map<String, Double> = emptyMap(),
    val ventScenarioId: String = "ards",
    val recents: List<String> = emptyList(),
    val mhContact: String = "",
    val checks: Map<String, Boolean> = emptyMap(),
    val audioEnabled: Boolean = true,
    val creatinineUnit: String = CreatinineUnit.MGDL.name,
    val updateRepo: String = "drabdo1990/anesth-helper",
)

class PrefsRepository(context: Context) {
    private val prefs = context.getSharedPreferences("anesthassist_prefs_v1", Context.MODE_PRIVATE)
    private val json = Json { ignoreUnknownKeys = true }

    fun load(): PersistedPrefs {
        val raw = prefs.getString(KEY_PREFS, null) ?: return PersistedPrefs()
        return runCatching { json.decodeFromString<PersistedPrefs>(raw) }.getOrDefault(PersistedPrefs())
    }

    fun save(data: PersistedPrefs) {
        prefs.edit().putString(KEY_PREFS, json.encodeToString(data)).apply()
    }

    fun clearAll() {
        prefs.edit().clear().apply()
    }

    companion object {
        private const val KEY_PREFS = "prefs_json"
    }
}
