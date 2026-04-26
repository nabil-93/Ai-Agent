# API Reference — Complete Endpoint Documentation

**Base URL**: `http://localhost:8000`

---

## 🏥 Health & Status

### Health Check
```
GET /health
```
**Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:45.123456"
}
```

### Root Info
```
GET /
```
**Response** (200 OK):
```json
{
  "app": "AI Job Agents Platform",
  "version": "1.0.0",
  "status": "running",
  "environment": "development"
}
```

---

## 📋 Jobs Endpoints

### List Jobs (with Filters)
```
GET /jobs?page=1&page_size=10&city=Berlin&job_type=Vollzeit&domain=IT&status=en_cours&source=linkedin&days=7
```

**Query Parameters**:
- `page` (int, default=1) — Page number
- `page_size` (int, default=10, max=100) — Items per page
- `city` (string, optional) — Filter by city
- `job_type` (string, optional) — Werkstudent, Praktikum, Vollzeit
- `domain` (string, optional) — IT, Software, Data, SAP, etc.
- `status` (string, optional) — en_cours, envoye, entretien, refus
- `source` (string, optional) — linkedin, xing, indeed, agentur
- `days` (int, default=7) — Last N days

**Response** (200 OK):
```json
{
  "total": 150,
  "page": 1,
  "page_size": 10,
  "jobs": [
    {
      "id": 1,
      "title": "Senior Python Developer",
      "location": "Berlin",
      "job_type": "Vollzeit",
      "domain": "Software",
      "description": "We are looking for...",
      "link": "https://linkedin.com/jobs/...",
      "email": "jobs@company.de",
      "phone": "+49-30-123456",
      "source": "linkedin",
      "status": "en_cours",
      "score": 8.5,
      "salary_min": 50000,
      "salary_max": 80000,
      "salary_currency": "EUR",
      "created_at": "2024-01-15T10:15:30",
      "updated_at": "2024-01-15T10:15:30",
      "company": {
        "id": 1,
        "name": "TechCorp GmbH",
        "location": "Berlin"
      }
    }
  ]
}
```

**Example Requests**:
```bash
# Get all jobs
curl http://localhost:8000/jobs

# Get Berlin jobs only
curl "http://localhost:8000/jobs?city=Berlin"

# Get IT Vollzeit jobs from last 30 days
curl "http://localhost:8000/jobs?domain=IT&job_type=Vollzeit&days=30"

# Get jobs with status "envoye" (sent)
curl "http://localhost:8000/jobs?status=envoye"

# Pagination
curl "http://localhost:8000/jobs?page=2&page_size=20"
```

---

### Get Single Job
```
GET /jobs/{job_id}
```

**Parameters**:
- `job_id` (int) — Job ID

**Response** (200 OK):
```json
{
  "id": 1,
  "title": "Senior Python Developer",
  "location": "Berlin",
  "job_type": "Vollzeit",
  "domain": "Software",
  "description": "...",
  "link": "...",
  "email": "...",
  "phone": "...",
  "source": "linkedin",
  "status": "en_cours",
  "score": 8.5,
  "salary_min": 50000,
  "salary_max": 80000,
  "salary_currency": "EUR",
  "created_at": "2024-01-15T10:15:30",
  "updated_at": "2024-01-15T10:15:30",
  "company": {...}
}
```

**Example**:
```bash
curl http://localhost:8000/jobs/1
```

---

### Update Job Status
```
PATCH /jobs/{job_id}
```

**Parameters**:
- `job_id` (int) — Job ID

**Request Body**:
```json
{
  "status": "envoye",
  "score": 9.0,
  "description": "Updated description"
}
```

All fields optional. Will only update provided fields.

**Response** (200 OK):
```json
{
  "id": 1,
  "title": "Senior Python Developer",
  "status": "envoye",
  "score": 9.0,
  "...": "..."
}
```

**Example**:
```bash
# Mark job as sent
curl -X PATCH http://localhost:8000/jobs/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "envoye"}'

# Mark job as interview
curl -X PATCH http://localhost:8000/jobs/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "entretien"}'

# Mark as rejected
curl -X PATCH http://localhost:8000/jobs/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "refus"}'

# Update score
curl -X PATCH http://localhost:8000/jobs/1 \
  -H "Content-Type: application/json" \
  -d '{"score": 9.5}'
```

---

### Download Job as PDF
```
GET /jobs/{job_id}/pdf
```

**Parameters**:
- `job_id` (int) — Job ID

**Response**: PDF file (application/pdf)

**Example**:
```bash
# Download PDF to file
curl http://localhost:8000/jobs/1/pdf --output job_1.pdf

