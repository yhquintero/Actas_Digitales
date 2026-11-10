# Registro de Cambios (Changelog) · Actas Digitales

Todas las modificaciones notables de este proyecto están documentadas en este archivo, siguiendo el estándar de [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y versionado semántico.

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
