#!/usr/bin/env python3
"""
Empaquetador de verificación del APK de Actas Digitales.

IMPORTANTE
==========
Este script NO compila el código Kotlin ni genera un APK instalable de la aplicación.
Construye un paquete de verificación mínimo (manifiesto binario + recursos + un
classes.dex reducido de las clases Application/Activity) firmado con RSA-4096, útil
solo para validar la cadena de firma, los recursos y el manifiesto en CI.

Un APK que ejecute realmente la interfaz Jetpack Compose, Room y la grabación de audio
debe compilarse con Gradle:  `cd android && ./gradlew assembleDebug`

El APK de verificación y el APK real se publican en rutas distintas para que nadie
instale por error un paquete que no abre la aplicación.
"""

import os
import sys
import shutil
import zipfile
import base64
import struct
import zlib
import hashlib
import datetime
from pathlib import Path
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.serialization import pkcs7

REPO_ROOT = Path(__file__).resolve().parent.parent
RES_DIR = REPO_ROOT / "android" / "app" / "src" / "main" / "res"
MANIFEST_FILE = REPO_ROOT / "android" / "app" / "src" / "main" / "AndroidManifest.xml"
# Paquete de verificación (NO instalable como aplicación funcional).
OUTPUT_APK = REPO_ROOT / "tools" / "verificacion" / "ActasDigitales-firma-verificacion.apk"
# Salida real de Gradle: ./gradlew assembleDebug
DEBUG_APK_DIR = REPO_ROOT / "android" / "app" / "build" / "outputs" / "apk" / "debug"
DEBUG_APK = DEBUG_APK_DIR / "app-debug.apk"

FRAMEWORK_JAR = Path("/tmp/android-framework.jar")
AAPT2_BIN = REPO_ROOT / "web" / "node_modules" / "bare-apk" / "prebuilds" / "linux-x64" / "aapt2"

def ensure_tools():
    if not FRAMEWORK_JAR.exists():
        apktool_jar = REPO_ROOT / "web" / "node_modules" / "apktool" / "dist" / "apktool.jar"
        if apktool_jar.exists():
            with zipfile.ZipFile(apktool_jar, 'r') as zf:
                zf.extract("brut/androlib/android-framework.jar", "/tmp")
            shutil.move("/tmp/brut/androlib/android-framework.jar", str(FRAMEWORK_JAR))
    
    if not AAPT2_BIN.exists() or not FRAMEWORK_JAR.exists():
        raise RuntimeError("aapt2 o android-framework.jar no disponibles.")

def uleb128(val):
    res = bytearray()
    while True:
        b = val & 0x7f
        val >>= 7
        if val > 0:
            res.append(b | 0x80)
        else:
            res.append(b)
            break
    return bytes(res)

