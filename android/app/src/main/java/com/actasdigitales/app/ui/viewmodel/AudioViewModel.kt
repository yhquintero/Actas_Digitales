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
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

sealed interface AudioUiState {
    object Idle : AudioUiState
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

    private val _apiKey = MutableStateFlow("")
    val apiKey: StateFlow<String> = _apiKey.asStateFlow()

    private val _amplitudeFlow = MutableStateFlow(0)
    val amplitudeFlow: StateFlow<Int> = _amplitudeFlow.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    @OptIn(ExperimentalCoroutinesApi::class)
    val historyActas: StateFlow<List<ActaEntity>> = _searchQuery
        .flatMapLatest { query ->
            if (query.isBlank()) {
                actaDao.getAllActas()
            } else {
                actaDao.searchActas(query)
            }
        }
        .flowOn(Dispatchers.IO)
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    private var pollingJob: Job? = null
    private var amplitudePollJob: Job? = null

    fun setSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun deleteActa(id: Long) {
        viewModelScope.launch(Dispatchers.IO) {
            actaDao.deleteActaById(id)
        }
    }

    fun startRecording() {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                recorderManager.startRecording()
                withContext(Dispatchers.Main) {
                    _uiState.value = AudioUiState.Recording(0)
                    startAmplitudePolling()
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    _uiState.value = AudioUiState.Error("Error al iniciar grabación: ${e.message}")
                }
            }
        }
    }

    private fun startAmplitudePolling() {
        amplitudePollJob?.cancel()
        amplitudePollJob = viewModelScope.launch(Dispatchers.Default) {
            while (recorderManager.isRecording) {
                val maxAmp = recorderManager.getMaxAmplitude()
                _amplitudeFlow.value = maxAmp
                delay(80)
            }
            _amplitudeFlow.value = 0
        }
    }

    fun stopRecordingAndUpload() {
        amplitudePollJob?.cancel()
        _amplitudeFlow.value = 0
        viewModelScope.launch(Dispatchers.IO) {
            val recordedFile = recorderManager.stopRecording()
            withContext(Dispatchers.Main) {
                if (recordedFile != null && recordedFile.exists()) {
                    uploadAudioFile(recordedFile)
                } else {
                    _uiState.value = AudioUiState.Error("No se pudo guardar la grabación")
                }
            }
        }
    }

    fun uploadAudioFile(file: File) {
        _uiState.value = AudioUiState.Uploading(file.name)
        viewModelScope.launch(Dispatchers.IO) {
            val key = _apiKey.value.takeIf { it.isNotBlank() }
            val result = repository.uploadAudio(file, key)
            withContext(Dispatchers.Main) {
                if (result.isSuccess) {
                    val initialJob = result.getOrThrow()
                    _uiState.value = AudioUiState.Processing(initialJob)
                    startPolling(initialJob.jobId)
                } else {
                    _uiState.value = AudioUiState.Error(
                        result.exceptionOrNull()?.message ?: "Error al subir el archivo de audio"
                    )
                }
            }
        }
    }

    private fun startPolling(jobId: String) {
        pollingJob?.cancel()
        pollingJob = viewModelScope.launch(Dispatchers.IO) {
            repository.pollJobUntilComplete(jobId).collect { job ->
                withContext(Dispatchers.Main) {
                    if (job.status == JobStatus.COMPLETED) {
                        _uiState.value = AudioUiState.Success(job)
                    } else if (job.status == JobStatus.FAILED) {
                        _uiState.value = AudioUiState.Error(
                            job.errorMessage ?: "Falló la transcripción o corrección del audio"
                        )
                    } else {
                        _uiState.value = AudioUiState.Processing(job)
                    }
                }
            }
        }
    }

    fun resetState() {
        pollingJob?.cancel()
        amplitudePollJob?.cancel()
        _amplitudeFlow.value = 0
        _uiState.value = AudioUiState.Idle
    }

    override fun onCleared() {
        super.onCleared()
        recorderManager.release()
        pollingJob?.cancel()
        amplitudePollJob?.cancel()
    }
}
