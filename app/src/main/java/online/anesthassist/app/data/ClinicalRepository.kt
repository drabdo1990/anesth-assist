package online.anesthassist.app.data

import android.content.Context
import kotlinx.serialization.json.Json

class ClinicalRepository(context: Context) {
    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }

    val bundle: ClinicalBundle by lazy {
        val raw = context.assets.open("clinical_data.json").bufferedReader().use { it.readText() }
        json.decodeFromString<ClinicalBundle>(raw)
    }

    val sourceById: Map<String, ClinicalSource> by lazy {
        bundle.sources.associateBy { it.id }
    }

    val medicationById: Map<String, Medication> by lazy {
        bundle.medications.associateBy { it.id }
    }

    val checklistItemById: Map<String, ChecklistItemRecord> by lazy {
        bundle.checklists.flatMap { it.items }.associateBy { it.id }
    }

    fun sourceTags(ids: List<String>): List<String> =
        ids.mapNotNull { sourceById[it]?.tag ?: it }.distinct()

    fun listsForPhase(phase: String): List<ChecklistRecord> {
        val preopIds = setOf("fasting-npo")
        val postopIds = setOf("emergence")
        return bundle.checklists.filter { checklist ->
            val p = when {
                checklist.id in preopIds -> "preop"
                checklist.id in postopIds -> "postop"
                else -> "intraop"
            }
            p == phase
        }
    }

    fun planItems(card: PlanCard, phaseKey: String): List<ChecklistItemRecord> =
        card.phases[phaseKey].orEmpty().mapNotNull { checklistItemById[it] }
}
