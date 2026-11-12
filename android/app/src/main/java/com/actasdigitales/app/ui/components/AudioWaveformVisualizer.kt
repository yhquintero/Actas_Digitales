package com.actasdigitales.app.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

/**
 * Visualizador en tiempo real de ondas de audio tipo ecualizador neón.
 * Reacciona dinámicamente a la amplitud del micrófono mientras se graba.
 */
@Composable
fun AudioWaveformVisualizer(
    isRecording: Boolean,
    maxAmplitude: Int,
    modifier: Modifier = Modifier,
    barCount: Int = 24
) {
    if (!isRecording) return

    val infiniteTransition = rememberInfiniteTransition(label = "WaveformTransition")

    val phase by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 2f * Math.PI.toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "PhaseAnimation"
    )

    // Normalizar la amplitud entre 0.15 y 1.0
    val normalizedAmp = (maxAmplitude / 32767f).coerceIn(0.15f, 1.0f)
    val primaryColor = MaterialTheme.colorScheme.primary
    val secondaryColor = MaterialTheme.colorScheme.secondary

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .height(54.dp),
        shape = RoundedCornerShape(12.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
    ) {
        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp, vertical = 8.dp)
        ) {
            val width = size.width
            val height = size.height
            val centerY = height / 2f
            val barWidth = (width / barCount) * 0.6f
            val barSpacing = (width / barCount) * 0.4f

            for (i in 0 until barCount) {
                // Cálculo senoidal modulado por la amplitud real
                val sinValue = kotlin.math.sin((i.toFloat() / barCount) * Math.PI * 2 + phase).toFloat()
                val barHeight = ((height * 0.7f) * (0.2f + 0.8f * kotlin.math.abs(sinValue))) * normalizedAmp
                val clampedHeight = barHeight.coerceAtLeast(6.dp.toPx())

                val x = i * (barWidth + barSpacing) + barSpacing / 2f
                val y = centerY - clampedHeight / 2f

                drawRoundRect(
                    brush = Brush.verticalGradient(
                        colors = listOf(primaryColor, secondaryColor)
                    ),
                    topLeft = Offset(x, y),
                    size = Size(barWidth, clampedHeight),
                    cornerRadius = androidx.compose.ui.geometry.CornerRadius(4.dp.toPx())
                )
            }
        }
    }
}
