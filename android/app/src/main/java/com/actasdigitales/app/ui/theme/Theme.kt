package com.actasdigitales.app.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

private val LightColorScheme = lightColorScheme(
    primary = IndigoPrimary,
    onPrimary = SlateSurface,
    primaryContainer = SlateCardSurface,
    onPrimaryContainer = SlateTextPrimary,
    secondary = EmeraldAccent,
    onSecondary = SlateSurface,
    background = SlateBackground,
    surface = SlateSurface,
    surfaceVariant = SlateCardSurface,
    error = RoseError,
    onBackground = SlateTextPrimary,
    onSurface = SlateTextPrimary,
    onSurfaceVariant = SlateTextSecondary
)

private val DarkColorScheme = darkColorScheme(
    primary = CyberIndigoPrimary,
    onPrimary = CyberDarkBackground,
    primaryContainer = CyberDarkSurface,
    onPrimaryContainer = CyberDarkTextPrimary,
    secondary = CyberNeonTeal,
    onSecondary = CyberDarkBackground,
    background = CyberDarkBackground,
    surface = CyberDarkSurface,
    surfaceVariant = CyberDarkCardSurface,
    error = CyberRoseError,
    onBackground = CyberDarkTextPrimary,
    onSurface = CyberDarkTextPrimary,
    onSurfaceVariant = CyberDarkTextSecondary
)

/**
 * Tema principal de Actas Digitales con soporte para 3 Modos:
 * - [ThemeMode.LIGHT]: Fuerza el tema Claro Futurista.
 * - [ThemeMode.DARK]: Fuerza el tema Oscuro Cyberpunk.
 * - [ThemeMode.SYSTEM]: Sigue la configuración del sistema (y Dynamic Color si está disponible).
 */
@Composable
fun ActasDigitalesTheme(
    themeMode: ThemeMode = ThemeMode.SYSTEM,
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val systemInDark = isSystemInDarkTheme()
    val useDarkTheme = when (themeMode) {
        ThemeMode.LIGHT -> false
        ThemeMode.DARK -> true
        ThemeMode.SYSTEM -> systemInDark
    }

    val context = LocalContext.current
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && themeMode == ThemeMode.SYSTEM -> {
            if (systemInDark) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        useDarkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
