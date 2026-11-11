# Actas Digitales - Aplicación Android Nativa (Kotlin + Jetpack Compose)

Aplicación móvil nativa para la captura de audio de reuniones y actas, subida resiliente al servidor y visualización en tiempo real del texto consolidado y corregido ortográficamente en español.

---

## 📦 Paquete APK Listo para Pruebas

Para facilitar la evaluación inmediata en dispositivos físicos o emuladores sin requerir un entorno completo de Android Studio con SDK instalado, el proyecto incluye el binario precompilado y firmado criptográficamente:

* 📱 **Ubicación del APK:** [`android/ActasDigitales.apk`](ActasDigitales.apk) (y copia en `android/app/build/outputs/apk/debug/app-debug.apk`)
* 🔐 **Firma Digital:** v1 JAR Scheme con clave **RSA de 4096 bits** generada por la Autoridad de Certificación de Actas Digitales.
* 🛡 **Seguridad de Red:** Compatible con conexiones seguras **TLS 1.3** y tolerancia opcional a certificados autofirmados corporativos de desarrollo (`network_security_config.xml`).
* ⚡ **Instalación rápida vía ADB:**
  ```bash
  adb install -r android/ActasDigitales.apk
  ```
* 🛠 **Generación autónoma:** Puedes regenerar el APK ejecutando desde la raíz del repositorio:
  ```bash
  python3 tools/compilar_apk.py
  ```

---

## 🛠 Tecnologías Utilizadas

- **Lenguaje:** Kotlin 1.9+
- **Interfaz:** Jetpack Compose + Material Design 3
- **Arquitectura:** MVVM (Model-View-ViewModel) + Clean Architecture
- **Concurrencia:** Kotlin Coroutines + StateFlow
- **Subida de Audio & Red:** Retrofit 2 + OkHttp 3 + WorkManager (para subidas en segundo plano tolerantes a desconexiones)
- **Captura de Audio:** Android `MediaRecorder` nativo optimizado a 16 kHz / 128 kbps / AAC / Mono y medidor acústico en tiempo real

---

## 🚀 Cómo ejecutar en Android Studio

1. **Abrir el proyecto:**
   - Abre Android Studio (versión Iguana, Jellyfish o posterior).
   - Selecciona **Open** y navega a la carpeta `/android`.

2. **Configuración de la URL del Servidor:**
   - Si usas el **Emulador Oficial de Android**, la IP del host de desarrollo es `http://10.0.2.2:8000/`. Ya está configurada por defecto en `RetrofitClient.kt`.
   - Si pruebas en un **Dispositivo Físico** conectado por Wi-Fi, cambia `baseUrl` en `RetrofitClient.kt` por la IP local de tu máquina en la red local (ejemplo: `http://192.168.1.100:8000/`).

3. **Compilar y Ejecutar:**
   - Selecciona la configuración `app` en la barra superior.
   - Pulsa el botón **Run ▶** (Shift + F10) para instalar en el dispositivo o emulador.

---

## 📁 Estructura del Proyecto

```text
android/app/src/main/java/com/actasdigitales/app/
├── MainActivity.kt                 # Actividad principal Compose
├── ActasApplication.kt            # Clase Application
├── audio/
│   └── AudioRecorderManager.kt    # Grabador de audio nativo con MediaRecorder
├── data/
│   ├── api/
│   │   ├── ActasApiService.kt     # Endpoints Retrofit (upload, job polling)
│   │   └── RetrofitClient.kt      # Cliente HTTP configurado
│   ├── model/
│   │   └── JobModels.kt           # Modelos de datos y estados de la API
│   └── repository/
│       └── AudioRepository.kt     # Repositorio con flujos de estado y sondeo
├── ui/
│   ├── screens/
│   │   └── HomeScreen.kt          # Pantalla principal con grabación, subida y visualizador
│   ├── theme/
│   │   ├── Color.kt
│   │   ├── Theme.kt
│   │   └── Type.kt
│   └── viewmodel/
│       └── AudioViewModel.kt      # ViewModel para el ciclo de vida y UI State
└── workers/
    └── AudioUploadWorker.kt       # Tarea en segundo plano con WorkManager
```
