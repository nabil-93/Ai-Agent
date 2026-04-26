# AI Job Agents Platform — Production SaaS

Automated multi-agent job search platform for Germany. Scrapes jobs from LinkedIn, Xing, Indeed, and Agentur für Arbeit. Uses AI for intelligent ranking, PDF export, and Telegram notifications.

## Tech Stack

- **Backend**: FastAPI + Async SQLAlchemy + PostgreSQL
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Zustand
- **Agents**: Python async scrapers + Chef orchestrator
- **Queue**: Celery + Redis
- **Notifications**: Telegram Bot API
- **Export**: ReportLab PDF generation

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)

### 1. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

Key environment variables:
```env
DATABASE_URL=postgresql+asyncpg://jobagent:jobagent123@postgres:5432/ai_job_agents
REDIS_URL=redis://redis:6379/0
SECRET_KEY=your-super-secret-key-change-in-production
TELEGRAM_BOT_TOKEN=your-bot-token (optional)
TELEGRAM_CHAT_ID=your-chat-id (optional)
```

### 2. Start with Docker Compose

```bash
docker-compose up -d
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- FastAPI Backend (port 8000)
- React Frontend (port 3000)
- Celery Worker
- Celery Beat Scheduler

### 3. Initialize Database

```bash
docker-compose exec backend python -m alembic upgrade head
```

### 4. Access the Platform

- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Architecture

### Backend Structure

```
backend/
├── app/
│   ├── api/routes/           # FastAPI routers
│   │   ├── jobs.py
│   │   ├── agents.py
│   │   └── dashboard.py
│   ├── agents/               # Job scraping agents
│   │   ├── base_agent.py
│   │   ├── linkedin_agent.py
│   │   ├── xing_agent.py
│   │   ├── indeed_agent.py
│   │   ├── agentur_agent.py
│   │   └── chef_agent.py
│   ├── models/               # SQLAlchemy ORM
│   │   ├── job.py
│   │   ├── agent.py
│   │   └── company.py
│   ├── schemas/              # Pydantic validators
│   ├── core/                 # Config, DB, Security
│   ├── services/             # Business logic
│   │   ├── telegram.py       # Telegram notifications
│   │   ├── pdf_export.py     # PDF generation
│   │   └── deduplication.py  # Job deduplication
│   └── tasks/                # Celery tasks
├── main.py                   # FastAPI entry point
└── requirements.txt
```

### Frontend Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── Dashboard.tsx     # Main stats dashboard
│   │   ├── Jobs.tsx          # Jobs list with filters
│   │   └── Agents.tsx        # Agent management
│   ├── components/           # Reusable components
│   ├── store/
│   │   └── useJobStore.ts    # Zustand state management
│   ├── api/
│   │   └── client.ts         # Axios HTTP client
│   ├── App.tsx              # Main router
│   └── main.tsx             # Entry point
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## API Endpoints

### Jobs
- `GET /jobs` — List jobs with filters
- `GET /jobs/{id}` — Get job details
- `PATCH /jobs/{id}` — Update job status
- `GET /jobs/{id}/pdf` — Download job as PDF

### Agents
- `GET /agents` — List all agents
- `GET /agents/{id}` — Get agent details
- `POST /agents/{id}/run` — Trigger agent immediately
- `POST /agents/{id}/enable` — Enable agent
- `POST /agents/{id}/disable` — Disable agent

### Dashboard
- `GET /dashboard/stats` — Get dashboard statistics
- `GET /dashboard/recent-jobs` — Get recent jobs

## Data Models

### Job
- id, title, company_id, location, job_type, domain
- description, link, email, phone, source
- status (en_cours, envoye, entretien, refus)
- score, salary_min, salary_max, created_at

### Agent
- id, name, source (linkedin, xing, indeed, agentur)
- task, status (active, idle, running, error)
- last_run, jobs_found_total, jobs_found_last_run
- enabled, config (JSON)

### Company
- id, name, location, website, contact_email, contact_phone

## Agent System

### How It Works

1. **LinkedIn/Xing/Indeed/Agentur Agents** scrape jobs from respective sources
2. Send jobs to **Chef Agent** via message queue
3. **Chef Agent**:
   - Deduplicates by hash(title+company)
   - Scores jobs based on keyword relevance
   - Stores in PostgreSQL
   - Queues notifications to Telegram
4. **Celery Beat** runs all agents every 4 hours
5. Manual trigger available via API

### Creating a Custom Agent

```python
from app.agents.base_agent import BaseJobAgent, JobData
from app.models.agent import AgentSource

