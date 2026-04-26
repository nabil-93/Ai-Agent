# 🚀 QUICKSTART — Launch in 5 Minutes

## Step 1: Copy Environment File
```bash
cd "c:\Users\nabil\Desktop\liste des P\AI Agent"
copy .env.example .env
```

## Step 2: Start Everything
```bash
docker-compose up -d
```

## Step 3: Wait for Services (30 seconds)
Docker will start:
- PostgreSQL database
- Redis cache
- FastAPI backend
- React frontend
- Celery worker
- Celery scheduler

## Step 4: Access the Platform

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3000 | Main dashboard |
| **API Docs** | http://localhost:8000/docs | Interactive API |
| **Database** | localhost:5432 | PostgreSQL |
| **Redis** | localhost:6379 | Cache |

---

# 💻 What You Get Immediately

## Frontend Features (http://localhost:3000)
✅ Dashboard with live statistics
✅ Jobs list with filters
✅ Agent management panel
✅ PDF export for each job
✅ Status tracking (En Cours, Envoyé, Entretien, Refus)

## Backend API (http://localhost:8000/docs)
✅ Complete REST API
✅ Swagger UI for testing
✅ Health check endpoint
✅ Authentication ready

## Database (PostgreSQL)
✅ Pre-configured schema
✅ 3 tables: jobs, agents, companies
✅ Proper indexes on common queries
✅ Ready for 100K+ jobs

## Queue System (Celery + Redis)
✅ Background task runner
✅ Scheduled jobs (every 4 hours)
✅ Manual agent triggering
✅ Notification queue

---

# 🧪 Quick API Tests

## Test 1: Health Check
```bash
curl http://localhost:8000/health
```
**Response**: `{"status": "healthy", ...}`

## Test 2: Get All Jobs
```bash
curl http://localhost:8000/jobs
```
**Response**: `{"total": X, "jobs": [...]}`

## Test 3: List Agents
```bash
curl http://localhost:8000/agents
```
**Response**: `{"agents": [5 agents], "total": 5}`

## Test 4: Dashboard Stats
```bash
curl http://localhost:8000/dashboard/stats
```
**Response**: Statistics with total jobs, by status, by source, etc.

## Test 5: Trigger an Agent
```bash
curl -X POST http://localhost:8000/agents/1/run
```
**Response**: Task queued, agent will scrape jobs in background

## Test 6: Update Job Status
```bash
curl -X PATCH http://localhost:8000/jobs/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "envoye"}'
```

## Test 7: Download PDF
```bash
curl http://localhost:8000/jobs/1/pdf --output job.pdf
```

---

# 📊 View Results

## Option 1: Web Dashboard
Open http://localhost:3000 in browser
- See all stats in real-time
- Click "Run Now" to trigger agents
- Update job statuses
- Download PDFs

## Option 2: API Documentation
Open http://localhost:8000/docs in browser
- Test all endpoints interactively
- See request/response examples
- Try different parameters

## Option 3: Command Line
```bash
# Get all jobs (with filters)
curl "http://localhost:8000/jobs?city=Berlin&domain=IT"

# Get dashboard stats
curl http://localhost:8000/dashboard/stats | jq

# View agent status
curl http://localhost:8000/agents | jq
```

---

# 🔧 Useful Commands

## View Logs
```bash
# All logs
docker-compose logs -f

# Just backend
docker-compose logs -f backend

# Just frontend
docker-compose logs -f frontend

# Just Celery worker
docker-compose logs -f celery_worker
```

## Access Database
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U jobagent -d ai_job_agents

# View jobs
psql> SELECT id, title, location, status FROM jobs LIMIT 10;

# View agents
psql> SELECT id, name, source, status FROM agents;

# Exit
psql> \q
```

## Connect to Redis
```bash
docker-compose exec redis redis-cli

# Check size
> DBSIZE

# View all keys
> KEYS *

# Monitor real-time
> MONITOR

# Exit
> EXIT
```

## Stop Everything
```bash
docker-compose down -v
```

---

# 🎯 Common Workflows

## Workflow 1: Trigger Scraping & Check Results
```bash
# 1. Trigger all agents
for i in 1 2 3 4; do
  curl -X POST http://localhost:8000/agents/$i/run
done

# 2. Wait 5 seconds for jobs to be processed
sleep 5

# 3. Check results
curl http://localhost:8000/dashboard/stats | jq '.summary'

# 4. View jobs in browser
open http://localhost:3000
```

## Workflow 2: Filter Jobs & Apply
```bash
# 1. Get Berlin IT jobs
curl "http://localhost:8000/jobs?city=Berlin&domain=IT"

# 2. For each job, mark as "envoye" (sent)
curl -X PATCH http://localhost:8000/jobs/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "envoye"}'

# 3. Download PDF for records
curl http://localhost:8000/jobs/1/pdf --output job_1.pdf
```

## Workflow 3: Track Interview Progress
```bash
# 1. Mark as "entretien" (interview scheduled)
curl -X PATCH http://localhost:8000/jobs/5 \
  -d '{"status": "entretien"}'

# 2. Update score after interview
curl -X PATCH http://localhost:8000/jobs/5 \
  -d '{"score": 9.5}'

# 3. Check dashboard to see interview count
curl http://localhost:8000/dashboard/stats | jq '.by_status'
```

---

# 📈 Data Included

The system comes with **sample data**:
- ✅ 5 Agents (LinkedIn, Xing, Indeed, Agentur, Chef)
- ✅ 10+ Sample jobs to test with
- ✅ Multiple companies from different cities
- ✅ Various job types and domains

**Note**: Sample jobs are mock data for testing. Real data comes from actual agents.

---

# 🚨 Troubleshooting

## Port Already in Use
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Or use different port in docker-compose.yml
# Change "8000:8000" to "8001:8000"
```

## Services Won't Start
```bash
# Check Docker is running
docker ps

# Check logs
docker-compose logs

# Restart everything
docker-compose down -v
docker-compose up -d
```

## Database Connection Error
```bash
# Verify PostgreSQL is running
docker-compose logs postgres

# Restart database
docker-compose restart postgres

# Give it time to start (30 seconds)
sleep 30
curl http://localhost:8000/health
```

## Frontend Not Loading
```bash
# Check if backend is accessible
curl http://localhost:8000/health

# View frontend logs
docker-compose logs frontend

# Restart frontend
docker-compose restart frontend
```

---

# 📚 Next Reading

- **API_REFERENCE.md** — Complete API documentation
- **README.md** — Full project overview
- **SETUP.md** — Detailed setup guide

---

# 🎉 You're Ready!

Your AI Job Agents Platform is now **fully operational**:

✅ Frontend dashboard ready at http://localhost:3000
✅ REST API available at http://localhost:8000
✅ Database with sample data in PostgreSQL
✅ Agents ready to scrape jobs
✅ Notifications system ready (add Telegram token in .env)
✅ PDF export working

**Start by opening http://localhost:3000 and clicking the "Run Now" button on any agent!**

---

**Questions?** Check API_REFERENCE.md for endpoint examples and SETUP.md for detailed configuration.
