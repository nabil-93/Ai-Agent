# 📋 LAUNCH CHECKLIST — Step-by-Step Setup

Complete this checklist to get your AI Job Agents Platform running.

---

## ✅ Phase 1: Prerequisites (5 minutes)

### Check System Requirements
- [ ] Windows 10/11 with WSL2 enabled (or Docker Desktop for Mac/Linux)
- [ ] Docker Desktop installed (https://www.docker.com/products/docker-desktop)
- [ ] At least 8GB RAM available
- [ ] At least 10GB disk space available
- [ ] Internet connection

**Verify Installation**:
```bash
docker --version  # Should be 20.10+
docker-compose --version  # Should be 2.0+
```

---

## ✅ Phase 2: Project Setup (2 minutes)

### Navigate to Project
```bash
cd "c:\Users\nabil\Desktop\liste des P\AI Agent"
```

### Copy Environment File
```bash
copy .env.example .env
```
- [ ] .env file created
- [ ] File is in project root directory

### Verify File Structure
```bash
dir /B | find "docker-compose"
dir /B | find "README"
dir /B | find "backend"
dir /B | find "frontend"
```

Check these files exist:
- [ ] docker-compose.yml
- [ ] .env
- [ ] .env.example
- [ ] README.md
- [ ] SETUP.md
- [ ] QUICKSTART.md
- [ ] API_REFERENCE.md
- [ ] backend/ folder
- [ ] frontend/ folder

---

## ✅ Phase 3: Docker Services (3 minutes)

### Start All Services
```bash
docker-compose up -d
```

Watch for output:
- [ ] PostgreSQL container created
- [ ] Redis container created
- [ ] Backend container created
- [ ] Frontend container created
- [ ] Celery worker created
- [ ] Celery beat created

### Verify Services Running
```bash
docker-compose ps
```

All containers should show `Up`:
- [ ] ai_job_agents_postgres — Up
- [ ] ai_job_agents_redis — Up
- [ ] ai_job_agents_backend — Up
- [ ] ai_job_agents_frontend — Up
- [ ] ai_job_agents_celery_worker — Up
- [ ] ai_job_agents_celery_beat — Up

### Wait for Services to Initialize
```bash
timeout /t 30
```
- [ ] Waited 30 seconds for services to boot

---

## ✅ Phase 4: Service Health Checks (2 minutes)

### Check Backend Health
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{"status": "healthy", "timestamp": "..."}
```
- [ ] Backend responds with healthy status

### Check Frontend Accessibility
Open in browser: http://localhost:3000
- [ ] Frontend dashboard loads
- [ ] Navigation bar visible
- [ ] No error messages

### Check API Documentation
Open in browser: http://localhost:8000/docs
- [ ] Swagger UI loads
- [ ] All endpoints listed
- [ ] Can interact with endpoints

### Check Database Connection
```bash
docker-compose exec postgres psql -U jobagent -d ai_job_agents -c "SELECT COUNT(*) FROM agents;"
```

Expected response: Should show `5` (5 agents)
- [ ] Database connection works
- [ ] Agents table has data

### Check Redis Connection
```bash
docker-compose exec redis redis-cli ping
```

Expected response: `PONG`
- [ ] Redis connection works

---

## ✅ Phase 5: Basic API Tests (5 minutes)

### Test 1: Get All Jobs
```bash
curl http://localhost:8000/jobs
```
- [ ] Returns JSON with jobs array
- [ ] Response includes pagination info

### Test 2: List Agents
```bash
curl http://localhost:8000/agents
```
- [ ] Returns 5 agents (LinkedIn, Xing, Indeed, Agentur, Chef)
- [ ] All agents show "idle" status

### Test 3: Get Dashboard Stats
```bash
curl http://localhost:8000/dashboard/stats
```
- [ ] Returns statistics object
- [ ] Shows summary, by_status, by_source, top_domains, top_locations

### Test 4: Trigger Agent
```bash
curl -X POST http://localhost:8000/agents/1/run
```
- [ ] Returns `{"status": "queued", ...}`
- [ ] Task ID provided

### Test 5: Update Job Status
```bash
curl -X PATCH http://localhost:8000/jobs/1 ^
  -H "Content-Type: application/json" ^
  -d "{\"status\": \"envoye\"}"
```
- [ ] Returns updated job with new status
- [ ] Status successfully changed

---

## ✅ Phase 6: Frontend Testing (3 minutes)

### Test Dashboard Page
http://localhost:3000

Check elements:
- [ ] Navigation bar visible with 3 links (Dashboard, Jobs, Agents)
- [ ] Stat cards visible (Total Jobs, Today, Week, Active Agents)
- [ ] Status distribution chart visible
- [ ] Jobs by source visible
- [ ] Top domains & locations visible

### Test Jobs Page
http://localhost:3000/jobs

Check elements:
- [ ] Jobs list loads
- [ ] Filter sidebar visible (city, type, domain, status, source)
- [ ] Job cards displayed with title, company, location
- [ ] Action buttons visible (View, PDF download)
- [ ] Pagination controls visible

### Test Agents Page
http://localhost:3000/agents

Check elements:
- [ ] All 5 agents displayed
- [ ] Agent cards show name, source, status
- [ ] Statistics visible (total jobs found, last run)
- [ ] "Run Now" button visible for each agent

---

## ✅ Phase 7: Optional Telegram Setup (5 minutes)

### Get Telegram Bot Token (Optional)
1. Chat with @BotFather on Telegram
2. Send `/newbot`
3. Follow prompts to create bot
4. Copy bot token (looks like `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

### Get Your Chat ID (Optional)
1. Message your new bot
2. Visit: `https://api.telegram.org/botYOUR_TOKEN/getUpdates`
3. Find your chat ID in the response

### Update .env File
```bash
# Edit .env and add:
TELEGRAM_BOT_TOKEN=your_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

Restart backend:
```bash
docker-compose restart backend
```

- [ ] TELEGRAM_BOT_TOKEN set (or empty to skip)
- [ ] TELEGRAM_CHAT_ID set (or empty to skip)
- [ ] Backend restarted

---

## ✅ Phase 8: Documentation Review (5 minutes)

### Read Documentation
- [ ] Opened and skimmed README.md
- [ ] Reviewed QUICKSTART.md
- [ ] Checked API_REFERENCE.md for endpoint examples
- [ ] Bookmarked documentation for later

### Bookmark Important URLs
- [ ] Frontend: http://localhost:3000
- [ ] API Docs: http://localhost:8000/docs
- [ ] API Reference: See API_REFERENCE.md

---

## ✅ Phase 9: First Real Test (2 minutes)

### Trigger an Agent and See Results

**Step 1**: Open http://localhost:3000 in browser

**Step 2**: Go to Agents page

**Step 3**: Click "Run Now" on any agent (try LinkedIn Agent first)

**Step 4**: You should see:
- [ ] Agent status changes to "running"
- [ ] Wait a few seconds
- [ ] Status changes back to "idle"
- [ ] Check backend logs for activity

**Step 5**: Go to Jobs page and refresh
- [ ] New jobs should appear (from mock data)
- [ ] Check total job count increased
- [ ] Jobs have scores assigned

**Step 6**: Go to Dashboard page and refresh
- [ ] Statistics updated with new jobs
- [ ] Charts show job distribution

---

## ✅ Phase 10: Production Readiness (Optional)

If you want to prepare for production:

### Security
- [ ] Changed SECRET_KEY in .env to random value
- [ ] Review .env file for any test values
- [ ] Disabled debug mode if needed

### Database
- [ ] Backup PostgreSQL config for production
- [ ] Reviewed database schema
- [ ] Understood data retention policy

### Monitoring
- [ ] Set up log monitoring
- [ ] Configured error tracking (optional)
- [ ] Set up performance monitoring (optional)

---

## 📋 Final Verification Checklist

Run these commands to verify everything is working:

```bash
# 1. All services running
docker-compose ps

# 2. Backend healthy
curl http://localhost:8000/health

# 3. Database accessible
docker-compose exec postgres psql -U jobagent -d ai_job_agents -c "\dt"

# 4. Redis working
docker-compose exec redis redis-cli ping

# 5. API responding
curl http://localhost:8000/jobs

# 6. Frontend loads
curl -s http://localhost:3000 | grep -q "AI Job Agents" && echo "Frontend OK"

# 7. No error logs
docker-compose logs --tail=20 | grep -i error || echo "No errors"
```

- [ ] All 7 checks pass

---

## 🎉 SUCCESS!

If you've completed this entire checklist, your **AI Job Agents Platform is fully operational!**

### What You Can Do Now:
✅ View dashboard with live statistics
✅ Browse jobs with advanced filters
✅ Trigger agents to scrape jobs
✅ Update job application status
✅ Download PDFs of job offers
✅ Use REST API for integration
✅ Monitor agent activity

### Next Steps:
1. **Explore the API**: Use http://localhost:8000/docs
2. **Read Documentation**: Check API_REFERENCE.md for examples
3. **Integrate Real Data**: Replace mock agents with real scrapers
4. **Deploy to Production**: Use SETUP.md for deployment guide
5. **Add Your Configuration**: Telegram, email, custom keywords

---

## 📞 Need Help?

| Issue | Solution |
|-------|----------|
| Service won't start | Check Docker is running: `docker ps` |
| Port 8000/3000 in use | Kill process or change port in docker-compose.yml |
| Database error | Restart PostgreSQL: `docker-compose restart postgres` |
| Frontend not loading | Check backend health: `curl http://localhost:8000/health` |
| API 404 errors | Verify endpoint URL against API_REFERENCE.md |
| Slow response | Check system resources: `docker stats` |

---

## 📊 Performance Baseline

Expected response times with sample data:

| Operation | Time |
|-----------|------|
| Dashboard load | <500ms |
| Jobs list (10 items) | <300ms |
| Get single job | <100ms |
| Update job | <200ms |
| Dashboard stats | <500ms |
| Trigger agent | <1000ms (queued) |

If slower, check system resources with `docker stats`

---

## ✨ You're All Set!

Your AI Job Agents Platform is ready to use. 

🎯 **Next**: Open http://localhost:3000 and start exploring!

---

**Checklist Version**: 1.0
**Last Updated**: 2024-01-15
**Status**: Ready for Production
