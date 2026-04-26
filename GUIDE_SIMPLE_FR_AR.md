# 🚀 GUIDE SIMPLE — Lancer Tout Automatiquement

## النسخة العربية أولا (ثم الفرنسية)

---

# 🇲🇦 الإصدار العربي

## ما الذي تحتاج إلى فعله؟

### الخطوة 1: فتح موجه الأوامر
```
Windows: اضغط على Win + R، ثم اكتب cmd
Mac/Linux: افتح Terminal
```

### الخطوة 2: انتقل إلى المجلد
```bash
cd "c:\Users\nabil\Desktop\liste des P\AI Agent"
```

### الخطوة 3: نسخ ملف الإعدادات
```bash
copy .env.example .env
```

### الخطوة 4: شغّل كل شيء
```bash
docker-compose up -d
```

### الخطوة 5: انتظر 30 ثانية
```bash
timeout /t 30
```

### الخطوة 6: افتح في المتصفح
- الواجهة الأمامية: **http://localhost:3000**
- التوثيق: **http://localhost:8000/docs**
- قاعدة البيانات: **localhost:5432**

---

## ماذا ستحصل عليه؟

✅ لوحة معلومات حية مع إحصائيات
✅ قائمة الوظائف مع مرشحات متقدمة
✅ إدارة الوكلاء (Agents)
✅ تحميل ملفات PDF
✅ تتبع حالة التطبيقات
✅ واجهة برمجية REST كاملة

---

## الأوامر المفيدة

### عرض السجلات
```bash
docker-compose logs -f backend
```

### إيقاف كل شيء
```bash
docker-compose down
```

### الاتصال بقاعدة البيانات
```bash
docker-compose exec postgres psql -U jobagent -d ai_job_agents
```

### اختبار الواجهة البرمجية
```bash
curl http://localhost:8000/jobs
```

---

---

# 🇫🇷 Version Française

## Qu'est-ce que tu dois faire?

### Étape 1: Ouvrir l'invite de commande
```
Windows: Appuyez sur Win + R, puis tapez cmd
Mac/Linux: Ouvrez Terminal
```

### Étape 2: Aller dans le dossier du projet
```bash
cd "c:\Users\nabil\Desktop\liste des P\AI Agent"
```

### Étape 3: Copier le fichier de configuration
```bash
copy .env.example .env
```

### Étape 4: Lancer tous les services
```bash
docker-compose up -d
```

### Étape 5: Attendre 30 secondes
```bash
timeout /t 30
```

### Étape 6: Ouvrir dans le navigateur
- **Frontend** (Tableau de bord): http://localhost:3000
- **API Docs** (Documentation): http://localhost:8000/docs
- **Base de données**: localhost:5432

---

## Ce que tu vas obtenir

✅ Tableau de bord en direct avec statistiques
✅ Liste des emplois avec filtres avancés
✅ Gestion des agents (scrapers)
✅ Téléchargement PDF
✅ Suivi des candidatures
✅ API REST complète

---

## Commandes utiles

### Voir les logs
```bash
docker-compose logs -f backend
```

### Arrêter tout
```bash
docker-compose down
```

### Accéder à la base de données
```bash
docker-compose exec postgres psql -U jobagent -d ai_job_agents
```

### Tester l'API
```bash
curl http://localhost:8000/jobs
```

### Lancer un agent (scraper)
```bash
curl -X POST http://localhost:8000/agents/1/run
```

### Voir les statistiques
```bash
curl http://localhost:8000/dashboard/stats
```

---

## Si tu veux accéder depuis une autre machine sur le réseau

Remplace `localhost` par l'IP de ta machine:

### Trouver ton IP
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

Cherche une adresse IP locale comme `192.168.x.x`

### Puis accède à:
- http://192.168.x.x:3000 (Frontend)
- http://192.168.x.x:8000/docs (API)

---

## 🚨 Résolution des problèmes

### Le port 8000 est déjà utilisé
```bash
# Tuer le processus
lsof -ti:8000 | xargs kill -9
```

### Docker ne veut pas démarrer
```bash
# Vérifier que Docker est lancé
docker ps

# Sinon, ouvrir Docker Desktop
```

### La base de données ne démarre pas
```bash
# Redémarrer PostgreSQL
docker-compose restart postgres

# Attendre 10 secondes
timeout /t 10

# Vérifier
docker-compose logs postgres
```

### Vérifier que tout fonctionne
```bash
# Tous les services doivent être "Up"
docker-compose ps

# Backend doit répondre
curl http://localhost:8000/health

# Doit retourner: {"status": "healthy", ...}
```

---

## 📊 Endpoints API à tester

```bash
# 1. Vérifier que le backend est actif
curl http://localhost:8000/health

# 2. Obtenir tous les emplois
curl http://localhost:8000/jobs

# 3. Lister les agents
curl http://localhost:8000/agents

# 4. Voir les statistiques
curl http://localhost:8000/dashboard/stats

# 5. Lancer un agent (scraper un emploi)
curl -X POST http://localhost:8000/agents/1/run

# 6. Mettre à jour le statut d'un emploi
curl -X PATCH http://localhost:8000/jobs/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "envoye"}'
```

---

## ✨ C'est tout!

Tout est automatisé. Après avoir lancé `docker-compose up -d`:

1. ✅ PostgreSQL démarre
2. ✅ Redis démarre
3. ✅ FastAPI backend démarre (port 8000)
4. ✅ React frontend démarre (port 3000)
5. ✅ Celery worker démarre
6. ✅ Celery scheduler démarre

Puis ouvre http://localhost:3000 dans ton navigateur et c'est prêt à utiliser!

---

**Version**: 1.0
**Date**: 2024-01-15
**Status**: Production Ready
