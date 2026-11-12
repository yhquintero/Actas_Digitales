package com.actasdigitales.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "actas_digitales")
data class ActaEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val jobId: String,
    val filename: String,
    val finalCorrectedText: String,
    val rawTranscription: String,
    val audioSha256: String,
    val timestamp: Long = System.currentTimeMillis(),
    val wordsCount: Int = 0,
    val removedFillers: Int = 0,
    val orthographicCorrections: Int = 0
)
