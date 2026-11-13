package com.actasdigitales.app.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

/**
 * Pantalla de inicio futurista de la aplicación (Splash Screen).
 * Muestra el ícono futurista animado, el nombre de la app debajo ("ACTAS DIGITALES"),
 * y la insignia vertical TLS en un diseño cyber de alto nivel.
 */
@Composable
fun FuturisticSplashScreen(
    onSplashFinished: () -> Unit
) {
    var progress by remember { mutableFloatStateOf(0f) }

    val infiniteTransition = rememberInfiniteTransition(label = "SplashTransition")

    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.08f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "PulseScale"
    )

    LaunchedEffect(Unit) {
        val steps = 20
        for (i in 1..steps) {
            delay(100)
            progress = i / steps.toFloat()
        }
        delay(300)
        onSplashFinished()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                brush = Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFF070A14),
                        Color(0xFF0F172A),
                        Color(0xFF1E1B4B)
                    )
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(24.dp)
        ) {
            // Contenedor Central con Ícono Futurista y Aura Pulsante
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.size(160.dp)
            ) {
                // Anillo exterior resplandeciente
                Box(
                    modifier = Modifier
                        .size(150.dp)
                        .scale(pulseScale)
                        .border(
                            width = 2.dp,
                            brush = Brush.sweepGradient(
                                colors = listOf(
                                    Color(0xFF06B6D4),
                                    Color(0xFF6366F1),
                                    Color(0xFF10B981),
                                    Color(0xFF06B6D4)
                                )
                            ),
                            shape = CircleShape
                        )
                )

                // Anillo secundario con pulso holográfico
                Box(
                    modifier = Modifier
                        .size(125.dp)
                        .background(
                            color = Color(0xFF6366F1).copy(alpha = 0.15f),
                            shape = CircleShape
                        )
                        .border(
                            width = 1.dp,
                            color = Color(0xFF38BDF8).copy(alpha = 0.4f),
                            shape = CircleShape
                        )
                )

                // Ícono central de micrófono e IA
                Surface(
                    modifier = Modifier
                        .size(90.dp)
                        .shadow(16.dp, shape = CircleShape),
                    shape = CircleShape,
                    color = Color(0xFF1E293B)
                ) {
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                brush = Brush.linearGradient(
                                    colors = listOf(
                                        Color(0xFF4F46E5),
                                        Color(0xFF06B6D4)
                                    )
                                )
                            )
                    ) {
                        Icon(
                            imageVector = Icons.Default.Mic,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(46.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // NOMBRE DE LA APP DEBAJO DEL ÍCONO AL INICIO
            Text(
                text = "ACTAS DIGITALES",
                fontSize = 24.sp,
                fontWeight = FontWeight.Black,
                color = Color.White,
                letterSpacing = 2.sp,
                fontFamily = FontFamily.SansSerif
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = "SISTEMA DE INTELIGENCIA ACÚSTICA & SEGURIDAD",
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF38BDF8),
                letterSpacing = 1.sp
            )

            Spacer(modifier = Modifier.height(32.dp))

            // INSIGNIA VERTICAL CON LAS LETRAS TLS AL INICIAR
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                VerticalTlsBadge(
                    showLabels = true,
                    modifier = Modifier.padding(horizontal = 16.dp)
                )
            }

            Spacer(modifier = Modifier.height(40.dp))

            // Barra de progreso cyber y mensaje de estado
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.width(240.dp)
            ) {
                LinearProgressIndicator(
                    progress = { progress },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(4.dp),
                    color = Color(0xFF06B6D4),
                    trackColor = Color(0xFF1E293B)
                )

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = "INICIALIZANDO CANALIZACIÓN TLS 1.3... ${(progress * 100).toInt()}%",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF94A3B8),
                    fontFamily = FontFamily.Monospace
                )
            }
        }
    }
}
