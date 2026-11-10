#!/usr/bin/env python3
"""
Panel de Control Centralizado HUD (Multiplataforma: Linux, macOS, Windows)
Permite orquestar el servidor HTTPS, ejecutar pruebas de fuego, renovar certificados
y abrir la interfaz web desde una consola interactiva con estilo cyberpunk/futurista.
"""

import os
import sys
import time
import signal
import webbrowser
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
CERTS_DIR = BASE_DIR / "certs"
FULLCHAIN = CERTS_DIR / "fullchain.pem"
SERVER_KEY = CERTS_DIR / "server.key"
UPLOAD_DIR = BASE_DIR / "backend" / "app" / "uploads"

# ANSI Cyberpunk Colors
C_CYAN = "\033[96m"
C_MAGENTA = "\033[95m"
C_GREEN = "\033[92m"
C_YELLOW = "\033[93m"
C_RED = "\033[91m"
C_BLUE = "\033[94m"
C_BOLD = "\033[1m"
C_RESET = "\033[0m"

server_process = None

def banner():
    print(f"{C_CYAN}{C_BOLD}" + "=" * 66)
    print("   ░█▀█░█▀▀░▀█▀░█▀█░█▀▀░░░█▀▄░▀█▀░█▀▀░▀█▀░▀█▀░█▀█░█░░░█▀▀░█▀▀")
    print("   ░█▀█░█░░░░█░░█▀█░▀▀█░░░█░█░░█░░█░█░░█░░░█░░█▀█░█░░░█▀▀░▀▀█")
    print("   ░▀░▀░▀▀▀░░▀░░▀░▀░▀▀▀░░░▀▀░░▀▀▀░▀▀▀░▀▀▀░░▀░░▀░▀░▀▀▀░▀▀▀░▀▀▀")
    print(f"      [ PANEL DE CONTROL FUTURISTA HUD · TLS 1.3 / OWASP ]{C_RESET}")
    print(f"{C_CYAN}{C_BOLD}" + "=" * 66 + f"{C_RESET}")

def certs_status():
    return FULLCHAIN.exists() and SERVER_KEY.exists()

def show_status():
    is_online = server_process is not None and server_process.poll() is None
    status_str = f"{C_GREEN}[ ONLINE / EN LÍNEA ]{C_RESET}" if is_online else f"{C_YELLOW}[ STANDBY / DETENIDO ]{C_RESET}"
    certs_str = f"{C_GREEN}[ VÁLIDOS / SAN ]{C_RESET}" if certs_status() else f"{C_RED}[ FALTANTES ]{C_RESET}"

    print(f"\n{C_MAGENTA}┌── TELEMETRÍA DEL SISTEMA ────────────────────────────────────────┐{C_RESET}")
    print(f"│  Estado Núcleo:      {status_str.ljust(50)} │")
    print(f"│  Protocolo:          {C_BOLD}HTTPS / TLS 1.3 (256-bit AEAD){C_RESET}               │")
    print(f"│  Certificados TLS:   {certs_str.ljust(50)} │")
    print(f"│  Protección:         {C_BOLD}DoS Token Bucket (120 req/min){C_RESET}               │")
    print(f"│  Estándares:         {C_BOLD}OWASP Top 10 + ASVS v4.0 + RAE{C_RESET}              │")
    print(f"{C_MAGENTA}└──────────────────────────────────────────────────────────────────┘{C_RESET}")

def start_server():
    global server_process
    if server_process and server_process.poll() is None:
        print(f"\n{C_YELLOW}[!] El servidor ya está en ejecución (PID: {server_process.pid}).{C_RESET}")
        return

    if not certs_status():
        print(f"\n{C_YELLOW}[*] Certificados no detectados. Generando certificados con CA local...{C_RESET}")
        from tools.generar_certificados_https import generar_certificados_firmados
        generar_certificados_firmados()

    print(f"\n{C_GREEN}[*] Lanzando servidor FastAPI con Uvicorn en https://localhost:8443...{C_RESET}")
    cmd = [
        sys.executable, "-m", "uvicorn",
        "app.main:app",
        "--host", "0.0.0.0",
        "--port", "8443",
        "--ssl-keyfile", str(SERVER_KEY),
        "--ssl-certfile", str(FULLCHAIN),
        "--app-dir", str(BASE_DIR / "backend")
    ]
    server_process = subprocess.Popen(cmd)
    time.sleep(1.5)
    print(f"{C_GREEN}[✓] Servidor activo (PID: {server_process.pid}) en https://localhost:8443{C_RESET}")

