package com.actasdigitales.app.ai

data class ExecutiveSummary(
    val summaryText: String,
    val keyDecisions: List<String>,
    val actionItems: List<String>
)

object ExecutiveSummaryExtractor {

    /**
     * Analiza y sintetiza el texto formalizado del acta para extraer el resumen ejecutivo,
     * las decisiones clave tomadas y la lista de tareas/acuerdos.
     */
    fun extractSummary(text: String): ExecutiveSummary {
        if (text.isBlank()) {
            return ExecutiveSummary(
                summaryText = "Sin contenido suficiente para estructurar un resumen.",
                keyDecisions = emptyList(),
                actionItems = emptyList()
            )
        }

        val sentences = text.split(Regex("(?<=[.!?])\\s+")).filter { it.isNotBlank() }

        // Resumen ejecutivo: Primeras 2 a 3 frases sintéticas
        val summary = sentences.take(3).joinToString(" ")

        // Extracción heurística de acuerdos y decisiones
        val decisions = mutableListOf<String>()
        val actions = mutableListOf<String>()

        sentences.forEach { sentence ->
            val lower = sentence.lowercase()
            when {
                lower.contains("acuerd") || lower.contains("decid") || lower.contains("aprob") -> {
                    decisions.add(sentence.trim())
                }
                lower.contains("debe") || lower.contains("encargad") || lower.contains("compromet") || lower.contains("responsable") -> {
                    actions.add(sentence.trim())
                }
            }
        }

        // Honesto: si no hay decisiones o tareas detectables, devolver listas vacías
        // en lugar de fabricar contenido que nunca se deliberó.

        return ExecutiveSummary(
            summaryText = summary,
            keyDecisions = decisions,
            actionItems = actions
        )
    }
}