# Open in browser
curl http://localhost:8000/jobs/1/pdf > job.pdf && open job.pdf
```

---

## 🤖 Agents Endpoints

### List All Agents
```
GET /agents
```

**Response** (200 OK):
```json
{
  "agents": [
    {
      "id": 1,
      "name": "LinkedIn Agent",
      "source": "linkedin",
      "task": "Search and scrape jobs from LinkedIn",
      "status": "idle",
      "last_run": "2024-01-15T10:30:00",
      "last_error": null,
      "jobs_found_total": 150,
      "jobs_found_last_run": 25,
      "run_count": 12,
      "enabled": 1,
      "created_at": "2024-01-15T08:00:00",
      "updated_at": "2024-01-15T10:30:00"
    },
    {
      "id": 2,
      "name": "Xing Agent",
      "source": "xing",
      "task": "Search and scrape jobs from Xing",
      "status": "idle",
      "last_run": "2024-01-15T10:15:00",
      "last_error": null,
      "jobs_found_total": 120,
      "jobs_found_last_run": 18,
      "run_count": 10,
      "enabled": 1,
      "created_at": "2024-01-15T08:00:00",
      "updated_at": "2024-01-15T10:15:00"
    },
    {...},
    {...}
  ],
  "total": 5
}
```

**Example**:
```bash
curl http://localhost:8000/agents
```

---

### Get Single Agent
```
GET /agents/{agent_id}
```

**Parameters**:
- `agent_id` (int) — Agent ID (1=LinkedIn, 2=Xing, 3=Indeed, 4=Agentur, 5=Chef)

**Response** (200 OK):
```json
{
  "id": 1,
  "name": "LinkedIn Agent",
  "source": "linkedin",
  "task": "Search and scrape jobs from LinkedIn",
  "status": "idle",
  "last_run": "2024-01-15T10:30:00",
  "jobs_found_total": 150,
  "jobs_found_last_run": 25,
  "enabled": 1,
  "...": "..."
}
```

**Example**:
```bash
curl http://localhost:8000/agents/1
```

---

### Trigger Agent to Run Now
```
POST /agents/{agent_id}/run
```

**Parameters**:
- `agent_id` (int) — Agent ID

**Response** (200 OK):
```json
{
  "status": "queued",
  "agent_id": 1,
  "agent_name": "LinkedIn Agent",
  "task_id": "abc123def456"
}
```

Agent will start processing in background. Check `/dashboard/stats` to see results.

**Example**:
```bash
# Run LinkedIn agent
curl -X POST http://localhost:8000/agents/1/run

# Run Xing agent
curl -X POST http://localhost:8000/agents/2/run

# Run Indeed agent
curl -X POST http://localhost:8000/agents/3/run

# Run all agents (one by one)
for i in 1 2 3 4; do
  curl -X POST http://localhost:8000/agents/$i/run
  echo "Agent $i triggered"
done
```

---

### Enable Agent
```
POST /agents/{agent_id}/enable
```

**Response** (200 OK):
```json
{
  "status": "enabled",
  "agent_id": 1
}
```

**Example**:
```bash
curl -X POST http://localhost:8000/agents/1/enable
```

---

### Disable Agent
```
POST /agents/{agent_id}/disable
```

**Response** (200 OK):
```json
{
  "status": "disabled",
  "agent_id": 1
}
```

**Example**:
```bash
curl -X POST http://localhost:8000/agents/1/disable
```

---

## 📊 Dashboard Endpoints

### Get Dashboard Statistics
```
GET /dashboard/stats
```

**Response** (200 OK):
```json
{
  "summary": {
    "total_jobs": 450,
    "today_jobs": 35,
    "week_jobs": 180,
    "active_agents": 4,
    "avg_score": 7.2
  },
  "by_status": {
    "en_cours": 320,
    "envoye": 80,
    "entretien": 35,
    "refus": 15
  },
  "by_source": {
    "linkedin": 150,
    "xing": 120,
    "indeed": 100,
    "agentur": 80
  },
  "top_domains": {
    "IT": 120,
    "Software": 100,
    "Data": 85,
    "SAP": 60,
    "Cloud": 55
  },
  "top_locations": {
    "Berlin": 95,
    "Munich": 80,
    "Hamburg": 65,
    "Frankfurt": 60,
    "Stuttgart": 55
  }
}
```

**Example**:
```bash
curl http://localhost:8000/dashboard/stats
```

---

### Get Recent Jobs
```
GET /dashboard/recent-jobs?limit=10
```

**Query Parameters**:
- `limit` (int, default=10) — Number of recent jobs to return

**Response** (200 OK):
```json
{
  "count": 10,
  "jobs": [
    {
      "id": 450,
      "title": "Python Developer",
      "company_id": 25,
      "location": "Berlin",
      "source": "linkedin",
      "created_at": "2024-01-15T11:30:00",
      "score": 8.5
    },
    {...}
  ]
}
```

**Example**:
```bash
# Get 10 most recent jobs
curl http://localhost:8000/dashboard/recent-jobs

