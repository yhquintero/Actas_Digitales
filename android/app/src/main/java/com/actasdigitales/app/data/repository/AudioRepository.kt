package com.actasdigitales.app.data.repository

import com.actasdigitales.app.data.api.RetrofitClient
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

class AudioRepository {

    private val apiService = RetrofitClient.getApiService()

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
     * Emite actualizaciones periódicas del estado del trabajo hasta que finalice o falle.
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
                }
            }
            if (!isFinished) {
                delay(1200)
            }
        }
    }
}
