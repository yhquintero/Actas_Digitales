package com.actasdigitales.app.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface ActaDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertActa(acta: ActaEntity): Long

    @Query("SELECT * FROM actas_digitales ORDER BY timestamp DESC")
    fun getAllActas(): Flow<List<ActaEntity>>

    @Query("SELECT * FROM actas_digitales WHERE finalCorrectedText LIKE '%' || :query || '%' OR filename LIKE '%' || :query || '%' ORDER BY timestamp DESC")
    fun searchActas(query: String): Flow<List<ActaEntity>>

    @Query("SELECT * FROM actas_digitales WHERE id = :id LIMIT 1")
    suspend fun getActaById(id: Long): ActaEntity?

    @Query("DELETE FROM actas_digitales WHERE id = :id")
    suspend fun deleteActaById(id: Long)

    @Query("DELETE FROM actas_digitales")
    suspend fun clearAll()
}
