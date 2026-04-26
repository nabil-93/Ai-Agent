#!/bin/bash

# AI Job Agents Platform - Automatic Startup Script
# This script starts everything and provides all necessary information

set -e

echo "=================================="
echo "🚀 AI Job Agents Platform Startup"
echo "=================================="
echo ""

# Check prerequisites
echo "✅ Checking prerequisites..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker Desktop."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found. Please install Docker Desktop."
    exit 1
fi

echo "✅ Docker & Docker Compose found"
echo ""

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env created (check and update if needed)"
else
    echo "✅ .env already exists"
fi

echo ""
echo "=================================="
echo "🐳 Starting Docker services..."
echo "=================================="
echo ""

# Stop old containers if any
docker-compose down -v 2>/dev/null || true

# Start all services
docker-compose up -d

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check PostgreSQL
echo ""
echo "🔍 Checking PostgreSQL..."
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U jobagent &> /dev/null; then
        echo "✅ PostgreSQL is ready"
        break
    fi
    echo "  Waiting... ($i/30)"
    sleep 1
done

# Check Redis
echo ""
echo "🔍 Checking Redis..."
if docker-compose exec -T redis redis-cli ping &> /dev/null; then
    echo "✅ Redis is ready"
fi

# Initialize database
echo ""
echo "📊 Initializing database..."
docker-compose exec -T backend python << 'EOF'
import asyncio
from app.core.database import init_db, AsyncSessionLocal
from app.models.agent import Agent, AgentSource, AgentStatus
from sqlalchemy import insert

async def setup():
    # Create tables
    await init_db()
    print("✅ Database tables created")

    # Insert initial agents
    async with AsyncSessionLocal() as session:
        # Check if agents already exist
        from sqlalchemy import select
        stmt = select(Agent)
        result = await session.execute(stmt)
        existing = result.scalars().first()

        if not existing:
            agents = [
                Agent(
                    name="LinkedIn Agent",
                    source=AgentSource.LINKEDIN,
                    task="Search and scrape jobs from LinkedIn",
                    status=AgentStatus.IDLE,
                    enabled=1
                ),
                Agent(
                    name="Xing Agent",
                    source=AgentSource.XING,
                    task="Search and scrape jobs from Xing",
                    status=AgentStatus.IDLE,
                    enabled=1
                ),
                Agent(
                    name="Indeed Agent",
                    source=AgentSource.INDEED,
                    task="Search and scrape jobs from Indeed",
                    status=AgentStatus.IDLE,
                    enabled=1
                ),
                Agent(
                    name="Agentur für Arbeit Agent",
                    source=AgentSource.AGENTUR,
                    task="Search and scrape jobs from Agentur für Arbeit",
                    status=AgentStatus.IDLE,
                    enabled=1
                ),
                Agent(
                    name="Chef Agent",
                    source=AgentSource.CHEF,
                    task="Aggregate, deduplicate, and score jobs",
                    status=AgentStatus.IDLE,
                    enabled=1
                ),
            ]
            session.add_all(agents)
            await session.commit()
            print("✅ Initial agents created")
        else:
            print("✅ Agents already exist")

asyncio.run(setup())
EOF

echo ""
echo "✅ Database initialization complete"
echo ""

# Get container info
echo "=================================="
echo "📋 Service Information"
echo "=================================="
echo ""

echo "🌐 Frontend:"
echo "   URL: http://localhost:3000"
echo "   Status: $(docker-compose ps frontend | tail -1 | awk '{print $NF}')"
echo ""

echo "⚙️  Backend API:"
echo "   URL: http://localhost:8000"
echo "   Docs: http://localhost:8000/docs"
echo "   ReDoc: http://localhost:8000/redoc"
echo "   Health: http://localhost:8000/health"
echo "   Status: $(docker-compose ps backend | tail -1 | awk '{print $NF}')"
echo ""

echo "🗄️  PostgreSQL:"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   User: jobagent"
echo "   Password: jobagent123"
echo "   Database: ai_job_agents"
echo "   Status: $(docker-compose ps postgres | tail -1 | awk '{print $NF}')"
echo ""

echo "🔴 Redis:"
echo "   Host: localhost"
echo "   Port: 6379"
echo "   Status: $(docker-compose ps redis | tail -1 | awk '{print $NF}')"
echo ""

echo "⚙️  Celery Worker:"
echo "   Status: $(docker-compose ps celery_worker | tail -1 | awk '{print $NF}')"
echo ""

echo "⏰ Celery Beat:"
echo "   Status: $(docker-compose ps celery_beat | tail -1 | awk '{print $NF}')"
echo ""

# Display all containers
echo "=================================="
echo "📦 All Running Containers"
echo "=================================="
echo ""
docker-compose ps
echo ""

# Test backend health
echo "=================================="
echo "🧪 Testing Backend Health"
echo "=================================="
echo ""

HEALTH=$(curl -s http://localhost:8000/health)
echo "Health Check Response:"
echo "$HEALTH" | jq . 2>/dev/null || echo "$HEALTH"
echo ""

# Create API test script
echo "=================================="
echo "✅ Setup Complete!"
echo "=================================="
echo ""
echo "📚 Next Steps:"
echo ""
echo "1. Open Frontend:"
echo "   → http://localhost:3000"
echo ""
echo "2. View API Documentation:"
echo "   → http://localhost:8000/docs"
echo ""
echo "3. Trigger an Agent (in separate terminal):"
echo "   → curl -X POST http://localhost:8000/agents/1/run"
echo ""
echo "4. View Logs:"
echo "   → docker-compose logs -f backend"
echo "   → docker-compose logs -f celery_worker"
echo ""
echo "5. Access Database:"
echo "   → docker-compose exec postgres psql -U jobagent -d ai_job_agents"
echo ""
echo "=================================="
echo "💡 Useful Commands"
echo "=================================="
echo ""
echo "# Stop all services"
echo "docker-compose down"
echo ""
echo "# View logs in real-time"
echo "docker-compose logs -f"
echo ""
echo "# Connect to database"
echo "docker-compose exec postgres psql -U jobagent -d ai_job_agents"
echo ""
echo "# Connect to Redis"
echo "docker-compose exec redis redis-cli"
echo ""
echo "=================================="
