package com.actasdigitales.app.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Componente modular con la insignia vertical "T L S" futurista.
 * T -> Transcripción Acústica
 * L -> Libro de Actas
 * S -> Seguridad Criptográfica TLS 1.3
 */
@Composable
fun VerticalTlsBadge(
    modifier: Modifier = Modifier,
    showLabels: Boolean = true
) {
    val infiniteTransition = rememberInfiniteTransition(label = "TlsGlowTransition")

    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.5f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1400, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "GlowAlpha"
    )

    Surface(
        modifier = modifier
            .shadow(8.dp, shape = RoundedCornerShape(16.dp))
            .border(
                width = 1.5.dp,
                brush = Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFF06B6D4).copy(alpha = glowAlpha),
                        Color(0xFF6366F1),
                        Color(0xFF10B981).copy(alpha = glowAlpha)
                    )
                ),
                shape = RoundedCornerShape(16.dp)
            ),
        shape = RoundedCornerShape(16.dp),
        color = Color(0xFF0F172A).copy(alpha = 0.92f)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Columna con letras verticales T L S
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                TlsLetterNode(letter = "T", color = Color(0xFF06B6D4))
                TlsLetterNode(letter = "L", color = Color(0xFF818CF8))
                TlsLetterNode(letter = "S", color = Color(0xFF10B981))
            }

            if (showLabels) {
                Spacer(modifier = Modifier.width(10.dp))
                Column(
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    TlsLabelItem(title = "TRANSCRIPCIÓN", desc = "Inteligencia Acústica IA", color = Color(0xFF06B6D4))
                    TlsLabelItem(title = "LIBRO DE ACTAS", desc = "Persistencia Local & PDF", color = Color(0xFF818CF8))
                    TlsLabelItem(title = "SEGURIDAD TLS 1.3", desc = "Encriptación RSA-4096", color = Color(0xFF10B981))
                }
            }
        }
    }
}

/**
 * Insignia Horizontal TLS futurista para banners y tarjetas principales.
 * Muestra las siglas T, L, S y la seguridad TLS 1.3 de forma 100% horizontal sin deformaciones.
 */
@Composable
fun HorizontalTlsBadge(
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier
            .border(
                width = 1.dp,
                brush = Brush.horizontalGradient(
                    colors = listOf(
                        Color(0xFF06B6D4),
                        Color(0xFF6366F1),
                        Color(0xFF10B981)
                    )
                ),
                shape = RoundedCornerShape(12.dp)
            ),
        shape = RoundedCornerShape(12.dp),
        color = Color(0xFF0F172A).copy(alpha = 0.9f)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 10.dp, vertical = 7.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            HorizontalTlsChip(letter = "T", label = "Transcripción", color = Color(0xFF06B6D4))
            HorizontalTlsChip(letter = "L", label = "Libro Actas", color = Color(0xFF818CF8))
            HorizontalTlsChip(letter = "S", label = "TLS 1.3 · RSA", color = Color(0xFF10B981))
        }
    }
}

@Composable
private fun HorizontalTlsChip(
    letter: String,
    label: String,
    color: Color
) {
    Row(
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .size(20.dp)
                .clip(RoundedCornerShape(6.dp))
                .background(color.copy(alpha = 0.25f))
                .border(0.8.dp, color.copy(alpha = 0.7f), RoundedCornerShape(6.dp))
        ) {
            Text(
                text = letter,
                color = color,
                fontWeight = FontWeight.Black,
                fontSize = 11.sp,
                fontFamily = FontFamily.Monospace
            )
        }
        Spacer(modifier = Modifier.width(4.dp))
        Text(
            text = label,
            color = Color.White,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            maxLines = 1,
            softWrap = false
        )
    }
}

@Composable
private fun TlsLetterNode(
    letter: String,
    color: Color
) {
    Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier
            .size(28.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(color.copy(alpha = 0.2f))
            .border(1.dp, color.copy(alpha = 0.6f), RoundedCornerShape(8.dp))
    ) {
        Text(
            text = letter,
            color = color,
            fontWeight = FontWeight.Black,
            fontSize = 15.sp,
            fontFamily = FontFamily.Monospace
        )
    }
}

@Composable
private fun TlsLabelItem(
    title: String,
    desc: String,
    color: Color
) {
    Column {
        Text(
            text = title,
            color = color,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.5.sp
        )
        Text(
            text = desc,
            color = Color(0xFF94A3B8),
            fontSize = 9.sp,
            fontWeight = FontWeight.Normal
        )
    }
}
