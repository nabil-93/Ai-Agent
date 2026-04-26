#!/usr/bin/env python3
"""
AI Job Agents Platform - Automatic Launcher
Démarre tout automatiquement en une seule commande
"""

import os
import sys
import subprocess
import time
import platform
import shutil
import requests
from pathlib import Path

def print_header(text):
    print("\n" + "="*50)
    print(f"🚀 {text}")
    print("="*50 + "\n")

def print_success(text):
    print(f"✅ {text}")

def print_error(text):
    print(f"❌ {text}")

def print_info(text):
    print(f"ℹ️  {text}")

def check_docker():
    """Vérifier que Docker est installé"""
    print_header("Vérification de Docker")

    if shutil.which("docker") is None:
        print_error("Docker n'est pas installé")
        print_info("Télécharger Docker Desktop: https://www.docker.com/products/docker-desktop")
        sys.exit(1)

    print_success("Docker trouvé")

    if shutil.which("docker-compose") is None:
        print_error("Docker Compose n'est pas installé")
        sys.exit(1)

    print_success("Docker Compose trouvé")

def setup_env():
    """Créer le fichier .env"""
    print_header("Configuration de l'environnement")

    env_file = Path(".env")
    env_example = Path(".env.example")

    if env_file.exists():
        print_success(".env déjà existe")
        return

    if not env_example.exists():
        print_error(".env.example non trouvé")
        sys.exit(1)

    # Copier le fichier
    with open(env_example, 'r') as f:
        content = f.read()

    with open(env_file, 'w') as f:
        f.write(content)

    print_success(".env créé à partir de .env.example")

def start_services():
    """Démarrer les services Docker"""
    print_header("Démarrage des services Docker")

    # Arrêter les anciens services
    print_info("Arrêt des anciens services...")
    subprocess.run(["docker-compose", "down", "-v"],
                   capture_output=True, text=True)
    time.sleep(2)

    # Démarrer les services
    print_info("Démarrage de tous les services...")
    result = subprocess.run(["docker-compose", "up", "-d"],
                           capture_output=True, text=True)

    if result.returncode != 0:
        print_error(f"Erreur au démarrage: {result.stderr}")
        sys.exit(1)

    print_success("Services en cours de démarrage...")
    print_info("Attente de 30 secondes pour que les services se stabilisent...")

    for i in range(30, 0, -1):
        print(f"  Attente... {i}s", end='\r')
        time.sleep(1)
    print("  Attente complète!         ")

def check_services():
    """Vérifier que tous les services sont actifs"""
    print_header("Vérification des services")

    # Vérifier PostgreSQL
    print_info("Vérification de PostgreSQL...")
    max_retries = 30
    for i in range(max_retries):
        try:
            result = subprocess.run(
                ["docker-compose", "exec", "-T", "postgres",
                 "pg_isready", "-U", "jobagent"],
                capture_output=True, text=True, timeout=5
            )
            if result.returncode == 0:
                print_success("PostgreSQL est prêt")
                break
        except:
            pass
        if i < max_retries - 1:
            print(f"  Tentative {i+1}/{max_retries}...")
            time.sleep(1)

    # Vérifier Redis
    print_info("Vérification de Redis...")
    try:
        result = subprocess.run(
            ["docker-compose", "exec", "-T", "redis", "redis-cli", "ping"],
            capture_output=True, text=True, timeout=5
        )
        if "PONG" in result.stdout:
            print_success("Redis est prêt")
    except:
        print_info("Redis se démarre...")

    # Afficher le statut
    print_info("\nStatut des conteneurs:")
    subprocess.run(["docker-compose", "ps"])

def test_backend():
    """Tester le backend"""
    print_header("Test du backend")

    print_info("Test de la santé du backend...")
    for i in range(30):
        try:
            response = requests.get("http://localhost:8000/health", timeout=2)
            if response.status_code == 200:
                data = response.json()
                print_success(f"Backend répondu: {data}")
                return True
        except:
            if i < 29:
                print(f"  Tentative {i+1}/30...", end='\r')
                time.sleep(1)

    print_error("Backend n'a pas répondu après 30 secondes")
    return False

def display_info():
    """Afficher les informations d'accès"""
    print_header("🎉 PRÊT À L'EMPLOI!")

    print("\n📋 ADRESSES D'ACCÈS:\n")

    print("🌐 FRONTEND (Tableau de Bord):")
    print("   http://localhost:3000")
    print("   Ouvrez cette URL dans votre navigateur")

    print("\n⚙️  API & DOCUMENTATION:")
    print("   http://localhost:8000")
    print("   http://localhost:8000/docs (Swagger UI)")
    print("   http://localhost:8000/redoc (ReDoc)")

    print("\n🗄️  BASE DE DONNÉES:")
    print("   Host: localhost")
    print("   Port: 5432")
    print("   User: jobagent")
    print("   Password: jobagent123")
    print("   Database: ai_job_agents")

    print("\n🔴 REDIS CACHE:")
    print("   Host: localhost")
    print("   Port: 6379")

    print("\n" + "="*50)
    print("✅ Tous les services sont en cours d'exécution!")
    print("="*50)

    print("\n📖 DOCUMENTATION:")
    print("   - QUICKSTART.md: Lancez-vous en 5 minutes")
    print("   - API_REFERENCE.md: Tous les endpoints")
    print("   - GUIDE_SIMPLE_FR_AR.md: Guide simple")

    print("\n🧪 TEST RAPIDE - Tapez dans une autre fenêtre:")
    print("   curl http://localhost:8000/jobs")
    print("   curl http://localhost:8000/agents")
    print("   curl http://localhost:8000/dashboard/stats")

def main():
    """Programme principal"""
    print("\n" + "="*50)
    print("🚀 AI JOB AGENTS PLATFORM")
    print("   Démarrage automatique")
    print("="*50)

    # Changer vers le répertoire du projet
    script_dir = Path(__file__).parent
    os.chdir(script_dir)

    # Vérifier les prérequis
    check_docker()
    setup_env()
    start_services()
    check_services()

    # Tester le backend
    if test_backend():
        display_info()
        print("\n🎯 PROCHAINES ÉTAPES:")
        print("   1. Ouvrez http://localhost:3000 dans votre navigateur")
        print("   2. Allez à la page 'Agents'")
        print("   3. Cliquez 'Run Now' sur n'importe quel agent")
        print("   4. Attendez quelques secondes")
        print("   5. Allez au 'Dashboard' pour voir les résultats")
        print("\n✨ Amusez-vous bien!\n")
    else:
        print_error("Le backend n'a pas pu démarrer")
        print_info("Vérifiez les logs avec: docker-compose logs backend")
        sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrompu par l'utilisateur")
        print("Pour arrêter les services: docker-compose down")
        sys.exit(0)
    except Exception as e:
        print_error(f"Erreur: {str(e)}")
        sys.exit(1)
