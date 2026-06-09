"""
Wellfound scraper — uses Firecrawl to extract structured job data.
Firecrawl handles JavaScript rendering and returns clean content.
Requires FIRECRAWL_API_KEY in .env file.
"""

import logging
import os
import re
from typing import List

from dotenv import load_dotenv

from job_agent.models import Job
from job_agent.scrapers import BaseScraper

logger = logging.getLogger(__name__)

# Load environment variables from .env
load_dotenv()


class WellfoundScraper(BaseScraper):
    """Scrapes job listings from Wellfound using Firecrawl for JS rendering."""

    BASE_URL = "https://wellfound.com"

    @property
    def source_name(self) -> str:
        return "Wellfound"

    def __init__(self):
        """Initialize the Firecrawl client."""
        self.api_key = os.getenv("FIRECRAWL_API_KEY")
        self.app = None

        if not self.api_key or self.api_key == "your_api_key_here":
            logger.warning(
                "[Wellfound] FIRECRAWL_API_KEY not set or is placeholder. "
                "Set it in your .env file. Wellfound scraping will be skipped."
            )
        else:
            try:
                from firecrawl import FirecrawlApp
                self.app = FirecrawlApp(api_key=self.api_key)
                logger.info("[Wellfound] Firecrawl client initialized successfully.")
            except ImportError:
                logger.error(
                    "[Wellfound] firecrawl-py is not installed. "
                    "Run: pip install firecrawl-py"
                )
            except Exception as e:
                logger.error(f"[Wellfound] Failed to initialize Firecrawl: {e}")

    def search(self, job_title: str, location: str = None) -> List[Job]:
        """
        Search Wellfound for jobs matching the given title using Firecrawl.

        Args:
            job_title: The job title/keyword to search for.
            location: Optional location constraint (e.g. 'Hyderabad').

        Returns:
            List of matching Job objects.
        """
        if not self.app:
            logger.warning("[Wellfound] Firecrawl not available. Returning empty results.")
            return []

        logger.info(f"[Wellfound] Searching for: '{job_title}' (Location: {location})")

        url = self._build_search_url(job_title, location)
        logger.info(f"[Wellfound] Scraping URL: {url}")

        try:
            # Use Firecrawl to scrape the page (handles JS rendering)
            result = self.app.scrape_url(
                url,
                formats=["markdown"],
                wait_for=3000,  # Wait 3s for JS to render
            )

            if not result:
                logger.warning("[Wellfound] Firecrawl returned empty result.")
                return []

            # Extract markdown content from result
            markdown = ""
            if isinstance(result, dict):
                markdown = result.get("markdown", "") or result.get("content", "")
            elif hasattr(result, "markdown"):
                markdown = result.markdown or ""

            if not markdown:
                logger.warning("[Wellfound] No markdown content in Firecrawl response.")
                return []

            jobs = self._parse_markdown(markdown, job_title, location)
            logger.info(f"[Wellfound] Found {len(jobs)} matching jobs")
            return jobs

        except Exception as e:
            logger.error(f"[Wellfound] Firecrawl scraping failed: {e}")
            return []

    def _build_search_url(self, job_title: str, location: str = None) -> str:
        """Build the Wellfound search URL for a given job title."""
        # Wellfound uses role-based URLs
        slug = re.sub(r"[^\w\s-]", "", job_title.lower())
        slug = re.sub(r"[\s_]+", "-", slug.strip())
        
        if location:
            loc_slug = re.sub(r"[^\w\s-]", "", location.lower())
            loc_slug = re.sub(r"[\s_]+", "-", loc_slug.strip())
            return f"{self.BASE_URL}/role/l/{slug}/{loc_slug}"
            
        return f"{self.BASE_URL}/role/r/{slug}"

    def _parse_markdown(self, markdown: str, keyword: str, location_filter: str = None) -> List[Job]:
        """
        Parse the markdown content from Firecrawl and extract job listings.
        """
        jobs = []
        keyword_lower = keyword.lower()

        lines = markdown.split("\n")
        
        current_company = "Unknown"
        current_job = {}

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Check for company name
            comp_match = re.search(r"\[\*\*(.*?)\*\*\]\(.*?company.*?\)|\[(.*?)\]\(.*?company.*?\)", line)
            if comp_match:
                current_company = comp_match.group(1) or comp_match.group(2)
                continue

            # Check for job title: [Title](https://wellfound.com/jobs/...)
            job_match = re.search(r"\[(.*?)\]\((.*?jobs.*?)\)", line)
            if job_match:
                if current_job.get("title"):
                    current_job["company"] = current_company
                    job = self._build_job_from_block(current_job, keyword_lower, location_filter)
                    if job:
                        jobs.append(job)
                
                current_job = {
                    "title": job_match.group(1).strip(),
                    "url": job_match.group(2).strip(),
                    "company": current_company
                }
                continue

            # If inside a job block, parse fields
            if current_job.get("title"):
                if line.lower() == "apply":
                    current_job["company"] = current_company
                    job = self._build_job_from_block(current_job, keyword_lower, location_filter)
                    if job:
                        jobs.append(job)
                    current_job = {}
                    continue

                # Look for salary/equity patterns
                salary_match = re.search(
                    r"(\$[\d,]+\s*[-–]\s*\$[\d,]+|\$[\d,]+k?\s*[-–]\s*\$?[\d,]+k?|"
                    r"₹[\d,]+\s*[-–]\s*₹?[\d,]+|[\d.]+\s*LPA|[\d.]+%\s*[-–]\s*[\d.]+%\s*equity|No equity)",
                    line,
                    re.IGNORECASE,
                )
                if salary_match and not current_job.get("salary"):
                    current_job["salary"] = line.strip()
                    continue

                # Otherwise assume it's location if it doesn't match 'ago', 'save', 'exp', etc.
                if not re.search(r"ago|save|exp", line, re.IGNORECASE) and not current_job.get("location"):
                    # Basic sanity check to avoid capturing weird markdown
                    if len(line) < 80 and not line.startswith("["):
                        current_job["location"] = line.strip()
                    continue

        if current_job.get("title"):
            current_job["company"] = current_company
            job = self._build_job_from_block(current_job, keyword_lower, location_filter)
            if job:
                jobs.append(job)

        return jobs

    def _build_job_from_block(self, block: dict, keyword_lower: str, location_filter: str = None) -> Job | None:
        """
        Convert a parsed block dict into a Job object.

        Args:
            block: Dict with parsed fields (title, company, location, salary, url).
            keyword_lower: Lowercased keyword for relevance check.
            location_filter: Optional location constraint.

        Returns:
            A Job object if the block is relevant, else None.
        """
        title = block.get("title", "").strip()
        if not title:
            return None

        # Relevance check — title or company should contain the keyword
        searchable = f"{title} {block.get('company', '')}".lower()
        # Ensure all keyword words appear in searchable text
        keyword_words = keyword_lower.split()
        if not all(word in searchable for word in keyword_words):
            return None

        # Location filtering logic
        location = block.get("location", "").strip()
        if location_filter:
            loc_lower = location.lower()
            fil_lower = location_filter.lower()
            # Skip if specific location requested, and not matched in location field
            if fil_lower not in loc_lower:
                return None

        return Job(
            title=title,
            company=block.get("company", "Unknown"),
            location=location,
            salary=block.get("salary", ""),
            url=block.get("url", f"{self.BASE_URL}/jobs"),
            source=self.source_name,
        )
