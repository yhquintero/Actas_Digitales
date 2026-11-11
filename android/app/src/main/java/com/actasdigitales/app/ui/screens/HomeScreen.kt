package com.actasdigitales.app.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.actasdigitales.app.data.model.JobResponse
import com.actasdigitales.app.ui.theme.EmeraldAccent
import com.actasdigitales.app.ui.theme.IndigoPrimary
import com.actasdigitales.app.ui.theme.RoseError
import com.actasdigitales.app.ui.viewmodel.AudioUiState
import com.actasdigitales.app.ui.viewmodel.AudioViewModel
import java.io.File
import java.io.FileOutputStream

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(viewModel: AudioViewModel) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    var hasMicPermission by remember { mutableStateOf(false) }

    // Launcher de permisos de micrófono
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        hasMicPermission = isGranted
        if (isGranted) {
            viewModel.startRecording()
        } else {
            Toast.makeText(context, "Se requiere permiso de micrófono para grabar", Toast.LENGTH_SHORT).show()
        }
    }

    // Launcher de selector de archivos de audio
    val filePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            val file = copyUriToCache(context, it)
            if (file != null) {
                viewModel.uploadAudioFile(file)
            } else {
                Toast.makeText(context, "No se pudo leer el archivo seleccionado", Toast.LENGTH_SHORT).show()
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Default.Mic,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            "Actas Digitales",
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = IndigoPrimary
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Transcripción y Corrección en Español",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Sube un archivo de audio o graba desde el micrófono",
                style = MaterialTheme.typography.labelSmall,
                color = Color.Gray,
                modifier = Modifier.padding(bottom = 12.dp)
            )

            // Banner Ejecutivo de los 4 Pilares y Seguridad Criptográfica
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                shape = RoundedCornerShape(14.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "PIPELINE DE INTELIGENCIA ACÚSTICA",
                            color = Color(0xFF818CF8),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Surface(
                            color = Color(0xFF064E3B),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text(
                                "TLS 1.3 · RSA-4096",
                                color = Color(0xFF34D399),
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        "Captura · Transcribe · Consolida · Formaliza",
                        color = Color.White,
                        fontWeight = FontWeight.Black,
                        fontSize = 14.sp
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        "Decodificación universal de audio y ortotipografía oficial RAE",
                        color = Color(0xFF94A3B8),
                        fontSize = 11.sp
                    )
                }
            }

            // Contenedor principal de acciones (Grabar o Seleccionar Archivo)
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(16.dp),
                elevation = CardDefaults.cardElevation(2.dp)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    val isRecording = uiState is AudioUiState.Recording

                    // Botón circular de Micrófono
                    Button(
                        onClick = {
                            if (isRecording) {
                                viewModel.stopRecordingAndUpload()
                            } else {
                                permissionLauncher.launch(android.Manifest.permission.RECORD_AUDIO)
                            }
                        },
                        modifier = Modifier.size(80.dp),
                        shape = CircleShape,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (isRecording) RoseError else IndigoPrimary
                        )
                    ) {
                        Icon(
                            imageVector = if (isRecording) Icons.Default.Stop else Icons.Default.Mic,
                            contentDescription = if (isRecording) "Detener" else "Grabar",
                            modifier = Modifier.size(36.dp),
                            tint = Color.White
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = if (isRecording) "Grabando audio... Pulsa para procesar" else "Pulsa para grabar",
                        fontWeight = FontWeight.Medium,
                        fontSize = 14.sp
                    )

                    Spacer(modifier = Modifier.height(16.dp))
                    Divider()
                    Spacer(modifier = Modifier.height(16.dp))

                    OutlinedButton(
                        onClick = { filePickerLauncher.launch("audio/*") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Default.UploadFile, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Seleccionar archivo de audio")
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Visualización según el estado
            when (val state = uiState) {
                is AudioUiState.Uploading -> {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Column(
                            modifier = Modifier.padding(20.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            CircularProgressIndicator(color = IndigoPrimary)
                            Spacer(modifier = Modifier.height(12.dp))
                            Text("Subiendo archivo: ${state.filename}...")
                        }
                    }
                }

                is AudioUiState.Processing -> {
                    ProcessingProgressCard(job = state.job)
                }

                is AudioUiState.Success -> {
                    SuccessResultCard(
                        job = state.job,
                        onReset = { viewModel.resetState() }
                    )
                }

                is AudioUiState.Error -> {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF1F2)),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Error, contentDescription = null, tint = RoseError)
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(state.message, color = RoseError, fontSize = 13.sp)
                        }
                    }
                }

                else -> {}
            }
        }
    }
}

