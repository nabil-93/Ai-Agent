import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.agent import Agent, AgentSource

logger = logging.getLogger(__name__)


# === Default config values (used when Agent row has nothing set) ===
DEFAULT_KEYWORDS = ["Python", "IT", "Data", "SAP", "Cloud", "Software", "JavaScript"]
DEFAULT_LOCATION = "Berlin"
DEFAULT_DOMAIN = "IT"


@dataclass
class AgentConfig:
    """Runtime configuration for an agent run, loaded from the DB Agent row."""
    keywords: list[str] = field(default_factory=list)
    location: Optional[str] = None
    domain: Optional[str] = None
    api_key: Optional[str] = None
    current_page: int = 1
    per_page: int = 5

    @classmethod
    def from_agent(cls, agent: Agent) -> "AgentConfig":
        """Build AgentConfig from an SQLAlchemy Agent row, applying defaults."""
        return cls(
            keywords=list(agent.keywords) if agent.keywords else list(DEFAULT_KEYWORDS),
            location=agent.location or DEFAULT_LOCATION,
            domain=agent.domain or DEFAULT_DOMAIN,
            api_key=agent.api_key,
            current_page=agent.current_page or 1,
        )


class JobData:
    """Data class for scraped job information."""

    def __init__(
        self,
        title: str,
        company: str,
        location: str,
        job_type: str,
        domain: str,
        description: Optional[str] = None,
        link: Optional[str] = None,
        email: Optional[str] = None,
        phone: Optional[str] = None,
        salary_min: Optional[float] = None,
        salary_max: Optional[float] = None,
    ):
        self.title = title
        self.company = company
        self.location = location
        self.job_type = job_type
        self.domain = domain
        self.description = description
        self.link = link or ""
        self.email = email
        self.phone = phone
        self.salary_min = salary_min
        self.salary_max = salary_max

    def to_dict(self) -> dict:
        return {
            "title": self.title,
            "company": self.company,
            "location": self.location,
            "job_type": self.job_type,
            "domain": self.domain,
            "description": self.description,
            "link": self.link,
            "email": self.email,
            "phone": self.phone,
            "salary_min": self.salary_min,
            "salary_max": self.salary_max,
        }


class BaseJobAgent(ABC):
    """Base class for all job hunters.

    Subclasses must implement BOTH paths:
      - search_with_api()  — used when AgentConfig.api_key is set
      - scrape_jobs()       — used when no api_key (free / fallback path)

    The public entry point is search(): it dispatches based on api_key.
    """

    def __init__(self, source: AgentSource):
        self.source = source
        self.logger = logging.getLogger(f"agent.{source.value}")

    async def search(self, config: AgentConfig) -> list[JobData]:
        """Dispatcher: routes to API or scraping based on config.api_key."""
        if config.api_key:
            self.logger.info(
                f"[{self.source.value}] API mode | page={config.current_page} | "
                f"keywords={config.keywords} | location={config.location}"
            )
            return await self.search_with_api(config)

        self.logger.info(
            f"[{self.source.value}] Scrape mode | page={config.current_page} | "
            f"keywords={config.keywords} | location={config.location}"
        )
        return await self.scrape_jobs(config)

    @abstractmethod
    async def search_with_api(self, config: AgentConfig) -> list[JobData]:
        """Authenticated path: call the source's API using config.api_key."""

    @abstractmethod
    async def scrape_jobs(self, config: AgentConfig) -> list[JobData]:
        """Unauthenticated path: scrape public listings."""

    async def send_to_chef(self, jobs: list[JobData]) -> int:
        """Send scraped jobs to Chef Agent for processing."""
        try:
            jobs_count = len(jobs)
            self.logger.info(f"Sending {jobs_count} jobs to Chef Agent")

            async with AsyncSessionLocal() as session:
                stmt = select(Agent).where(Agent.source == self.source)
                result = await session.execute(stmt)
                agent = result.scalar_one_or_none()

                if agent:
                    agent.jobs_found_last_run = jobs_count
                    agent.jobs_found_total += jobs_count
                    agent.last_run = datetime.utcnow()
                    await session.commit()

            return jobs_count
        except Exception as e:
            self.logger.error(f"Error sending jobs to chef: {str(e)}")
            return 0

    def validate_job_data(self, job: JobData) -> bool:
        """Validate scraped job data."""
        if not job.title or not job.company or not job.location:
            return False
        if not job.link:
            return False
        return True
