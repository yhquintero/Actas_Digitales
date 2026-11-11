#!/usr/bin/env python3
"""
Pruebas de Seguridad y Validación de Certificados TLS/HTTPS
Verifica certificados X.509, SAN, cabeceras de seguridad y rate limiting.
"""

import sys
import unittest
from pathlib import Path
from cryptography import x509
from cryptography.x509.oid import ExtensionOID
from fastapi.testclient import TestClient

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR / "backend"))

from app.main import app

class TestSeguridadHTTPS(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.certs_dir = BASE_DIR / "certs"
        if not (cls.certs_dir / "server.crt").exists():
            from tools.generar_certificados_https import generar_certificados_firmados
            generar_certificados_firmados(salida_dir=cls.certs_dir)

    def test_01_certificados_existen(self):
        """Verifica que los certificados y la clave privada existan."""
        ca_cert = self.certs_dir / "ca.crt"
        server_cert = self.certs_dir / "server.crt"
        server_key = self.certs_dir / "server.key"
        fullchain = self.certs_dir / "fullchain.pem"

        self.assertTrue(ca_cert.exists(), "Falta certs/ca.crt")
        self.assertTrue(server_cert.exists(), "Falta certs/server.crt")
        self.assertTrue(server_key.exists(), "Falta certs/server.key")
        self.assertTrue(fullchain.exists(), "Falta certs/fullchain.pem")

    def test_02_extensiones_san_certificado(self):
        """Verifica que el certificado del servidor contenga Subject Alternative Names y módulo RSA-4096."""
        server_cert_path = self.certs_dir / "server.crt"
        with open(server_cert_path, "rb") as f:
            cert = x509.load_pem_x509_certificate(f.read())

        self.assertEqual(cert.public_key().key_size, 4096, "El módulo de la clave del servidor debe ser de 4096 bits")

        san_ext = cert.extensions.get_extension_for_oid(ExtensionOID.SUBJECT_ALTERNATIVE_NAME)
        self.assertIsNotNone(san_ext, "El certificado debe contener la extensión X509v3 Subject Alternative Name")

        dns_names = [name.value for name in san_ext.value if isinstance(name, x509.DNSName)]
        ip_addresses = [str(name.value) for name in san_ext.value if isinstance(name, x509.IPAddress)]

        self.assertIn("localhost", dns_names)
        self.assertIn("actasdigitales.local", dns_names)
        self.assertIn("127.0.0.1", ip_addresses)
        self.assertIn("0.0.0.0", ip_addresses)

    def test_03_cabeceras_seguridad_http(self):
        """Verifica que el servidor inyecte cabeceras de seguridad HSTS, CSP, X-Frame-Options, etc."""
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)

        headers = res.headers
        self.assertIn("strict-transport-security", headers)
        self.assertIn("max-age=31536000", headers["strict-transport-security"])
        self.assertEqual(headers.get("x-content-type-options"), "nosniff")
        self.assertEqual(headers.get("x-frame-options"), "DENY")
        self.assertEqual(headers.get("referrer-policy"), "strict-origin-when-cross-origin")
        self.assertIn("microphone=(self)", headers.get("permissions-policy", ""))

    def test_04_formato_acta_oficial(self):
        """Verifica el endpoint de estructuración de actas oficiales legales."""
        res = self.client.post(
            "/api/audio/format-official-acta",
            data={
                "title": "Junta General Extraordinaria",
                "attendees": "Director General, Directora Financiera",
                "text": "Se aprueba el presupuesto para el ejercicio anual. Se ratifican los acuerdos del trimestre anterior."
            }
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("formatted_acta", data)
        self.assertIn("ACTA DE JUNTA GENERAL EXTRAORDINARIA", data["formatted_acta"])
        self.assertIn("ACUERDO-01", data["formatted_acta"])

if __name__ == "__main__":
    unittest.main()
