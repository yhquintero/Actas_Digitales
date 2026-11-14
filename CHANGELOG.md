# Registro de Cambios (Changelog) · Actas Digitales

Todas las modificaciones notables de este proyecto están documentadas en este archivo, siguiendo el estándar de [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y versionado semántico.

---

## [No publicado] - 2026-11-14 · Honestidad y seguridad por defecto

> Auditoría interna «honestidad total»: nada de fingir capacidades.
> Cambios con **ruptura** de comportamiento (seguro por defecto).

### 🔐 Seguridad
- `POST /api/audio/system/purge-cache` y `POST /api/audio/system/run-fire-tests`
  exigen `ACTAS_ADMIN_TOKEN` (cabecera `X-Admin-Token`). Sin configurar → 503; erróneo → 401.
- `GET /api/acts` y `POST /api/acts/sync` exigen `ACTAS_SYNC_TOKEN` (cabecera `X-Sync-Token`).
  Sin configurar → 503. La app Android envía el token vía BuildConfig `ACTAS_SYNC_TOKEN`.
- CSP: `script-src 'self'` (eliminado `'unsafe-inline'`; scripts inline extraídos a `web/public/boot.js`).
- Cabecera `Server` ya no revela versión/framework; `--no-server-header` documentado para uvicorn.
- Manifiesto Android: eliminado `android:usesCleartextTraffic="true"` (la network-security-config gobierna).

### 🗄 Almacén de actas
- `synced_acts.jsonl` → **SQLite** (`acts.db`, WAL, PRIMARY KEY `audio_sha256`) con
  **migración automática** en el primer arranque (`tools/test_acts_store.py` lo cubre).
- `ACTAS_RETENTION_HOURS` (defecto 720 h): purga automática de subidas antiguas cada 6 h.
  El almacén de actas nunca se purga por este mecanismo.

### 🗣 Honestidad del pipeline
- **Audios canónicos de demostración desactivados por defecto** (`ACTAS_DEMO_MODE=1` para demos).
- **Google Web Speech desactivado por defecto** (`ACTAS_ALLOW_GOOGLE_ASR=1` para opt-in explícito):
  por defecto el audio NUNCA sale del servidor.
- Cada job expone `transcription_engine` (visible en la Web como chip; ámbar para `demo-canonical`).
- Mensaje «no speech» honesto: explica qué motores hay y cómo habilitar transcripción real.
- Android: `OfflineAiEngine` ya no inventa un acta falsa ni «ACUERDOS»; genera un **respaldo de
  custodia sin transcripción** (SHA-256 + estructura vacía a rellenar a mano).
- Android: `ExecutiveSummaryExtractor` ya no inventa decisiones/tareas ausentes (listas vacías).
- Android: `MultiLanguageTranslator` ya no se anuncia como traducción «oficial»; es borrador
  parcial de términos clave, etiquetado como tal.

### 🛠 App Android · Ajustes de servidor
- Nuevo diálogo **Ajustes del servidor** (icono engranaje en Captura): URL persistente
  (SharedPreferences), tabla de preajustes (emulador TLS/HTTP, `actasdigitales.local`) y
  **prueba real de `/api/health`** con diagnóstico. Arregla el error típico `10.0.2.2:8443`.
- `AudioRepository` sin caché permanente del servicio (al cambiar la URL se aplica en la siguiente llamada).

### ✅ Verificación y tooling
- `tools/check_version_sync.py` nuevo: versión canónica `web/package.json` ⇄ backend ⇄ README ⇄ docs ⇄ Footer ⇄ CHANGELOG. CI lo ejecuta.
- `tools/test_acts_store.py` nuevo (migración, idempotencia SHA-256, retención). CI lo ejecuta.
- Versiones sincronizadas a 1.5.0 en README (badge), Footer web, `docs/index.html`.
- Fix incongruencia de manifiesto y claims «cifrado de extremo a extremo» → «TLS en tránsito, on-premise».

---

## [1.5.0] - 2026-11-13

> Iteración sobre las «Más sugerencias de mejora» propuestas tras la 1.4.0.
> Estado verificado ítem a ítem (ver README y PR); las partes Android se compilan
> en CI/Android Studio porque el sandbox no dispone de Android SDK.

### 📦 Publicación en GitHub Releases + URL canónica
- `/api/app/info` ahora anuncia `release_url` (env `ACTAS_RELEASE_URL`, defecto:
  releases del repositorio) y la Web la enlaza en la sección de descarga.
- Nuevo workflow `release.yml`: al pushear un tag `v*`, compila
  `assembleRelease` + `bundleRelease`, **firma** con los secrets
  `ACTAS_KEYSTORE_*`, genera `SHA256SUMS.txt` y crea/actualiza la GitHub Release
  con APK (universal y por ABI) + AAB. La versión del APK se deriva del tag.
- QR y CTA de la Web siguen apuntando al servidor (auto-alojado) por defecto;
  GitHub Releases queda como distribución canónica externa con checksum.

### 🔐 Firmas y claves
- **CI firma los artefactos en cada tag**; el keystore viaja como secret
  (`ACTAS_KEYSTORE_BASE64`) y jamás se commitea.
- Gradle: `versionCode`/`versionName` sobrescribibles con
  `ACTAS_VERSION_CODE`/`ACTAS_VERSION_NAME`; `signingConfig` ya lee la clave
  de `android/signing/` o env. Minify/R8 activados (`isMinifyEnabled` +
  `isShrinkResources`), splits por ABI (`arm64-v8a`, `armeabi-v7a`, `x86_64`)
  con APK universal, `bundleRelease` para Play. Reglas R8 amplias en
  `proguard-rules.pro` (Retrofit/Gson/Room/modelos). **No compilado en local**
  (sin SDK en sandbox): la primera verificación real es CI/Studio.

### 📱 Móvil ⇄ Web: actas compartidas vía Room + servidor
- **CloudSyncWorker deja de ser una simulación**: sube las actas de Room
  (`GET acts snapshot`, idempotente por `audio_sha256`) a `POST /api/acts/sync`.
- Backend nuevo `acts_router`: `POST /api/acts/sync` (validación Pydantic,
  deduplicación por hash, persistencia NDJSON en UPLOAD_DIR, métricas, log
  estructurado) y `GET /api/acts` (lista para la Web).
- Web: `ApiService.listSyncedActas()` y nueva sección colapsable
  «Actas del móvil (Room → servidor)» en el historial (RecentJobs), oculta
  cuando no hay actas sincronizadas. Verificada con smoke render (jsdom).
- **Honestidad sobre el alcance**: la sincronización es por lotes con
  deduplicación servidor-side; aún no hay columna `pendingSync` en Room
  (reenvía el histórico de expedición). La Web aún no tiene edición de actas
  del móvil; solo lectura.

### 🌗 PWA
- Manifiesto con `id: "/"` y segundo shortcut **«Verificar APK»** (ancla
  `#verificador-apk` en la sección de descarga). Icons ya eran propios (PWA
  instalable en Android/Desktop verificada).

### 📊 Observabilidad
- `GET /api/metrics` (JSON, sin dependencias): contadores por proceso
  (`http_requests_total`, `app_info_requests_total`, `app_downloads_total`,
  `app_downloads_bytes_total`, `acts_sync_requests_total`, `acts_synced_total`),
  `uptime_seconds`, `jobs_in_memory`, `last_download`. Los contadores se
  reinician con el proceso (documentado); para multi-instancia, exportar a
  Prometheus.
- Logs estructurados JSON Lines (`actas.observabilidad`) en descargas del APK
  (`app_download`: artefacto, bytes, sha256, cliente) e información.
- Middleware de conteo de peticiones HTTP.

### 🛡 Seguridad
- **Android: eliminado el TrustManager que aceptaba CUALQUIER certificado** y
  el `hostnameVerifier` universal. Ahora: CAs del sistema, validación TLS
  estricta, **certificate pinning opcional** (`ACTAS_CERT_PIN_PRIMARY`/
  `ACTAS_CERT_PIN_BACKUP`, SPKI SHA-256 en base64, también en sync worker) y
  CAs de usuario confinadas a dominios de desarrollo LAN en
  `network_security_config.xml`.
- **CORS estricto**: orígenes explícitos vía `ACTAS_CORS_ORIGINS` (defecto:
  localhost de desarrollo); nunca `*` con credenciales; métodos y cabeceras
  mínimos. Same-origin (Web servida por el mismo proceso) sin cambios.
- Logging HTTP del cliente móvil: `BODY` solo en debug; `BASIC` en release.

### ✅ CI
- Nuevo job E2E incluye `/api/metrics` (JSON, contadores). El workflow de
  release firma y publica AAB/APK por tag.

### 🐛 Correcciones rápidas
- `web/Dockerfile`: `npm install` → `npm ci` (build reproducible).
- `config.py` VERSION 1.0.0 → **1.5.0**; `web/package.json` → 1.5.0.
- Manual de usuario HTML (`/docs/MANUAL_USUARIO.html`) incluido en la Web
  (antes 404).

### 📱 Android: arranque, puntero y uso en dispositivo (PR #22 integrado)
- **Arranque sin cierre**: Room migrado de `annotationProcessor` a **KSP**
  (`ksp(libs.androidx.room.compiler)` + `ksp { arg("room.generateKotlin", "true") }`);
  generación de `AppDatabase_Impl`/`ActaDao_Impl` garantizada. Toolchain final:
  AGP 9.5.1 · Kotlin 2.1.0 · KSP 2.1.0-1.0.29 · Room 2.8.5 (Room se mantiene en
  2.8.5, no se baja a 2.7.2 como proponía el PR). `org.jetbrains.kotlin.android`
  sigue retirado (AGP 9 compila Kotlin de forma nativa).
- **Hover del puntero**: `MainActivity.dispatchGenericMotionEvent` descarta
  `ACTION_HOVER_EXIT` sin botones pulsados (fallo conocido de Compose,
  issuetracker.google.com/issues/314269723); el toque táctil no se ve afectado.
- **Atrás en el móvil**: desde Historial regresa a Captura (`BackHandler`) en
  lugar de cerrar la app.
- **Modo oscuro**: la tipografía hereda el color del tema activo (antes texto
  ilegible); tema nativo oscuro `values-night` y `windowBackground` coherente.
- **Grabación**: liberación de `MediaRecorder` si `prepare()` falla, filtros
  DSP reales, cronómetro en pantalla, descarte de grabaciones vacías con aviso.
- **Sin conexión**: si el servidor no responde, el audio + su SHA-256 se
  registran en el historial local como acta de respaldo (nunca más pantalla
  bloqueada con error); antes la transcripción offline usaría igualmente
  `OfflineAiEngine` cuando el DSP está disponible.
- **Historial**: confirmación antes de eliminar un acta; exportación de PDF con
  `FileProvider` + `xml/file_paths.xml` al diálogo del sistema (antes quedaba
  solo en la caché).
- **Red**: TLS negociado por el sistema (1.3 → 1.2, ya no se fuerza 1.3),
  `retryOnConnectionFailure`, pinning opcional intacto, logger BASIC solo en
  debug (nunca BODY, que filtraba la API Key en logcat).
- **Permisos**: eliminados permisos de almacenamiento; el selector usa Storage
  Access Framework y valida extensión/tamaño/archivo vacío.
- **Icono propio** de la app (`drawable/ic_launcher`) en lugar del icono
  genérico del sistema.
- **Detalle de compilación:** el `ID de sesión` para el DSP de ruido/eco se obtiene
  por reflexión (`getMethod("getAudioSessionId")`) porque el getter sintético
  `audioSessionId` no resuelve en la compilación de CI (AGP 9.5.1 / Kotlin 2.1.0 /
  compileSdk 35). Si el getter no existe en el entorno, la grabación funciona igual
  y simplemente no se activa el DSP.
- **Seguridad mantenida**: se integró el commit de PR #22 sin aceptar su
  `TrustManager` universal ni su `hostnameVerifier { _, _ -> true }` (se
  mantuvieron la validación TLS del sistema y el certificate pinning opt-in).
- Verificación: CI `android-build-check.yml` (assembleRelease + bundleRelease)
  sobre la rama; **no verificado en dispositivo físico en el sandbox**.

---

## [1.4.0] - 2026-11-13

### 📱 Distribución de la App: ahora se sirve la app nativa REAL
- **Cambio de artefacto oficial:** `/api/app/download` sirve por defecto [`android/app/release/app-release.apk`](android/app/release/app-release.apk) (~13 MB): la app nativa completa en **Kotlin + Jetpack Compose** (WorkManager, Room, BiometricPrompt), firmada con **APK Signature Scheme v2/v3**. El APK raíz (`ActasDigitales.apk`, ~6 KB) queda relegado a respaldo legado.
- **Detección honesta de firma en el servidor:** el backend inspecciona el APK (entradas `META-INF/*.RSA/.SF` para v1; magic `APK Sig Block 42` para v2/v3) y **nunca sirve un APK sin firma** por defecto. `/api/app/info` ahora reporta `signature_schemes`, `installable`, `artifact_kind` (`release-gradle` | `stub-demo` | `external`) y `description` del artefacto servido; versión/SDK/requisito informados por artefacto (release: v1.0.0 · minSdk 26 · Android 8.0+; stub: v1.2.0 · minSdk 24 · Android 7.0+).
- **Sincronía Web ↔ release garantizada:** `web/public/ActasDigitales.apk` es copia byte a byte del release (SHA-256 idéntico) servida también por hosting estático; nuevo `tools/sync_apk.py` (copia y `--check` para CI) y script npm `sync:apk`. `compilar_apk.py` la invoca al final de cada build.
- **Firma release persistente en Gradle:** `build.gradle.kts` declara `signingConfig` para `release` leyendo `ACTAS_KEYSTORE_PATH/PASSWORD/KEY_ALIAS/KEY_PASSWORD` o `android/signing/actas-mobile.keystore` (opcional; sin clave, la build sigue sin firma como antes). `versionName`/`versionCode` bumpados a **1.3.0 / 2** para la próxima build.
- **Firma persistente en el toolchain autónomo:** `tools/compilar_apk.py` reutiliza `android/signing/actas-mobile.{key,crt}.pem` en lugar de generar una clave efímera en cada ejecución (la firma ya no cambia entre builds, permitiendo actualizaciones in-situ). El stub queda sincronizado con el release real tras cada compilación.
- **Claves fuera de Git:** `.gitignore` ignora `android/signing/`, `*.keystore`, `*.jks`.

### 🖥️ Verificación SHA-256 en el navegador tras la descarga
- La sección «Descarga la App para tu móvil» incorpora un **verificador de integridad en el cliente**: selecciona el APK descargado y el navegador calcula su SHA-256 (`crypto.subtle`) comparándolo con la custodia del servidor — ✓ íntegro / ✗ corrupto o manipulado. Requiere contexto seguro (HTTPS/localhost); si no, indica el procedimiento CLI (`sha256sum`).
- **Modo estático de respaldo:** si el backend no responde (hosting estático puro, p. ej. GitHub Pages), la Web degrada a la copia `/ActasDigitales.apk` (con su SHA-256 calculado en el navegador) y el QR apunta a ella. Nuevo tile/descarga consistente en todo el flujo.

### 🌗 Modo oscuro completo
- `darkMode: 'class'` en Tailwind; script anti-FOUC en `index.html` (persistencia en `localStorage.actas_theme` + respeto de `prefers-color-scheme`); **toggle Sol/Luna en la barra superior**.
- Inyección sistemática de variantes `dark:` en toda la interfaz (Navbar, Footer, Pilares, Historial, Uploader, Grabador, Visor de resultados, Modales de seguridad y vídeo, Badge, progreso de job) con verificación de renderizado en ambos temas. `color-scheme: dark` y `scroll-behavior` respetan `prefers-reduced-motion`.

### ✅ Calidad y CI
- **Nuevo job E2E en CI** (`apk-distribution-e2e`): verificación `tools/sync_apk.py --check`, arranque del servidor y pruebas **Playwright** (`web/e2e/app-download.spec.ts`): título, sección de descarga + QR visible, integridad SHA-256 del APK servido vs `/api/app/info`, `HEAD` con `X-APK-SHA256`, MIME de la copia estática y 404 JSON para `/api/*` desconocidas. Las 4 pruebas de API verificadas en local; las 2 de navegador corren en CI (descarga de Chromium restringida en sandbox).
- `web-frontend` usa `npm ci` (reproducible). Nuevos scripts: `test:e2e`, `sync:apk`.

---

## [1.3.0] - 2026-11-13

> **Nota de corrección (1.4.0):** esta versión asumía que `android/ActasDigitales.apk` era el artefacto oficial y que la Web servía «la app». La inspección posterior (Androguard) demostró que era un stub mínimo y que el release real estaba sin usar. La 1.4.0 cambia el artefacto distribuido al release nativo y corrige toda la documentación derivada.

### 📱 Descarga de la App Android desde la propia Web
- **Nuevo endpoint `GET /api/app/info`:** Metadatos públicos del APK servido por el servidor (versión 1.2.0, paquete `com.actasdigitales.app`, tamaño, SHA-256 de custodia, firma RSA-4096, requisitos Android 7.0+/API 24).
- **Nuevo endpoint `GET|HEAD /api/app/download`:** Descarga directa del APK oficial (`application/vnd.android.package-archive`) con cabeceras `X-APK-SHA256`, `X-APK-Version`, `Content-Length` y `Content-Disposition: attachment`. Sin tiendas externas ni dependencia de GitHub; funciona en LAN, Docker (montaje `./android:/android:ro` vía `APK_DOWNLOAD_PATH`) y HTTPS.
- **Nueva sección «Descarga la App para tu móvil» en la Web:** Botón de descarga directo, código QR con la URL absoluta para escanear desde el teléfono, hash SHA-256 con copia al portapapeles, pasos de instalación («apps desconocidas»), nota para iPhone/iPad (PWA vía Safari) y estado del paquete en vivo.
- **Accesos directos:** Botón «App» en la barra superior, enlace «Descargar App Android» en el pie, tarjeta lateral «App Móvil» y módulo de ancho completo «DESCARGAR APP MÓVIL (APK)» en el Panel de Control Futurista.

### 🖥️ Vista Web corregida y pulida
- **PWA real:** `manifest.webmanifest`, iconos 192/512 con el logotipo oficial, `apple-touch-icon`, favicon de marca (antes emoji), metadatos `theme-color`, `description` y `application-name` en `index.html`.
- **Animaciones reparadas:** Sustituidas las clases inexistentes de `tailwindcss-animate` (`animate-in`, `fade-in`, `zoom-in-95`, `slide-in-from-top-4`) por utilidades propias (`animate-fade-in`, `animate-fade-slide-up`, `animate-fade-zoom-in`) con respeto a `prefers-reduced-motion`.
- **Clases Tailwind inválidas eliminadas:** `p-4.5` → `p-5`; `shadow-xs` / `shadow-2xs` → `shadow-sm`; retiradas clases del plugin `tailwind-scrollbar` no instalado.
- **Accesibilidad y HTML válido:** Corregido el anidamiento `<a>` dentro de `<button>` en la tarjeta de Certificado de Confianza (ahora son elementos hermanos), `aria-label`s y `aria-expanded`, `scroll-behavior: smooth`.
- **Historial con estado vacío:** En lugar de ocultar el panel de actas recientes, se muestra una guía para procesar la primera acta.
- **Multi-subida robusta:** Fallo de un archivo ya no aborta el resto del lote. Fuga de `ObjectURL` corregida en el grabador.

### 🛡️ Servidor endurecido
- **`Clear-Site-Data` eliminado del fallback del SPA:** Ya no borra `localStorage` (la API Key guardada) ni las cachés en cada refresco; la purga explícita queda en `/limpiar-cache` y `/api/purge-cache`.
- **Path traversal neutralizado** en el fallback del SPA: resolución confinada a `web/dist` con `is_relative_to`.
- **404 JSON para rutas API desconocidas:** `/api/*` sin coincidencia ya no devuelve HTML 200.
- **Caché inmutable (1 año) para `/assets` con hash de Vite;** cabeceras `Cache-Control` largas para iconos; nginx del frontend con gzip, CSP y `proxy_buffering off`.
- **`client_max_body_size` 1024M** en el nginx de despliegue, alineado con el límite de 1 GB del backend y la Web.

## [1.2.1] - 2026-11-12

### 🐞 Correcciones críticas de la aplicación Android (arranque y estabilidad)

- **Cierre inmediato al abrir la app (`AppDatabase_Impl does not exist`):** Room se declaraba con
  `annotationProcessor`, que solo procesa fuentes Java. Se migró a **KSP** con
  `ksp(libs.androidx.room.compiler)`, de modo que `AppDatabase_Impl` y `ActaDao_Impl` se generan
  en la compilación (`ksp { arg("room.generateKotlin", "true") }`).
- **Cadena de compilación compatible con AGP 9.5.1:** se retiró el plugin `org.jetbrains.kotlin.android`
  (AGP 9 compila Kotlin de forma nativa) y se conservó solo `org.jetbrains.kotlin.plugin.compose`,
  junto con `com.google.devtools.ksp`, la combinación soportada por AGP 9.
- **Cierre por `ACTION_HOVER_EXIT` (ratón, lápiz o teclado externo):** se intercepta ese evento en
  `MainActivity.dispatchGenericMotionEvent` cuando no hay botones pulsados, neutralizando el fallo
  conocido de Compose (`issuetracker.google.com/issues/314269723`) sin afectar al toque táctil.
- **Texto ilegible en modo oscuro:** la tipografía fijaba colores oscuros; ahora hereda el color del
  tema activo.
- **Destello blanco al abrir y contenido bajo el recorte de pantalla:** tema nativo oscuro
  (`values-night`), `windowBackground` coherente y gestión única de insets.

### 📱 Mejoras de uso en móvil

- **Grabación:** liberación correcta de `MediaRecorder` si `prepare()` falla, activación real de los
  filtros DSP de ruido/eco, cronómetro en pantalla y descarte de grabaciones vacías con aviso claro.
- **Modo sin conexión:** si el servidor no responde, el audio y su huella SHA-256 se registran en el
  historial local con un acta de respaldo (antes la pantalla quedaba bloqueada con un error).
- **Historial:** confirmación antes de eliminar un acta y exportación de PDF mediante `FileProvider`
  al diálogo del sistema (antes solo mostraba un aviso y el PDF quedaba en la caché).
- **Selector de archivos:** admite cualquier nombre y extensión de audio, valida archivo vacío y el
  límite de 1 GB.
- **Botón Atrás:** desde Historial regresa a Captura en lugar de cerrar la aplicación.
- **Red:** se dejó de forzar exclusivamente TLS 1.3 (rompía el handshake con servidores TLS 1.2) y se
  retiraron permisos de almacenamiento innecesarios.
- **Icono propio** de la aplicación en lugar del icono genérico del sistema.

### 🧰 Distribución

- **Se retiró `android/ActasDigitales.apk`:** era un paquete de 5,8 KB generado por
  `tools/compilar_apk.py` que contenía un `classes.dex` mínimo (solo `ActasApplication` y
  `MainActivity`) sin Compose ni Room, por lo que no abría la aplicación. El APK real se compila con
  `cd android && ./gradlew assembleDebug`.
- `tools/compilar_apk.py` ahora declara que produce un paquete **de verificación de firma y recursos**
  para CI, escribe en `tools/verificacion/` y no sobrescribe la salida de Gradle.

> **Nota (integración en 1.5.0):** la sección 1.2.1 documenta el fix de PR #22
> (cerrado sin merge). Versiones finales integradas en main: AGP 9.5.1 · Kotlin 2.1.0 ·
> KSP 2.1.0-1.0.29 · Room 2.8.5 (no las cifras originales del PR).

---

## [1.2.0] - 2026-11-10

### 🛡️ Criptografía y Seguridad Avanzada
- **Módulo RSA-4096 Completo:** Actualización del generador criptográfico a claves RSA de 4096 bits para la Autoridad de Certificación raíz (`ca.key`) y certificados de servidor (`server.key`), superando las recomendaciones NIST y ENS.
- **Cadena de Custodia SHA-256:** Vinculación hash SHA-256 punto a punto entre la pista de audio capturada y el acta formal emitida.
- **Cabeceras HSTS y CSP Reforzadas:** `Strict-Transport-Security` con vigencia estricta de 31536000 segundos (1 año) con inclusión de subdominios y precarga.

### 📱 Aplicación Móvil Android & APK Directo
- **Entrega de Paquete APK Precompilado:** Publicación del binario listo para pruebas en [`android/ActasDigitales.apk`](android/ActasDigitales.apk) y `android/app/build/outputs/apk/debug/app-debug.apk`.
- **Firma Digital RSA-4096:** Empaquetado y firma criptográfica v1 JAR Scheme con clave RSA de 4096 bits verificada mediante Androguard.
- **Grabador de Audio 128 kbps AAC:** Optimización acústica a 16 kHz / 128 kbps estéreo, con pausa y reanudación, visualizador acústico en tiempo real y tolerancia TLS 1.3 ante CAs corporativas.
- **Script de Compilación Autónomo:** Adición de `tools/compilar_apk.py` para regeneración independiente del paquete Android.

### 📸 Capturas de Pantalla Profesionales & Documentación Web
- **Galería de Capturas en Alta Resolución:** Generación automatizada de 8 capturas fotorealistas sincronizadas con el estado actual del sistema mediante `@resvg/resvg-js`.
- **Los 4 Pilares de Arquitectura:** Banner y secciones dedicadas a *01 Captura · 02 Transcribe · 03 Consolida · 04 Formaliza*.
- **Portal Web GitHub Pages Renovado:** Rediseño completo de `docs/index.html` con estética dark glassmorphism, comparativas interactivas, tabla criptográfica y descarga directa del APK.

---

## [1.1.0] - 2026-11-10

### 🔒 Seguridad y Criptografía
- **Soporte HTTPS con Certificados Firmados:** Implementación del generador `tools/generar_certificados_https.py` con CA raíz X.509 v3 y extensiones SAN (Subject Alternative Names).
- **TLS 1.3:** Configuración de cifrados modernos y cabeceras de seguridad estrictas (`HSTS`, `CSP`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
- **Middleware de Rate Limiting:** Protección contra denegación de servicio (DoS) e inundación de peticiones en FastAPI.
- **Android Network Security Config:** Soporte de confianza para CAs de sistema y certificados de usuario en `network_security_config.xml`.

### ✨ Nuevas Funciones y Mejoras
- **Estructuración de Acta Oficial RAE:** Nuevo endpoint `/api/audio/format-official-acta` que transforma el texto en un acta formal con convocatoria, orden del día, acuerdos y firmas.
- **Reproductor de Vídeo Promocional Interactivo (3 min):** Modal integrado en la aplicación web (`PromoVideoModal.tsx`) con 6 escenas animadas, subtítulos y temporización sincronizada.
- **Búsqueda y Filtros en Historial:** Búsqueda en tiempo real de actas procesadas en el panel lateral.
- **Exportación a PDF / Imprimir:** Estilos CSS de impresión optimizados para emisión de documentos oficiales.

---

## [1.0.0] - 2026-11-10

### 🚀 Lanzamiento Inicial
- **Servidor Backend en FastAPI:** Pipeline asíncrono con endpoints para subida de audio, consulta de estado y streaming en tiempo real vía Server-Sent Events (SSE).
- **Motor Lingüístico en Español:** Eliminación de tartamudeos con guion, palabras repetidas accidentalmente y muletillas orales comunes. Corrección de acentuación diacrítica y signos reglamentarios `¿` y `¡`.
- **Aplicación Web en React 18 + TypeScript + Vite + Tailwind:** Grabador de micrófono en el navegador, uploader drag-and-drop, comparativa visual Antes/Después y auditoría de cambios.
- **Aplicación Android Nativa en Kotlin:** Interfaz declarativa en Jetpack Compose, captura de audio con MediaRecorder y subida resiliente con WorkManager.
