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
* 🧪 **APK mínimo (legado):** [`ActasDigitales.apk`](ActasDigitales.apk) (~6 KB) es un stub de instalación autónomo generado por `python3 tools/compilar_apk.py` (AAPT2 + DEX sintético, firma v1 RSA-4096). Desde la 1.3.0 la Web sirve por defecto el release; el stub queda como respaldo. `compilar_apk.py` reutiliza una **clave persistente** en `android/signing/` (antes regeneraba la clave en cada build, invalidando las actualizaciones in-situ).

---

## 🛠 Tecnologías Utilizadas

- **Lenguaje:** Kotlin 1.9+
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

## ✅ Verificación en CI (sin publicar)

Cada push a `arena/**` o `main` que toque `android/**` ejecuta [.github/workflows/android-build-check.yml](../.github/workflows/android-build-check.yml): firma efímera PKCS12 del propio runner, `./gradlew :app:assembleRelease :app:bundleRelease` (R8 + splits por ABI) y SHA-256 de los artefactos adjuntos al run. **No publica nada**; solo verifica que el proyecto compila y empaqueta correctamente.

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

> **Estado actual (v1.5.0):** el keystore persistente PKCS12 (`actas-mobile`, RSA-4096) ya está generado en `android/signing/` (fuera de Git) junto con las credenciales en `keystore-credentials.txt`. **Haz copia de seguridad de ambos archivos** (p. ej. en tu gestor de contraseñas): la clave firma todas las actualizaciones futuras; perderla obliga a re-firmar la distribución. Para activar la publicación automática, carga `ACTAS_KEYSTORE_BASE64/PASSWORD/KEY_ALIAS/KEY_PASSWORD` como secrets y vuelve a etiquetar (`git tag -f v1.5.0 && git push -f origin v1.5.0`) o ejecuta el workflow manualmente.
