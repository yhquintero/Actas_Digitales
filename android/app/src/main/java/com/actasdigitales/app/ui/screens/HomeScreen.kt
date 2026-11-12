package com.actasdigitales.app.ui.screens

import android.content.Context
import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.actasdigitales.app.ui.components.*
import com.actasdigitales.app.ui.theme.ThemeMode
import com.actasdigitales.app.ui.viewmodel.AudioUiState
import com.actasdigitales.app.ui.viewmodel.AudioViewModel
import java.io.File
import java.io.FileOutputStream

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    viewModel: AudioViewModel,
    themeMode: ThemeMode,
    onThemeModeChange: (ThemeMode) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val currentAmplitude by viewModel.amplitudeFlow.collectAsState()
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
                            imageVector = Icons.Default.Mic,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Actas Digitales",
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                },
                actions = {
                    ThemeToggleChip(
                        currentMode = themeMode,
                        onModeChange = onThemeModeChange,
                        modifier = Modifier.padding(end = 12.dp)
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary
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
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground
            )
            Text(
                text = "Sube un archivo de audio o graba desde el micrófono",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(bottom = 14.dp)
            )

            // Banner Ejecutivo de los 4 Pilares y Seguridad Criptográfica
            CyberPipelineBannerCard(
                modifier = Modifier.padding(bottom = 16.dp)
            )

            // Contenedor principal de acciones (Grabar o Seleccionar Archivo)
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(16.dp),
                elevation = CardDefaults.cardElevation(3.dp)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    val isRecording = uiState is AudioUiState.Recording

                    // Componente de Botón de Micrófono con Pulso Animado Holográfico
                    AudioRecordingPulse(
                        isRecording = isRecording,
                        onClick = {
                            if (isRecording) {
                                viewModel.stopRecordingAndUpload()
                            } else {
                                permissionLauncher.launch(android.Manifest.permission.RECORD_AUDIO)
                            }
                        }
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    Text(
                        text = if (isRecording) "Grabando audio... Pulsa para procesar" else "Pulsa para grabar",
                        fontWeight = FontWeight.Medium,
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )

                    // Ecualizador de ondas neón animadas en tiempo real muestreado asíncronamente
                    if (isRecording) {
                        Spacer(modifier = Modifier.height(14.dp))
                        AudioWaveformVisualizer(
                            isRecording = true,
                            maxAmplitude = currentAmplitude
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                    Spacer(modifier = Modifier.height(16.dp))

                    OutlinedButton(
                        onClick = { filePickerLauncher.launch("audio/*") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.UploadFile,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Seleccionar archivo de audio",
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Visualización según el estado
            when (val state = uiState) {
                is AudioUiState.Uploading -> {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Column(
                            modifier = Modifier.padding(20.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = "Subiendo archivo: ${state.filename}...",
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }

                is AudioUiState.Processing -> {
                    FuturisticProcessingCard(job = state.job)
                }

                is AudioUiState.Success -> {
                    FuturisticSuccessCard(
                        job = state.job,
                        onReset = { viewModel.resetState() }
                    )
                }

                is AudioUiState.Error -> {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.errorContainer
                        ),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.Error,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.error
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                text = state.message,
                                color = MaterialTheme.colorScheme.onErrorContainer,
                                fontSize = 13.sp
                            )
                        }
                    }
                }

                else -> {}
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
