import os
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response

from .config import settings
from .routers.audio_router import router as audio_router
from .routers.app_router import router as app_router
from .routers.acts_router import router as acts_router
from .middlewares.security_middleware import SecurityMiddleware
from .services.job_manager import job_manager
from .services.metrics import metrics

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicio del servidor
    yield
    # Apagado ordenado e inmediato: cancelar conexiones SSE y tareas pendientes
    job_manager.shutdown()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API seguro con TLS para procesamiento, transcripción, consolidación y corrección de audio a texto.",
    lifespan=lifespan
)

# Middleware de Seguridad y Cabeceras HTTPS
app.add_middleware(SecurityMiddleware, max_requests_per_minute=180)

# CORS estricto: orígenes explícitos y NUNCA '*' con credenciales (combinación inválida).
# Same-origin (Web servida por este mismo proceso) no necesita CORS. Por defecto
# solo se permiten orígenes locales de desarrollo; en producción define
# ACTAS_CORS_ORIGINS="https://tu-dominio.example,https://www.tu-dominio.example".
_cors_env = os.getenv("ACTAS_CORS_ORIGINS", "").strip()
if _cors_env:
    CORS_ORIGINS = [origin.strip() for origin in _cors_env.split(",") if origin.strip()]
else:
    CORS_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
_cors_allow_all = CORS_ORIGINS == ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=not _cors_allow_all,  # '*' exige credenciales desactivadas
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-API-Key"],
)

@app.middleware("http")
async def count_http_requests(request: Request, call_next):
    metrics.inc("http_requests_total")
    return await call_next(request)

# API Routers
app.include_router(audio_router, prefix=settings.API_PREFIX)
app.include_router(app_router, prefix=settings.API_PREFIX)
app.include_router(acts_router, prefix=settings.API_PREFIX)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "language": settings.DEFAULT_LANGUAGE
    }

@app.get("/api/metrics")
async def metrics_endpoint():
    """
    Métricas ligeras en memoria (contadores por proceso): peticiones HTTP,
    descargas del APK, actas sincronizadas desde la app móvil y trabajos en
    memoria. Sin dependencias externas; reinicia con el proceso.
    """
    return metrics.snapshot(version=settings.VERSION, jobs_total=len(job_manager._jobs))

# Neutralizador de Service Worker residual de Inventario / NovaGest u otras apps locales
KILLER_SW_JS = """// Actas Digitales - Neutralizador de Service Worker de Inventario / NovaGest
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => {
    self.registration.unregister().then(() => self.clients.matchAll()).then((clients) => {
        clients.forEach(c => c.navigate(c.url));
    });
    if ('caches' in self) {
        caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
    }
});
"""

@app.get("/sw.js")
@app.get("/service-worker.js")
@app.get("/registerSW.js")
async def kill_service_worker():
    return Response(
        content=KILLER_SW_JS,
        media_type="application/javascript",
        headers={
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Clear-Site-Data": '"cache", "storage"'
        }
    )

@app.get("/api/purge-cache")
@app.get("/limpiar-cache")
async def purge_cache_endpoint():
    html = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Actas Digitales - Cache Purgada</title>
<script>
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()));
}
if ('caches' in window) {
    caches.keys().then(names => names.forEach(n => caches.delete(n)));
}
setTimeout(() => { window.location.href = '/'; }, 1000);
</script>
<style>
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #38bdf8; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
.card { background: #1e293b; padding: 2.5rem; border-radius: 16px; text-align: center; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5); max-width: 480px; }
h2 { color: #818cf8; margin-bottom: 0.5rem; }
p { color: #94a3b8; font-size: 0.95rem; }
.spinner { width: 36px; height: 36px; border: 4px solid #334155; border-top: 4px solid #38bdf8; border-radius: 50%; animation: spin 1s linear infinite; margin: 1.5rem auto 0 auto; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
</head>
<body>
<div class="card">
  <h2>🧹 Cache y Service Workers Purgados</h2>
  <p>Se ha liberado la memoria del navegador de datos previos de Inventario / NovaGest.</p>
  <div class="spinner"></div>
  <p style="margin-top: 1rem; font-size: 0.85rem; color: #64748b;">Cargando Actas Digitales en 1 segundo...</p>
</div>
</body>
</html>"""
    return Response(
        content=html,
        media_type="text/html",
        headers={
            "Clear-Site-Data": '"cache", "storage", "executionContexts"',
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"
        }
    )

# Si existe la carpeta dist del frontend compilado, se sirve en la raíz
static_dist_path = Path(__file__).resolve().parent.parent.parent / "web" / "dist"
if static_dist_path.exists():
    app.mount("/assets", StaticFiles(directory=str(static_dist_path / "assets")), name="assets")
    audio_dist_path = static_dist_path / "audio"
    if audio_dist_path.exists():
        app.mount("/audio", StaticFiles(directory=str(audio_dist_path)), name="audio")

    @app.api_route("/{full_path:path}", methods=["GET", "HEAD"])
    async def serve_spa(full_path: str):
        # Rutas API no registradas deben responder 404 JSON, nunca el HTML del SPA
        if full_path.startswith("api/") or full_path == "api":
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Endpoint de API no encontrado")
        # Resolver y confinar dentro de web/dist (anti path-traversal)
        try:
            resolved = (static_dist_path / full_path).resolve(strict=False)
        except (OSError, ValueError):
            resolved = static_dist_path
        dist_root = static_dist_path.resolve()
        if resolved.is_file() and resolved.is_relative_to(dist_root):
            # Los assets de Vite llevan hash en el nombre: inmutables y cacheables
            if resolved.parent == dist_root / "assets":
                return FileResponse(
                    resolved,
                    headers={"Cache-Control": "public, max-age=31536000, immutable"},
                )
            return FileResponse(resolved)
        return FileResponse(
            static_dist_path / "index.html",
            headers={
                # index.html siempre fresco; NO se envía Clear-Site-Data aquí
                # (eso borraba localStorage — la API Key — en cada refresco).
                # La purga explícita vive en /limpiar-cache y /api/purge-cache.
                "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
                "Pragma": "no-cache",
                "Expires": "0",
            }
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
