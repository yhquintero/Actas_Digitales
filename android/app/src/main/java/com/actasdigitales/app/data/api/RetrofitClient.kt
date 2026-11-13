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
    // URL base configurable (por defecto puerto 8443 HTTPS o 8000 HTTP)
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
     * Cliente HTTP seguro: validación TLS estándar del sistema y, si se
     * definieron los pines, certificate pinning adicional. En depuración se
     * registra el cuerpo de las peticiones; en release, solo la línea básica.
     */
    private val okHttpClient: OkHttpClient by lazy {
        val logging = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BODY
            } else {
                HttpLoggingInterceptor.Level.BASIC
            }
        }
        val builder = OkHttpClient.Builder()
            .addInterceptor(logging)
            .connectTimeout(60, TimeUnit.SECONDS)
            .readTimeout(180, TimeUnit.SECONDS)
            .writeTimeout(180, TimeUnit.SECONDS)
        certificatePinner()?.let { builder.certificatePinner(it) }
        builder.build()
    }

    fun getApiService(customUrl: String? = null): ActasApiService {
        val url = customUrl ?: baseUrl
        return Retrofit.Builder()
            .baseUrl(url)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ActasApiService::class.java)
    }
}
