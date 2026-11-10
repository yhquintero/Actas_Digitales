import time
from collections import defaultdict
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

class SecurityMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests_per_minute: int = 120):
        super().__init__(app)
        self.max_requests_per_minute = max_requests_per_minute
        self.request_counts = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()

        # 1. Rate Limiting en memoria por IP
        # Limpiar registros más antiguos de 60 segundos
        self.request_counts[client_ip] = [
            ts for ts in self.request_counts[client_ip] if now - ts < 60
        ]

        if len(self.request_counts[client_ip]) >= self.max_requests_per_minute:
            return Response(
                content='{"detail": "Demasiadas peticiones. Límite de tasa excedido."}',
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                media_type="application/json"
            )

        self.request_counts[client_ip].append(now)

        # 2. Ejecutar la petición
        response = await call_next(request)

        # 3. Inyectar Cabeceras de Seguridad Estrictas
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "microphone=(self), camera=(), geolocation=()"

        return response
