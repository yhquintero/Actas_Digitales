# Registro de Cambios (Changelog) · Actas Digitales

Todas las modificaciones notables de este proyecto están documentadas en este archivo, siguiendo el estándar de [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y versionado semántico.

---

## [1.3.0] - 2026-11-13

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