def generate_dex():
    """Genera un archivo Dalvik classes.dex válido con MainActivity y ActasApplication."""
    strings = sorted([
        "<init>",
        "Landroid/app/Activity;",
        "Landroid/app/Application;",
        "Landroid/os/Bundle;",
        "Lcom/actasdigitales/app/ActasApplication;",
        "Lcom/actasdigitales/app/MainActivity;",
        "MainActivity.java",
        "V",
        "VL",
        "onCreate"
    ])

    type_strings = [
        "Landroid/app/Activity;",
        "Landroid/app/Application;",
        "Landroid/os/Bundle;",
        "Lcom/actasdigitales/app/ActasApplication;",
        "Lcom/actasdigitales/app/MainActivity;",
        "V"
    ]
    type_ids = [strings.index(s) for s in type_strings]

    header_size = 112
    string_ids_off = header_size
    type_ids_off = string_ids_off + len(strings) * 4
    proto_ids_off = type_ids_off + len(type_ids) * 4
    method_ids_off = proto_ids_off + 2 * 12
    # 6 method IDs:
    # 0: Activity.<init>()V
    # 1: Activity.onCreate(Bundle)V
    # 2: Application.<init>()V
    # 3: Application.onCreate()V
    # 4: MainActivity.<init>()V
    # 5: MainActivity.onCreate(Bundle)V
    class_defs_off = method_ids_off + 6 * 8
    # 2 class defs: ActasApplication, MainActivity (2 * 32 = 64 bytes)
    data_off = class_defs_off + 2 * 32

    while data_off % 4 != 0:
        data_off += 1

    data = bytearray()

    def add_data(chunk, align=1):
        nonlocal data
        while (data_off + len(data)) % align != 0:
            data.append(0)
        offset = data_off + len(data)
        data.extend(chunk)
        return offset

    # type_list for proto 1 parameters: [type 2 = Bundle]
    type_list_bundle = struct.pack("<I", 1) + struct.pack("<H", 2)
    proto_bundle_params_off = add_data(type_list_bundle, align=4)

    # Code items:
    # Code 0: init() -> invoke-direct {v0}, return-void
    code_init_insns = struct.pack("<HHH", 0x1070, 0, 0x000E)
    code_init = struct.pack("<HHHHII", 1, 1, 1, 0, 0, 3) + code_init_insns
    code_init_off = add_data(code_init, align=4)

    # Code 1: onCreate(Bundle) -> invoke-super {v0, v1}, return-void
    code_oncreate_bundle_insns = struct.pack("<HHHH", 0x206F, 1, 0x0010, 0x000E)
    code_oncreate_bundle = struct.pack("<HHHHII", 2, 2, 2, 0, 0, 4) + code_oncreate_bundle_insns
    code_oncreate_bundle_off = add_data(code_oncreate_bundle, align=4)

    # Code 2: app onCreate() -> invoke-super {v0}, return-void
    code_app_oncreate_insns = struct.pack("<HHH", 0x106F, 3, 0x000E)
    code_app_oncreate = struct.pack("<HHHHII", 1, 1, 1, 0, 0, 3) + code_app_oncreate_insns
    code_app_oncreate_off = add_data(code_app_oncreate, align=4)

    # class_data for ActasApplication
    # direct_methods: 1 (init -> method 2, diff 2)
    # virtual_methods: 1 (onCreate -> method 3, diff 3)
    cdata_app = (
        uleb128(0) + uleb128(0) + uleb128(1) + uleb128(1) +
        uleb128(2) + uleb128(0x10001) + uleb128(code_init_off) +
        uleb128(3) + uleb128(0x0001) + uleb128(code_app_oncreate_off)
    )
    cdata_app_off = add_data(cdata_app, align=1)

    # class_data for MainActivity
    # direct_methods: 1 (init -> method 4, diff 4)
    # virtual_methods: 1 (onCreate -> method 5, diff 5)
    cdata_main = (
        uleb128(0) + uleb128(0) + uleb128(1) + uleb128(1) +
        uleb128(4) + uleb128(0x10001) + uleb128(code_init_off) +
        uleb128(5) + uleb128(0x0001) + uleb128(code_oncreate_bundle_off)
    )
    cdata_main_off = add_data(cdata_main, align=1)

    # string_data_items
    string_data_offsets = []
    for s in strings:
        s_bytes = s.encode('utf-8')
        s_chunk = uleb128(len(s)) + s_bytes + b'\x00'
        s_off = add_data(s_chunk, align=1)
        string_data_offsets.append(s_off)

    while (data_off + len(data)) % 4 != 0:
        data.append(0)
    map_off = data_off + len(data)

    map_items = [
        (0x0000, 1, 0),
        (0x0001, len(strings), string_ids_off),
        (0x0002, len(type_ids), type_ids_off),
        (0x0003, 2, proto_ids_off),
        (0x0005, 6, method_ids_off),
        (0x0006, 2, class_defs_off),
        (0x1001, 1, proto_bundle_params_off),
        (0x2001, 3, code_init_off),
        (0x2000, 2, cdata_app_off),
        (0x2002, len(strings), string_data_offsets[0]),
        (0x1000, 11, map_off),
    ]
    map_items.sort(key=lambda x: x[2])
    map_chunk = struct.pack("<I", len(map_items))
    for mtype, msize, moff in map_items:
        map_chunk += struct.pack("<HHII", mtype, 0, msize, moff)
    data.extend(map_chunk)

    total_size = data_off + len(data)
    data_size = len(data)

    string_ids_bytes = b"".join(struct.pack("<I", off) for off in string_data_offsets)
    type_ids_bytes = b"".join(struct.pack("<I", off) for off in type_ids)

    # proto 0: ()V -> shorty 'V' (idx 7), ret 'V' (type 5), params 0
    # proto 1: (Bundle)V -> shorty 'VL' (idx 8), ret 'V' (type 5), params
    proto0_bytes = struct.pack("<III", strings.index("V"), 5, 0)
    proto1_bytes = struct.pack("<III", strings.index("VL"), 5, proto_bundle_params_off)
    proto_ids_bytes = proto0_bytes + proto1_bytes

    # method_ids:
    # 0: Activity.<init>()V (class 0, proto 0, name <init>)
    # 1: Activity.onCreate(Bundle)V (class 0, proto 1, name onCreate)
    # 2: Application.<init>()V (class 1, proto 0, name <init>)
    # 3: Application.onCreate()V (class 1, proto 0, name onCreate)
    # 4: MainActivity.<init>()V (class 4, proto 0, name <init>)
    # 5: MainActivity.onCreate(Bundle)V (class 4, proto 1, name onCreate)
    method_ids_bytes = (
        struct.pack("<HHI", 0, 0, strings.index("<init>")) +
        struct.pack("<HHI", 0, 1, strings.index("onCreate")) +
        struct.pack("<HHI", 1, 0, strings.index("<init>")) +
        struct.pack("<HHI", 1, 0, strings.index("onCreate")) +
        struct.pack("<HHI", 4, 0, strings.index("<init>")) +
        struct.pack("<HHI", 4, 1, strings.index("onCreate"))
    )

    # class_defs:
    # 1. ActasApplication (class_idx 3 = Lcom/actasdigitales/app/ActasApplication;, superclass 1 = Application)
    cdef_app = struct.pack(
        "<IIIIIIII",
        3, 0x0001, 1, 0, strings.index("MainActivity.java"), 0, cdata_app_off, 0
    )
    # 2. MainActivity (class_idx 4 = Lcom/actasdigitales/app/MainActivity;, superclass 0 = Activity)
    cdef_main = struct.pack(
        "<IIIIIIII",
        4, 0x0001, 0, 0, strings.index("MainActivity.java"), 0, cdata_main_off, 0
    )
    class_defs_bytes = cdef_app + cdef_main

    body = (
        string_ids_bytes +
        type_ids_bytes +
        proto_ids_bytes +
        method_ids_bytes +
        class_defs_bytes +
        bytes(data)
    )

    header = bytearray(112)
    header[0:8] = b"dex\n035\x00"
    struct.pack_into("<I", header, 40, 0x12345678)
    struct.pack_into("<I", header, 32, total_size)
    struct.pack_into("<I", header, 36, 112)
    struct.pack_into("<I", header, 52, map_off)
    struct.pack_into("<II", header, 56, len(strings), string_ids_off)
    struct.pack_into("<II", header, 64, len(type_ids), type_ids_off)
    struct.pack_into("<II", header, 72, 2, proto_ids_off)
    struct.pack_into("<II", header, 80, 0, 0)
    struct.pack_into("<II", header, 88, 6, method_ids_off)
    struct.pack_into("<II", header, 96, 2, class_defs_off)
    struct.pack_into("<II", header, 104, data_size, data_off)

    full_dex = bytearray(header + body)

    sha1 = hashlib.sha1(full_dex[32:]).digest()
    full_dex[12:32] = sha1

    adler = zlib.adler32(full_dex[12:]) & 0xffffffff
    struct.pack_into("<I", full_dex, 8, adler)

    return bytes(full_dex)

