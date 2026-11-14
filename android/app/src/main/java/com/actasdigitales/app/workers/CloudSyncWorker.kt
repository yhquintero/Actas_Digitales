package com.actasdigitales.app.workers

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import com.actasdigitales.app.BuildConfig
import com.actasdigitales.app.data.api.RetrofitClient
import com.actasdigitales.app.data.local.AppDatabase
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * Sube las actas locales (Room) al servidor para que la Web las muestre.
 *
 * La subida es idempotente por `audio_sha256`: el servidor deduplica, de modo
 * que reenviar el histórico completo tras cada cambio no genera duplicados.
 * Nota honesta: sin una columna `pendingSync`, cada pasada reensobre el lote
 * completo; la deduplicación servidor-side lo hace correcto aunque no óptimo.
 * La validación SHA-256 del audio ocurre al guardarse en Room (AudioRepository).
 */
class CloudSyncWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            val dao = AppDatabase.getDatabase(applicationContext).actaDao()
            val acts = dao.getActasSnapshot(limit = 100)
            if (acts.isEmpty()) {
                return@withContext Result.success(workDataOf("synced_count" to 0))
            }

            val base = RetrofitClient.baseUrl.trimEnd('/')
            val jsonArray = JSONArray()
            acts.forEach { acta ->
                jsonArray.put(
                    JSONObject().apply {
                        put("audio_sha256", acta.audioSha256)
                        put("job_id", acta.jobId)
                        put("filename", acta.filename.take(255))
                        put("final_text", acta.finalCorrectedText.take(190_000))
                        put("raw_text", acta.rawTranscription.take(190_000))
                        put("words_count", acta.wordsCount)
                        put("removed_fillers", acta.removedFillers)
                        put("orthographic_corrections", acta.orthographicCorrections)
                        put("timestamp", acta.timestamp)
                    }
                )
            }
            val body = JSONObject()
                .put("source", "android-room")
                .put("acts", jsonArray)

            val clientBuilder = OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(60, TimeUnit.SECONDS)
                .writeTimeout(60, TimeUnit.SECONDS)
            // Respeta el pinning de certificados si está configurado (RetrofitClient)
            RetrofitClient.certificatePinner()?.let { clientBuilder.certificatePinner(it) }
            val client = clientBuilder.build()

            val request = Request.Builder()
                .url("$base/api/acts/sync")
                .post(body.toString().toRequestBody("application/json; charset=utf-8".toMediaType()))
                .header("Accept", "application/json")
                .apply {
                    // El servidor exige ACTAS_SYNC_TOKEN en /api/acts/sync (seguridad por defecto).
                    if (BuildConfig.ACTAS_SYNC_TOKEN.isNotBlank()) {
                        header("X-Sync-Token", BuildConfig.ACTAS_SYNC_TOKEN)
                    }
                }
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    // El servidor rechazó el lote: reintentar más tarde (WorkManager backoff)
                    return@withContext Result.retry()
                }
                val respBody = response.body?.string() ?: "{}"
                val stored = try {
                    JSONObject(respBody).optInt("stored", 0)
                } catch (e: Exception) {
                    0
                }
                Result.success(workDataOf("synced_count" to stored))
            }
        } catch (e: Exception) {
            Result.retry()
        }
    }
}
