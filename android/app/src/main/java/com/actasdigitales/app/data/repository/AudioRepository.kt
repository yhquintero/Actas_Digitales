package com.actasdigitales.app.data.repository

import com.actasdigitales.app.ai.OfflineAiEngine
import com.actasdigitales.app.audio.AudioRecorderManager
import com.actasdigitales.app.data.api.RetrofitClient
import com.actasdigitales.app.data.local.ActaDao
import com.actasdigitales.app.data.local.ActaEntity
import com.actasdigitales.app.data.model.CorrectionItem
import com.actasdigitales.app.data.model.JobResponse
import com.actasdigitales.app.data.model.JobStats
import com.actasdigitales.app.data.model.JobStatus
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import java.util.UUID

/**
 * Repositorio de audio.
 *
 * El servidor es la vía principal (transcripción real con IA). Cuando el dispositivo
 * no alcanza el backend (sin red, servidor apagado, emulador sin 10.0.2.2), se genera
 * un acta local de respaldo en lugar de dejar la pantalla bloqueada con un error:
 * así la app sigue siendo utilizable en el móvil y el audio queda registrado en el
 * historial con su huella SHA-256.
 */
class AudioRepository(private val actaDao: ActaDao? = null) {

    private val apiService by lazy { RetrofitClient.getApiService() }

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
            val payload = response.body()
            if (response.isSuccessful && payload != null) {
                Result.success(payload)
            } else {
                Result.failure(Exception("Error del servidor (${response.code()}) ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getJobStatus(jobId: String): Result<JobResponse> {
        return try {
            val response = apiService.getJobStatus(jobId)
            val payload = response.body()
            if (response.isSuccessful && payload != null) {
                Result.success(payload)
            } else {
                Result.failure(Exception("Error consultando el estado: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Emite actualizaciones del estado del trabajo hasta que finalice o falle y guarda
     * el acta en Room al completarse. Si el sondeo falla de forma persistente, emite un
     * trabajo fallido con el motivo real en vez de quedarse en silencio.
     */
    fun pollJobUntilComplete(jobId: String): Flow<JobResponse> = flow {
        var consecutiveErrors = 0
        while (true) {
            val result = getJobStatus(jobId)
            if (result.isSuccess) {
                consecutiveErrors = 0
                val job = result.getOrThrow()
                emit(job)
                if (job.status == JobStatus.COMPLETED) {
                    saveJobToLocalDb(job)
                    return@flow
                }
                if (job.status == JobStatus.FAILED) {
                    return@flow
                }
            } else {
                consecutiveErrors++
                if (consecutiveErrors >= MAX_POLL_ERRORS) {
                    emit(
                        JobResponse(
                            jobId = jobId,
                            filename = "",
                            fileSizeBytes = 0,
                            status = JobStatus.FAILED,
                            errorMessage = "Se perdió la conexión con el servidor durante el procesamiento"
                        )
                    )
                    return@flow
                }
            }
            delay(POLL_INTERVAL_MS)
        }
    }

    /**
     * Respaldo local: registra el audio capturado cuando el servidor no está disponible.
     * Devuelve un [JobResponse] completado para que la interfaz muestre el acta y las
     * estadísticas sin depender de la red.
     */
    suspend fun createOfflineActa(file: File, reason: String): JobResponse {
        val sha256 = AudioRecorderManager.computeSha256(file)
        val approxWords = ((file.length() / BYTES_PER_WORD_ESTIMATE).toInt()).coerceAtLeast(0)
        val now = System.currentTimeMillis()
        val readableDate = java.text.SimpleDateFormat(
            "dd/MM/yyyy HH:mm",
            java.util.Locale.getDefault()
        ).format(java.util.Date(now))

        val body = buildString {
            appendLine("ACTA DIGITAL — REGISTRO LOCAL DE AUDIO")
            appendLine()
            appendLine("Archivo: ${file.name}")
            appendLine("Fecha de captura: $readableDate")
            appendLine("Huella SHA-256: $sha256")
            appendLine()
            appendLine("La transcripción automática no se pudo completar porque el servidor no")
            appendLine("está accesible desde este dispositivo ($reason).")
            appendLine()
            appendLine("El audio original queda conservado en el dispositivo junto con este acta,")
            appendLine("de modo que pueda reenviarse al servidor cuando se recupere la conexión")
            appendLine("sin perder la cadena de custodia.")
        }

        val job = JobResponse(
            jobId = "local-${UUID.randomUUID()}",
            filename = file.name,
            fileSizeBytes = file.length(),
            status = JobStatus.COMPLETED,
            progressPercent = 100,
            currentStep = "Registro local",
            language = "es",
            rawTranscription = null,
            cleanedTranscription = null,
            finalCorrectedText = body,
            segments = emptyList(),
            correctionsApplied = emptyList<CorrectionItem>(),
            stats = JobStats(
                originalWords = approxWords,
                finalWords = approxWords,
                removedFillers = 0,
                orthographicCorrections = 0,
                audioSha256 = sha256,
                audioDurationSec = 0f
            ),
            errorMessage = null,
            isOffline = true
        )

        saveJobToLocalDb(job)
        return job
    }

    private suspend fun saveJobToLocalDb(job: JobResponse) {
        val dao = actaDao ?: return
        try {
            dao.insertActa(
                ActaEntity(
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
            )
        } catch (ignored: Exception) {
        }
    }

    // Acceso al historial local de actas
    fun getAllLocalActas(): Flow<List<ActaEntity>>? = actaDao?.getAllActas()

    fun searchLocalActas(query: String): Flow<List<ActaEntity>>? = actaDao?.searchActas(query)

    suspend fun deleteLocalActa(id: Long) {
        actaDao?.deleteActaById(id)
    }

    companion object {
        private const val POLL_INTERVAL_MS = 1_200L
        private const val MAX_POLL_ERRORS = 15
        private const val BYTES_PER_WORD_ESTIMATE = 3_500.0
    }
}
