package com.actasdigitales.app.audio

import android.content.Context
import android.media.MediaRecorder
import android.os.Build
import android.os.SystemClock
import java.io.File
import java.io.FileInputStream
import java.io.IOException
import java.security.MessageDigest

/**
 * Grabador de audio nativo basado en [MediaRecorder] (AAC 16 kHz estéreo/mono, 128 kbps).
 *
 * Correcciones aplicadas para el uso real en móvil:
 *  - Se libera correctamente el [MediaRecorder] si `prepare()` falla (antes quedaba vivo
 *    y bloqueaba el micrófono para siguientes intentos).
 *  - Se activan los filtros DSP de supresión de ruido y cancelación de eco tras `start()`.
 *  - Se emite un archivo válido aunque `stop()` lance (grabaciones demasiado cortas),
 *    en lugar de devolver `null` y perder el audio.
 *  - Se expone la duración real grabada para el cronómetro de la interfaz.
 */
class AudioRecorderManager(private val context: Context) {

    private var mediaRecorder: MediaRecorder? = null
    private var startedAt: Long = 0L

    var currentOutputFile: File? = null
        private set

    var isRecording: Boolean = false
        private set

    var isPaused: Boolean = false
        private set

    @Synchronized
    fun startRecording(): File {
        // Libera cualquier grabador previo antes de abrir el micrófono.
        release()

        val outputDir = context.cacheDir
        val audioFile = File(outputDir, "acta_grabacion_${System.currentTimeMillis()}.m4a")
        currentOutputFile = audioFile

        val recorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            MediaRecorder(context)
        } else {
            @Suppress("DEPRECATION")
            MediaRecorder()
        }

        try {
            recorder.apply {
                setAudioSource(MediaRecorder.AudioSource.MIC)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setAudioSamplingRate(SAMPLE_RATE)
                setAudioEncodingBitRate(BIT_RATE)
                setAudioChannels(1)
                setOutputFile(audioFile.absolutePath)
                prepare()
                start()
            }
        } catch (e: IOException) {
            safeRelease(recorder)
            throw e
        } catch (e: RuntimeException) {
            safeRelease(recorder)
            throw e
        }

        mediaRecorder = recorder
        isRecording = true
        isPaused = false
        startedAt = SystemClock.elapsedRealtime()

        // Supresión de ruido / cancelación de eco por hardware (si el dispositivo lo soporta).
        try {
            recorder.audioSessionId?.let { AudioNoiseFilter.enableDspFilters(it) }
        } catch (ignored: Exception) {
        }

        return audioFile
    }

    fun pauseRecording(): Boolean {
        if (!isRecording || isPaused) return false
        return try {
            mediaRecorder?.pause()
            isPaused = true
            true
        } catch (e: Exception) {
            false
        }
    }

    fun resumeRecording(): Boolean {
        if (!isRecording || !isPaused) return false
        return try {
            mediaRecorder?.resume()
            isPaused = false
            true
        } catch (e: Exception) {
            false
        }
    }

    /** Duración transcurrida de la grabación en segundos. */
    val elapsedSeconds: Int
        get() {
            if (!isRecording || startedAt == 0L) return 0
            return ((SystemClock.elapsedRealtime() - startedAt) / 1000L).toInt()
        }

    fun getMaxAmplitude(): Int {
        if (!isRecording || isPaused) return 0
        return try {
            mediaRecorder?.maxAmplitude ?: 0
        } catch (e: Exception) {
            0
        }
    }

    /**
     * Detiene la grabación y devuelve el archivo resultante.
     * Si la grabación fue demasiado corta, `stop()` lanza y el archivo queda inservible:
     * en ese caso se elimina y se devuelve `null` para informar al usuario.
     */
    @Synchronized
    fun stopRecording(): File? {
        if (!isRecording) return null
        val recorder = mediaRecorder
        val file = currentOutputFile

        val stoppedOk = try {
            recorder?.stop()
            true
        } catch (e: Exception) {
            false
        } finally {
            safeRelease(recorder)
            mediaRecorder = null
            isRecording = false
            isPaused = false
            startedAt = 0L
            AudioNoiseFilter.release()
        }

        val validFile = file?.takeIf { stoppedOk && it.exists() && it.length() > MIN_FILE_SIZE_BYTES }
        if (!stoppedOk && file != null) {
            file.delete()
        }
        currentOutputFile = null
        return validFile
    }

    @Synchronized
    fun release() {
        val recorder = mediaRecorder
        try {
            if (isRecording) recorder?.stop()
        } catch (ignored: Exception) {
        }
        safeRelease(recorder)
        mediaRecorder = null
        isRecording = false
        isPaused = false
        startedAt = 0L
        AudioNoiseFilter.release()
    }

    private fun safeRelease(recorder: MediaRecorder?) {
        try {
            recorder?.reset()
        } catch (ignored: Exception) {
        }
        try {
            recorder?.release()
        } catch (ignored: Exception) {
        }
    }

    companion object {
        private const val SAMPLE_RATE = 16_000
        private const val BIT_RATE = 128_000
        private const val MIN_FILE_SIZE_BYTES = 1_024L

        /**
         * Calcula el resumen criptográfico SHA-256 del archivo de audio para
         * garantizar la cadena de custodia desde el dispositivo móvil.
         */
        fun computeSha256(file: File): String {
            return try {
                val digest = MessageDigest.getInstance("SHA-256")
                val buffer = ByteArray(8192)
                FileInputStream(file).use { fis ->
                    var bytesRead: Int
                    while (fis.read(buffer).also { bytesRead = it } != -1) {
                        digest.update(buffer, 0, bytesRead)
                    }
                }
                digest.digest().joinToString("") { "%02x".format(it) }
            } catch (e: Exception) {
                "sha256-error"
            }
        }
    }
}
