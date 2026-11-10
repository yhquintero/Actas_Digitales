import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .config import settings
from .routers.audio_router import router as audio_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API para procesamiento, transcripción, consolidación y corrección de audio a texto."
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Router
app.include_router(audio_router, prefix=settings.API_PREFIX)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "language": settings.DEFAULT_LANGUAGE
    }

# Si existe la carpeta dist del frontend compilado, se sirve en la raíz
static_dist_path = Path(__file__).resolve().parent.parent.parent / "web" / "dist"
if static_dist_path.exists():
    app.mount("/assets", StaticFiles(directory=str(static_dist_path / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Servir index.html para soportar rutas del cliente (SPA)
        file_path = static_dist_path / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(static_dist_path / "index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
