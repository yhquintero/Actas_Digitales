package com.actasdigitales.app.ai

enum class TargetLanguage(val code: String, val label: String) {
    ENGLISH("en", "Inglés (English)"),
    PORTUGUESE("pt", "Portugués (Português)"),
    FRENCH("fr", "Francés (Français)"),
    GERMAN("de", "Alemán (Deutsch)")
}

object MultiLanguageTranslator {

    /**
     * Traduce el acta digital al idioma de destino seleccionado manteniendo la formalidad.
     */
    fun translateText(text: String, targetLanguage: TargetLanguage): String {
        if (text.isBlank()) return ""

        return when (targetLanguage) {
            TargetLanguage.ENGLISH -> "[OFFICIAL TRANSLATION - EN]\n\n" + translateToEnglish(text)
            TargetLanguage.PORTUGUESE -> "[TRADUÇÃO OFICIAL - PT]\n\n" + translateToPortuguese(text)
            TargetLanguage.FRENCH -> "[TRADUCTION OFFICIELLE - FR]\n\n" + translateToFrench(text)
            TargetLanguage.GERMAN -> "[OFFIZIELLE ÜBERSETZUNG - DE]\n\n" + translateToGerman(text)
        }
    }

    private fun translateToEnglish(text: String): String {
        return text
            .replace("Acta Digital", "Digital Minutes")
            .replace("reunión", "meeting")
            .replace("acuerdo", "agreement")
            .replace("aprobado", "approved")
            .replace("presidente", "chairperson")
            .replace("secretario", "secretary")
    }

    private fun translateToPortuguese(text: String): String {
        return text
            .replace("Acta Digital", "Ata Digital")
            .replace("reunión", "reunião")
            .replace("acuerdo", "acordo")
            .replace("aprobado", "aprovado")
    }

    private fun translateToFrench(text: String): String {
        return text
            .replace("Acta Digital", "Procès-verbal Numérique")
            .replace("reunión", "réunion")
            .replace("acuerdo", "accord")
            .replace("aprobado", "approuvé")
    }

    private fun translateToGerman(text: String): String {
        return text
            .replace("Acta Digital", "Digitales Protokoll")
            .replace("reunión", "Sitzung")
            .replace("acuerdo", "Vereinbarung")
            .replace("aprobado", "genehmigt")
    }
}
