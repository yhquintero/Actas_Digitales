package com.actasdigitales.app.ui.theme

/**
 * Representa los tres modos de tema soportados en la aplicación:
 * - [LIGHT]: Modo Claro Futurista (Cyber Light)
 * - [DARK]: Modo Oscuro Cyberpunk (Obsidian Dark)
 * - [SYSTEM]: Modo Automático (Sincronizado con el sistema / Dynamic Color)
 */
enum class ThemeMode {
    SYSTEM,
    LIGHT,
    DARK;

    fun next(): ThemeMode = when (this) {
        SYSTEM -> LIGHT
        LIGHT -> DARK
        DARK -> SYSTEM
    }

    val label: String
        get() = when (this) {
            SYSTEM -> "Sistema / Auto"
            LIGHT -> "Claro Futurista"
            DARK -> "Oscuro Cyberpunk"
        }
}
