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
* 🛡 **Seguridad de Red:** Validación TLS estricta con CAs del sistema y **certificate pinning opcional** (`ACTAS_CERT_PIN_PRIMARY` / `ACTAS_CERT_PIN_BACKUP`, pines SPKI SHA-256 en base64 vía `BuildConfig`, también aplicado a la sincronización con la Web). Las CAs de usuario solo se confían en dominios de desarrollo (LAN/emulador); **no existe bypass de certificados** (la versión que aceptaba cualquier certificado fue eliminada). Generación del pin:
  ```bash
  openssl x509 -in server.crt -pubkey -noout | openssl pkey -pubin -outform der \
    | openssl dgst -sha256 -binary | openssl base64
  ```
* 🌐 **Distribución desde la Web:** el servidor sirve este APK en `/api/app/download` con hash SHA-256 verificable (`/api/app/info`), y `web/public/ActasDigitales.apk` es su copia estática para hosting sin backend. Sincronízalas tras cada build con `python3 tools/sync_apk.py` (verificación en CI: `--check`).
* ⚡ **Instalación rápida vía ADB:**
  ```bash
  adb install -r app-release.apk
  ```
* 🧪 **Paquete de verificación (no instalable):** `python3 tools/compilar_apk.py` genera únicamente un paquete de verificación de firma y recursos para CI en `tools/verificacion/` (sin la interfaz Compose ni Room; no abre como aplicación). El antiguo stub legado `android/ActasDigitales.apk` se retiró en 1.5.0.

---

## 📦 Compilación del APK

```bash
cd android
./gradlew assembleDebug        # genera app/build/outputs/apk/debug/app-debug.apk
./gradlew assembleRelease      # release (R8 + splits ABI), signingConfig opcional
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

* 🔧 **Requisitos:** JDK 17 o superior y Android SDK 35 (`local.properties` con `sdk.dir` o variable `ANDROID_HOME`).
* 🛡 **Seguridad de Red:** validación TLS estricta con CAs del sistema o corporativas + **certificate pinning opcional** + TLS 1.2/1.3 soportados; solo `10.0.2.2`, `localhost` y `actasdigitales.local` (LAN de desarrollo) admiten HTTP en `network_security_config.xml`.
* ℹ️ **`tools/compilar_apk.py`** genera un paquete **de verificación** de firma y recursos para CI (sin la interfaz Compose ni Room). No es un APK instalable y su salida queda en `tools/verificacion/`.

## 🧱 Cadena de compilación

| Componente | Versión | Nota |
|---|---|---|
| AGP | 9.5.1 | Incluye Kotlin integrado (no se aplica `org.jetbrains.kotlin.android`) |
| KSP | 2.1.0-1.0.29 | Genera `AppDatabase_Impl` y `ActaDao_Impl` de Room |
| Room | 2.8.5 | Persistencia del historial de actas |
| Kotlin | 2.1.0 | Con Compose plugin |
| Compose BOM | 2025.06.01 | Compose UI + Material 3 |
| compileSdk / targetSdk / minSdk | 35 / 34 / 26 | Android 8.0 o superior |

---


---

## 🛠 Tecnologías Utilizadas

- **Lenguaje:** Kotlin 2.1.0
- **Interfaz:** Jetpack Compose + Material Design 3
- **Arquitectura:** MVVM (Model-View-ViewModel) + Clean Architecture
- **Concurrencia:** Kotlin Coroutines + StateFlow
- **Subida de Audio & Red:** Retrofit 2 + OkHttp 3 + WorkManager (para subidas en segundo plano tolerantes a desconexiones)
- **Persistencia compartida:** Room (base local `actas_digitales`); `CloudSyncWorker` sube las actas al servidor (`POST /api/acts/sync`, deduplicación por SHA-256) y la Web las muestra en el historial
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

---

## 🚀 Publicar una Release (APK/AAB firmados)

El workflow [.github/workflows/release.yml](../.github/workflows/release.yml) compila, firma y publica los artefactos al hacer push de un tag `v*`:

```bash
# 1. Genera el keystore (una vez) — ¡NUNCA lo commitees!
mkdir -p signing
keytool -genkey -v -keystore signing/actas-mobile.keystore \
  -alias actas-mobile -keyalg RSA -keysize 4096 -validity 3650

# 2. Carga los secrets en GitHub (Settings → Secrets and variables → Actions)
base64 -w0 signing/actas-mobile.keystore   # -> ACTAS_KEYSTORE_BASE64
#    ACTAS_KEYSTORE_PASSWORD, ACTAS_KEY_ALIAS, ACTAS_KEY_PASSWORD
#    ACTAS_CERT_PIN_PRIMARY / ACTAS_CERT_PIN_BACKUP (opcional, SPKI SHA-256)

# 3. Etiqueta y publica
git tag v1.5.0 && git push origin v1.5.0
# 4. El workflow crea la GitHub Release con APK universal + por ABI + AAB + SHA256SUMS.txt
```

La versión del APK deriva del tag (`ACTAS_VERSION_NAME`) y `versionCode` del número de ejecución de CI. Para Play Store usa el **AAB** generado (`bundleRelease`); para distribución directa usa el **APK universal** (lo que sirve la Web y GitHub Releases).


* 🔄 **Móvil ⇄ Web comparten actas:** ambos endpoints (`/api/acts`, `/api/acts/sync`) exigen `ACTAS_SYNC_TOKEN` (cabecera `X-Sync-Token`). La app lo envía si se compila con la variable de entorno `ACTAS_SYNC_TOKEN`. Sin él, la sincronización responde 401/503.
