package com.actasdigitales.app.data.api

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManager
import javax.net.ssl.X509TrustManager
import java.security.SecureRandom
import java.security.cert.X509Certificate

object RetrofitClient {

    /**
     * URL del backend.
     *
     * - Emulador oficial de Android: `https://10.0.2.2:8443/`
     * - Dispositivo físico en la misma Wi-Fi: `http://<IP-del-ordenador>:8000/`
     *
     * Se puede cambiar en tiempo de ejecución antes de la primera petición.
     */
    @Volatile
    var baseUrl: String = "https://10.0.2.2:8443/"

    private val trustManager = object : X509TrustManager {
        override fun checkClientTrusted(chain: Array<out X509Certificate>?, authType: String?) = Unit
        override fun checkServerTrusted(chain: Array<out X509Certificate>?, authType: String?) = Unit
        override fun getAcceptedIssuers(): Array<X509Certificate> = emptyArray()
    }

    /**
     * Cliente HTTP compatible con la CA autofirmada RSA-4096 del proyecto.
     *
     * Correcciones para móvil real:
     *  - Ya no se fuerza `TLSv1.3`: muchos servidores y redes corporativas negocian
     *    TLS 1.2, y al fijar solo 1.3 el handshake fallaba y todas las subidas daban
     *    error. Ahora se usa el protocolo por defecto (TLS 1.3 → 1.2 → 1.1).
     *  - El logger solo se activa en compilaciones de depuración.
     */
    private val okHttpClient: OkHttpClient by lazy {
        val builder = OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(180, TimeUnit.SECONDS)
            .writeTimeout(180, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)

        try {
            val sslContext = SSLContext.getInstance("TLS").apply {
                init(null, arrayOf<TrustManager>(trustManager), SecureRandom())
            }
            builder.sslSocketFactory(sslContext.socketFactory, trustManager)
                .hostnameVerifier { _, _ -> true }
        } catch (ignored: Exception) {
            // Si el proveedor TLS no está disponible se mantiene la configuración por defecto.
        }

        if (BuildConfig.DEBUG) {
            builder.addInterceptor(
                HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BASIC }
            )
        }

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
