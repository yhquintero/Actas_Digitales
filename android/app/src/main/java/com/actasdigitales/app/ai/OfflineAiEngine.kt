package com.actasdigitales.app.ai

import com.actasdigitales.app.audio.AudioRecorderManager
import com.actasdigitales.app.data.model.JobResponse
import com.actasdigitales.app.data.model.JobStats
import com.actasdigitales.app.data.model.JobStatus
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

object OfflineAiEngine {

    /**
     * Modo sin conexión — RESPALDO HONESTO, no transcripción.
     *
     * Qué hace de verdad:
     *  1. Calcula la huella SHA-256 del archivo y estima la duración por tamaño/bitrate.
     *  2. Genera un **respaldo de acta** con la evidencia disponible (fecha, fichero, hash)
     *     y la estructura VACÍA a cumplimentar por las personas presentes.
     *
     * Qué NO hace (y aquí jamás se simulará): no transcribe el audio, no detecta
     * participantes, no inventa acuerdos, deliberaciones ni estadísticas, y no mide
     * muletillas ni correcciones. El acta completa solo puede generarse con el servidor
     * (transcripción real) o rellenándose a mano.
     */
    fun processAudioOffline(file: File): JobResponse {
        val jobId = "offline_" + UUID.randomUUID().toString().take(8)
        val sha256 = AudioRecorderManager.computeSha256(file)
        val dateFormat = SimpleDateFormat("dd 'de' MMMM 'de' yyyy, HH:mm", Locale("es", "ES"))
        val dateStr = dateFormat.format(Date())

        // Estimación grosera: ~16 kbps mono AAC/Opus de baja tasa (solo informativa)
        val estimatedDurationSec = (file.length() / 2000.0).coerceIn(5.0, 8 * 3600.0)

        val honestNote = "SIN TRANSCRIPCIÓN (modo sin conexión). " +
            "El audio '${file.name}' quedó registrado con su huella SHA-256 $sha256. " +
            "El contenido de la reunión NO se transcribió ni se generó ningún acuerdo: " +
            "este documento es un respaldo de custodia a completar manualmente " +
            "o a transcribir después con el servidor."

        val backupText = """
            RESPALDO DE ACTA · SIN CONEXIÓN (NO TRANSCRIPCIÓN)
            Fecha y hora: $dateStr
            Archivo de origen: ${file.name}
            Huella SHA-256: $sha256
            Duración estimada: ${formatDuration(estimatedDurationSec)} (aprox.)

            IMPORTANTE: este documento NO contiene el contenido de la reunión.
            Ninguna deliberación, acuerdo ni participante ha sido detectado ni redactado
            de forma automática. Su única función es preservar la evidencia de que la
            grabación existió y llegó íntegra a este dispositivo.

            A cumplimentar a mano por quien corresponda:

            1. ASISTENTES:
               - Nombre y cargo:
               - Nombre y cargo:

            2. ORDEN DEL DÍA:
               - Punto 1:
               - Punto 2:

            3. DELIBERACIONES (resuma aquí el contenido real):
               -

            4. ACUERDOS (numerados, solo los realmente adoptados):
               - ACUERDO-01:
               - ACUERDO-02:

            5. PIE DE FIRMAS:
               Presidencia: ____________________    Secretaría: ____________________
        """.trimIndent()

        val stats = JobStats(
            originalWords = 0,
            finalWords = 0,
            removedFillers = 0,
            orthographicCorrections = 0,
            processingTimeSec = 0.1f,
            audioDurationSec = estimatedDurationSec.toFloat(),
            wordsPerMinute = 0f,
            durationCoveragePercent = 0f,
            audioSha256 = sha256
        )

        return JobResponse(
            jobId = jobId,
            filename = file.name,
            fileSizeBytes = file.length(),
            status = JobStatus.COMPLETED,
            progressPercent = 100,
            currentStep = "Respaldo sin conexión guardado (sin transcribir)",
            language = "es",
            rawTranscription = honestNote,
            cleanedTranscription = backupText,
            finalCorrectedText = backupText,
            correctionsApplied = emptyList(),
            stats = stats
        )
    }

    private fun formatDuration(totalSeconds: Double): String {
        val total = totalSeconds.toLong().coerceAtLeast(0L)
        val h = total / 3600
        val m = (total % 3600) / 60
        val s = total % 60
        return if (h > 0) String.format("%d:%02d:%02d", h, m, s) else String.format("%02d:%02d", m, s)
    }
}
