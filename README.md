# Actas Digitales - Solución Full-Stack de Voz a Texto Corregido

Sistema completo de procesamiento de audio a texto para actas de reuniones y documentos oficiales en español, que cubre tres plataformas: **Servidor Backend (FastAPI)**, **Aplicación Web (React + TypeScript)** y **Aplicación Android Nativa (Kotlin + Jetpack Compose)**.

---

## 🏗 Arquitectura y Componentes del Sistema

```text
Actas_Digitales/
├── backend/                  # Servidor FastAPI (Python 3.11)
│   ├── app/
│   │   ├── config.py         # Configuración del servidor y variables de entorno
│   │   ├── main.py           # Entrada FastAPI, middlewares CORS y archivos estáticos
│   │   ├── models/           # Esquemas Pydantic y estados de procesamiento
│   │   ├── routers/          # Endpoints de subida, consulta, streaming SSE
│   │   └── services/         # Audio, STT, Consolidación y Corrección Ortotipográfica
│   ├── requirements.txt
│   └── Dockerfile
│
├── web/                      # Aplicación Web (React 18 + TypeScript + Vite + Tailwind)
│   ├── src/
│   │   ├── components/       # Grabador de micrófono, Uploader, Pipeline, Visualizador
│   │   ├── types/            # Tipos de datos e interfaces
│   │   └── App.tsx           # Orquestación de interfaz de usuario
│   ├── package.json
│   └── Dockerfile
│
├── android/                  # Aplicación Nativa Android (Kotlin + Jetpack Compose)
│   ├── app/src/main/
│   │   ├── AndroidManifest.xml
│   │   └── java/com/actasdigitales/app/
│   │       ├── audio/        # AudioRecorderManager (MediaRecorder nativo)
│   │       ├── data/         # Retrofit API, Repositorio y Modelos
│   │       ├── ui/           # Pantallas Compose (HomeScreen), Tema y ViewModel
│   │       └── workers/      # AudioUploadWorker (WorkManager para subidas en background)
│   ├── build.gradle.kts
│   └── README.md
│
└── docker-compose.yml        # Despliegue orquestado con un solo comando
```

---

## ⚡ Flujo de Procesamiento de Extremo a Extremo

1. **Ingesta:** El usuario sube un archivo (.mp3, .wav, .m4a, .ogg, .webm) o graba audio en vivo desde la Web o Android.
2. **Preprocesamiento:** Inspección de cabeceras, cálculo de duración, normalización de audio y Voice Activity Detection (VAD).
3. **Transcripción Fonética (STT):** Extracción de texto con marcas de tiempo forzando el idioma español (`language="es"`).
4. **Consolidación y Desduplicación:** Algoritmo que une fragmentos solapados, suprime tartamudeos ("de-de-de verdad" → "de verdad") y elimina muletillas orales ("bueno pues este...", "o sea").
5. **Corrección Ortotipográfica y Gramatical:** Corrección de tildes diacríticas, concordancia gramatical, mayúsculas iniciales y signos de apertura reglamentarios en español (`¿` y `¡`).
6. **Entrega:** Actualización en tiempo real vía Server-Sent Events (SSE) o polling hacia la Web y Android, permitiendo copiar o exportar a `.txt` y `.md`.

---

## 🚀 Puesta en Marcha Rápida

### 1. Iniciar el Backend (Servidor)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

* El servidor API estará disponible en `http://localhost:8000`.
* Documentación interactiva Swagger en `http://localhost:8000/docs`.

### 2. Iniciar la Aplicación Web (Frontend)

```bash
cd web
npm install
npm run dev
```

* Interfaz web disponible en `http://localhost:5173` (con proxy automático a `/api` del backend).
* También puedes compilar con `npm run build` y el propio servidor FastAPI servirá la aplicación web completa en `http://localhost:8000`.

### 3. Ejecutar la Aplicación Android

1. Abre Android Studio y selecciona la carpeta `/android`.
2. Conecta un dispositivo físico o inicia un emulador de Android.
3. La aplicación está preconfigurada para comunicarse con el servidor local a través de `http://10.0.2.2:8000/` (o configura tu IP de red local en `RetrofitClient.kt`).
4. Pulsa **Run ▶**.

### 4. Despliegue con Docker Compose

```bash
docker-compose up --build
```

---

## 🔐 Configuración de Proveedores IA (Opcional)

Por defecto, el backend incluye un motor integrado de procesamiento y corrección de reglas en español que funciona sin necesidad de claves externas. Si deseas utilizar modelos en la nube (OpenAI Whisper / GPT-4o o Groq Whisper / Llama 3):

* Crea un archivo `.env` en `backend/` con:
  ```env
  OPENAI_API_KEY=sk-...
  # o bien:
  GROQ_API_KEY=gsk_...
  ```
* O introduce la clave directamente en la interfaz web desde el botón **Configurar API Key**.
