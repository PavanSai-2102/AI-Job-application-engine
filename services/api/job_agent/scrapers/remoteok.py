"""
RemoteOK scraper — uses the public REST API.
Endpoint: https://remoteok.com/api
"""

import logging
import time
from typing import List

import requests

from job_agent.models import Job
from job_agent.scrapers import BaseScraper

logger = logging.getLogger(__name__)


class RemoteOKScraper(BaseScraper):
    """Fetches remote job listings from RemoteOK's public JSON API."""

    API_URL = "https://remoteok.com/api"
    MAX_RETRIES = 2
    RETRY_DELAY = 3  # seconds

    @property
    def source_name(self) -> str:
        return "RemoteOK"

    def search(self, job_title: str, location: str = None) -> List[Job]:
        """
        Search RemoteOK for jobs matching the given title.

        Args:
            job_title: The job title/keyword to search for.
            location: Optional location constraint (e.g. 'Hyderabad').

        Returns:
            List of matching Job objects.
        """
        logger.info(f"[RemoteOK] Searching for: '{job_title}' (Location: {location})")

        data = self._fetch_api(job_title)
        if not data:
            return []

        jobs = self._parse_jobs(data, job_title, location)
        logger.info(f"[RemoteOK] Found {len(jobs)} matching jobs")
        return jobs

    def _fetch_api(self, keyword: str) -> list:
        """Fetch raw job data from the RemoteOK API with retry logic."""
        import urllib.parse
        
        headers = {
            "User-Agent": "JobAgent/1.0 (github.com/job-agent)",
            "Accept": "application/json",
        }

        # Build tags query parameter from keyword
        tags = urllib.parse.quote(",".join(keyword.lower().split()))
        url = f"{self.API_URL}?tags={tags}"

        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                response = requests.get(url, headers=headers, timeout=15)

                if response.status_code == 429:
                    logger.warning(
                        f"[RemoteOK] Rate limited (429). Retry {attempt}/{self.MAX_RETRIES}..."
                    )
                    time.sleep(self.RETRY_DELAY * attempt)
                    continue

                response.raise_for_status()
                data = response.json()

                # First element is metadata/legal notice — skip it
                if isinstance(data, list) and len(data) > 1:
                    return data[1:]
                return []

            except requests.exceptions.RequestException as e:
                logger.error(f"[RemoteOK] Request failed (attempt {attempt}): {e}")
                if attempt < self.MAX_RETRIES:
                    time.sleep(self.RETRY_DELAY)

        logger.error("[RemoteOK] All retry attempts exhausted.")
        return []

    def _parse_jobs(self, raw_jobs: list, keyword: str, location_filter: str = None) -> List[Job]:
        """
        Filter and convert raw API data to Job objects.

        Args:
            raw_jobs: List of dicts from the API response.
            keyword: Search keyword to filter by (case-insensitive).
            location_filter: Optional location constraint.

        Returns:
            Filtered list of Job objects.
        """
        keyword_words = keyword.lower().split()
        jobs = []

        for entry in raw_jobs:
            if not isinstance(entry, dict):
                continue

            position = entry.get("position", "")
            company = entry.get("company", "")
            tags = entry.get("tags", [])
            description = entry.get("description", "")

            # Build searchable text from position and company to prevent tag spam false positives
            searchable = f"{position} {company}".lower()

            # Match if ALL keyword words appear in the searchable text for high accuracy
            if not all(word in searchable for word in keyword_words):
                continue

            # Location — RemoteOK is remote-first
            location = entry.get("location", "").strip() or "Remote"

            # Location filtering logic removed for RemoteOK as per user request

            # Build salary string
            salary = self._format_salary(
                entry.get("salary_min"), entry.get("salary_max")
            )

            # Build job URL
            slug = entry.get("slug", "")
            url = f"https://remoteok.com/remote-jobs/{slug}" if slug else entry.get("url", "")

            jobs.append(
                Job(
                    title=position.strip(),
                    company=company.strip(),
                    location=location,
                    salary=salary,
                    url=url,
                    source=self.source_name,
                )
            )

        return jobs

    @staticmethod
    def _format_salary(salary_min, salary_max) -> str:
        """Format salary range into a readable string."""
        if salary_min and salary_max:
            return f"${int(salary_min):,} - ${int(salary_max):,}"
        elif salary_min:
            return f"${int(salary_min):,}+"
        elif salary_max:
            return f"Up to ${int(salary_max):,}"
        return "Not disclosed"
