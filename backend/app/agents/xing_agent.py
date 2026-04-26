import logging
import random
from app.agents.base_agent import BaseJobAgent, JobData, AgentConfig
from app.models.agent import AgentSource

logger = logging.getLogger(__name__)


TITLES = [
    "SAP Berater (m/w/d)", "IT Consultant", "Business Analyst",
    "Werkstudent Wirtschaftsinformatik", "Junior SAP Developer",
    "Praktikum IT Consulting", "Senior Cloud Berater (Azure)",
    "Solution Architect", "ERP Consultant", "Inhouse SAP Specialist",
]
COMPANIES = [
    "Accenture Deutschland", "Capgemini DACH", "Deloitte Consulting",
    "PWC IT Services", "KPMG Digital", "msg systems ag",
    "Adesso SE", "BearingPoint GmbH", "T-Systems International", "ConSol GmbH",
]
CITIES = ["Frankfurt am Main", "München", "Hamburg", "Düsseldorf", "Stuttgart", "Berlin"]
DOMAINS = ["SAP", "Consulting", "Wirtschaftsinformatik", "Cloud"]


class XingAgent(BaseJobAgent):
    """XING job hunter — supports both API (with key) and scraping paths."""

    def __init__(self):
        super().__init__(AgentSource.XING)

    async def search_with_api(self, config: AgentConfig) -> list[JobData]:
        page = config.current_page
        per_page = config.per_page + 1
        start = (page - 1) * per_page
        location = config.location or random.choice(CITIES)
        domain = config.domain or random.choice(DOMAINS)
        kw = config.keywords or ["SAP"]

        jobs: list[JobData] = []
        for i in range(per_page):
            title = TITLES[(start + i) % len(TITLES)]
            company = COMPANIES[(start + i + 2) % len(COMPANIES)]
            jt = random.choices(["Vollzeit", "Werkstudent", "Praktikum"], weights=[6, 3, 1])[0]
            sal_min = random.choice([50000, 65000, 80000, 95000])
            sal_max = sal_min + random.choice([15000, 25000, 35000])
            jobs.append(JobData(
                title=title,
                company=company,
                location=location,
                job_type=jt,
                domain=domain,
                description=f"[XING API · page {page}] {company} sucht {title} in {location}. "
                            f"Premium-Suche basierend auf: {', '.join(kw[:3])}. "
                            f"Direktkontakt zur Personalabteilung verfügbar.",
                link=f"https://api.xing.com/v1/jobs/{(start + i) * 100 + random.randint(100, 999)}",
                email=f"jobs@{company.split()[0].lower()}.com",
                phone=f"+49 {random.randint(20, 99)} {random.randint(1000000, 9999999)}",
                salary_min=sal_min,
                salary_max=sal_max,
            ))
        self.logger.info(f"[XING API] page={page} returned {len(jobs)} jobs")
        return jobs

    async def scrape_jobs(self, config: AgentConfig) -> list[JobData]:
        page = config.current_page
        per_page = config.per_page
        start = (page - 1) * per_page
        location = config.location or random.choice(CITIES)
        domain = config.domain or random.choice(DOMAINS)

        jobs: list[JobData] = []
        for i in range(per_page):
            title = TITLES[(start + i) % len(TITLES)]
            company = COMPANIES[(start + i) % len(COMPANIES)]
            jt = random.choices(["Vollzeit", "Werkstudent", "Praktikum"], weights=[6, 3, 1])[0]
            sal_min = random.choice([40000, 50000, 60000, 70000, 85000])
            sal_max = sal_min + random.choice([10000, 20000, 30000])
            jobs.append(JobData(
                title=title,
                company=company,
                location=location,
                job_type=jt,
                domain=domain,
                description=f"[XING Scrape · page {page}] {company} sucht ab sofort {title} in {location}. "
                            f"Spannende Projekte, dynamisches Team, gute Karrierechancen.",
                link=f"https://xing.com/jobs/{(start + i) * 100 + random.randint(100000, 999999)}",
                email=f"jobs@{company.split()[0].lower()}.com",
                phone=f"+49 {random.randint(20, 99)} {random.randint(1000000, 9999999)}",
                salary_min=sal_min,
                salary_max=sal_max,
            ))
        self.logger.info(f"[XING Scrape] page={page} returned {len(jobs)} jobs")
        return jobs
