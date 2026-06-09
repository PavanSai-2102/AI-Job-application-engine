"""
Naukri scraper — uses Playwright (headless browser) to render the JavaScript-heavy
page, then parses the fully rendered HTML with BeautifulSoup.

Naukri.com is a fully client-side rendered React (Next.js) application.
Simple HTTP requests return empty job data because listings are loaded
via JavaScript after page load. Playwright launches a real headless
browser to render the page, then we extract the HTML and parse it.
"""

import logging
import re
import time
from typing import List

from job_agent.models import Job
from job_agent.scrapers import BaseScraper

logger = logging.getLogger(__name__)


class NaukriScraper(BaseScraper):
    """Scrapes job listings from Naukri.com using Playwright + BeautifulSoup."""

    BASE_URL = "https://www.naukri.com"
    MAX_PAGES = 2  # Limit pages to avoid detection

    @property
    def source_name(self) -> str:
        return "Naukri"

    def search(self, job_title: str, location: str = None) -> List[Job]:
        """
        Search Naukri for jobs matching the given title.

        Uses Playwright to render the page in a headless browser,
        waits for job cards to load, then parses the HTML.

        Args:
            job_title: The job title/keyword to search for.
            location: Optional location constraint (e.g. 'Hyderabad').

        Returns:
            List of matching Job objects.
        """
        logger.info(f"[Naukri] Searching for: '{job_title}' (Location: {location})")

        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            logger.error(
                "[Naukri] playwright is not installed. "
                "Run: pip install playwright && playwright install chromium"
            )
            return []

        all_jobs = []
        slug = self._slugify(job_title)
        keyword_words = job_title.lower().split()

        with sync_playwright() as p:
            try:
                # Try to use actual Google Chrome installed on Mac to bypass Akamai
                browser = p.chromium.launch(
                    headless=True,
                    channel="chrome",
                    args=[
                        "--disable-blink-features=AutomationControlled",
                        "--no-sandbox",
                    ]
                )
            except Exception as e:
                logger.warning(
                    f"[Naukri] Could not launch Chrome channel, falling back to default Chromium: {e}"
                )
                browser = p.chromium.launch(
                    headless=True,
                    args=[
                        "--disable-blink-features=AutomationControlled",
                        "--no-sandbox",
                    ]
                )

            context = browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                ),
                viewport={"width": 1440, "height": 900},
                locale="en-US,en;q=0.9",
            )
            page = context.new_page()

            # Inject script to override navigator.webdriver to bypass Akamai
            page.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                });
                Object.defineProperty(navigator, 'plugins', {
                    get: () => [1, 2, 3, 4, 5]
                });
                window.chrome = {
                    runtime: {}
                };
            """)

            # Dict to store intercepted JSON payloads mapped by page number
            intercepted_jsons = {}

            def handle_response(response):
                if "jobapi" in response.url and "/v3/search" in response.url:
                    try:
                        import urllib.parse
                        parsed = urllib.parse.urlparse(response.url)
                        query = urllib.parse.parse_qs(parsed.query)
                        p_num = int(query.get("pageNo", [1])[0])
                    except Exception:
                        p_num = None
                    try:
                        intercepted_jsons[p_num] = response.json()
                        logger.info(f"[Naukri] Intercepted search API response for page {p_num}")
                    except Exception as e:
                        logger.error(f"[Naukri] Failed to parse intercepted API response: {e}")

            page.on("response", handle_response)

            for page_num in range(1, self.MAX_PAGES + 1):
                url = self._build_url(slug, page_num, location)
                logger.info(f"[Naukri] Loading page {page_num}: {url}")

                try:
                    page.goto(url, wait_until="domcontentloaded", timeout=30000)

                    # Wait for the job listing container to appear (up to 15s)
                    page.wait_for_selector(
                        "#listContainer",
                        timeout=15000,
                    )

                    # Give extra time for network activity and rendering
                    page.wait_for_timeout(3000)

                    # Check if we successfully intercepted the JSON response
                    json_data = intercepted_jsons.get(page_num) or intercepted_jsons.get(None)
                    jobs = []

                    if json_data:
                        logger.info(f"[Naukri] Parsing intercepted JSON for page {page_num}...")
                        jobs = self._parse_json(json_data, keyword_words)
                        # Clean up to prevent accidental reuse
                        intercepted_jsons.pop(page_num, None)
                        intercepted_jsons.pop(None, None)

                    if not jobs:
                        # Fallback: parse rendered DOM if interception was empty or failed
                        logger.info(f"[Naukri] Interception failed/empty. Falling back to HTML DOM parsing...")
                        html = page.content()
                        logger.info(f"[Naukri] Page rendered HTML length: {len(html)}")
                        jobs = self._parse_html(html, keyword_words)

                    if not jobs:
                        logger.info(f"[Naukri] No jobs found on page {page_num}. Stopping.")
                        break

                    all_jobs.extend(jobs)
                    logger.info(f"[Naukri] Page {page_num}: found {len(jobs)} jobs")

                    # Polite delay between pages
                    if page_num < self.MAX_PAGES:
                        time.sleep(2)

                except Exception as e:
                    logger.error(f"[Naukri] Failed to load page {page_num}: {e}")
                    break

            browser.close()

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
