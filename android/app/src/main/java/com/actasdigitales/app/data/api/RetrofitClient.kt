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

    const val DEFAULT_BASE_URL = "https://10.0.2.2:8443/"

    /**
     * URL del backend. Configurable en tiempo de ejecución con [configure]:
     * la UI de Ajustes la persiste en SharedPreferences y la restaura al arrancar.
     *
     * - Emulador oficial de Android: `https://10.0.2.2:8443/`
     * - Emulador en HTTP plano:      `http://10.0.2.2:8000/`
     * - Dispositivo físico (LAN):    `https://<IP-u-nombre>:<puerto>/` con la CA
     *   del proyecto instalada como CA de usuario, o el nombre `actasdigitales.local`
     *   (también con cleartext permitido en network_security_config).
     */
    @Volatile
    var baseUrl: String = DEFAULT_BASE_URL
        private set

    @Volatile
    private var cachedService: ActasApiService? = null

    @Volatile
    private var cachedClient: OkHttpClient? = null

    /** Normaliza, aplica la nueva URL y descarta cliente/servicio cacheados. */
    @Synchronized
    fun configure(newUrl: String) {
        var url = newUrl.trim()
        if (!url.startsWith("http://") && !url.startsWith("https://")) url = "https://$url"
        baseUrl = if (url.endsWith("/")) url else "$url/"
        cachedClient = null
        cachedService = null
    }

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
     *  - retryOnConnectionFailure para redes corporativas o Wi-Fi inestables.
     *  - Logger solo en compilaciones de depuración, en nivel BASIC (nunca BODY).
     *  - Sin trust-all ni hostnameVerifier universal: jamás se aceptan certificados inválidos.
     */
    private fun buildClient(): OkHttpClient {
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
        return builder.build()
    }

    @Synchronized
    private fun httpClient(): OkHttpClient = cachedClient ?: buildClient().also { cachedClient = it }

    @Synchronized
    fun getApiService(customUrl: String? = null): ActasApiService {
        if (customUrl == null) {
            cachedService?.let { return it }
            val url = baseUrl
            return Retrofit.Builder()
                .baseUrl(url)
                .client(httpClient())
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(ActasApiService::class.java)
                .also { cachedService = it }
        }
        val url = customUrl.let { if (it.endsWith("/")) it else "$it/" }
        return Retrofit.Builder()
            .baseUrl(url)
            .client(httpClient())
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ActasApiService::class.java)
    }
}
