package com.actasdigitales.app

import android.app.Application
import com.actasdigitales.app.data.api.RetrofitClient
import com.actasdigitales.app.data.api.ServerPreferences

class ActasApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // Restaurar la URL del servidor elegida por el usuario (Ajustes), si existe.
        RetrofitClient.configure(ServerPreferences.load(this))
        // Room se inicializa de forma perezosa desde AppDatabase; la sincronización
        // en segundo plano la programa AudioRepository con WorkManager.
    }
}
