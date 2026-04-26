#!/usr/bin/env python3
"""
AI Job Agents Platform - Setup LOCAL (Sans Docker)
Installation simple - tout en Python
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

def print_header(text):
    print("\n" + "="*60)
    print(f"🚀 {text}")
    print("="*60 + "\n")

def print_success(text):
    print(f"✅ {text}")

def print_error(text):
    print(f"❌ {text}")

def print_info(text):
    print(f"ℹ️  {text}")

def install_requirements():
    """Installer les packages Python nécessaires"""
    print_header("Installation des dépendances Python")

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
    ]

    print_info(f"Installation de {len(requirements)} packages...")

    for i, req in enumerate(requirements, 1):
        print(f"  [{i}/{len(requirements)}] {req.split('==')[0]}...", end='\r')
        result = subprocess.run(
            [sys.executable, "-m", "pip", "install", "-q", req],
            capture_output=True
        )
        if result.returncode != 0:
            print_error(f"Erreur en installant {req}")

    print("\n")
    print_success("Tous les packages installés!")

def setup_database():
    """Créer la base de données SQLite"""
    print_header("Configuration de la base de données")

    print_info("Création de la base de données SQLite...")

    # Créer le dossier data s'il n'existe pas
    Path("data").mkdir(exist_ok=True)

    # Créer la DB avec Python
    create_db_script = """
import asyncio
from app.core.database import init_db, AsyncSessionLocal
from app.models.agent import Agent, AgentSource, AgentStatus
from datetime import datetime

async def setup():
    await init_db()
    print("✅ Tables créées")

    # Ajouter les agents initiaux
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select
        stmt = select(Agent)
        result = await session.execute(stmt)
        existing = result.scalars().first()

        if not existing:
            agents = [
                Agent(name="LinkedIn Agent", source=AgentSource.LINKEDIN, task="Search jobs on LinkedIn", status=AgentStatus.IDLE, enabled=1),
                Agent(name="Xing Agent", source=AgentSource.XING, task="Search jobs on Xing", status=AgentStatus.IDLE, enabled=1),
                Agent(name="Indeed Agent", source=AgentSource.INDEED, task="Search jobs on Indeed", status=AgentStatus.IDLE, enabled=1),
                Agent(name="Agentur für Arbeit", source=AgentSource.AGENTUR, task="Search jobs on Agentur", status=AgentStatus.IDLE, enabled=1),
                Agent(name="Chef Agent", source=AgentSource.CHEF, task="Aggregate and process jobs", status=AgentStatus.IDLE, enabled=1),
            ]
            session.add_all(agents)
            await session.commit()
            print("✅ Agents créés")
        else:
            print("✅ Agents déjà existent")

asyncio.run(setup())
"""

    with open("setup_db.py", "w") as f:
        f.write(create_db_script)

    result = subprocess.run([sys.executable, "setup_db.py"], capture_output=True, text=True)
    print(result.stdout)
    if result.stderr:
        print_error(result.stderr)

    print_success("Base de données prête!")

def show_instructions():
    """Afficher les instructions de démarrage"""
    print_header("✅ INSTALLATION TERMINÉE!")

    print("📝 POUR DÉMARRER LE SYSTÈME:\n")

    print("Ouvrez 2 terminales séparées:\n")

    print("TERMINAL 1 - Lancer le Backend:")
    print("  cd c:\\Users\\nabil\\Desktop\\liste\\ des\\ P\\AI\\ Agent")
    print("  python -m uvicorn app.main:app --reload --port 8000")
    print("  (Puis ouvrir: http://localhost:8000/docs)\n")

    print("TERMINAL 2 - Lancer le Frontend:")
    print("  cd c:\\Users\\nabil\\Desktop\\liste\\ des\\ P\\AI\\ Agent\\frontend")
    print("  npm install  (une seule fois)")
    print("  npm run dev")
    print("  (Puis ouvrir: http://localhost:5173)\n")

    print("="*60)
    print("🌐 ACCÈS:")
    print("  Frontend: http://localhost:5173")
    print("  Backend API: http://localhost:8000")
    print("  Swagger UI: http://localhost:8000/docs")
    print("="*60)

    print("\n🧪 TESTER L'API:")
    print("  curl http://localhost:8000/jobs")
    print("  curl http://localhost:8000/agents")
    print("  curl http://localhost:8000/dashboard/stats\n")

def main():
    """Programme principal"""
    print("\n" + "="*60)
    print("🚀 AI JOB AGENTS PLATFORM - VERSION LOCALE")
    print("   (Sans Docker)")
    print("="*60)

    # Changer vers le répertoire du projet
    script_dir = Path(__file__).parent
    os.chdir(script_dir)

    # Créer .env s'il n'existe pas
    if not Path(".env").exists() and Path(".env.example").exists():
        print_info("Création du fichier .env...")
        with open(".env.example") as f:
            content = f.read()
        with open(".env", "w") as f:
            f.write(content)
        print_success(".env créé")

    # Installer les requirements
    install_requirements()

    # Setup database
    setup_database()

    # Afficher les instructions
    show_instructions()

    print("\n✨ C'est prêt! Suis les instructions ci-dessus.\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n⚠️  Interrompu")
        sys.exit(0)
    except Exception as e:
        print_error(f"Erreur: {str(e)}")
        sys.exit(1)
