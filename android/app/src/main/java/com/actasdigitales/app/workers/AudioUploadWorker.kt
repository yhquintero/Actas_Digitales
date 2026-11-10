package com.actasdigitales.app.workers

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import com.actasdigitales.app.data.repository.AudioRepository
import java.io.File

class AudioUploadWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    private val repository = AudioRepository()

    override suspend fun doWork(): Result {
        val filePath = inputData.getString(KEY_AUDIO_PATH) ?: return Result.failure()
        val apiKey = inputData.getString(KEY_API_KEY)
        val file = File(filePath)

        if (!file.exists()) {
            return Result.failure(workDataOf("error" to "Archivo de audio no encontrado"))
        }

        return try {
            val response = repository.uploadAudio(file, apiKey)
            if (response.isSuccess) {
                val job = response.getOrThrow()
                Result.success(workDataOf(KEY_JOB_ID to job.jobId))
            } else {
                if (runAttemptCount < 3) {
                    Result.retry()
                } else {
                    Result.failure(workDataOf("error" to response.exceptionOrNull()?.message))
                }
            }
        } catch (e: Exception) {
            if (runAttemptCount < 3) {
                Result.retry()
            } else {
                Result.failure(workDataOf("error" to e.localizedMessage))
            }
        }
    }

    companion object {
        const val KEY_AUDIO_PATH = "key_audio_path"
        const val KEY_API_KEY = "key_api_key"
        const val KEY_JOB_ID = "key_job_id"
    }
}
