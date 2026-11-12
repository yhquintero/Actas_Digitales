package com.actasdigitales.app.data.model

import com.google.gson.annotations.SerializedName

enum class JobStatus {
    @SerializedName("QUEUED") QUEUED,
    @SerializedName("PREPROCESSING") PREPROCESSING,
    @SerializedName("TRANSCRIBING") TRANSCRIBING,
    @SerializedName("CONSOLIDATING") CONSOLIDATING,
    @SerializedName("CORRECTING") CORRECTING,
    @SerializedName("COMPLETED") COMPLETED,
    @SerializedName("FAILED") FAILED
}

data class AudioSegment(
    @SerializedName("id") val id: Int,
    @SerializedName("start_time") val startTime: Float,
    @SerializedName("end_time") val endTime: Float,
    @SerializedName("text") val text: String
)

data class CorrectionItem(
    @SerializedName("original") val original: String,
    @SerializedName("corrected") val corrected: String,
    @SerializedName("type") val type: String,
    @SerializedName("explanation") val explanation: String? = null
)

data class JobStats(
    @SerializedName("original_words") val originalWords: Int = 0,
    @SerializedName("final_words") val finalWords: Int = 0,
    @SerializedName("removed_fillers") val removedFillers: Int = 0,
    @SerializedName("orthographic_corrections") val orthographicCorrections: Int = 0,
    @SerializedName("processing_time_sec") val processingTimeSec: Float = 0f,
    @SerializedName("audio_duration_sec") val audioDurationSec: Float = 0f,
    @SerializedName("words_per_minute") val wordsPerMinute: Float = 0f,
    @SerializedName("duration_coverage_percent") val durationCoveragePercent: Float = 100f,
    @SerializedName("audio_sha256") val audioSha256: String? = null
)

data class JobResponse(
    @SerializedName("job_id") val jobId: String,
    @SerializedName("filename") val filename: String,
    @SerializedName("file_size_bytes") val fileSizeBytes: Long,
    @SerializedName("status") val status: JobStatus,
    @SerializedName("progress_percent") val progressPercent: Int = 0,
    @SerializedName("current_step") val currentStep: String = "",
    @SerializedName("language") val language: String = "es",
    @SerializedName("raw_transcription") val rawTranscription: String? = null,
    @SerializedName("cleaned_transcription") val cleanedTranscription: String? = null,
    @SerializedName("final_corrected_text") val finalCorrectedText: String? = null,
    @SerializedName("segments") val segments: List<AudioSegment> = emptyList(),
    @SerializedName("corrections_applied") val correctionsApplied: List<CorrectionItem> = emptyList(),
    @SerializedName("stats") val stats: JobStats? = null,
    @SerializedName("error_message") val errorMessage: String? = null,
    /** `true` cuando el acta se generó localmente porque el servidor no estaba accesible. */
    val isOffline: Boolean = false
)
