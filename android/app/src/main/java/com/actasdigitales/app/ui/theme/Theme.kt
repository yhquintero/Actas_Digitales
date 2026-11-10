package com.actasdigitales.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColorScheme = lightColorScheme(
    primary = IndigoPrimary,
    onPrimary = SlateSurface,
    secondary = EmeraldAccent,
    background = SlateBackground,
    surface = SlateSurface,
    error = RoseError,
    onBackground = SlateTextPrimary,
    onSurface = SlateTextPrimary
)

@Composable
fun ActasDigitalesTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        typography = Typography,
        content = content
    )
}
