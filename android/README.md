# Actas Digitales - Aplicación Android Nativa (Kotlin + Jetpack Compose)

Aplicación móvil nativa para la captura de audio de reuniones y actas, subida resiliente al servidor y visualización en tiempo real del texto consolidado y corregido ortográficamente en español.

---

## 📦 Paquete APK Listo para Instalar

El artefacto oficial de distribución es el **release nativo completo** (Kotlin + Jetpack Compose, WorkManager, Room, BiometricPrompt):

* 📱 **Artefacto oficial:** [`app/release/app-release.apk`](app/release/app-release.apk) (~13 MB, `com.actasdigitales.app`, v1.0.0 / code 1, minSdk 26, target 34) — firmado con **APK Signature Scheme v2/v3**.
* 🔐 **Firma del release:** `build.gradle.kts` declara una `signingConfig` opcional que lee la clave permanente desde `android/signing/actas-mobile.keystore` o de las variables de entorno `ACTAS_KEYSTORE_PATH` / `ACTAS_KEYSTORE_PASSWORD` / `ACTAS_KEY_ALIAS` / `ACTAS_KEY_PASSWORD`. **La clave nunca va a Git** (`android/signing/` está ignorado). Generación:
  ```bash
  keytool -genkey -v -keystore signing/actas-mobile.keystore \
    -alias actas-mobile -keyalg RSA -keysize 4096 -validity 3650
  ```
  La próxima build declara `versionName 1.3.0` / `versionCode 2` (la `app-release.apk` comprometida es 1.0.0/1).
* 🛡 **Seguridad de Red:** Compatible con conexiones seguras **TLS 1.3** y tolerancia opcional a certificados autofirmados corporativos de desarrollo (`network_security_config.xml`).
* 🌐 **Distribución desde la Web:** el servidor sirve este APK en `/api/app/download` con hash SHA-256 verificable (`/api/app/info`), y `web/public/ActasDigitales.apk` es su copia estática para hosting sin backend. Sincronízalas tras cada build con `python3 tools/sync_apk.py` (verificación en CI: `--check`).
* ⚡ **Instalación rápida vía ADB:**
  ```bash
  adb install -r app-release.apk
  ```
* 🧪 **APK mínimo (legado):** [`ActasDigitales.apk`](ActasDigitales.apk) (~6 KB) es un stub de instalación autónomo generado por `python3 tools/compilar_apk.py` (AAPT2 + DEX sintético, firma v1 RSA-4096). Desde la 1.3.0 la Web sirve por defecto el release; el stub queda como respaldo. `compilar_apk.py` reutiliza una **clave persistente** en `android/signing/` (antes regeneraba la clave en cada build, invalidando las actualizaciones in-situ).

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
