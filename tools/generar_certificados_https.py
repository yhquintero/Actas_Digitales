#!/usr/bin/env python3
"""
Herramienta de generación de certificados TLS/HTTPS firmados para Actas Digitales.
Genera una Autoridad Certificadora (CA) local y un certificado de servidor X.509 v3
con extensiones SAN (Subject Alternative Name) para localhost, 127.0.0.1, 0.0.0.0 y dominios locales.
"""

import os
import sys
import datetime
import ipaddress
from pathlib import Path

from cryptography import x509
from cryptography.x509.oid import NameOID, ExtendedKeyUsageOID
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

CERTS_DIR = Path(__file__).resolve().parent.parent / "certs"

def generar_certificados_firmados(
    dias_validez: int = 825,
    common_name: str = "localhost",
    salida_dir: Path = CERTS_DIR
):
    salida_dir.mkdir(parents=True, exist_ok=True)
    ca_key_path = salida_dir / "ca.key"
    ca_cert_path = salida_dir / "ca.crt"
    server_key_path = salida_dir / "server.key"
    server_cert_path = salida_dir / "server.crt"
    fullchain_path = salida_dir / "fullchain.pem"

    print(f"[1/4] Generando clave privada RSA-4096 para Autoridad Certificadora (CA)...")
    ca_private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=4096
    )

    ca_subject = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, "ES"),
        x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "Madrid"),
        x509.NameAttribute(NameOID.LOCALITY_NAME, "Madrid"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Actas Digitales Security Authority"),
        x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, "Root CA"),
        x509.NameAttribute(NameOID.COMMON_NAME, "Actas Digitales Root CA"),
    ])

    ahora = datetime.datetime.now(datetime.timezone.utc)
    vencimiento_ca = ahora + datetime.timedelta(days=3650)

    print(f"[2/4] Creando certificado raíz autofirmado de la CA...")
    ca_cert = (
        x509.CertificateBuilder()
        .subject_name(ca_subject)
        .issuer_name(ca_subject)
        .public_key(ca_private_key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(ahora - datetime.timedelta(hours=1))
        .not_valid_after(vencimiento_ca)
        .add_extension(
            x509.BasicConstraints(ca=True, path_length=None),
            critical=True
        )
        .add_extension(
            x509.KeyUsage(
                digital_signature=True,
                key_encipherment=False,
                key_cert_sign=True,
                crl_sign=True,
                content_commitment=False,
                data_encipherment=False,
                key_agreement=False,
                encipher_only=False,
                decipher_only=False
            ),
            critical=True
        )
        .add_extension(
            x509.SubjectKeyIdentifier.from_public_key(ca_private_key.public_key()),
            critical=False
        )
        .sign(ca_private_key, hashes.SHA256())
    )

    print(f"[3/4] Generando clave y certificado del servidor firmado por la CA...")
    server_private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048
    )

    server_subject = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, "ES"),
        x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "Madrid"),
        x509.NameAttribute(NameOID.LOCALITY_NAME, "Madrid"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Actas Digitales"),
        x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, "Seguridad HTTPS"),
        x509.NameAttribute(NameOID.COMMON_NAME, common_name),
    ])

    vencimiento_servidor = ahora + datetime.timedelta(days=dias_validez)

    # Nombres Alternativos del Sujeto (SAN) obligatorios para TLS 1.3
    san_list = [
        x509.DNSName("localhost"),
        x509.DNSName("actasdigitales.local"),
        x509.DNSName("*.actasdigitales.local"),
        x509.IPAddress(ipaddress.IPv4Address("127.0.0.1")),
        x509.IPAddress(ipaddress.IPv4Address("0.0.0.0")),
    ]

    server_cert = (
        x509.CertificateBuilder()
        .subject_name(server_subject)
        .issuer_name(ca_subject)
        .public_key(server_private_key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(ahora - datetime.timedelta(hours=1))
        .not_valid_after(vencimiento_servidor)
        .add_extension(
            x509.BasicConstraints(ca=False, path_length=None),
            critical=True
        )
        .add_extension(
            x509.KeyUsage(
                digital_signature=True,
                key_encipherment=True,
                key_cert_sign=False,
                crl_sign=False,
                content_commitment=False,
                data_encipherment=False,
                key_agreement=False,
                encipher_only=False,
                decipher_only=False
            ),
            critical=True
        )
        .add_extension(
            x509.ExtendedKeyUsage([
                ExtendedKeyUsageOID.SERVER_AUTH,
                ExtendedKeyUsageOID.CLIENT_AUTH
            ]),
            critical=False
        )
        .add_extension(
            x509.SubjectAlternativeName(san_list),
            critical=False
        )
        .add_extension(
            x509.AuthorityKeyIdentifier.from_issuer_public_key(ca_private_key.public_key()),
            critical=False
        )
        .add_extension(
            x509.SubjectKeyIdentifier.from_public_key(server_private_key.public_key()),
            critical=False
        )
        .sign(ca_private_key, hashes.SHA256())
    )

    print(f"[4/4] Guardando claves y certificados en formato PEM en: {salida_dir}")
    # Guardar CA
    with open(ca_key_path, "wb") as f:
        f.write(ca_private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption()
        ))
    with open(ca_cert_path, "wb") as f:
        f.write(ca_cert.public_bytes(serialization.Encoding.PEM))

    # Guardar Servidor
    server_key_pem = server_private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption()
    )
    server_cert_pem = server_cert.public_bytes(serialization.Encoding.PEM)
    ca_cert_pem = ca_cert.public_bytes(serialization.Encoding.PEM)

    with open(server_key_path, "wb") as f:
        f.write(server_key_pem)
    with open(server_cert_path, "wb") as f:
        f.write(server_cert_pem)

    # Fullchain = Certificado de Servidor + Certificado de CA
    with open(fullchain_path, "wb") as f:
        f.write(server_cert_pem)
        f.write(b"\n")
        f.write(ca_cert_pem)

    print(f"✓ Certificados HTTPS generados y firmados exitosamente:")
    print(f"  - CA Raíz:            {ca_cert_path}")
    print(f"  - Clave Servidor:     {server_key_path}")
    print(f"  - Certificado:        {server_cert_path}")
    print(f"  - Cadena Completa:    {fullchain_path}")
    print(f"  - SAN Configurados:   localhost, 127.0.0.1, 0.0.0.0, actasdigitales.local")
    return fullchain_path, server_key_path

if __name__ == "__main__":
    generar_certificados_firmados()
