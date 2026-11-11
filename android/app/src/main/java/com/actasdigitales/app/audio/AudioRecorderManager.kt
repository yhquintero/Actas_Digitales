package com.actasdigitales.app.audio

import android.content.Context
import android.media.MediaRecorder
import android.os.Build
import java.io.File
import java.io.FileInputStream
import java.io.IOException
import java.security.MessageDigest

class AudioRecorderManager(private val context: Context) {

    private var mediaRecorder: MediaRecorder? = null
    var currentOutputFile: File? = null
        private set

    var isRecording: Boolean = false
        private set

    var isPaused: Boolean = false
        private set

    fun startRecording(): File {
        val outputDir = context.cacheDir
        val audioFile = File(outputDir, "acta_grabacion_${System.currentTimeMillis()}.m4a")
        currentOutputFile = audioFile

        mediaRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            MediaRecorder(context)
        } else {
            @Suppress("DEPRECATION")
            MediaRecorder()
        }.apply {
            setAudioSource(MediaRecorder.AudioSource.MIC)
            setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            setAudioSamplingRate(16000)
            setAudioEncodingBitRate(128000) // Calidad acústica elevada a 128 kbps
            setOutputFile(audioFile.absolutePath)

            try {
                prepare()
                start()
                isRecording = true
                isPaused = false
            } catch (e: IOException) {
                release()
                isRecording = false
                isPaused = false
                throw e
            }
        }

        return audioFile
    }

    fun pauseRecording(): Boolean {
        if (!isRecording || isPaused) return false
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            try {
                mediaRecorder?.pause()
                isPaused = true
                true
            } catch (e: Exception) {
                false
            }
        } else {
            false
        }
    }

    fun resumeRecording(): Boolean {
        if (!isRecording || !isPaused) return false
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            try {
                mediaRecorder?.resume()
                isPaused = false
                true
            } catch (e: Exception) {
                false
            }
        } else {
            false
        }
    }

    fun getMaxAmplitude(): Int {
        if (!isRecording || isPaused) return 0
        return try {
            mediaRecorder?.maxAmplitude ?: 0
        } catch (e: Exception) {
            0
        }
    }

    fun stopRecording(): File? {
        if (!isRecording) return null
        return try {
            mediaRecorder?.apply {
                stop()
                release()
            }
            mediaRecorder = null
            isRecording = false
            isPaused = false
            currentOutputFile
        } catch (e: Exception) {
            mediaRecorder?.release()
            mediaRecorder = null
            isRecording = false
            isPaused = false
            null
        }
    }

    fun release() {
        try {
            if (isRecording) {
                mediaRecorder?.stop()
            }
            mediaRecorder?.release()
        } catch (ignored: Exception) {}
        mediaRecorder = null
        isRecording = false
        isPaused = false
    }

    companion object {
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
