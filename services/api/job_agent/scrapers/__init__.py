"""
Scrapers package.
Provides a base class and platform-specific scrapers for job search.
"""

from abc import ABC, abstractmethod
from typing import List

from job_agent.models import Job


class BaseScraper(ABC):
    """Abstract base class that all scrapers must implement."""

    @property
    @abstractmethod
    def source_name(self) -> str:
        """Return the platform name (e.g., 'Naukri', 'RemoteOK', 'Wellfound')."""
        ...

    @abstractmethod
    def search(self, job_title: str, location: str = None) -> List[Job]:
        """
        Search for jobs matching the given title and optional location.

        Args:
            job_title: The job title/keyword to search for.
            location: Optional location constraint (e.g. 'Hyderabad').

        Returns:
            A list of Job objects found on this platform.
        """
        ...
