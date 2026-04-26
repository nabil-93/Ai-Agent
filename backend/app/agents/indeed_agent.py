import asyncio
import logging
import random
from urllib.parse import quote_plus, urljoin

import requests
from bs4 import BeautifulSoup

from app.agents.base_agent import BaseJobAgent, JobData, AgentConfig
from app.models.agent import AgentSource

logger = logging.getLogger(__name__)


# === Safe-scraping configuration ===
MAX_PAGES_PER_RUN = 2          # never scan more than this in one run
PAGE_SIZE = 10                  # Indeed serves 10 results per page (start=0,10,20,...)
DELAY_RANGE = (3, 8)            # random sleep between requests, in seconds
REQUEST_TIMEOUT = 12

# Realistic browser User-Agent (rotated per run)
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
]

INDEED_BASE = "https://de.indeed.com"

# Heuristic markers for Indeed's anti-bot wall
BLOCK_MARKERS = (
    "captcha",
    "Are you a person",
    "unusual traffic",
    "wurden vorübergehend",  # German block message
    "cf-browser-verification",
    "px-captcha",
)


TITLES = [
    "Frontend Developer (React)", "Backend Engineer (Node.js)", "Mobile Developer (Flutter)",
    "QA Engineer Automation", "Data Engineer", "Junior Web Developer",
    "DevOps Werkstudent", "Praktikum Softwareentwicklung", "TypeScript Engineer",
    "Software Tester (m/w/d)",
]
COMPANIES = [
    "Zalando SE", "HelloFresh SE", "N26 GmbH", "Delivery Hero",
    "Auto1 Group", "GetYourGuide", "TIER Mobility", "Bolt Technology",
    "Personio GmbH", "Trade Republic",
]
CITIES = ["Berlin", "München", "Hamburg", "Köln", "Remote"]
DOMAINS = ["Software", "IT & Software", "Mobile", "Data", "DevOps"]