class CustomAgent(BaseJobAgent):
    def __init__(self):
        super().__init__(AgentSource.CUSTOM)
    
    async def search(self, keywords: list[str], location: str) -> list[JobData]:
        # Implement scraping logic
        jobs = [
            JobData(
                title="Job Title",
                company="Company Name",
                location="City",
                job_type="Vollzeit",
                domain="IT",
                link="https://example.com",
            )
        ]
        return jobs
```

## Telegram Notifications

When new jobs are found, the platform sends Telegram messages:

1. Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in `.env`
2. Platform automatically notifies on new jobs
3. Format: Title, Company, Location, Domain, Salary, Link

## PDF Export

Download individual job offers as formatted PDF files:
- GET `/jobs/{id}/pdf` returns downloadable PDF
- Includes: Title, Company, Location, Description, Contact Info, Link

## Filtering & Search

### Available Filters
- **City**: Filter by location (ilike match)
- **Job Type**: Werkstudent, Praktikum, Vollzeit
- **Domain**: IT, Software, Data, SAP, Cloud, etc.
- **Status**: en_cours, envoye, entretien, refus
- **Source**: linkedin, xing, indeed, agentur
- **Days**: Last N days (default 7)

### Scoring Algorithm
- Title keyword match: +2 points
- Description keyword match: +1 point
- Location match: +1.5 points
- Normalized to 0-10 scale

## Development

### Local Backend Development

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Local Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Running Celery Workers Locally

```bash
# In separate terminal from backend
celery -A app.tasks.celery_app worker --loglevel=info

# In another terminal
celery -A app.tasks.celery_app beat --loglevel=info
```

## Database Migrations

Using Alembic for schema management:

```bash
# Create migration
docker-compose exec backend alembic revision --autogenerate -m "message"

# Apply migrations
docker-compose exec backend alembic upgrade head

# Downgrade
docker-compose exec backend alembic downgrade -1
```

## Monitoring

### Logs
```bash
docker-compose logs -f backend
docker-compose logs -f celery_worker
docker-compose logs -f frontend
```

### Database
Access PostgreSQL:
```bash
docker-compose exec postgres psql -U jobagent -d ai_job_agents
```

### Redis
Check Redis:
```bash
docker-compose exec redis redis-cli
> INFO
> KEYS *
```

## Performance Tuning

### Database
- Indexed on: location, source, status, created_at, score
- Composite index on (title, company_id)
- Connection pool size: configured for 20 connections

### Celery
- Worker prefetch_multiplier: 1 (process one task at a time)
- Task soft timeout: 25 min
- Task hard timeout: 30 min

### Frontend
- Uses Zustand for lightweight state management
- Tailwind CSS for optimized styling
- React Router for SPA navigation

## Security

- JWT authentication ready (infrastructure in place)
- CORS configured for frontend origin
- SQL injection protection via SQLAlchemy ORM
- Password hashing with bcrypt
- Environment variables for sensitive data

## Roadmap

### Phase 1 (Current) — MVP
- ✅ Multi-agent scraping framework
- ✅ Dashboard with statistics
- ✅ Job filtering and search
- ✅ Status tracking
- ✅ PDF export
- ✅ Telegram notifications

### Phase 2 — Advanced Features
- [ ] CV-to-Job matching
- [ ] Automatic application workflow
- [ ] Advanced analytics
- [ ] Custom agent builder UI
- [ ] Email notifications

### Phase 3 — Scale
- [ ] Mobile app
- [ ] Chrome extension
- [ ] Real-time WebSocket updates
- [ ] Kubernetes deployment
- [ ] Multi-tenant SaaS pricing

## Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Make changes with clean commits
3. Push and create pull request
4. Ensure tests pass

## License

Proprietary - AI Job Agents Platform © 2024

## Support

- API Documentation: http://localhost:8000/docs
- Issues: Report via GitHub
- Email: support@aijobagents.de

---

**Built with ❤️ using FastAPI, React, and CrewAI**
