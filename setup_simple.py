#!/usr/bin/env python3
"""
AI Job Agents Platform - Setup LOCAL (Simple - Sans emojis)
"""

import os
import sys
import subprocess
from pathlib import Path

def print_header(text):
    print("\n" + "="*60)
    print(f">>> {text}")
    print("="*60 + "\n")

def print_success(text):
    print(f"[OK] {text}")

def print_error(text):
    print(f"[ERROR] {text}")

def print_info(text):
    print(f"[INFO] {text}")

def install_requirements():
    """Installer les packages Python necessaires"""
    print_header("Installation des dependances Python")

    requirements = [
        "fastapi==0.104.1",
        "uvicorn[standard]==0.24.0",
        "sqlalchemy==2.0.23",
        "pydantic==2.5.0",
        "pydantic-settings==2.1.0",
        "python-jose[cryptography]==3.3.0",
        "passlib[bcrypt]==1.7.4",
        "python-multipart==0.0.6",
        "aiofiles==23.2.1",
        "httpx==0.25.2",
        "aiohttp==3.9.1",
        "requests==2.31.0",
        "beautifulsoup4==4.12.2",
        "reportlab==4.0.7",
        "python-telegram-bot==20.3",
        "python-dotenv==1.0.0",
        "aiosqlite==0.19.0",
    ]

    print_info(f"Installation de {len(requirements)} packages...")
    print("")

    failed = []
    for i, req in enumerate(requirements, 1):
        pkg_name = req.split('==')[0]
        print(f"[{i}/{len(requirements)}] {pkg_name}...", end=' ')

        result = subprocess.run(
            [sys.executable, "-m", "pip", "install", "-q", req],
            capture_output=True,
            text=True
        )

        if result.returncode == 0:
            print("OK")
        else:
            print("ERREUR")
            failed.append(req)

    print("")
    if failed:
        print_error(f"{len(failed)} packages ont eu des erreurs")
        for pkg in failed:
            print(f"  - {pkg}")

    print_success("Installation terminees!")

def setup_env():
    """Creer le fichier .env"""
    print_header("Configuration de l'environnement")

    env_file = Path(".env")

    if env_file.exists():
        print_success(".env existe deja")
        return

    env_content = """DATABASE_URL=sqlite:///./data/jobs.db
SQLALCHEMY_ECHO=False
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
SERPAPI_KEY=
LINKEDIN_EMAIL=
LINKEDIN_PASSWORD=
LOG_LEVEL=INFO
VITE_API_URL=http://localhost:8000
ENV=development
"""

    with open(env_file, 'w') as f:
        f.write(env_content)

    print_success(".env cree")

def create_data_dir():
    """Creer le dossier data"""
    print_header("Creation de la base de donnees")

    Path("data").mkdir(exist_ok=True)
    print_info("Dossier 'data' cree")

    print_success("Base de donnees SQLite prete!")

def show_instructions():
    """Afficher les instructions"""
    print_header("INSTALLATION TERMINEES!")

    print("="*60)
    print("PROCHAINES ETAPES:")
    print("="*60)
    print("")

    print("1. Ouvrez DEUX fenetre CMD")
    print("")

    print("FENETRE 1 - BACKEND:")
    print("  cd \"c:\\Users\\nabil\\Desktop\\liste des P\\AI Agent\"")
    print("  python -m uvicorn app.main:app --reload --port 8000")
    print("")

    print("FENETRE 2 - FRONTEND:")
    print("  cd \"c:\\Users\\nabil\\Desktop\\liste des P\\AI Agent\\frontend\"")
    print("  npm install")
    print("  npm run dev")
    print("")

    print("2. Ouvrez votre navigateur:")
    print("  http://localhost:5173")
    print("")

    print("3. Voila! C'est pret!")
    print("")

    print("="*60)
    print("ACCÈS:")
    print("="*60)
    print("Frontend: http://localhost:5173")
    print("Backend API: http://localhost:8000")
    print("API Docs: http://localhost:8000/docs")
    print("")

def main():
    print("\n" + "="*60)
    print("AI JOB AGENTS PLATFORM - VERSION LOCALE")
    print("(Sans Docker)")
    print("="*60)

    script_dir = Path(__file__).parent
    os.chdir(script_dir)

    install_requirements()
    setup_env()
    create_data_dir()
    show_instructions()

    print("Appuyez sur ENTER pour terminer...")
    input()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n[STOP] Interrompu par l'utilisateur")
        sys.exit(0)
    except Exception as e:
        print_error(f"Erreur: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
