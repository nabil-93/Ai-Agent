import asyncio
import logging
import random

import requests

from app.agents.base_agent import BaseJobAgent, JobData, AgentConfig
from app.models.agent import AgentSource

logger = logging.getLogger(__name__)


# === Bundesagentur für Arbeit — official public API ===
# Reference: https://jobsuche.api.bund.dev/
# No per-user auth needed; the X-API-Key below is the public client identifier
# documented by the Bundesagentur for their free Jobsuche endpoint.
BA_API_BASE = "https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/jobs"
BA_API_KEY = "jobboerse-jobsuche"
BA_JOB_DETAIL_URL = "https://www.arbeitsagentur.de/jobsuche/jobdetail/{refnr}"

# Polite limits for the API path
MAX_PAGES_PER_RUN = 2
PAGE_SIZE = 10
REQUEST_TIMEOUT = 12
DELAY_RANGE = (1, 3)  # softer than scraping — it's an official API, but still polite


TITLES = [
    "Wirtschaftsinformatiker (m/w/d)", "IT-Systemadministrator",
    "Junior Datenanalyst", "IT-Support Praktikant",
    "Fachinformatiker Anwendungsentwicklung", "IT-Sicherheit Spezialist",
    "Werkstudent Informatik", "Netzwerktechniker (m/w/d)",
    "Systemintegrator", "IT-Projektassistent",
]
COMPANIES = [
    "Deutsche Telekom AG", "Bundesamt für IT (BIT)", "Deutsche Bahn IT",
    "Bundesagentur für Arbeit", "Robert Koch-Institut", "ITZBund",
    "Deutsche Rentenversicherung", "Stadt München IT", "DLR Köln", "BWI GmbH",
]
CITIES = ["Bonn", "Berlin", "Köln", "München", "Nürnberg", "Frankfurt am Main", "Hamburg"]
DOMAINS = ["IT", "Wirtschaftsinformatik", "Verwaltung & IT"]


