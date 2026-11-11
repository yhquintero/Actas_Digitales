import { SecurityFeature } from '../types';

export const SECURITY_FEATURES: SecurityFeature[] = [
  {
    id: 'tls13',
    category: 'Cifrado & Transporte',
    title: 'Cifrado de Extremo a Extremo TLS 1.3',
    status: 'Activo',
    description:
      'Túnel HTTPS seguro con suites de cifrado de última generación (ECDHE-ECDSA / AES-GCM 256 bits). Candado verde verificado en Chrome, Edge y navegadores corporativos.',
    impact: 'Inmunidad ante escuchas clandestinas (Eavesdropping) e interceptación en redes locales.',
    technicalDetails: 'Certificados SAN con clave RSA-4096 bits (módulo ampliado de 2048 a 4096 bits para CA y servidor) y registro automático en Windows CurrentUser\\Root.'
  },
  {
    id: 'sha256-custodia',
    category: 'Integridad & Custodia',
    title: 'Cadena de Custodia Criptográfica (SHA-256)',
    status: 'Activo',
    description:
      'Cada pista de audio y cada documento formal generado se firman con un resumen criptográfico SHA-256 inmutable asociado al timestamp UTC del servidor.',
    impact: 'Garantía fehaciente de no repudio e integridad documental ante auditorías y litigios.',
    technicalDetails: 'Hash SHA-256 integrado en metadatos del acta oficial, exportación DOCX y registros de base de datos.'
  },
  {
    id: 'soberano-onprem',
    category: 'Privacidad & Soberanía',
    title: 'Modo Soberano 100% On-Premise (Air-Gapped)',
    status: 'Activo',
    description:
      'Capacidad de operar completamente sin conexión a internet ni dependencia de nubes externas. Ni un solo byte de audio o texto sale del perímetro corporativo.',
    impact: 'Protección absoluta del secreto empresarial, deliberaciones de comités y juntas de gobierno.',
    technicalDetails: 'Motores locales de audio (PyAV, imageio-ffmpeg) y modelos offline de lenguaje sin telemetría.'
  },
  {
    id: 'headers-defense',
    category: 'Defensa en Profundidad',
    title: 'Cabeceras de Blindaje Web (CSP, HSTS, X-Frame)',
    status: 'Activo',
    description:
      'Políticas estrictas de seguridad HTTP: Content-Security-Policy estricta, HSTS con max-age=63072000 (2 años), X-Frame-Options: DENY y prevención de sniffing MIME.',
    impact: 'Prevención proactiva de inyecciones XSS, Clickjacking, MIME confusion y ataques man-in-the-middle.',
    technicalDetails: 'Inyectadas dinámicamente por el middleware de seguridad de FastAPI y Nginx reverse proxy.'
  },
  {
    id: 'rate-limit-dos',
    category: 'Defensa en Profundidad',
    title: 'Limitador de Tasa Anti-Saturación (Rate Limiting)',
    status: 'Activo',
    description:
      'Umbral estricto de 180 peticiones por minuto por cliente IP con mitigación de DoS y cuotas máximas de subida (1 GB) validadas antes de la escritura en disco.',
    impact: 'Estabilidad garantizada del servidor y protección contra denegación de servicio por subidas masivas.',
    technicalDetails: 'Implementado en SecurityMiddleware con ventana móvil de tokens y limpieza automática de memoria.'
  },
  {
    id: 'sanitizacion-xss',
    category: 'Integridad & Custodia',
    title: 'Sanitización Estricta de Salida Ortotipográfica',
    status: 'Activo',
    description:
      'Todo texto consolidado y corregido pasa por filtros de escape de entidades HTML y delimitadores Markdown para impedir inyección de scripts o macros en DOCX.',
    impact: 'Seguridad al previsualizar e imprimir actas con contenido procedente de oradores no autenticados.',
    technicalDetails: 'Normalización de caracteres Unicode UTF-8 y exclusión de secuencias de escape ANSI / scripts.'
  }
];

export const SECURITY_RECOMMENDATIONS = [
  {
    title: 'Rotación Periódica de Certificados CA',
    recommendation: 'Programar la renovación anual de ca.crt y server.crt utilizando el script "tools/generar_certificados_https.py" para mantener suites criptográficas actualizadas.'
  },
  {
    title: 'Autenticación Mutua mTLS para Entornos Gubernamentales',
    recommendation: 'Activar autenticación con certificado de cliente (mTLS) en el puerto 8443 para que únicamente dispositivos con certificado de empleado público puedan emitir actas.'
  },
  {
    title: 'Firmado Digital con Certificado FNMT / eIDAS',
    recommendation: 'Integrar la firma electrónica avanzada (XAdES / PAdES) del PDF resultante utilizando el DNI electrónico o certificado de representante legal para validez jurídica plena.'
  },
  {
    title: 'Almacenamiento Cifrado en Reposo (BitLocker / LUKS)',
    recommendation: 'Asegurar que el directorio "backend/uploads" resida en una partición con cifrado de disco completo para proteger las grabaciones ante robo físico del servidor.'
  }
];