@Composable
fun ProcessingProgressCard(job: JobResponse) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Procesando audio", fontWeight = FontWeight.Bold)
                Text(
                    "${job.progressPercent}%",
                    fontWeight = FontWeight.Bold,
                    color = IndigoPrimary
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            LinearProgressIndicator(
                progress = { job.progressPercent / 100f },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(4.dp)),
                color = IndigoPrimary,
            )

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = job.currentStep,
                style = MaterialTheme.typography.bodyMedium,
                color = Color.DarkGray
            )
        }
    }
}

@Composable
fun SuccessResultCard(job: JobResponse, onReset: () -> Unit) {
    val context = LocalContext.current
    var selectedTab by remember { mutableStateOf(0) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(3.dp)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = EmeraldAccent)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Resultado Final", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                }

                Row {
                    // Copiar al portapapeles
                    IconButton(onClick = {
                        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                        val clip = ClipData.newPlainText("Acta Corregida", job.finalCorrectedText ?: "")
                        clipboard.setPrimaryClip(clip)
                        Toast.makeText(context, "Texto copiado al portapapeles", Toast.LENGTH_SHORT).show()
                    }) {
                        Icon(Icons.Default.ContentCopy, contentDescription = "Copiar")
                    }

                    // Compartir vía Intent
                    IconButton(onClick = {
                        val sendIntent: Intent = Intent().apply {
                            action = Intent.ACTION_SEND
                            putExtra(Intent.EXTRA_TEXT, job.finalCorrectedText ?: "")
                            type = "text/plain"
                        }
                        val shareIntent = Intent.createChooser(sendIntent, "Compartir Acta Corregida")
                        context.startActivity(shareIntent)
                    }) {
                        Icon(Icons.Default.Share, contentDescription = "Compartir")
                    }
                }
            }

            // Estadísticas rápidas
            job.stats?.let { stats ->
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFFF1F5F9), RoundedCornerShape(8.dp))
                        .padding(8.dp),
                    horizontalArrangement = Arrangement.SpaceAround
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("${stats.finalWords}", fontWeight = FontWeight.Bold, color = IndigoPrimary)
                        Text("Palabras", fontSize = 10.sp, color = Color.Gray)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("${stats.removedFillers}", fontWeight = FontWeight.Bold, color = Color(0xFFD97706))
                        Text("Muletillas", fontSize = 10.sp, color = Color.Gray)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("${stats.orthographicCorrections}", fontWeight = FontWeight.Bold, color = EmeraldAccent)
                        Text("Ortografía", fontSize = 10.sp, color = Color.Gray)
                    }
                }

                // Sello de Cadena de Custodia Criptográfica SHA-256
                stats.audioSha256?.let { sha ->
                    Spacer(modifier = Modifier.height(10.dp))
                    Surface(
                        color = Color(0xFFF8FAFC),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(8.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    Icons.Default.Shield,
                                    contentDescription = null,
                                    tint = EmeraldAccent,
                                    modifier = Modifier.size(13.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    "Cadena de Custodia Criptográfica (SHA-256):",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF334155)
                                )
                            }
                            Text(
                                sha,
                                fontSize = 9.sp,
                                color = Color(0xFF64748B),
                                fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Selector de pestaña: Corregido vs Bruto
            TabRow(selectedTabIndex = selectedTab) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = { Text("Texto Corregido") }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = { Text("Transcripción Cruda") }
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Surface(
                color = Color(0xFFF8FAFC),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = if (selectedTab == 0) {
                        job.finalCorrectedText ?: "Sin texto"
                    } else {
                        job.rawTranscription ?: "Sin transcripción"
                    },
                    modifier = Modifier.padding(12.dp),
                    fontSize = 14.sp,
                    lineHeight = 20.sp
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = onReset,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = IndigoPrimary),
                shape = RoundedCornerShape(10.dp)
            ) {
                Text("Procesar Otra Acta")
            }
        }
    }
}

/**
 * Función utilitaria para copiar el Uri seleccionado a un archivo temporal local
 */
private fun copyUriToCache(context: Context, uri: Uri): File? {
    return try {
        val contentResolver = context.contentResolver
        val tempFile = File(context.cacheDir, "audio_upload_${System.currentTimeMillis()}.m4a")
        contentResolver.openInputStream(uri)?.use { inputStream ->
            FileOutputStream(tempFile).use { outputStream ->
                inputStream.copyTo(outputStream)
            }
        }
        tempFile
    } catch (e: Exception) {
        null
    }
}
