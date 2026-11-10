package com.actasdigitales.app.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.actasdigitales.app.audio.AudioRecorderManager
import com.actasdigitales.app.data.model.JobResponse
import com.actasdigitales.app.data.model.JobStatus
import com.actasdigitales.app.data.repository.AudioRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
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

    private val repository = AudioRepository()
    private val recorderManager = AudioRecorderManager(application)

    private val _uiState = MutableStateFlow<AudioUiState>(AudioUiState.Idle)
    val uiState: StateFlow<AudioUiState> = _uiState.asStateFlow()

    private val _apiKey = MutableStateFlow("")
    val apiKey: StateFlow<String> = _apiKey.asStateFlow()

    private var pollingJob: Job? = null

    fun setApiKey(key: String) {
        _apiKey.value = key
    }

    fun startRecording() {
        try {
            recorderManager.startRecording()
            _uiState.value = AudioUiState.Recording(0)
        } catch (e: Exception) {
            _uiState.value = AudioUiState.Error("Error al iniciar grabación: ${e.message}")
        }
    }

    fun stopRecordingAndUpload() {
        val recordedFile = recorderManager.stopRecording()
        if (recordedFile != null && recordedFile.exists()) {
            uploadAudioFile(recordedFile)
        } else {
            _uiState.value = AudioUiState.Error("No se pudo guardar la grabación")
        }
    }

    fun uploadAudioFile(file: File) {
        _uiState.value = AudioUiState.Uploading(file.name)
        viewModelScope.launch {
            val key = _apiKey.value.takeIf { it.isNotBlank() }
            val result = repository.uploadAudio(file, key)
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

    private fun startPolling(jobId: String) {
        pollingJob?.cancel()
        pollingJob = viewModelScope.launch {
            repository.pollJobUntilComplete(jobId).collect { job ->
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

    fun resetState() {
        pollingJob?.cancel()
        _uiState.value = AudioUiState.Idle
    }

    override fun onCleared() {
        super.onCleared()
        recorderManager.release()
        pollingJob?.cancel()
    }
}
