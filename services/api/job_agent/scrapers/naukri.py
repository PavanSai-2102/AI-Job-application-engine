"""
Naukri scraper — uses Firecrawl to render the JavaScript-heavy
page, then parses the fully rendered HTML with BeautifulSoup.
"""

import logging
import os
import re
from typing import List

from dotenv import load_dotenv

from job_agent.models import Job
from job_agent.scrapers import BaseScraper

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()


class NaukriScraper(BaseScraper):
    """Scrapes job listings from Naukri.com using Firecrawl + BeautifulSoup."""

    BASE_URL = "https://www.naukri.com"
    MAX_PAGES = 2  # Limit pages to avoid detection/high costs

    @property
    def source_name(self) -> str:
        return "Naukri"

    def __init__(self):
        """Initialize the Firecrawl client."""
        self.api_key = os.getenv("FIRECRAWL_API_KEY")
        self.app = None

        if not self.api_key or self.api_key == "your_api_key_here":
            logger.warning(
                "[Naukri] FIRECRAWL_API_KEY not set or is placeholder. "
                "Set it in your .env file. Naukri scraping will be skipped."
            )
        else:
            try:
                from firecrawl import FirecrawlApp
                self.app = FirecrawlApp(api_key=self.api_key)
                logger.info("[Naukri] Firecrawl client initialized successfully.")
            except ImportError:
                logger.error(
                    "[Naukri] firecrawl-py is not installed. "
                    "Run: pip install firecrawl-py"
                )
            except Exception as e:
                logger.error(f"[Naukri] Failed to initialize Firecrawl: {e}")

    def search(self, job_title: str, location: str = None) -> List[Job]:
        """
        Search Naukri for jobs matching the given title using Firecrawl.
        """
        if not self.app:
            logger.warning("[Naukri] Firecrawl not available. Returning empty results.")
            return []

        logger.info(f"[Naukri] Searching for: '{job_title}' (Location: {location})")

        all_jobs = []
        slug = self._slugify(job_title)
        keyword_words = job_title.lower().split()

        for page_num in range(1, self.MAX_PAGES + 1):
            url = self._build_url(slug, page_num, location)
            logger.info(f"[Naukri] Loading page {page_num}: {url}")

            try:
                # Use Firecrawl to scrape the page and get HTML
                result = self.app.scrape_url(
                    url,
                    formats=["html"],
                    wait_for=5000,  # Wait 5s for JS to render
                )

                if not result:
                    logger.warning(f"[Naukri] Firecrawl returned empty result for page {page_num}.")
                    break

                html = ""
                if isinstance(result, dict):
                    html = result.get("html", "")
                else:
                    html = getattr(result, "html", "")

                if not html:
                    logger.warning(f"[Naukri] No HTML content in Firecrawl response for page {page_num}.")
                    break

                logger.info(f"[Naukri] Page rendered HTML length: {len(html)}")
                jobs = self._parse_html(html, keyword_words)

                if not jobs:
                    logger.info(f"[Naukri] No jobs found on page {page_num}. Stopping.")
                    break

                all_jobs.extend(jobs)
                logger.info(f"[Naukri] Page {page_num}: found {len(jobs)} jobs")

            except Exception as e:
                logger.error(f"[Naukri] Firecrawl scraping failed on page {page_num}: {e}")
                break

        logger.info(f"[Naukri] Total jobs found: {len(all_jobs)}")
        return all_jobs

    def _slugify(self, job_title: str) -> str:
        """Convert a job title to a URL-friendly slug for Naukri."""
        slug = re.sub(r"[^\w\s-]", "", job_title.lower())
        slug = re.sub(r"[\s_]+", "-", slug.strip())
        return slug

    def _build_url(self, slug: str, page: int, location: str = None) -> str:
        """Build the Naukri search URL for a given slug, page number, and optional location."""
        if location:
            loc_slug = self._slugify(location)
            if page == 1:
                return f"{self.BASE_URL}/{slug}-jobs-in-{loc_slug}"
            return f"{self.BASE_URL}/{slug}-jobs-in-{loc_slug}-{page}"

        if page == 1:
            return f"{self.BASE_URL}/{slug}-jobs"
        return f"{self.BASE_URL}/{slug}-jobs-{page}"

    def _parse_html(self, html: str, keyword_words: list) -> List[Job]:
        """
        Parse the fully rendered Naukri HTML and extract job listings.

        Uses the selector path provided by the user:
        #listContainer > div.styles_job-listing-container_* > div > div

        Args:
            html: Fully rendered HTML string from Playwright.
            keyword_words: List of keyword words for relevance filtering.

        Returns:
            List of Job objects parsed from the HTML.
        """
        from bs4 import BeautifulSoup

        soup = BeautifulSoup(html, "html.parser")
        jobs = []

        # Primary container: #listContainer
        list_container = soup.select_one("#listContainer")
        if not list_container:
            logger.warning("[Naukri] #listContainer not found in HTML.")
            return []

        # Find the job listing container (class starts with styles_job-listing-container)
        job_listing_container = list_container.select_one(
            "div[class*='job-listing-container']"
        )
        if not job_listing_container:
            # Fallback: try finding it anywhere
            job_listing_container = list_container
            logger.info("[Naukri] Using #listContainer directly as fallback.")

        # Each job card is typically inside a div with class containing 'srp-jobtuple-wrapper'
        # or similar wrapper classes
        job_cards = (
            job_listing_container.select("div[class*='srp-jobtuple-wrapper']")
            or job_listing_container.select("div[class*='jobTuple']")
            or job_listing_container.select("article[class*='jobTuple']")
            or job_listing_container.select("div[data-job-id]")
        )

        # If specific selectors didn't work, try a broader approach:
        # Get direct children of the listing container's inner div
        if not job_cards:
            inner_div = job_listing_container.select_one(
                "div[class*='job-listing-container'] > div"
            )
            if inner_div:
                job_cards = inner_div.find_all("div", recursive=False)
            else:
                # Last fallback: any direct children divs in the container
                job_cards = job_listing_container.find_all("div", recursive=False)

        logger.info(f"[Naukri] Found {len(job_cards)} potential job cards")

        for card in job_cards:
            try:
                job = self._parse_card(card, keyword_words)
                if job:
                    jobs.append(job)
            except Exception as e:
                logger.warning(f"[Naukri] Failed to parse a job card: {e}")
                continue

        return jobs

    def _parse_card(self, card, keyword_words: list) -> Job | None:
        """
        Extract job details from a single Naukri job card element.

        Args:
            card: BeautifulSoup element representing a single job card.
            keyword_words: List of keyword words for relevance filtering.

        Returns:
            A Job object, or None if essential fields are missing.
        """
        # --- Title ---
        # Job title is usually in an <a> tag with class containing 'title'
        title_elem = (
            card.select_one("a[class*='title']")
            or card.select_one("a.title")
            or card.select_one("h2 a")
            or card.select_one("a[title]")
        )

        if not title_elem:
            # Try finding any prominent link
            links = card.select("a[href*='job-listings']")
            if links:
                title_elem = links[0]

        if not title_elem:
            return None

        title = title_elem.get_text(strip=True)
        url = title_elem.get("href", "")
        if url and not url.startswith("http"):
            url = f"{self.BASE_URL}{url}"

        if not title or len(title) < 3:
            return None

        # --- Company ---
        company_elem = (
            card.select_one("a[class*='comp-name']")
            or card.select_one("span[class*='comp-name']")
            or card.select_one("a[class*='companyName']")
            or card.select_one("a.subTitle")
            or card.select_one("a[class*='company']")
            or card.select_one("span[class*='company']")
        )
        company = company_elem.get_text(strip=True) if company_elem else "Unknown"

        # --- Location ---
        location_elem = (
            card.select_one("span[class*='locWdth']")
            or card.select_one("span[class*='loc']")
            or card.select_one("span[class*='location']")
            or card.select_one("li[class*='location']")
        )
        location = location_elem.get_text(strip=True) if location_elem else ""

        # --- Salary ---
        salary_elem = (
            card.select_one("span[class*='sal']")
            or card.select_one("span[class*='salary']")
            or card.select_one("li[class*='salary']")
        )
        salary = salary_elem.get_text(strip=True) if salary_elem else ""

        # --- Experience ---
        exp_elem = (
            card.select_one("span[class*='exp']")
            or card.select_one("span[class*='experience']")
            or card.select_one("li[class*='experience']")
        )
        experience = exp_elem.get_text(strip=True) if exp_elem else ""

        # --- Relevance filter ---
        if keyword_words:
            searchable = f"{title} {company} {location}".lower()
            if not all(word in searchable for word in keyword_words):
                return None

        return Job(
            title=title,
            company=company,
            location=location,
            salary=salary,
            url=url,
            source=self.source_name,
        )

    def _parse_json(self, data: dict, keyword_words: list) -> List[Job]:
        """
        Parse the intercepted Naukri API JSON response.

        Args:
            data: Intercepted JSON dict.
            keyword_words: List of keyword words for relevance filtering.

        Returns:
            List of Job objects parsed from the JSON.
        """
        jobs = []
        job_details = data.get("jobDetails", [])
        
        for item in job_details:
            try:
                title = item.get("title", "").strip()
                if not title:
                    continue
                    
                company = item.get("companyName", "Unknown").strip()
                
                # Extract placeholders (experience, salary, location)
                placeholders = item.get("placeholders", [])
                
                # placeholders[0] is usually experience
                # placeholders[1] is usually salary
                # placeholders[2] is usually location
                experience = placeholders[0].get("label", "").strip() if len(placeholders) > 0 else ""
                salary = placeholders[1].get("label", "").strip() if len(placeholders) > 1 else ""
                location = placeholders[2].get("label", "").strip() if len(placeholders) > 2 else ""
                
                # Handle fallback values
                if not salary or salary.lower() == "not disclosed":
                    salary = "Not disclosed"
                    
                # Construct job URL
                jd_url = item.get("jdURL", "")
                if jd_url:
                    if not jd_url.startswith("http"):
                        jd_url = f"{self.BASE_URL}{jd_url}"
                else:
                    # Construct a dummy URL using jobId as a fallback
                    job_id = item.get("jobId", "")
                    if job_id:
                        jd_url = f"{self.BASE_URL}/job-listings-{job_id}"
                    else:
                        jd_url = f"{self.BASE_URL}"

                # Relevance filtering
                if keyword_words:
                    searchable = f"{title} {company} {location}".lower()
                    if not all(word in searchable for word in keyword_words):
                        continue

                jobs.append(
                    Job(
                        title=title,
                        company=company,
                        location=location,
                        salary=salary,
                        url=jd_url,
                        source=self.source_name,
                    )
                )
            except Exception as e:
                logger.warning(f"[Naukri] Failed to parse a JSON job entry: {e}")
                continue
                
        return jobs