# Get 20 most recent jobs
curl "http://localhost:8000/dashboard/recent-jobs?limit=20"
```

---

## 🔍 Common API Use Cases

### 1. Get all IT jobs from Berlin
```bash
curl "http://localhost:8000/jobs?domain=IT&city=Berlin"
```

### 2. Get jobs I haven't applied to yet
```bash
curl "http://localhost:8000/jobs?status=en_cours&page=1&page_size=50"
```

### 3. Get jobs from last 3 days
```bash
curl "http://localhost:8000/jobs?days=3"
```

### 4. Get job and download as PDF
```bash
curl http://localhost:8000/jobs/123/pdf --output job_123.pdf
```

### 5. Update job status after applying
```bash
curl -X PATCH http://localhost:8000/jobs/123 \
  -H "Content-Type: application/json" \
  -d '{"status": "envoye", "score": 9.0}'
```

### 6. Get dashboard stats
```bash
curl http://localhost:8000/dashboard/stats | jq
```

### 7. Trigger agent and wait for results
```bash
curl -X POST http://localhost:8000/agents/1/run
echo "Agent triggered. Check dashboard in a few seconds..."
sleep 5
curl http://localhost:8000/dashboard/stats
```

### 8. Disable agent
```bash
curl -X POST http://localhost:8000/agents/1/disable
```

### 9. Enable agent
```bash
curl -X POST http://localhost:8000/agents/1/enable
```

---

## 📌 Data Types & Enums

### JobType
- `Werkstudent` — Student job (min wage work)
- `Praktikum` — Internship
- `Vollzeit` — Full-time

### JobStatus
- `en_cours` — Ongoing (not yet applied)
- `envoye` — Sent (applied)
- `entretien` — Interview
- `refus` — Rejected

### JobSource
- `linkedin` — LinkedIn
- `xing` — Xing
- `indeed` — Indeed
- `agentur` — Agentur für Arbeit

### AgentStatus
- `active` — Active/available
- `idle` — Idle (not running)
- `running` — Currently running
- `error` — Last run had error

### AgentSource
- `linkedin` — LinkedIn scraper
- `xing` — Xing scraper
- `indeed` — Indeed scraper
- `agentur` — Agentur für Arbeit scraper
- `chef` — Chef/orchestrator agent

---

## 🧪 Testing with curl

All examples above use `curl`. You can also:

### Use Swagger UI
Open http://localhost:8000/docs in browser

### Use ReDoc
Open http://localhost:8000/redoc in browser

### Use Postman
1. Import OpenAPI spec: http://localhost:8000/openapi.json
2. Create requests
3. Test endpoints

### Use Python
```python
import requests

# Get jobs
response = requests.get("http://localhost:8000/jobs")
jobs = response.json()
print(jobs)

# Update job
response = requests.patch(
    "http://localhost:8000/jobs/1",
    json={"status": "envoye"}
)
print(response.json())

# Download PDF
response = requests.get("http://localhost:8000/jobs/1/pdf")
with open("job.pdf", "wb") as f:
    f.write(response.content)
```

### Use JavaScript/Node.js
```javascript
// Get jobs
const response = await fetch("http://localhost:8000/jobs");
const jobs = await response.json();
console.log(jobs);

// Update job
const updateResponse = await fetch("http://localhost:8000/jobs/1", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ status: "envoye" })
});
const updated = await updateResponse.json();
console.log(updated);
```

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid job type"
}
```

### 404 Not Found
```json
{
  "detail": "Job not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## 📈 Performance Tips

1. **Use pagination**: Get 50 items instead of all
2. **Filter early**: Reduce results client-side by filtering on server
3. **Cache results**: Use Redis (already configured)
4. **Batch requests**: Get multiple jobs in one request
5. **Use parallel requests**: Trigger multiple agents at once

---

**API Documentation Generated**: 2024-01-15
**Version**: 1.0.0
**Status**: Production Ready
