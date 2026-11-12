package com.actasdigitales.app

import android.app.Application

class ActasApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // Espacio reservado para inicializaciones globales (por ejemplo, sincronización
        // en segundo plano). Room se inicializa de forma perezosa desde AppDatabase.
    }
}
