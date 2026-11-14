package com.actasdigitales.app.ui.screens

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.OpenableColumns
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.UploadFile
import androidx.compose.material3.IconButton
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.actasdigitales.app.ui.components.AudioRecordingPulse
import com.actasdigitales.app.ui.components.AudioWaveformVisualizer
import com.actasdigitales.app.ui.components.CyberPipelineBannerCard
import com.actasdigitales.app.ui.components.FuturisticProcessingCard
import com.actasdigitales.app.ui.components.FuturisticSuccessCard
import com.actasdigitales.app.ui.components.ThemeToggleChip
import com.actasdigitales.app.ui.components.ServerSettingsDialog
import com.actasdigitales.app.ui.theme.ThemeMode
import com.actasdigitales.app.ui.viewmodel.AudioUiState
import com.actasdigitales.app.ui.viewmodel.AudioViewModel
import java.io.File
import java.io.FileOutputStream

private const val MAX_FILE_SIZE_BYTES = 1_024L * 1_024L * 1_024L // 1 GB, igual que el backend

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    viewModel: AudioViewModel,
    themeMode: ThemeMode,
    onThemeModeChange: (ThemeMode) -> Unit
) {
    var showServerDialog by remember { mutableStateOf(false) }

    val uiState by viewModel.uiState.collectAsState()
    val currentAmplitude by viewModel.amplitudeFlow.collectAsState()
    val context = LocalContext.current

    // El permiso se consulta del sistema en cada composición relevante:
    // si el usuario lo concede y vuelve atrás, la interfaz queda sincronizada.
    var hasMicPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) ==
                PackageManager.PERMISSION_GRANTED
        )
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        hasMicPermission = granted
        if (granted) {
            viewModel.startRecording()
        } else {
            Toast.makeText(context, "Se requiere permiso de micrófono para grabar", Toast.LENGTH_LONG).show()
        }
    }

    val filePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri == null) return@rememberLauncherForActivityResult
        val file = copyUriToCache(context, uri)
        if (file == null) {
            Toast.makeText(context, "No se pudo leer el archivo seleccionado", Toast.LENGTH_LONG).show()
        } else if (file.length() == 0L) {
            Toast.makeText(context, "El archivo está vacío o no es de audio", Toast.LENGTH_LONG).show()
            file.delete()
        } else if (file.length() > MAX_FILE_SIZE_BYTES) {
            Toast.makeText(context, "El archivo supera el límite de 1 GB", Toast.LENGTH_LONG).show()
            file.delete()
        } else {
            viewModel.uploadAudioFile(file)
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
                            modifier = Modifier.size(22.dp)
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
                    IconButton(onClick = { showServerDialog = true }) {
                        Icon(
                            imageVector = Icons.Default.Settings,
                            contentDescription = "Ajustes del servidor",
                            tint = Color.White
                        )
                    }
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
                .padding(horizontal = 16.dp, vertical = 12.dp)
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
                text = "Graba desde el micrófono o elige un archivo de audio",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(bottom = 12.dp)
            )

            CyberPipelineBannerCard(modifier = Modifier.padding(bottom = 14.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(18.dp),
                elevation = CardDefaults.cardElevation(3.dp)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    val isRecording = uiState is AudioUiState.Recording
                    val seconds = (uiState as? AudioUiState.Recording)?.durationSeconds ?: 0

                    AudioRecordingPulse(
                        isRecording = isRecording,
                        onClick = {
                            if (isRecording) {
                                viewModel.stopRecordingAndUpload()
                            } else if (hasMicPermission) {
                                viewModel.startRecording()
                            } else {
                                permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                            }
                        }
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = if (isRecording) {
                            "Grabando  ${formatDuration(seconds)}"
                        } else {
                            "Pulsa para grabar"
                        },
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 15.sp,
                        color = if (isRecording) {
                            MaterialTheme.colorScheme.error
                        } else {
                            MaterialTheme.colorScheme.onSurface
                        }
                    )

                    if (isRecording) {
                        Text(
                            text = "Pulsa de nuevo para detener y procesar",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(12.dp))
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
                        shape = RoundedCornerShape(12.dp),
                        enabled = !isRecording
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

            Spacer(modifier = Modifier.height(18.dp))

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
                                text = "Subiendo ${state.filename}…",
                                color = MaterialTheme.colorScheme.onSurface,
                                fontSize = 13.sp
                            )
                        }
                    }
                }

                is AudioUiState.Processing -> FuturisticProcessingCard(job = state.job)

                is AudioUiState.Success -> {
                    if (state.job.isOffline) {
                        OfflineNoticeCard()
                        Spacer(modifier = Modifier.height(12.dp))
                    }
                    FuturisticSuccessCard(
                        job = state.job,
                        onReset = { viewModel.resetState() },
                        isOffline = state.job.isOffline
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
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.Error,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.error
                                )
                                Spacer(modifier = Modifier.width(10.dp))
                                Text(
                                    text = "Ocurrió un problema",
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onErrorContainer
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = state.message,
                                color = MaterialTheme.colorScheme.onErrorContainer,
                                fontSize = 13.sp
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Button(
                                onClick = { viewModel.resetState() },
                                modifier = Modifier.align(Alignment.End)
                            ) {
                                Text("Reintentar")
                            }
                        }
                    }
                }

                else -> Unit
            }
        }

        if (showServerDialog) {
            ServerSettingsDialog(onDismiss = { showServerDialog = false })
        }
    }
}

@Composable
private fun OfflineNoticeCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.secondaryContainer
        ),
        shape = RoundedCornerShape(14.dp)
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = "Guardado sin conexión",
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSecondaryContainer,
                fontSize = 13.sp
            )
            Text(
                text = "No se alcanzó el servidor de transcripción. El audio y su huella SHA-256 " +
                    "quedaron registrados en el historial del dispositivo.",
                color = MaterialTheme.colorScheme.onSecondaryContainer,
                fontSize = 12.sp
            )
        }
    }
}

private fun formatDuration(totalSeconds: Int): String {
    val minutes = totalSeconds / 60
    val seconds = totalSeconds % 60
    return "%02d:%02d".format(minutes, seconds)
}

/**
 * Copia el contenido elegido en el selector del sistema a un archivo temporal de la caché.
 * Mantiene la extensión original para que el servidor valide el formato correctamente.
 */
private fun copyUriToCache(context: Context, uri: Uri): File? {
    return try {
        var displayName = "audio_${System.currentTimeMillis()}.m4a"
        context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
            val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            if (nameIndex >= 0 && cursor.moveToFirst()) {
                cursor.getString(nameIndex)?.let { name ->
                    if (name.isNotBlank()) displayName = name
                }
            }
        }

        val extension = displayName.substringAfterLast('.', "m4a").lowercase()
        val tempFile = File(context.cacheDir, "audio_upload_${System.currentTimeMillis()}.$extension")

        context.contentResolver.openInputStream(uri)?.use { inputStream ->
            FileOutputStream(tempFile).use { outputStream -> inputStream.copyTo(outputStream) }
        } ?: return null

        tempFile
    } catch (e: Exception) {
        null
    }
        if (showServerDialog) {
            ServerSettingsDialog(onDismiss = { showServerDialog = false })
        }

}
