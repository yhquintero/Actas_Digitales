<div align="center">

<img src="brand/actas-digitales-icon.png" width="104" alt="Logotipo de Actas Digitales" />

# Actas Digitales

### Captura. Transcribe. Consolida. Formaliza.

**Plataforma integral de procesamiento de voz a texto en español con supresión de muletillas, desduplicación y corrección ortotipográfica para actas de reuniones oficiales.**  
**Web instalable (PWA), aplicación Android nativa en Kotlin y servidor propio con HTTPS y TLS 1.3 — también en red local privada.**

🌐 **[Sitio del proyecto](https://yhquintero.github.io/Actas_Digitales/) · [Manual de usuario](docs/MANUAL_USUARIO.html) · [Guía rápida (2 páginas)](docs/GUIA_RAPIDA.md) · [Vídeo (3 min)](docs/PROPUESTA_VIDEO_PROMOCIONAL.md)**

🌐 **Español** · [English](docs/readme/README_en.md)

[![CI](https://github.com/yhquintero/Actas_Digitales/actions/workflows/ci.yml/badge.svg)](https://github.com/yhquintero/Actas_Digitales/actions/workflows/ci.yml)
[![Versión](https://img.shields.io/badge/versi%C3%B3n-1.1.0-4f46e5?style=flat-square)](CHANGELOG.md)
[![Plataformas](https://img.shields.io/badge/plataformas-Web%C2%B7Android%C2%B7Servidor-1e1b4b?style=flat-square)](#-ecosistema)
[![Seguridad](https://img.shields.io/badge/Seguridad-HTTPS%20%7C%20TLS%201.3-059669?style=flat-square)](#-seguridad-https-y-certificados)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](#-requisitos)
[![Kotlin](https://img.shields.io/badge/Kotlin-Jetpack%20Compose-7F52FF?style=flat-square&logo=kotlin&logoColor=white)](android/)
[![Licencia](https://img.shields.io/badge/licencia-propietaria-475569?style=flat-square)](LICENSE)

[Resumen](#-resumen) · [Ecosistema](#-ecosistema) · [Funciones](#-funciones) · [Capturas](#-capturas) · [Requisitos](#-requisitos) · [Inicio rápido](#-inicio-rápido) · [Seguridad HTTPS](#-seguridad-https-y-certificados) · [Documentación](#-documentación) · [Calidad y pruebas](#-calidad-y-pruebas) · [Preguntas frecuentes](#-preguntas-frecuentes) · [Licencia](#-licencia)

</div>

<p align="center">
  <img src="brand/actas-digitales-hero.png" width="100%" alt="Actas Digitales: Panel en el navegador, App Android nativa y conexión segura TLS 1.3" />
</p>

> [!TIP]
> **¿Primera vez?** Empieza por el **[Manual de Usuario](docs/MANUAL_USUARIO.md)** —paso a paso,
> también en [versión imprimible](docs/MANUAL_USUARIO.html)— o consulta la
> **[Guía Rápida de 2 páginas](docs/GUIA_RAPIDA.md)** y el
> **[Vídeo promocional de 3 minutos](docs/PROPUESTA_VIDEO_PROMOCIONAL.md)**, que explica
> las seis fases para capturar audio y emitir el acta final con firmas oficiales.

> [!IMPORTANT]
> **Actas Digitales es software propietario.** El código es visible en GitHub para auditoría y evaluación técnica, pero usarlo en producción, copiarlo, modificarlo o distribuirlo requiere una **licencia de uso** del titular. Consulta [LICENSE](LICENSE) y la sección [Licencia](#-licencia).

---

## 🧭 Resumen

**Actas Digitales** sustituye los días de transcripción manual y cuadernos sueltos por un pipeline de procesamiento lingüístico automatizado de extremo a extremo: **subida de archivos o grabación directa con micrófono**, **detección de actividad de voz (VAD)**, **transcripción fonética calibrada en español**, **desduplicación y eliminación de muletillas orales**, y **corrección ortotipográfica y gramatical** según las normas de la RAE antes de entregar el resultado final.

La interfaz Web se instala como app (PWA) y ofrece preescucha y comparativa visual; la app Android lleva la grabación al bolsillo con reanudación automática si se pierde la conexión; y el servidor propio bajo **HTTPS con certificados firmados y TLS 1.3** garantiza que las deliberaciones confidenciales nunca salgan de la infraestructura privada de la organización.

| Ficha del proyecto | Detalle |
|---|---|
| **Qué es** | Sistema integral de voz a texto oficial, consolidación lingüística y corrección ortotipográfica en español |
| **Para quién** | Secretarios de actas, directivos, comités técnicos, asambleas, asesorías jurídicas y equipos de gobierno |
| **Cómo está hecho** | Python 3.11 (FastAPI + Pydantic + Uvicorn) · React 18 + TypeScript + Vite + Tailwind (Web) · Kotlin + Jetpack Compose + WorkManager (Android) · Cryptography (TLS 1.3 con certificados X.509 v3 y SAN) |
| **Dónde corre** | Servidor propio (Linux, Windows, macOS, Docker) en red local o nube privada. Sin dependencia obligatoria de terceros |
| **Cómo se usa** | Navegador web instalable (PC o móvil), app Android nativa con subida resiliente en segundo plano, o API REST |
| **Estado** | Versión **1.1.0** estable · integración continua en verde con pruebas de seguridad y pipeline lingüístico |
| **Modelo** | Software propietario con derechos reservados © 2026 yhquintero |

---

## 🧩 Ecosistema

Actas Digitales está compuesto por **tres componentes que trabajan de forma sincronizada**:

| Pieza | Qué es | Qué aporta |
|---|---|---|
| 🌐 **Web (PWA)** | Interfaz moderna servida por el propio servidor; instalable como app de escritorio o móvil | Centro de mando: grabación en vivo con Web Audio API, uploader drag-and-drop (.mp3, .wav, .m4a, .ogg, .webm), seguimiento del pipeline en tiempo real (SSE), comparativa antes/después, auditoría de cambios, estructuración de acta RAE y exportación a PDF, TXT y Markdown |
| 📱 **Android** | App nativa en Kotlin + Jetpack Compose + Material Design 3 | Operación en movilidad: captura acústica de alta fidelidad con `MediaRecorder` (AAC 16 kHz), subida en segundo plano con `WorkManager` (tolerante a cortes de red), visualización reactiva y compartir mediante Android Intent |
| 🗄️ **Servidor** | Proceso asíncrono en FastAPI + Workers en segundo plano | Núcleo de procesamiento: normalización acústica, VAD, motor STT forzado en español (`language="es"`), algoritmo de desduplicación de solapamientos, corrección ortotipográfica y cifrado HTTPS estricto con TLS 1.3 |

```text
                    ┌──────────────────────────────┐
   Navegador Web ───┤  Web (React + TS + Vite)     │
   (PC / Portátil)  │  Grabador mic · Comparativa  │
                    │  Acta oficial RAE · PDF/MD   │
                    └──────────────┬───────────────┘
                                   │  HTTPS (TLS 1.3) · REST + SSE
                    ┌──────────────▼───────────────┐        ┌──────────────────┐
   App Android ─────┤  Servidor FastAPI (Python)   ├───────►│  Certificados    │
   (Kotlin Compose) │  VAD · STT 'es' · Pipeline   │        │  TLS 1.3 / SAN   │
                    │  Desduplicación y Ortografía │        └──────────────────┘
                    └──────────────┬───────────────┘
                                   │
                    ┌──────────────▼───────────────┐
                    │  Documento Final Consolidado │
                    │  - Sin muletillas ni cortes  │
                    │  - Tildes RAE y signos ¿ ¡   │
                    │  - Convocatoria y Firmas     │
                    └──────────────────────────────┘
```

---

## ✨ Funciones

### Operación y Captura Acústica
- 🎙 **Grabación directa en navegador y móvil** — Web Audio API en navegador y `MediaRecorder` nativo en Android calibrado a 16 kHz / mono / AAC para máxima fidelidad fonética.
- 📥 **Soporte multiformato** — Acepta `.mp3`, `.wav`, `.m4a`, `.ogg`, `.webm`, `.flac` y `.aac` de hasta 100 MB por sesión.
- 📡 **Subida resiliente y tolerante a fallos** — En Android, `WorkManager` gestiona la subida en segundo plano: si el usuario minimiza la app o se pierde el Wi-Fi, la transferencia se reanuda de forma transparente.

### Pipeline de Inteligencia Lingüística
- ⏱ **Detección de voz (VAD) y segmentación** — Normalización de volumen (`loudnorm`) y fragmentación basada en silencios naturales, evitando cortes bruscos en medio de oraciones.
- 🗣 **Transcripción fonética especializada en español** — Parámetro `language="es"` forzado para evitar conmutaciones indebidas de idioma y asegurar la correcta interpretación de modismos y términos técnicos.
- ✂️ **Consolidación y desduplicación inteligente** — Detección de solapamientos en fronteras de segmentos mediante alineación difusa (*fuzzy matching*).
- 🧹 **Supresión de muletillas y vacilaciones orales** — Limpieza automática de expresiones redundantes (*"bueno pues este..."*, *"o sea"*, *"ehhh"*, *"tipo que"*).
- 🩹 **Eliminación de tartamudeos y repeticiones accidentales** — Corrección de cortes con guion (*"de-de-de verdad"* $\to$ *"de verdad"*) y palabras duplicadas consecutivas (*"vamos a a a revisar"* $\to$ *"vamos a revisar"*).
- ✍️ **Corrección ortotipográfica y gramatical RAE** — Acentuación correcta de palabras agudas/graves en actas (*sesión, reunión, situación, día, conclusión, próximo, último, técnico, artículo, estará, habrá*), concordancia de género/número y mayúsculas oracionales.
- ❓ **Signos de apertura reglamentarios en español** — Inyección obligatoria de los signos de apertura `¿` y `¡` al inicio de oraciones interrogativas y exclamativas.

### Entrega, Auditoría y Formalización
- 📊 **Comparativa visual Antes / Después** — Vista en paralelo que resalta en rojo la transcripción cruda y en verde el acta consolidada.
- 🔍 **Auditoría de cambios** — Listado pormenorizado de cada corrección aplicada con su categoría (*muletilla, repetición, ortografía, puntuación*) y justificación.
- 📑 **Estructuración en Acta Oficial RAE** — Convierte el texto corregido en un documento formal con título, asistentes, orden del día, acuerdos numerados (`ACUERDO-01`, etc.) y pie de firmas para Presidente y Secretario.
- 💾 **Exportación multipropósito** — Copiado instantáneo al portapapeles, descarga en `.txt` UTF-8, archivo `.md` (Markdown) o impresión/guardado en PDF vectorial.

---

## 📸 Capturas

*Datos de demostración del proyecto: sesión oficial simulada con supresión de muletillas y corrección ortotipográfica RAE.*

<p align="center">
  <img src="docs/assets/capturas/galeria-actas-digitales.png" width="100%" alt="Actas Digitales: Panel Web, App Android, Comparativa de calidad y Pipeline lingüístico" />
</p>

<table>
  <tr>
    <td width="50%" valign="top"><img src="docs/assets/capturas/grabacion-audio.png" alt="Grabación de audio en vivo con micrófono y muestreo de 16 kHz" /><br /><sub><b>Grabación en directo</b> — captura acústica con cancelación de eco y medidor de tiempo.</sub></td>
    <td width="50%" valign="top"><img src="docs/assets/capturas/pipeline-progreso.png" alt="Pipeline de 5 fases en tiempo real con SSE" /><br /><sub><b>Pipeline en 5 fases</b> — Ingesta, VAD, STT fonético, Consolidación y Corrección RAE.</sub></td>
  </tr>
  <tr>
    <td width="50%" valign="top"><img src="docs/assets/capturas/comparativa-antes-despues.png" alt="Comparativa Antes y Después con texto crudo vs consolidado" /><br /><sub><b>Comparativa Antes / Después</b> — texto crudo con tartamudeos frente al acta limpia.</sub></td>
    <td width="50%" valign="top"><img src="docs/assets/capturas/acta-oficial-rae.png" alt="Acta Oficial RAE con orden del día, acuerdos y firmas" /><br /><sub><b>Acta Oficial RAE</b> — orden del día, acuerdos numerados y espacio legal para firmas.</sub></td>
  </tr>
  <tr>
    <td width="50%" valign="top"><img src="docs/assets/capturas/auditoria-correcciones.png" alt="Auditoría de correcciones y muletillas eliminadas" /><br /><sub><b>Auditoría de cambios</b> — desglose de muletillas, repeticiones y tildes corregidas.</sub></td>
    <td width="50%" valign="top"><img src="docs/assets/capturas/app-android-movil.png" alt="Aplicación Android nativa en Kotlin con Jetpack Compose" /><br /><sub><b>App Android nativa</b> — interfaz Compose con subida resiliente en segundo plano.</sub></td>
  </tr>
</table>

<p align="center">
  <img src="docs/assets/actas-digitales-movil.png" width="100%" alt="Actas Digitales en el móvil: Web PWA instalable y Android nativo con Jetpack Compose" />
  <br /><sub>Actas Digitales en movilidad: Web PWA instalable y app Android nativa con WorkManager.</sub>
</p>

▶️ **Vídeo:** [presentación oficial de 3 min (1080p60, narración en español y subtítulos)](docs/PROPUESTA_VIDEO_PROMOCIONAL.md) · [reproductor interactivo en la app Web](web/) · [manual imprimible de usuario](docs/MANUAL_USUARIO.html)

---

## 🔒 Seguridad HTTPS y Certificados

La confidencialidad de las deliberaciones de reuniones es primordial. Actas Digitales incorpora una arquitectura de seguridad robusta:

- **Cifrado en tránsito obligatorio:** Conexiones bajo **HTTPS / TLS 1.3** con cifrados modernos autenticados (AEAD).
- **Generador de certificados con CA propia:** Herramienta automatizada (`tools/generar_certificados_https.py`) que emite certificados X.509 v3 con extensiones SAN para `localhost`, `127.0.0.1`, `0.0.0.0` y `actasdigitales.local`.
- **Cabeceras de protección:**
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` (HSTS).
  - `X-Frame-Options: DENY` (anti-clickjacking).
  - `X-Content-Type-Options: nosniff` (anti-MIME sniffing).
  - `Content-Security-Policy (CSP)` y `Permissions-Policy: microphone=(self)`.
- **Mitigación DoS y Rate Limiting:** Middleware en FastAPI que restringe ráfagas de peticiones por dirección IP.
- **Android Network Security Config:** El cliente móvil confía tanto en las CAs del sistema como en certificados corporativos instalados por el usuario (`network_security_config.xml`).
- **Privacidad absoluta:** Modo 100% autoalojado donde el audio y el texto nunca abandonan la red del cliente.

Guía completa de despliegue y certificados: [docs/INSTALACION_HTTPS.md](docs/INSTALACION_HTTPS.md). Política de reporte: [SECURITY.md](SECURITY.md).

---

## 🚀 Inicio Rápido

### 1. Requisitos Previos
- Python 3.10 o superior.
- Node.js 18+ (para compilar la aplicación Web).
- Android Studio Iguana o posterior (para compilar la app Android).

### 2. Generar Certificados e Iniciar Servidor HTTPS

```bash
# 1. Clonar el repositorio
git clone https://github.com/yhquintero/Actas_Digitales.git
cd Actas_Digitales

# 2. Instalar dependencias del servidor
cd backend
pip install -r requirements.txt
pip install cryptography httpx

# 3. Generar certificados TLS firmados (si es la primera vez)
cd ..
python3 tools/generar_certificados_https.py

# 4. Iniciar servidor seguro HTTPS en el puerto 8443
python3 tools/iniciar_https.py
```

* Interfaz Web y API disponibles en: `https://localhost:8443`
* Documentación interactiva Swagger: `https://localhost:8443/docs`

### 3. Desarrollo de la Aplicación Web

```bash
cd web
npm install
npm run dev
```

* Servidor de desarrollo Vite en `http://localhost:5173` con proxy automático a la API backend.
* Compilación para producción: `npm run build` (genera los activos estáticos en `web/dist`).

### 4. Ejecución de la Aplicación Android

1. Abre **Android Studio** y selecciona la carpeta `/android`.
2. Conecta tu teléfono o inicia el emulador oficial de Android.
3. El cliente viene configurado por defecto con `http://10.0.2.2:8000/` (emulador) o ajusta `RetrofitClient.baseUrl` con la IP local de tu servidor.
4. Pulsa **Run ▶**.

### 5. Despliegue con Docker Compose (Producción)

```bash
docker-compose up --build -d
```

---

## ✅ Calidad y Pruebas

La integración continua ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) ejecuta la suite de pruebas unitarias, validación de certificados TLS y compilación en cada push.

Para ejecutar las mismas pruebas localmente desde la raíz del repositorio:

```bash
# 1. Pruebas de certificados TLS, SAN y cabeceras de seguridad HTTPS
python3 tools/test_seguridad_https.py

# 2. Pruebas del pipeline de consolidación, desduplicación y ortografía en español
python3 tools/test_pipeline.py

# 3. Suite de Pruebas de Fuego, Fuzzing y Estándares OWASP Top 10
python3 tools/test_pruebas_de_fuego.py

# 4. Verificación de compilación y tipado estricto de la Web
cd web && npm run build && cd ..
```

---

## 📁 Estructura del Proyecto

```text
Actas_Digitales/
├── brand/                    # Logotipos vectoriales e ilustraciones hero
├── certs/                    # Certificados TLS firmados (ca.crt, server.crt, fullchain.pem)
├── deploy/                   # Configuraciones de producción para NGINX y Caddy (HTTPS)
├── docs/                     # Manuales, guías legales, capturas y guion de video
│   ├── assets/               # Gráficos del manual y sitio web
│   ├── readme/               # Traducciones del README (English)
│   ├── MANUAL_USUARIO.md     # Manual completo paso a paso
│   ├── MANUAL_USUARIO.html   # Versión imprimible del manual de usuario
│   ├── GUIA_RAPIDA.md        # Guía condensada de 2 páginas para reuniones
│   ├── INSTALACION_HTTPS.md  # Manual de instalación y certificados TLS
│   ├── PROPUESTA_VIDEO_PROMOCIONAL.md # Guion técnico del video de 3 minutos
│   └── index.html            # Sitio estático para GitHub Pages
├── backend/                  # Servidor API FastAPI en Python 3.11
│   ├── app/
│   │   ├── config.py         # Configuración y variables de entorno
│   │   ├── main.py           # Aplicación FastAPI, CORS y middleware de seguridad
│   │   ├── middlewares/      # SecurityMiddleware (HSTS, CSP, Rate Limiting)
│   │   ├── models/           # Esquemas Pydantic y estados de procesamiento
│   │   ├── routers/          # Endpoints de audio, streaming SSE y actas oficiales
│   │   └── services/         # STT, VAD, Consolidación y Corrección Ortotipográfica
│   ├── requirements.txt
│   └── Dockerfile
├── web/                      # Aplicación Web React 18 + TypeScript + Vite + Tailwind
│   ├── src/
│   │   ├── components/       # Uploader, Grabador mic, Visualizador, Modal Video 3 min
│   │   ├── types/            # Contratos e interfaces TypeScript
│   │   └── App.tsx           # Orquestador del frontend
│   ├── package.json
│   └── Dockerfile
├── android/                  # Aplicación Android Nativa en Kotlin (Jetpack Compose)
│   ├── app/src/main/
│   │   ├── AndroidManifest.xml # Permisos y configuración de red segura
│   │   ├── res/xml/          # network_security_config.xml para CAs
│   │   └── java/com/actasdigitales/app/
│   │       ├── audio/        # AudioRecorderManager (MediaRecorder 16 kHz AAC)
│   │       ├── data/         # Retrofit API, Repositorio y Modelos
│   │       ├── ui/           # Pantallas Compose (HomeScreen), Tema y ViewModel
│   │       └── workers/      # AudioUploadWorker (WorkManager en segundo plano)
│   └── build.gradle.kts
├── tools/                    # Generador de certificados, lanzadores y pruebas automatizadas
│   ├── generar_certificados_https.py
│   ├── iniciar_https.py
│   ├── test_seguridad_https.py
│   └── test_pipeline.py
├── docker-compose.yml        # Orquestación con NGINX y FastAPI
├── CHANGELOG.md              # Registro de versiones y cambios
├── SECURITY.md               # Política de reporte de vulnerabilidades
└── LICENSE                   # Licencia de software propietario
```

---

## 📚 Documentación

| Documento | Contenido |
|---|---|
| [**Manual de Usuario**](docs/MANUAL_USUARIO.md) · [versión imprimible](docs/MANUAL_USUARIO.html) | Manual completo paso a paso: navegación HTTPS, grabación, subida, pipeline de 5 fases, estructuración de acta RAE, Android, solución de problemas y lista de verificación |
| [Guía rápida (2 páginas)](docs/GUIA_RAPIDA.md) | Resumen condensado de preparación, grabación y formalización de actas en una sola hoja |
| [Instalación y Despliegue HTTPS](docs/INSTALACION_HTTPS.md) | Configuración de certificados TLS firmados con SAN, NGINX, Caddy, Docker y confianza en Android |
| [Vídeo promocional (3 min)](docs/PROPUESTA_VIDEO_PROMOCIONAL.md) | Guion técnico detallado minuto a minuto con escenas, efectos, locución en español y especificaciones de postproducción |
| [Sitio de presentación](docs/index.html) | Página de producto estática autocontenida, lista para publicar en GitHub Pages desde la carpeta `docs/` |
| [Política de Seguridad](SECURITY.md) | Estándares criptográficos TLS 1.3, mitigación DoS y reporte responsable de vulnerabilidades |
| [Registro de Cambios](CHANGELOG.md) | Novedades, mejoras y correcciones de cada versión (Web, Backend y Android) |

**Traducciones del README:** [English](docs/readme/README_en.md). La versión en español es la de referencia oficial.

---

## ❓ Preguntas frecuentes

<details>
<summary><b>¿Cómo solucionar el error de descarga en GitHub Desktop («curl 56 Recv failure» / «early EOF»)?</b></summary>

<br />

Este error ocurre cuando la conexión de red local sufre un microcorte o el búfer HTTP de Git en tu equipo tiene el tamaño mínimo por defecto (1 MB). Para resolverlo al instante en tu equipo, abre la terminal o PowerShell y amplía el búfer de Git:

```bash
git config --global http.postBuffer 524288000
git config --global http.maxRequestBuffer 100M
git config --global core.compression 0
```

Alternativamente, si deseas clonar de inmediato sin descargar el historial completo de commits anteriores, ejecuta una clonación superficial (*shallow clone*):

```bash
git clone --depth 1 https://github.com/yhquintero/Actas_Digitales.git
```

</details>

<details>
<summary><b>¿Funciona sin conexión a internet externa?</b></summary>

<br />

Sí, de forma absoluta. El servidor puede ejecutarse en una máquina local o en la red Wi-Fi de tu oficina. La aplicación Web se comunica directamente con el servidor de la red local mediante HTTPS y el motor lingüístico de consolidación y corrección opera localmente con reglas fonéticas en español sin enviar ningún dato a servidores externos.

</details>

<details>
<summary><b>¿Por qué es obligatorio el protocolo HTTPS?</b></summary>

<br />

Los navegadores web modernos (Chrome, Firefox, Safari y Edge) y los sistemas operativos móviles bloquean de forma estricta el acceso al micrófono del usuario (`navigator.mediaDevices.getUserMedia`) si el sitio se sirve mediante HTTP inseguro. HTTPS garantiza además que los archivos de audio de reuniones confidenciales viajen cifrados de extremo a extremo con TLS 1.3.

</details>

<details>
<summary><b>¿Cómo se eliminan los tartamudeos y muletillas?</b></summary>

<br />

A diferencia de un transcriptor genérico que copia literalmente los defectos orales, Actas Digitales cuenta con un módulo de consolidación lingüística (`consolidation_service.py`) que detecta patrones fonéticos de vacilación (*"bueno pues este..."*, *"ehhh"*, *"o sea"*), suprime tartamudeos con guion (*"yo-yo"*, *"de-de-de verdad"*) y desduplica palabras repetidas consecutivamente (*"vamos a a a revisar"*) sin alterar el significado semántico de la intervención.

</details>

<details>
<summary><b>¿Cómo se corrigen las faltas de ortografía y signos ¿ ¡?</b></summary>

<br />

El módulo de corrección ortotipográfica (`correction_service.py`) inspecciona el texto consolidado y aplica las normas de la Real Academia Española (RAE): coloca tildes diacríticas y en palabras frecuentes de actas (*sesión, reunión, día, conclusión, artículo, próximo*), asegura la concordancia de oraciones largas e inyecta los signos de apertura reglamentarios (`¿` y `¡`) que los transcriptores convencionales omiten.

</details>

<details>
<summary><b>¿Qué pasa si se corta la conexión mientras subo un audio en Android?</b></summary>

<br />

La aplicación Android nativa está construida con **Android Jetpack WorkManager** y Retrofit. La tarea de subida se ejecuta en segundo plano con restricciones del sistema: si se pierde la conexión celular o Wi-Fi, la transferencia queda en pausa y se reanuda de forma automática en cuanto se restablece la conectividad, sin perder el archivo grabado.

</details>

<details>
<summary><b>¿Puedo utilizar modelos en la nube como OpenAI Whisper o Groq?</b></summary>

<br />

Sí. Por defecto el sistema funciona con el motor autónomo integrado. Si deseas conectar modelos cloud, basta con configurar las variables `OPENAI_API_KEY` o `GROQ_API_KEY` en el archivo `.env` del servidor o ingresar la clave temporal directamente en la interfaz web desde el botón **Configurar API Key**.

</details>

---

## 📄 Licencia

**Software propietario — todos los derechos reservados.** © 2026 yhquintero.

Ver el código fuente en GitHub no concede ningún derecho de uso, copia, modificación o distribución comercial ni privada. Instalar Actas Digitales en una organización, comité o negocio requiere una licencia de uso autorizada por el titular. Condiciones completas en [LICENSE](LICENSE).

---

<div align="center">

<sub><b>Actas Digitales</b> · Captura. Transcribe. Consolida. Formaliza. · © 2026 yhquintero · <a href="#">Volver arriba ⬆</a></sub>

</div>
