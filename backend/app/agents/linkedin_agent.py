import logging
import random
from app.agents.base_agent import BaseJobAgent, JobData, AgentConfig
from app.models.agent import AgentSource

logger = logging.getLogger(__name__)


TITLES = [
    "Senior Python Developer", "Data Scientist (Python)", "Junior Backend Engineer",
    "Machine Learning Engineer", "Cloud Architect (AWS)", "DevOps Engineer",
    "Full Stack Developer (React + Node)", "Software Engineer - Search",
    "Senior Java Developer", "Site Reliability Engineer",
]
COMPANIES = [
    "TechCorp GmbH", "Siemens Digital Industries", "SAP SE", "BMW Group IT",
    "Lufthansa Systems", "Allianz Technology", "Mercedes-Benz Tech",
    "Bosch Digital", "Deutsche Bank Tech", "Zalando SE",
]
CITIES = ["Berlin", "München", "Hamburg", "Frankfurt am Main", "Stuttgart", "Köln", "Düsseldorf", "Remote"]
DOMAINS = ["IT & Software", "Data & AI", "Cloud", "DevOps", "SAP"]


class LinkedInAgent(BaseJobAgent):
    """LinkedIn job hunter — supports both API (with key) and scraping paths."""

    def __init__(self):
        super().__init__(AgentSource.LINKEDIN)

    # ---------- API path ----------
    async def search_with_api(self, config: AgentConfig) -> list[JobData]:
        # In production this would call the LinkedIn API with config.api_key.
        # Here we emit a slightly different shape so the path is observable.
        page = config.current_page
        per_page = config.per_page + 2  # API typically fetches more
        start = (page - 1) * per_page
        location = config.location or random.choice(CITIES)
        domain = config.domain or random.choice(DOMAINS)
        kw = config.keywords or ["Python"]

        jobs: list[JobData] = []
        for i in range(per_page):
            title = TITLES[(start + i) % len(TITLES)]
            company = COMPANIES[(start + i + 3) % len(COMPANIES)]
            jt = random.choices(["Vollzeit", "Werkstudent", "Praktikum"], weights=[7, 2, 1])[0]
            sal_min = random.choice([55000, 65000, 75000, 85000])
            sal_max = sal_min + random.choice([15000, 20000, 30000])
            jobs.append(JobData(
                title=title,
                company=company,
                location=location,
                job_type=jt,
                domain=domain,
                description=f"[LinkedIn API · page {page}] {company} sucht {title} in {location}. "
                            f"Treffer auf Basis von {', '.join(kw[:3])}. "
                            f"Premium-Match via LinkedIn Talent Solutions.",
                link=f"https://api.linkedin.com/v2/jobPosts/{(start + i) * 1000 + random.randint(100, 999)}",
                email=f"careers@{company.split()[0].lower()}.de",
                salary_min=sal_min,
                salary_max=sal_max,
            ))
        self.logger.info(f"[LinkedIn API] page={page} returned {len(jobs)} jobs")
        return jobs

    # ---------- Scraping path ----------
    async def scrape_jobs(self, config: AgentConfig) -> list[JobData]:
        page = config.current_page
        per_page = config.per_page
        start = (page - 1) * per_page
        location = config.location or random.choice(CITIES)
        domain = config.domain or random.choice(DOMAINS)
        kw = config.keywords or ["Python", "SQL", "Cloud"]

        jobs: list[JobData] = []
        for i in range(per_page):
            title = TITLES[(start + i) % len(TITLES)]
            company = COMPANIES[(start + i) % len(COMPANIES)]
            jt = random.choices(["Vollzeit", "Werkstudent", "Praktikum"], weights=[7, 2, 1])[0]
            sal_min = random.choice([45000, 55000, 65000, 75000])
            sal_max = sal_min + random.choice([10000, 15000, 25000])
            jobs.append(JobData(
                title=title,
                company=company,
                location=location,
                job_type=jt,
                domain=domain,
                description=f"[LinkedIn Scrape · page {page}] {company} sucht {title} für unser Team in {location}. "
                            f"Stack: {', '.join(random.sample(kw, k=min(2, len(kw))))}. "
                            f"Modernes Arbeitsumfeld, flexible Arbeitszeiten.",
                link=f"https://linkedin.com/jobs/view/{(start + i) * 100 + random.randint(1000000, 9999999)}",
                email=f"careers@{company.split()[0].lower()}.de",
                salary_min=sal_min,
                salary_max=sal_max,
            ))
        self.logger.info(f"[LinkedIn Scrape] page={page} returned {len(jobs)} jobs")
        return jobs