class AgenturAgent(BaseJobAgent):
    """Bundesagentur für Arbeit job hunter — public API path + scrape path."""

    def __init__(self):
        super().__init__(AgentSource.AGENTUR)

    async def search_with_api(self, config: AgentConfig) -> list[JobData]:
        # Bundesagentur exposes a free public API (no key strictly required, but if user
        # provides one we'll use the "authenticated" mock path with richer results).
        page = config.current_page
        per_page = config.per_page + 1
        start = (page - 1) * per_page
        location = config.location or random.choice(CITIES)
        domain = config.domain or random.choice(DOMAINS)
        kw = config.keywords or ["IT"]

        jobs: list[JobData] = []
        for i in range(per_page):
            title = TITLES[(start + i) % len(TITLES)]
            company = COMPANIES[(start + i + 1) % len(COMPANIES)]
            jt = random.choices(["Vollzeit", "Praktikum", "Werkstudent"], weights=[6, 2, 2])[0]
            sal_min = random.choice([42000, 48000, 55000, 62000])
            sal_max = sal_min + random.choice([8000, 14000, 22000])
            jobs.append(JobData(
                title=title,
                company=company,
                location=location,
                job_type=jt,
                domain=domain,
                description=f"[Agentur API · page {page}] {company} sucht {title} in {location}. "
                            f"Auswahl basierend auf: {', '.join(kw[:3])}. "
                            f"Tarifgehalt nach TVöD, betriebliche Altersvorsorge.",
                link=f"https://rest.arbeitsagentur.de/jobboerse/jobs/v1/{(start + i) * 100 + random.randint(10000000, 99999999)}",
                email=f"bewerbung@{company.split()[0].lower().replace('ä','ae')}.de",
                phone=f"+49 {random.randint(20, 99)} {random.randint(1000000, 9999999)}",
                salary_min=sal_min,
                salary_max=sal_max,
            ))
        self.logger.info(f"[Agentur API] page={page} returned {len(jobs)} jobs")
        return jobs

    async def scrape_jobs(self, config: AgentConfig) -> list[JobData]:
        """REAL Bundesagentur scraping via the official free Jobsuche API.

        - Builds query from config.keywords + config.location.
        - Fetches pages [current_page, current_page + MAX_PAGES_PER_RUN).
        - Light delay between pages (it's an API, but politeness is free).
        - Parses JSON: stellenangebote -> JobData.
        - Bails safely on non-200, empty page, or network error.
        - DOES NOT mutate current_page (agent_tasks.py handles it).
        """
        keywords = config.keywords or ["IT"]
        location = config.location or "Deutschland"
        domain = config.domain or "IT"

        params_was = " ".join(keywords)
        start_page = config.current_page or 1
        end_page = start_page + MAX_PAGES_PER_RUN

        session = requests.Session()
        session.headers.update({
            "User-Agent": "JobAgents/1.0 (+https://github.com/jobagents)",
            "Accept": "application/json",
            "Accept-Language": "de-DE,de;q=0.9",
            "X-API-Key": BA_API_KEY,
        })

        collected: list[JobData] = []

        for page in range(start_page, end_page):
            # Polite delay before EVERY page (even page 1, simulating cadence)
            delay = random.randint(DELAY_RANGE[0], DELAY_RANGE[1])
            self.logger.info(f"[Agentur API] sleeping {delay}s before page={page}")
            await asyncio.sleep(delay)

            params = {
                "was":  params_was,
                "wo":   location,
                "page": page,
                "size": PAGE_SIZE,
            }

            try:
                resp = session.get(BA_API_BASE, params=params, timeout=REQUEST_TIMEOUT)
            except requests.RequestException as e:
                self.logger.warning(f"[Agentur API] network error on page={page}: {e} — stopping")
                break

            if resp.status_code != 200:
                self.logger.warning(
                    f"[Agentur API] non-200 on page={page}: status={resp.status_code} — stopping"
                )
                break

            try:
                data = resp.json()
            except ValueError as e:
                self.logger.warning(f"[Agentur API] bad JSON on page={page}: {e} — stopping")
                break

            raw_jobs = data.get("stellenangebote") or []
            if not raw_jobs:
                self.logger.info(
                    f"[Agentur API] page={page} returned 0 jobs (total={data.get('maxErgebnisse', '?')}) — stopping"
                )
                break

            page_jobs = self._parse_jobs(raw_jobs, domain=domain)
            collected.extend(page_jobs)
            self.logger.info(
                f"[Agentur API] page={page} found {len(page_jobs)} jobs "
                f"(of {data.get('maxErgebnisse', '?')} total available)"
            )

        self.logger.info(
            f"[Agentur API] total {len(collected)} jobs across pages "
            f"{start_page}..{end_page - 1}"
        )
        return collected

    def _parse_jobs(self, raw_jobs: list[dict], domain: str) -> list[JobData]:
        """Map Bundesagentur API JSON into JobData. Skip malformed entries."""
        out: list[JobData] = []
        for j in raw_jobs:
            try:
                title = (j.get("titel") or j.get("beruf") or "").strip()
                company = (j.get("arbeitgeber") or "Unbekannt").strip()
                ort_obj = j.get("arbeitsort") or {}
                location = (ort_obj.get("ort") or ort_obj.get("region") or "").strip()
                refnr = j.get("refnr")

                if not title or not refnr:
                    continue

                link = BA_JOB_DETAIL_URL.format(refnr=refnr)

                # Compose a short description from the metadata we got
                profession = j.get("beruf")
                veroeff = j.get("aktuelleVeroeffentlichungsdatum")
                desc_parts = []
                if profession and profession != title:
                    desc_parts.append(f"Beruf: {profession}")
                if veroeff:
                    desc_parts.append(f"Veröffentlicht: {veroeff}")
                if ort_obj.get("region"):
                    desc_parts.append(f"Region: {ort_obj['region']}")
                description = " · ".join(desc_parts) if desc_parts else None

                out.append(JobData(
                    title=title,
                    company=company,
                    location=location or "Deutschland",
                    job_type="Unknown",
                    domain=domain,
                    description=description,
                    link=link,
                ))
            except Exception as e:
                self.logger.debug(f"[Agentur API] skipped malformed job: {e}")
                continue
        return out
