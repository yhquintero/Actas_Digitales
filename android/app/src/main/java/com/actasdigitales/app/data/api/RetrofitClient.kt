package com.actasdigitales.app.data.api

import com.actasdigitales.app.BuildConfig
import okhttp3.CertificatePinner
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.net.URI
import java.util.concurrent.TimeUnit

object RetrofitClient {

    /**
     * URL del backend.
     *
     * - Emulador oficial de Android: `https://10.0.2.2:8443/`
     * - Dispositivo físico en la misma Wi-Fi: `http://<IP-del-ordenador>:8000/`
     *   (o `https://…:8443/` con la CA del proyecto instalada como CA de usuario)
     *
     * Se puede cambiar en tiempo de ejecución antes de la primera petición.
     */
    @Volatile
    var baseUrl: String = "https://10.0.2.2:8443/"

    /**
     * Certificate pinning OPCIONAL (opt-in) y recomendado en producción:
     *   export ACTAS_CERT_PIN_PRIMARY="sha256/<base64-del-SPKI>"
     *   export ACTAS_CERT_PIN_BACKUP="sha256/<base64-del-SPKI-de-respaldo>"
     *
     * El pin del SPKI (no del certificado) sobrevive a la renovación del
     * certificado siempre que se renueve con la MISMA clave. Genera los pines con:
     *   openssl x509 -in server.crt -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl base64
     *
     * Sin pines, la validación TLS usa las CAs del sistema: SEGURA, sin bypass.
     * (La versión anterior aceptaba CUALQUIER certificado —eliminado.)
     */
    internal fun certificatePinner(): CertificatePinner? {
        val host = try {
            URI(baseUrl).host
        } catch (e: Exception) {
            null
        }
        if (host.isNullOrBlank()) return null
        val pins = listOf(BuildConfig.ACTAS_CERT_PIN_PRIMARY, BuildConfig.ACTAS_CERT_PIN_BACKUP)
            .map { it.trim() }
            .filter { it.isNotEmpty() }
        if (pins.isEmpty()) return null
        val builder = CertificatePinner.Builder()
        pins.forEach { pin -> builder.add(host, pin) }
        return builder.build()
    }

    /**
     * Cliente HTTP seguro y usable en dispositivo real:
     *  - Validación TLS del sistema, o certificate pinning con ACTAS_CERT_PIN_*.
     *  - TLS negociado por el sistema (1.3 → 1.2): no se fuerza ningún protocolo.
     *  - retryOnConnectionFailure para redes corporativas o Wi-Fi inestables.
     *  - Logger solo en compilaciones de depuración, en nivel BASIC (nunca BODY,
     *    que podría filtrar la API Key en el logcat).
     *  - Sin trust-all ni hostnameVerifier universal: jamás se aceptan certificados inválidos.
     */
    private val okHttpClient: OkHttpClient by lazy {
        val builder = OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(180, TimeUnit.SECONDS)
            .writeTimeout(180, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)

        if (BuildConfig.DEBUG) {
            builder.addInterceptor(
                HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BASIC }
            )
        }
        certificatePinner()?.let { builder.certificatePinner(it) }
        builder.build()
    }

    fun getApiService(customUrl: String? = null): ActasApiService {
        val url = (customUrl ?: baseUrl).let { if (it.endsWith("/")) it else "$it/" }
        return Retrofit.Builder()
            .baseUrl(url)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ActasApiService::class.java)
    }
}
