# Actas Digitales - Aplicación Android Nativa (Kotlin + Jetpack Compose)

Aplicación móvil nativa para la captura de audio de reuniones y actas, subida resiliente al servidor y visualización en tiempo real del texto consolidado y corregido ortográficamente en español.

---

## 📦 Compilación del APK

El APK no se versiona en el repositorio: se genera con Gradle a partir de este código fuente, de modo que el binario instalado siempre corresponde a la versión actual.

```bash
cd android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

* 🔧 **Requisitos:** JDK 17+ y Android SDK 35 (configura `local.properties` con `sdk.dir` o la variable `ANDROID_HOME`).
* 🔐 **Firma:** el APK de depuración usa la clave de depuración estándar. Para distribución, añade tu `signingConfig` de release.
* 🛡 **Seguridad de Red:** HTTPS obligatorio por defecto con CAs del sistema o corporativas (`network_security_config.xml`); solo `10.0.2.2`, `localhost` y `actasdigitales.local` admiten HTTP para desarrollo.
* ℹ️ **`tools/compilar_apk.py`** genera un paquete **de verificación** de firma y recursos para CI (sin la interfaz Compose ni Room). No es un APK instalable y su salida queda en `tools/verificacion/`.

## 🧱 Cadena de compilación

| Componente | Versión | Nota |
|---|---|---|
| AGP | 9.5.1 | Incluye Kotlin integrado (no se aplica `org.jetbrains.kotlin.android`) |
| Gradle | 9.6.0 | Requerido por AGP 9.5 |
| KSP | 2.3.10 | Genera `AppDatabase_Impl` y `ActaDao_Impl` de Room |
| Room | 2.7.2 | Persistencia del historial de actas |
| Compose BOM | 2025.06.01 | Compose UI 1.8.2 + Material 3 1.3.2 |
| compileSdk / targetSdk / minSdk | 35 / 34 / 26 | Android 8.0 o superior |

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