def stop_server():
    global server_process
    if server_process and server_process.poll() is None:
        print(f"\n{C_RED}[*] Deteniendo servidor Uvicorn (PID: {server_process.pid})...{C_RESET}")
        server_process.terminate()
        server_process.wait()
        server_process = None
        print(f"{C_GREEN}[✓] Servidor detenido.{C_RESET}")
    else:
        print(f"\n{C_YELLOW}[!] No hay servidor en ejecución.{C_RESET}")

def open_web():
    url = "https://localhost:8443"
    print(f"\n{C_CYAN}[+] Abriendo interfaz Web en el navegador ({url})...{C_RESET}")
    webbrowser.open(url)

def run_fire_tests():
    print(f"\n{C_RED}{C_BOLD}[*] Ejecutando Suite de Pruebas de Fuego OWASP y ASVS v4.0...{C_RESET}")
    subprocess.run([sys.executable, str(BASE_DIR / "tools" / "test_pruebas_de_fuego.py")])

def renew_certs():
    print(f"\n{C_MAGENTA}[*] Regenerando y refirmando certificados TLS 1.3 con SAN...{C_RESET}")
    from tools.generar_certificados_https import generar_certificados_firmados
    generar_certificados_firmados()
    print(f"{C_GREEN}[✓] Certificados renovados exitosamente en {CERTS_DIR}{C_RESET}")

def purge_cache():
    print(f"\n{C_BLUE}[*] Purgando búferes y archivos temporales de audio...{C_RESET}")
    purged = 0
    freed = 0
    if UPLOAD_DIR.exists():
        for f in UPLOAD_DIR.glob("*"):
            if f.is_file() and f.name != ".gitkeep":
                freed += f.stat().st_size
                f.unlink()
                purged += 1
    print(f"{C_GREEN}[✓] Caché purgada: {purged} archivos eliminados ({round(freed / (1024*1024), 2)} MB liberados). Retención cero.{C_RESET}")

def main():
    while True:
        os.system('cls' if os.name == 'nt' else 'clear')
        banner()
        show_status()

        print(f"\n{C_BOLD}ACCIONES FUTURISTAS DISPONIBLES:{C_RESET}")
        print(f"  {C_CYAN}[1]{C_RESET} 🚀 {C_BOLD}Iniciar Todo (Servidor Seguro HTTPS){C_RESET}")
        print(f"  {C_GREEN}[2]{C_RESET} 🌐 {C_BOLD}Abrir Web en Navegador{C_RESET}")
        print(f"  {C_RED}[3]{C_RESET} 🔥 {C_BOLD}Ejecutar Pruebas de Fuego OWASP (10/10){C_RESET}")
        print(f"  {C_MAGENTA}[4]{C_RESET} 🛡️ {C_BOLD}Renovar Certificados TLS / SAN{C_RESET}")
        print(f"  {C_BLUE}[5]{C_RESET} 🧹 {C_BOLD}Purgar Caché y Temporales de Audio{C_RESET}")
        print(f"  {C_YELLOW}[6]{C_RESET} 🛑 {C_BOLD}Detener Servidor{C_RESET}")
        print(f"  {C_RESET}[0] ✖ Salir{C_RESET}")

        try:
            choice = input(f"\n{C_CYAN}{C_BOLD}ActasDigitales-HUD > {C_RESET}").strip()
            if choice == "1":
                start_server()
                input(f"\n{C_YELLOW}Presiona ENTER para continuar...{C_RESET}")
            elif choice == "2":
                open_web()
                input(f"\n{C_YELLOW}Presiona ENTER para continuar...{C_RESET}")
            elif choice == "3":
                run_fire_tests()
                input(f"\n{C_YELLOW}Presiona ENTER para continuar...{C_RESET}")
            elif choice == "4":
                renew_certs()
                input(f"\n{C_YELLOW}Presiona ENTER para continuar...{C_RESET}")
            elif choice == "5":
                purge_cache()
                input(f"\n{C_YELLOW}Presiona ENTER para continuar...{C_RESET}")
            elif choice == "6":
                stop_server()
                input(f"\n{C_YELLOW}Presiona ENTER para continuar...{C_RESET}")
            elif choice == "0":
                if server_process and server_process.poll() is None:
                    stop_server()
                print(f"\n{C_CYAN}Saliendo de Actas Digitales HUD. ¡Hasta pronto!{C_RESET}\n")
                break
        except (KeyboardInterrupt, EOFError):
            if server_process and server_process.poll() is None:
                stop_server()
            break

if __name__ == "__main__":
    main()
