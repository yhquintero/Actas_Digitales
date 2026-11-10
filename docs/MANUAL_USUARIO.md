# Manual de Usuario · Actas Digitales

**Versión:** 1.1.0 · **Fecha:** Noviembre 2026 · **Clasificación:** Guía Oficial de Operación  
**Plataformas:** Web (PWA instalable), Android nativo (Kotlin) y Servidor Seguro (HTTPS / TLS 1.3)

---

## 📑 Índice de Contenidos

1. [Resumen del Sistema](#1-resumen-del-sistema)
2. [Requisitos Técnicos](#2-requisitos-técnicos)
3. [Guía de la Aplicación Web](#3-guía-de-la-aplicación-web)
   - 3.1. Acceso y navegación segura (HTTPS)
   - 3.2. Subida de archivos de audio
   - 3.3. Grabación directa con micrófono
   - 3.4. Seguimiento del pipeline en 5 etapas
   - 3.5. Visualización, comparativa y auditoría
   - 3.6. Estructuración en Acta Oficial RAE
   - 3.7. Exportación a TXT, Markdown e impresión PDF
4. [Guía de la Aplicación Android](#4-guía-de-la-aplicación-android)
   - 4.1. Instalación y permisos
   - 4.2. Conexión con el servidor
   - 4.3. Grabación y subida resiliente en segundo plano
   - 4.4. Consulta de resultados y compartir
5. [Criterios de Grabación y Calidad Fonética](#5-criterios-de-grabación-y-calidad-fonética)
6. [Solución de Problemas Frecuentes](#6-solución-de-problemas-frecuentes)
7. [Lista de Verificación (Checklist) para Reuniones](#7-lista-de-verificación-checklist-para-reuniones)

---

## 1. Resumen del Sistema

**Actas Digitales** es una plataforma integral diseñada para eliminar la transcripción manual de reuniones, asambleas, juntas de accionistas y comités técnicos. El sistema no solo extrae el texto del audio, sino que aplica un proceso lingüístico avanzado en español para:

- **Desduplicar cortes de audio** y unir solapamientos entre fragmentos.
- **Suprimir tartamudeos y repeticiones accidentales** (*"de-de-de verdad"* $\to$ *"de verdad"*, *"vamos a a a revisar"* $\to$ *"vamos a revisar"*).
- **Eliminar muletillas y vacilaciones orales** (*"bueno pues este..."*, *"o sea"*, *"ehhh"*).
- **Corregir la ortografía, tildes diacríticas y concordancia gramatical**.
- **Insertar los signos reglamentarios de apertura en español** (`¿` y `¡`).
- **Estructurar el documento final en un Acta Oficial** con orden del día, acuerdos adoptados y pie de firmas.

---

## 2. Requisitos Técnicos

### 2.1. Aplicación Web
- **Navegadores recomendados:** Google Chrome 100+, Mozilla Firefox 100+, Microsoft Edge 100+, Safari 16+.
- **Protocolo:** HTTPS con TLS 1.2 / TLS 1.3 mandatorio para habilitar el acceso al micrófono (`navigator.mediaDevices.getUserMedia`).
- **Formatos de audio admitidos:** `.mp3`, `.wav`, `.m4a`, `.ogg`, `.webm`, `.flac`, `.aac`.
- **Límite de tamaño sugerido:** Hasta **1 GB (1024 MB)** por archivo, con soporte para selección múltiple simultánea.

### 2.2. Aplicación Android
- **Sistema Operativo:** Android 8.0 (Oreo / API 26) o superior (probado en Android 14+).
- **Permisos requeridos:** `RECORD_AUDIO` (Micrófono) e `INTERNET` (Acceso a red HTTPS).
- **Almacenamiento:** Mínimo 50 MB de espacio libre para caché de audio.

### 2.3. Servidor
- **Plataformas:** Linux (Ubuntu/Debian/Alpine), macOS, Windows 10/11 con Python 3.10+ o contenedor Docker.

---

## 3. Guía de la Aplicación Web

### 3.1. Acceso y navegación segura (HTTPS)
1. Abre tu navegador e ingresa a la URL segura proporcionada por tu administrador (ejemplo: `https://localhost:8443` o `https://actasdigitales.local`).
2. Verifica el icono de candado en la barra de direcciones del navegador. Indica que la conexión está cifrada con TLS 1.3 y protegida mediante HSTS.
3. Si el servidor utiliza el certificado firmado por la CA local de la empresa, asegúrate de tener instalado el certificado raíz `ca.crt` en tu almacén de certificados de confianza.

### 3.2. Subida de archivos de audio
1. En la pestaña **Subir Archivo de Audio**, arrastra tu archivo al recuadro punteado o haz clic para abrir el explorador de archivos.
2. Comprueba que el nombre y tamaño del archivo coincidan.
3. Haz clic en el botón azul **Transcribir y Corregir**.

### 3.3. Grabación directa con micrófono
1. Selecciona la pestaña **Grabar desde Micrófono**.
2. La primera vez, el navegador solicitará permiso: pulsa **Permitir**.
3. Pulsa el botón circular del micrófono para iniciar la grabación. El contador de tiempo comenzará a avanzar.
4. Al terminar la intervención, pulsa el botón cuadrado rojo de detención.
5. Puedes reproducir la preescucha del audio para verificar la nitidez. Si estás conforme, pulsa **Procesar esta Grabación**.

### 3.4. Seguimiento del pipeline en 5 etapas
Apenas comienza el procesamiento, la barra de progreso y las tarjetas de estado informan en tiempo real:

1. **Ingesta y Subida:** Valida el archivo y encola la tarea en el servidor.
2. **Preproceso & VAD:** Normaliza el volumen sonoro y divide silencios con Voice Activity Detection.
3. **Transcripción STT:** Extrae el contenido fonético forzando el idioma español (`language="es"`).
4. **Consolidación:** Desduplica palabras, une fragmentos y elimina muletillas orales.
5. **Corrección Ortotipográfica:** Aplica tildes, mayúsculas, signos ¿ ¡ y concordancia.

### 3.5. Visualización, comparativa y auditoría
Una vez completado el trabajo, se presentan 4 pestañas de análisis:

- **Texto Corregido:** El texto limpio listo para lectura o envío.
- **Comparativa Antes / Después:** Pantalla dividida con el texto original en rojo tenue y el texto final consolidado en verde esmeralda.
- **Auditoría de Cambios:** Tabla detallada de cada corrección aplicada con etiqueta (*muletilla, repetición, ortografía, puntuación*) y su justificación lingüística.
- **Transcripción Cruda (STT):** Texto literal palabra por palabra junto con las marcas de tiempo de cada segmento de audio.

### 3.6. Estructuración en Acta Oficial RAE
Para convertir el texto en un documento legal formal:
1. Pulsa el botón verde **Acta Oficial RAE** en la barra superior del visualizador.
2. El sistema genera automáticamente el documento con:
   - Título formal de la sesión.
   - Fecha y lugar.
   - Lista de asistentes.
   - Orden del día.
   - Resumen de intervenciones.
   - Acuerdos adoptados numerados (`ACUERDO-01`, `ACUERDO-02`, etc.).
   - Sección de cierre formal con líneas de firma para Presidente y Secretario.

### 3.7. Exportación a TXT, Markdown e impresión PDF
- **Copiar:** Copia el texto al portapapeles del sistema operativo.
- **.TXT:** Descarga un archivo de texto plano UTF-8 compatible con cualquier editor.
- **.MD:** Descarga el documento en formato Markdown con estructura de encabezados.
- **PDF / Imprimir:** Abre el cuadro de diálogo de impresión del navegador con estilos optimizados para papel A4/Carta o guardado como PDF vectorial.

---

## 4. Guía de la Aplicación Android

### 4.1. Instalación y permisos
1. Instala el paquete APK en tu dispositivo móvil.
2. Al abrir la aplicación por primera vez, pulsa el botón del micrófono: Android solicitará el permiso `android.permission.RECORD_AUDIO`. Pulsa **Permitir**.

### 4.2. Conexión con el servidor
- En la configuración predeterminada para emuladores, la app se conecta a `http://10.0.2.2:8000/`.
- En dispositivos físicos, asegúrate de que el teléfono y el servidor compartan la misma red Wi-Fi e ingresa la dirección IP segura del servidor en la configuración de la app.

### 4.3. Grabación y subida resiliente en segundo plano
- Pulsa el botón grande de micrófono para grabar la reunión.
- Al pulsar **Detener**, la grabación se empaqueta en AAC a 16 kHz y se despacha a través de **Android WorkManager**.
- Si el teléfono se bloquea, se minimiza la app o la conexión Wi-Fi sufre cortes temporales, **WorkManager** reanudará automáticamente la subida en cuanto la red vuelva a estar disponible.

### 4.4. Consulta de resultados y compartir
- Al completarse el trabajo, la pantalla muestra el texto corregido junto a las estadísticas de palabras y muletillas eliminadas.
- Utiliza el botón **Copiar** para almacenar el acta en el portapapeles o el botón **Compartir** para enviarla directamente por correo electrónico, WhatsApp o aplicaciones de mensajería corporativa.

---

## 5. Criterios de Grabación y Calidad Fonética

Para obtener una precisión superior al 95%:
1. **Posición del micrófono:** Ubica el dispositivo en el centro de la mesa, a una distancia no mayor a 1.5 metros de los participantes principales.
2. **Evitar solapamientos:** Fomentar el uso de la palabra ordenado. Cuando dos personas hablan al mismo tiempo, el modelo fonético prioriza al hablante con mayor potencia acústica.
3. **Evitar eco ambiental:** Las salas con cortinas, alfombras o paneles acústicos producen transcripciones notablemente más limpias que los recintos con superficies de vidrio o azulejo.

---

## 6. Solución de Problemas Frecuentes

| Síntoma | Causa Probable | Solución Recomendada |
| :--- | :--- | :--- |
| **El navegador no permite activar el micrófono** | La página se abrió por HTTP inseguro | Accede obligatoriamente mediante `https://`. Los navegadores modernos bloquean el micrófono en páginas no seguras. |
| **Error 400: Formato no permitido** | El archivo tiene una extensión no soportada | Convierte el archivo a `.mp3`, `.wav` o `.m4a` antes de subirlo. |
| **Error 413: Archivo excede el tamaño máximo** | La grabación pesa más de 1 GB (1024 MB) | Sube grabaciones de hasta 1 GB por archivo o divídelas si superan dicho volumen. |
| **Aviso de certificado no seguro en el navegador (NET::ERR_CERT_AUTHORITY_INVALID)** | Certificado de CA local no registrado en Windows | Ejecuta el archivo `instalar-certificado-confianza.bat` o pulsa `[ 🔒 CONFIAR CA EN WINDOWS ]` en el Panel de Control para activar el candado verde en Chrome y Edge. |
| **La app Android indica error de conexión** | IP o puerto inaccesible en la red | Verifica que el firewall del servidor permita el puerto configurado (ej. 8000 u 8443) y que ambos equipos estén en la misma subred. |

---

## 7. Lista de Verificación (Checklist) para Reuniones

- [ ] **Antes de la reunión:**
  - [ ] Servidor iniciado con HTTPS activo.
  - [ ] Dispositivo de grabación con batería superior al 50%.
  - [ ] Prueba de audio de 5 segundos grabada y verificada.
- [ ] **Durante la reunión:**
  - [ ] Micrófono colocado sin obstrucciones físicas (lejos de ventiladores o proyectores).
  - [ ] Los participantes mencionan su nombre al iniciar intervenciones clave.
- [ ] **Al finalizar la reunión:**
  - [ ] Detener la grabación y verificar la subida al servidor.
  - [ ] Revisar el texto en la pestaña *Comparativa Antes / Después*.
  - [ ] Generar el *Acta Oficial RAE* y exportar a PDF o Markdown para recabar las firmas.