def compile_and_sign():
    ensure_tools()
    tmp_dir = Path("/tmp/apk_build")
    if tmp_dir.exists():
        shutil.rmtree(tmp_dir)
    tmp_dir.mkdir(parents=True, exist_ok=True)

    # 1. Compilar recursos con AAPT2
    compiled_zip = tmp_dir / "res.zip"
    os.system(f"{AAPT2_BIN} compile --dir {RES_DIR} -o {compiled_zip} > /dev/null 2>&1")

    # 2. Linkear manifiesto y recursos
    unaligned_apk = tmp_dir / "unaligned.apk"
    tmp_manifest = tmp_dir / "AndroidManifest.xml"
    with open(MANIFEST_FILE, "r", encoding="utf-8") as f:
        manifest_text = f.read()
    # Limpiar atributos no presentes en base framework jar para standalone linking
    manifest_text = manifest_text.replace('android:roundIcon="@android:drawable/ic_btn_speak_now"', '')
    manifest_text = manifest_text.replace('android:networkSecurityConfig="@xml/network_security_config"', '')
    with open(tmp_manifest, "w", encoding="utf-8") as f:
        f.write(manifest_text)

    cmd = (
        f"{AAPT2_BIN} link -I {FRAMEWORK_JAR} "
        f"--manifest {tmp_manifest} "
        f"-o {unaligned_apk} "
        f"--package-id 0x7f "
        f"--version-code 1 "
        f"--version-name 1.2.0 "
        f"--min-sdk-version 24 "
        f"--target-sdk-version 34 "
        f"{compiled_zip} > /dev/null 2>&1"
    )
    res = os.system(cmd)
    if res != 0 or not unaligned_apk.exists():
        raise RuntimeError("Fallo al ejecutar aapt2 link.")

    # 3. Generar classes.dex
    dex_bytes = generate_dex()

    # 4. Generar clave RSA-4096 y certificado X.509
    key = rsa.generate_private_key(public_exponent=65537, key_size=4096)
    subject = issuer = x509.Name([
        x509.NameAttribute(x509.NameOID.COMMON_NAME, "Actas Digitales Mobile"),
        x509.NameAttribute(x509.NameOID.ORGANIZATION_NAME, "Actas Digitales Security Authority"),
        x509.NameAttribute(x509.NameOID.COUNTRY_NAME, "ES")
    ])
    now = datetime.datetime.now(datetime.timezone.utc)
    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now - datetime.timedelta(days=1))
        .not_valid_after(now + datetime.timedelta(days=3650))
        .sign(key, hashes.SHA256())
    )

    # 5. Extraer entradas y agregar DEX
    entries = {}
    with zipfile.ZipFile(unaligned_apk, 'r') as zf:
        for info in zf.infolist():
            entries[info.filename] = zf.read(info.filename)
    entries["classes.dex"] = dex_bytes

    # 6. Crear firmas JAR (MANIFEST.MF, CERT.SF, CERT.RSA)
    manifest_mf = "Manifest-Version: 1.0\r\nCreated-By: Actas Digitales Toolchain (RSA-4096)\r\n\r\n"
    for name in sorted(entries.keys()):
        digest = base64.b64encode(hashlib.sha256(entries[name]).digest()).decode('ascii')
        manifest_mf += f"Name: {name}\r\nSHA-256-Digest: {digest}\r\n\r\n"

    manifest_mf_bytes = manifest_mf.encode('utf-8')
    manifest_mf_digest = base64.b64encode(hashlib.sha256(manifest_mf_bytes).digest()).decode('ascii')

    cert_sf = f"Signature-Version: 1.0\r\nCreated-By: Actas Digitales Toolchain (RSA-4096)\r\nSHA-256-Digest-Manifest: {manifest_mf_digest}\r\n\r\n"
    for name in sorted(entries.keys()):
        entry_header = f"Name: {name}\r\nSHA-256-Digest: {base64.b64encode(hashlib.sha256(entries[name]).digest()).decode('ascii')}\r\n\r\n".encode('utf-8')
        entry_digest = base64.b64encode(hashlib.sha256(entry_header).digest()).decode('ascii')
        cert_sf += f"Name: {name}\r\nSHA-256-Digest: {entry_digest}\r\n\r\n"

    cert_sf_bytes = cert_sf.encode('utf-8')

    builder = (
        pkcs7.PKCS7SignatureBuilder()
        .set_data(cert_sf_bytes)
        .add_signer(cert, key, hashes.SHA256())
    )
    cert_rsa_der = builder.sign(
        encoding=serialization.Encoding.DER,
        options=[pkcs7.PKCS7Options.DetachedSignature]
    )

    entries["META-INF/MANIFEST.MF"] = manifest_mf_bytes
    entries["META-INF/CERT.SF"] = cert_sf_bytes
    entries["META-INF/CERT.RSA"] = cert_rsa_der

    # 7. Escribir el paquete de verificación.
    #    Nunca se escribe en android/app/build/outputs/... porque esa ruta la genera
    #    Gradle con el APK real y quedaría sobrescrita por este paquete reducido.
    OUTPUT_APK.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(OUTPUT_APK, "w", compression=zipfile.ZIP_DEFLATED) as zout:
        for name in sorted(entries.keys()):
            zout.writestr(name, entries[name])

    print(f"[OK] Paquete de verificación de firma: {OUTPUT_APK} ({OUTPUT_APK.stat().st_size} bytes)")
    print("     Este paquete NO es la aplicación funcional: solo valida firma, recursos y manifiesto.")
    print("     Para el APK instalable real: cd android && ./gradlew assembleDebug")
    print(f"     Salida esperada de Gradle: {DEBUG_APK}")

    # 8. Verificación Androguard
    from androguard.core.apk import APK
    apk = APK(str(OUTPUT_APK))
    print("\n--- Verificación Androguard de APK ---")
    print(f"  Paquete: {apk.get_package()}")
    print(f"  Nombre de App: {apk.get_app_name()}")
    print(f"  Versión: {apk.get_androidversion_name()} (Code: {apk.get_androidversion_code()})")
    print(f"  Actividades: {apk.get_activities()}")
    print(f"  Permisos: {apk.get_permissions()}")
    print(f"  Firmado v1: {apk.is_signed()}")
    certs = apk.get_certificates()
    if certs:
        print(f"  Certificado: {certs[0].subject.human_friendly}")
        print(f"  Algoritmo y longitud de clave: RSA {certs[0].public_key.bit_size} bits")
    print("--------------------------------------\n")

if __name__ == "__main__":
    compile_and_sign()
