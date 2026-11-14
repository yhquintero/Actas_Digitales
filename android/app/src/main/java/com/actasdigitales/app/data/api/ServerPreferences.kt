package com.actasdigitales.app.data.api

import android.content.Context
import android.net.Uri

/**
 * URL del servidor configurable en tiempo de ejecución.
 *
 * Por qué: la dirección fija `https://10.0.2.2:8443/` sólo existe dentro del
 * emulador Android (es un alias a tu ordenador en el puerto 8443 con TLS y la
 * CA del proyecto instalada). En un móvil físico esa dirección no responde —
 * de ahí el error de conexión. Aquí el usuario elige y puede probar la URL.
 */
object ServerPreferences {

    private const val PREFS = "actas_server"
    private const val KEY_URL = "base_url"

    const val EMULATOR_TLS = "https://10.0.2.2:8443/"
    const val EMULATOR_PLAIN_8000 = "http://10.0.2.2:8000/"
    const val LOCAL_HOSTNAME = "http://actasdigitales.local:8000/"

    val PRESETS: List<Pair<String, String>> = listOf(
        "Emulador · HTTPS 8443 (CA del proyecto)" to EMULATOR_TLS,
        "Emulador · HTTP 8000" to EMULATOR_PLAIN_8000,
        "Red local · actasdigitales.local:8000" to LOCAL_HOSTNAME
    )

    fun load(context: Context): String {
        val stored = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY_URL, null)
        return stored?.takeIf { it.isNotBlank() } ?: RetrofitClient.DEFAULT_BASE_URL
    }

    /** Normaliza y persiste; devuelve la URL normalizada. */
    fun save(context: Context, rawUrl: String): String {
        val normalized = normalize(rawUrl)
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_URL, normalized)
            .apply()
        RetrofitClient.configure(normalized)
        return normalized
    }

    /** Garantiza esquema y barra final. Si falta el esquema, asume https. */
    fun normalize(rawUrl: String): String {
        var url = rawUrl.trim()
        if (url.isEmpty()) return EMULATOR_TLS
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://$url"
        }
        // Validación básica: host no vacío
        val host = try {
            Uri.parse(url).host
        } catch (e: Exception) {
            null
        }
        if (host.isNullOrBlank()) {
            throw IllegalArgumentException("URL inválida: $url")
        }
        return if (url.endsWith("/")) url else "$url/"
    }
}
