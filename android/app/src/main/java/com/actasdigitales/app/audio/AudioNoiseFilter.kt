package com.actasdigitales.app.audio

import android.media.audiofx.AcousticEchoCanceler
import android.media.audiofx.NoiseSuppressor
import android.util.Log

object AudioNoiseFilter {

    private const val TAG = "AudioNoiseFilter"
    private var noiseSuppressor: NoiseSuppressor? = null
    private var echoCanceler: AcousticEchoCanceler? = null

    /**
     * Intenta activar la supresión de ruido ambiental y la cancelación de eco por hardware (DSP)
     * para el ID de sesión de audio proporcionado.
     */
    fun enableDspFilters(audioSessionId: Int) {
        try {
            if (NoiseSuppressor.isAvailable()) {
                noiseSuppressor = NoiseSuppressor.create(audioSessionId)?.apply {
                    enabled = true
                }
                Log.d(TAG, "Filtro DSP NoiseSuppressor activado exitosamente")
            }

            if (AcousticEchoCanceler.isAvailable()) {
                echoCanceler = AcousticEchoCanceler.create(audioSessionId)?.apply {
                    enabled = true
                }
                Log.d(TAG, "Filtro DSP AcousticEchoCanceler activado exitosamente")
            }
        } catch (e: Exception) {
            Log.w(TAG, "No se pudo activar la supresión DSP por hardware: ${e.message}")
        }
    }

    /**
     * Libera los recursos de supresión de ruido DSP.
     */
    fun release() {
        try {
            noiseSuppressor?.release()
            noiseSuppressor = null
            echoCanceler?.release()
            echoCanceler = null
        } catch (ignored: Exception) {}
    }
}
