# Guía de Instalación y Despliegue Seguro (HTTPS / TLS 1.3)

Esta guía explica cómo desplegar el servidor de **Actas Digitales** con cifrado HTTPS de extremo a extremo, generación de certificados firmados por una Autoridad Certificadora (CA) propia o Let's Encrypt, y endurecimiento de seguridad (*security hardening*).

---

## 🔒 1. Requisitos Criptográficos de HTTPS

Para garantizar que el navegador web permita el acceso al micrófono (`getUserMedia`) y que los dispositivos Android transmitan audios confidenciales sin riesgo de intercepción (Man-in-the-Middle), se aplican las siguientes directivas:

- **Protocolo:** TLS 1.3 mandatorio (con retrocompatibilidad estricta con TLS 1.2).
- **Cifrados:** Cifrados autenticados (AEAD) con Secreto Perfecto hacia Adelante (PFS):
  - `TLS_AES_256_GCM_SHA384`
  - `TLS_CHACHA20_POLY1305_SHA256`
  - `ECDHE-ECDSA-AES256-GCM-SHA384` / `ECDHE-RSA-AES256-GCM-SHA384`
- **Extensión X.509 v3 SAN:** Nombres Alternativos del Sujeto (`localhost`, `127.0.0.1`, `0.0.0.0`, `actasdigitales.local`).

---

## 🛠 2. Generación Automatizada de Certificados Firmados

El repositorio incluye la herramienta `tools/generar_certificados_https.py`, que emite una CA raíz propia y firma el certificado del servidor con una validez de 825 días (máximo estándar aceptado por navegadores):

```bash
# Ejecutar desde la raíz del proyecto
python3 tools/generar_certificados_https.py
```

Archivos generados en `certs/`:
- `ca.key` y `ca.crt`: Clave y certificado raíz de la Autoridad Certificadora.
- `server.key` y `server.crt`: Clave privada (RSA-2048/4096) y certificado del servidor.
- `fullchain.pem`: Cadena completa de certificados para NGINX, Caddy o Uvicorn.

---

## 🚀 3. Métodos de Inicio del Servidor Seguro

### Método A: Servidor FastAPI Directo con TLS (Desarrollo / Red Local)

Puedes iniciar el backend directamente con soporte SSL/TLS:

```bash
python3 tools/iniciar_https.py
```

El servidor escuchará en `https://0.0.0.0:8443` con TLS 1.3 activo y cabeceras HSTS.

---

### Método B: Producción con Docker Compose y NGINX (Recomendado)

En producción, el proxy inverso NGINX maneja la terminación TLS, aplica rate limiting estricto y redirecciona automáticamente el tráfico HTTP al puerto HTTPS:

```bash
# Iniciar todos los servicios orquestados
docker-compose -f docker-compose.yml up -d --build
```

Configuración de NGINX en `deploy/nginx/nginx-https.conf`:
- **Puerto 80:** Redirección 301 obligatoria a HTTPS.
- **Puerto 443:** TLS 1.3 con certificados de `certs/fullchain.pem`.
- **Cabeceras inyectadas:**
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Content-Security-Policy`

---

### Método C: Caddy con HTTPS Automático y Let's Encrypt

Si dispones de un dominio público registrado (ejemplo: `actas.miempresa.com`):

1. Edita `deploy/caddy/Caddyfile` e introduce tu dominio y correo electrónico.
2. Inicia Caddy:
   ```bash
   caddy run --config deploy/caddy/Caddyfile
   ```
3. Caddy obtendrá y renovará automáticamente los certificados SSL de Let's Encrypt cada 60 días sin intervención manual.

---

## 📱 4. Confianza del Certificado en Dispositivos Android

Cuando trabajas en red local con certificados firmados por tu propia CA:

1. Copia el archivo `certs/ca.crt` al almacenamiento del teléfono.
2. En Android, dirígete a:
   **Ajustes $\to$ Seguridad $\to$ Credenciales de cifrado $\to$ Instalar desde almacenamiento $\to$ Certificado de CA**.
3. Nombra el certificado como *"Actas Digitales CA"* y pulsa **Aceptar**.
4. La aplicación Android utiliza la directiva `network_security_config.xml`, que confía tanto en las CAs oficiales del sistema como en las CAs de usuario instaladas.