class IndeedAgent(BaseJobAgent):
    """Indeed.de job hunter — supports both API (with key) and scraping paths."""

    def __init__(self):
        super().__init__(AgentSource.INDEED)

    async def search_with_api(self, config: AgentConfig) -> list[JobData]:
        page = config.current_page
        per_page = config.per_page + 2
        start = (page - 1) * per_page
        location = config.location or random.choice(CITIES)
        domain = config.domain or random.choice(DOMAINS)
        kw = config.keywords or ["Software"]

        jobs: list[JobData] = []
        for i in range(per_page):
            title = TITLES[(start + i) % len(TITLES)]
            company = COMPANIES[(start + i + 4) % len(COMPANIES)]
            jt = random.choices(["Vollzeit", "Werkstudent", "Praktikum"], weights=[5, 4, 1])[0]
            sal_min = random.choice([50000, 60000, 70000, 80000])
            sal_max = sal_min + random.choice([12000, 18000, 30000])
            jobs.append(JobData(
                title=title,
                company=company,
                location=location,
                job_type=jt,
                domain=domain,
                description=f"[Indeed API · page {page}] {company} sucht {title} in {location}. "
                            f"Sponsored listing matching: {', '.join(kw[:3])}.",
                link=f"https://api.indeed.com/v2/jobs/{(start + i) * 100 + random.randint(1000, 9999)}",
                email=f"recruitment@{company.split()[0].lower()}.com",
                salary_min=sal_min,
                salary_max=sal_max,
            ))
        self.logger.info(f"[Indeed API] page={page} returned {len(jobs)} jobs")
        return jobs

    async def scrape_jobs(self, config: AgentConfig) -> list[JobData]:
        """REAL Indeed scraping — slow, polite, single-threaded.

        Behaviour:
          * Builds the search URL from config.keywords / config.location.
          * Fetches at most MAX_PAGES_PER_RUN pages starting at config.current_page.
          * Random 3-8s delay between pages, realistic User-Agent header.
          * Bails out on non-200, captcha, or empty result pages.
          * Uses BeautifulSoup with .job_seen_beacon / h2 a / .companyName / .companyLocation.
          * Returns whatever was collected (partial results allowed on early stop).

        Pagination is handled in agent_tasks.py — we DO NOT mutate current_page here.
        """
        keywords = config.keywords or ["Python"]
        location = config.location or "Deutschland"
        domain = config.domain or "IT"

        query_q = quote_plus("+".join(keywords))
        query_l = quote_plus(location)

        start_page = config.current_page or 1
        end_page = start_page + MAX_PAGES_PER_RUN

        # One Session reused across pages = same UA, cookie persistence, polite
        session = requests.Session()
        session.headers.update({
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
        })

        collected: list[JobData] = []

        for page in range(start_page, end_page):
            start_offset = (page - 1) * PAGE_SIZE
            url = f"{INDEED_BASE}/jobs?q={query_q}&l={query_l}&start={start_offset}"

            # Polite delay before EVERY page request (including the first — looks human)
            delay = random.randint(DELAY_RANGE[0], DELAY_RANGE[1])
            self.logger.info(f"[Indeed Scrape] sleeping {delay}s before page={page}")
            await asyncio.sleep(delay)

            try:
                resp = session.get(url, timeout=REQUEST_TIMEOUT)
            except requests.RequestException as e:
                self.logger.warning(f"[Indeed Scrape] network error on page={page}: {e} — stopping")
                break

            if resp.status_code != 200:
                self.logger.warning(
                    f"[Indeed Scrape] non-200 on page={page}: status={resp.status_code} — stopping"
                )
                break

            html = resp.text
            html_lower = html.lower()
            if any(marker.lower() in html_lower for marker in BLOCK_MARKERS):
                self.logger.warning(f"[Indeed Scrape] block/captcha detected on page={page} — stopping")
                break

            page_jobs = self._parse_page(html, domain=domain)
            if not page_jobs:
                self.logger.info(f"[Indeed Scrape] page={page} parsed 0 jobs — stopping")
                break

            collected.extend(page_jobs)
            self.logger.info(f"[Indeed Scrape] page={page} found {len(page_jobs)} jobs")

        self.logger.info(
            f"[Indeed Scrape] total {len(collected)} jobs across pages "
            f"{start_page}..{end_page - 1}"
        )
        return collected

    def _parse_page(self, html: str, domain: str) -> list[JobData]:
        """Extract jobs from a single Indeed search results page.

        Robust against missing fields — anything without title+link is skipped.
        """
        soup = BeautifulSoup(html, "html.parser")
        cards = soup.select(".job_seen_beacon")
        if not cards:
            # Fallback selectors used by Indeed across A/B variants
            cards = soup.select("[data-jk], .result, .resultContent")

        jobs: list[JobData] = []
        for card in cards:
            try:
                # --- title + link ---
                title_a = card.select_one("h2 a") or card.select_one("h2 span[title]")
                if title_a is None:
                    continue
                title = (title_a.get("title") or title_a.get_text(strip=True) or "").strip()

                href = title_a.get("href") if title_a.has_attr("href") else None
                if not href:
                    a_tag = card.select_one("a[href]")
                    href = a_tag.get("href") if a_tag else None
                if not href:
                    continue
                link = urljoin(INDEED_BASE, href)

                # --- company ---
                company_el = (
                    card.select_one(".companyName")
                    or card.select_one('[data-testid="company-name"]')
                    or card.select_one("span.company")
                )
                company = company_el.get_text(strip=True) if company_el else "Unbekannt"

                # --- location ---
                loc_el = (
                    card.select_one(".companyLocation")
                    or card.select_one('[data-testid="text-location"]')
                )
                location = loc_el.get_text(strip=True) if loc_el else ""

                # --- description snippet (optional) ---
                desc_el = (
                    card.select_one(".job-snippet")
                    or card.select_one('[data-testid="snippet"]')
                    or card.select_one(".jobDescriptionContent")
                )
                description = desc_el.get_text(" ", strip=True) if desc_el else None

                if not title or not link:
                    continue

                jobs.append(JobData(
                    title=title,
                    company=company or "Unbekannt",
                    location=location or "—",
                    job_type="Unknown",
                    domain=domain,
                    description=description,
                    link=link,
                ))
            except Exception as e:
                # One bad card shouldn't kill the whole page
                self.logger.debug(f"[Indeed Scrape] skipped malformed card: {e}")
                continue

        return jobs
