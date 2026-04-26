# Production Deployment Guide — AI Job Agents

This guide explains how to deploy the entire platform online so you can access it via a URL without running it locally.

## 1. GitHub Setup (Prerequisite)

You need to push your code to a private GitHub repository.

```powershell
# Inside the "AI Agent" folder:
git init
git add .
git commit -m "feat: production deployment configuration"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ai-job-agents.git
git push -u origin main
```

## 2. Backend & Infrastructure (Railway.app)

Railway is the easiest place to host the Backend, Database, Redis, and Celery workers because it supports `docker-compose`.

1.  Go to [Railway.app](https://railway.app/) and sign in with GitHub.
2.  Click **New Project** > **Deploy from GitHub repo**.
3.  Select your `ai-job-agents` repository.
4.  Railway will detect the `docker-compose.yml`.
5.  **Environment Variables**: In the Backend service settings, add your secrets:
    *   `TELEGRAM_BOT_TOKEN`
    *   `TELEGRAM_CHAT_ID`
    *   `SECRET_KEY` (Generate a random string)
6.  Once deployed, Railway will provide a public URL for the backend (e.g., `https://backend-production.up.railway.app`). **Copy this URL.**

## 3. Frontend (Vercel)

Vercel is the best place for the React frontend.

1.  Go to [Vercel.com](https://vercel.com/) and sign in with GitHub.
2.  Click **Add New** > **Project**.
3.  Import the `ai-job-agents` repository.
4.  **Framework Preset**: Vite.
5.  **Root Directory**: Click "Edit" and select `frontend`.
6.  **Environment Variables**: Add a new variable:
    *   Key: `VITE_API_URL`
    *   Value: `https://your-backend-url-from-railway.app`
7.  Click **Deploy**.

## 4. Updates

Every time you `git push` to your GitHub repository, both Vercel and Railway will automatically update your website. No more terminal needed!

## 5. Security Checklist

*   [ ] Change `SECRET_KEY` in Railway.
*   [ ] Ensure `DATABASE_URL` is pointing to the Railway internal Postgres URL.
*   [ ] Make sure `.env` is NOT pushed to GitHub (it's already in `.gitignore`).
