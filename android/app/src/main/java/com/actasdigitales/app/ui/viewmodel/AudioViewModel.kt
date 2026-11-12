package com.actasdigitales.app.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.actasdigitales.app.audio.AudioRecorderManager
import com.actasdigitales.app.data.local.ActaDao
import com.actasdigitales.app.data.local.ActaEntity
import com.actasdigitales.app.data.local.AppDatabase
import com.actasdigitales.app.data.model.JobResponse
import com.actasdigitales.app.data.model.JobStatus
import com.actasdigitales.app.data.repository.AudioRepository
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

sealed interface AudioUiState {
    data object Idle : AudioUiState
    data class Recording(val durationSeconds: Int) : AudioUiState
    data class Uploading(val filename: String) : AudioUiState
    data class Processing(val job: JobResponse) : AudioUiState
    data class Success(val job: JobResponse) : AudioUiState
    data class Error(val message: String) : AudioUiState
}

class AudioViewModel(application: Application) : AndroidViewModel(application) {

    private val actaDao: ActaDao = AppDatabase.getDatabase(application).actaDao()
    private val repository = AudioRepository(actaDao)

    val recorderManager = AudioRecorderManager(application)

    private val _uiState = MutableStateFlow<AudioUiState>(AudioUiState.Idle)
    val uiState: StateFlow<AudioUiState> = _uiState.asStateFlow()

    private val _amplitudeFlow = MutableStateFlow(0)
    val amplitudeFlow: StateFlow<Int> = _amplitudeFlow.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    @OptIn(ExperimentalCoroutinesApi::class)
    val historyActas: StateFlow<List<ActaEntity>> = _searchQuery
        .flatMapLatest { query ->
            if (query.isBlank()) actaDao.getAllActas() else actaDao.searchActas(query)
        }
        .flowOn(Dispatchers.IO)
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = emptyList()
        )

    private var pollingJob: Job? = null
    private var amplitudePollJob: Job? = null
    private var timerJob: Job? = null

    fun setSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun deleteActa(id: Long) {
        viewModelScope.launch(Dispatchers.IO) { actaDao.deleteActaById(id) }
    }

    fun startRecording() {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                recorderManager.startRecording()
                withContext(Dispatchers.Main) {
                    _uiState.value = AudioUiState.Recording(0)
                    startCronometer()
                    startAmplitudePolling()
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    _uiState.value = AudioUiState.Error("No se pudo iniciar la grabación: ${e.message}")
                }
            }
        }
    }

    private fun startCronometer() {
        timerJob?.cancel()
        timerJob = viewModelScope.launch {
            while (recorderManager.isRecording) {
                val seconds = recorderManager.elapsedSeconds
                if (_uiState.value is AudioUiState.Recording) {
                    _uiState.value = AudioUiState.Recording(seconds)
                }
                delay(500)
            }
        }
    }

    private fun startAmplitudePolling() {
        amplitudePollJob?.cancel()
        amplitudePollJob = viewModelScope.launch(Dispatchers.Default) {
            while (recorderManager.isRecording) {
                _amplitudeFlow.value = recorderManager.getMaxAmplitude()
                delay(80)
            }
            _amplitudeFlow.value = 0
        }
    }

    fun stopRecordingAndUpload() {
        timerJob?.cancel()
        amplitudePollJob?.cancel()
        _amplitudeFlow.value = 0
        viewModelScope.launch(Dispatchers.IO) {
            val recordingsFolder = getApplication<Application>().cacheDir
            val recordedFile = recorderManager.stopRecording()
            // Limpieza de grabaciones antiguas (E/S en segundo plano, nunca en el hilo principal).
            cleanupOldRecordings(recordingsFolder)

            withContext(Dispatchers.Main) {
                _uiState.value = AudioUiState.Idle
                if (recordedFile != null && recordedFile.exists()) {
                    uploadAudioFile(recordedFile)
                } else {
                    _uiState.value = AudioUiState.Error(
                        "No se guardó audio: la grabación fue demasiado corta. Graba unos segundos más."
                    )
                }
            }
        }
    }

    fun uploadAudioFile(file: File) {
        pollingJob?.cancel()
        _uiState.value = AudioUiState.Uploading(file.name)
        viewModelScope.launch(Dispatchers.IO) {
            val result = repository.uploadAudio(file)
            if (result.isSuccess) {
                val initialJob = result.getOrThrow()
                withContext(Dispatchers.Main) { _uiState.value = AudioUiState.Processing(initialJob) }
                startPolling(initialJob.jobId)
            } else {
                // Sin servidor: se conserva el acta localmente en lugar de fallar en seco.
                val reason = friendlyReason(result.exceptionOrNull())
                val fallback = repository.createOfflineActa(file, reason)
                withContext(Dispatchers.Main) {
                    _uiState.value = AudioUiState.Success(fallback)
                }
            }
        }
    }

    private fun friendlyReason(error: Throwable?): String {
        val message = error?.message.orEmpty()
        return when {
            message.contains("timeout", ignoreCase = true) -> "tiempo de espera agotado"
            message.contains("Failed to connect", ignoreCase = true) -> "servidor no accesible"
            message.contains("ECONNREFUSED", ignoreCase = true) -> "servidor apagado"
            message.isBlank() -> "error de red"
            else -> message.take(80)
        }
    }

    private fun startPolling(jobId: String) {
        pollingJob?.cancel()
        pollingJob = viewModelScope.launch(Dispatchers.IO) {
            try {
                repository.pollJobUntilComplete(jobId).collect { job ->
                    withContext(Dispatchers.Main) {
                        _uiState.value = when (job.status) {
                            JobStatus.COMPLETED -> AudioUiState.Success(job)
                            JobStatus.FAILED -> AudioUiState.Error(
                                job.errorMessage ?: "Falló la transcripción del audio"
                            )
                            else -> AudioUiState.Processing(job)
                        }
                    }
                }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    _uiState.value = AudioUiState.Error(
                        "Se interrumpió el seguimiento del trabajo: ${e.message}"
                    )
                }
            }
        }
    }

    fun resetState() {
        pollingJob?.cancel()
        amplitudePollJob?.cancel()
        timerJob?.cancel()
        _amplitudeFlow.value = 0
        _uiState.value = AudioUiState.Idle
    }

    private fun cleanupOldRecordings(folder: File) {
        try {
            val limit = System.currentTimeMillis() - MAX_CACHE_AGE_MS
            folder.listFiles { file -> file.name.startsWith("acta_grabacion_") }
                ?.filter { it.lastModified() < limit }
                ?.forEach { it.delete() }
        } catch (ignored: Exception) {
        }
    }

    override fun onCleared() {
        super.onCleared()
        recorderManager.release()
        pollingJob?.cancel()
        amplitudePollJob?.cancel()
        timerJob?.cancel()
    }

    companion object {
        private const val MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1_000L
    }
}
