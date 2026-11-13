package com.actasdigitales.app.data.repository

import com.actasdigitales.app.ai.OfflineAiEngine
import com.actasdigitales.app.data.api.RetrofitClient
import com.actasdigitales.app.data.local.ActaDao
import com.actasdigitales.app.data.local.ActaEntity
import com.actasdigitales.app.data.model.JobResponse
import com.actasdigitales.app.data.model.JobStatus
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File

class AudioRepository(private val actaDao: ActaDao? = null) {

    private val apiService = RetrofitClient.getApiService()

    /**
     * Canalización de Inteligencia Acústica 100% Offline (Zero-Cloud Local).
     * Procesa el archivo de audio localmente, ejecuta la ortotipografía RAE,
     * calcula el resumen criptográfico SHA-256 y persiste la entidad en Room.
     */
    fun processAudioOfflineFlow(file: File): Flow<JobResponse> = flow {
        val finalJob = OfflineAiEngine.processAudioOffline(file)

        // Paso 1: Decodificación acústica DSP (30%)
        emit(finalJob.copy(
            status = JobStatus.TRANSCRIBING,
            progressPercent = 30,
            currentStep = "Decodificando Espectro Acústico Local (DSP)..."
        ))
        delay(350)

        // Paso 2: Corrección ortotípica RAE (65%)
        emit(finalJob.copy(
            status = JobStatus.CORRECTING,
            progressPercent = 65,
            currentStep = "Aplicando Ortotipografía RAE & Sintaxis..."
        ))
        delay(400)

        // Paso 3: Verificación Criptográfica SHA-256 (90%)
        emit(finalJob.copy(
            status = JobStatus.CONSOLIDATING,
            progressPercent = 90,
            currentStep = "Generando Firma SHA-256 & Guardando en Room..."
        ))
        delay(300)

        // Guardado local en Room
        saveJobToLocalDb(finalJob)

        // Paso 4: Finalizado 100%
        emit(finalJob)
    }

    suspend fun uploadAudio(file: File, apiKey: String? = null): Result<JobResponse> {
        return try {
            val mediaType = "audio/*".toMediaTypeOrNull()
            val requestFile = file.asRequestBody(mediaType)
            val body = MultipartBody.Part.createFormData("file", file.name, requestFile)
            val langBody = "es".toRequestBody("text/plain".toMediaTypeOrNull())

            val response = apiService.uploadAudio(body, langBody, apiKey)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Error en el servidor: ${response.code()} ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getJobStatus(jobId: String): Result<JobResponse> {
        return try {
            val response = apiService.getJobStatus(jobId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Error consultando estado: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Emite actualizaciones periódicas del estado del trabajo hasta que finalice o falle,
     * guardando automáticamente el acta en Room Database al completar.
     */
    fun pollJobUntilComplete(jobId: String): Flow<JobResponse> = flow {
        var isFinished = false
        while (!isFinished) {
            val result = getJobStatus(jobId)
            if (result.isSuccess) {
                val job = result.getOrThrow()
                emit(job)
                if (job.status == JobStatus.COMPLETED || job.status == JobStatus.FAILED) {
                    isFinished = true
                    if (job.status == JobStatus.COMPLETED) {
                        saveJobToLocalDb(job)
                    }
                }
            }
            if (!isFinished) {
                delay(1200)
            }
        }
    }

    private suspend fun saveJobToLocalDb(job: JobResponse) {
        try {
            actaDao?.let { dao ->
                val entity = ActaEntity(
                    jobId = job.jobId,
                    filename = job.filename,
                    finalCorrectedText = job.finalCorrectedText ?: "",
                    rawTranscription = job.rawTranscription ?: "",
                    audioSha256 = job.stats?.audioSha256 ?: "sha256-unverified",
                    timestamp = System.currentTimeMillis(),
                    wordsCount = job.stats?.finalWords ?: 0,
                    removedFillers = job.stats?.removedFillers ?: 0,
                    orthographicCorrections = job.stats?.orthographicCorrections ?: 0
                )
                dao.insertActa(entity)
            }
        } catch (ignored: Exception) {}
    }

    // Métodos para acceder al historial local de actas
    fun getAllLocalActas(): Flow<List<ActaEntity>>? = actaDao?.getAllActas()

    fun searchLocalActas(query: String): Flow<List<ActaEntity>>? = actaDao?.searchActas(query)

    suspend fun deleteLocalActa(id: Long) {
        actaDao?.deleteActaById(id)
    }
}
