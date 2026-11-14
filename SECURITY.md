# Política de Seguridad · Actas Digitales

**Actas Digitales** está diseñado bajo el principio de **seguridad por defecto y privacidad absoluta**. Dado que las actas de reuniones contienen decisiones estratégicas, financieras y legales confidenciales, este documento establece las directivas de seguridad del sistema y el procedimiento para reportar vulnerabilidades.

---

## 🔒 1. Estándares Criptográficos y de Red

- **Cifrado en Tránsito:**
  - Conexiones obligatorias bajo **HTTPS / TLS 1.3** con retrocompatibilidad controlada en TLS 1.2.
  - Cabecera HTTP Strict Transport Security (`HSTS`) activa con vigencia de 1 año (`max-age=31536000; includeSubDomains; preload`).
  - Protección estricta contra clickjacking mediante `X-Frame-Options: DENY`.
  - Protección de tipos MIME con `X-Content-Type-Options: nosniff`.
  - Política de contenido `Content-Security-Policy (CSP)` estricta.
- **Cifrado en Reposo:**
  - Los archivos de audio almacenados en el servidor se procesan en volúmenes temporales protegidos con permisos de lectura exclusivos para el usuario del servicio.
  - Purga automática de fragmentos temporales tras la consolidación del texto.
- **Mitigación DoS / Rate Limiting:**
  - Middleware de limitación de tasa activo por dirección IP (180 peticiones por minuto).
  - Nota operativa: sin proxy inverso confiable, todas las conexiones del mismo host comparten cubo; usa TLS terminado y `X-Forwarded-For` configurado en tu proxy para contadores por cliente reales.
- **Autenticación de administración:**
  - `POST /api/audio/system/purge-cache` y `POST /api/audio/system/run-fire-tests` exigen la cabecera `X-Admin-Token` igual que `ACTAS_ADMIN_TOKEN`. Vacío = desactivados (HTTP 503).
- **Autenticación de sincronización móvil⇄Web:**
  - `GET/POST /api/acts*` exigen `X-Sync-Token` igual que `ACTAS_SYNC_TOKEN`. Vacío = sincronización desactivada (HTTP 503). La app Android lo envía automáticamente si se compila con `ACTAS_SYNC_TOKEN`.
- **Almacén de actas:** SQLite (`acts.db`) con modo WAL y clave primaria `audio_sha256` (deduplicación atómica y a prueba de inyecciones vía consultas parametrizadas).
- **Retención de datos:** purga automática de subidas antiguas (`ACTAS_RETENTION_HOURS`, defecto 720 h). Las actas sincronizadas (`acts.db`) nunca se purgan por este mecanismo; borra datos de un acta solicitando eliminación al operador.
- **Egress de audio (honesto):** por defecto el audio nunca sale del servidor. Excepciones opt-in y visibles: Whisper API (Groq/OpenAI) con API Key, y `ACTAS_ALLOW_GOOGLE_ASR=1` (Google Web Speech). Los audios canónicos de demo (`ACTAS_DEMO_MODE=1`) sirven texto preescrito y están pensados sólo para demos; jamás para actas reales (la Web los marca como «DEMO · audio canónico»).
- **Integridad del canal:** SHA-256 verifica integridad del audio en tránsito/descarga; no prueba autoría ni identidad del hablante. Firma y sellado temporal RFC 3161/PAdES están en la hoja de ruta (no implementados en 1.5.x).

---

## 🛡 2. Reporte Responsable de Vulnerabilidades

Si descubres una posible vulnerabilidad de seguridad en Actas Digitales:

1. **No abras un issue público en GitHub.**
2. Envía un informe detallado con:
   - Descripción de la vulnerabilidad y vector de ataque.
   - Pasos para reproducirla o prueba de concepto (PoC).
   - Componente afectado (Web, Servidor FastAPI o Android).
3. Contacto de seguridad:
   - Correo electrónico: `seguridad@actasdigitales.local` (o contacto directo del mantenedor en GitHub: `@yhquintero`).
4. **Plazo de Respuesta:** Nos comprometemos a acusar recibo en menos de 48 horas laborables y coordinar un parche correctivo antes de cualquier divulgación pública.

---

## 📋 3. Versiones con Soporte de Seguridad

| Versión | Soporte de Seguridad |
| :--- | :--- |
| **1.5.x** | ✅ Soportada actualmente |
| **1.1.x – 1.4.x** | ⚠️ Actualización recomendada a 1.5.x |
| **< 1.1.0** | ❌ Obsoleta |
