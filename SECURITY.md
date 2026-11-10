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
  - Middleware de limitación de tasa activo por dirección IP (máximo 120 peticiones por minuto para endpoints de consulta y 2 peticiones por segundo para subida de audios).

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
| **1.1.x** | ✅ Soportada actualmente (Parches críticos y TLS 1.3) |
| **1.0.x** | ⚠️ Actualización recomendada a 1.1.x |
| **< 1.0.0** | ❌ Obsoleta |
