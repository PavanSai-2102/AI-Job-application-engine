"""
Job data model shared across all scrapers.
"""

from dataclasses import dataclass, asdict
from datetime import datetime, timezone


@dataclass
class Job:
    """Represents a single job listing from any platform."""

    title: str
    company: str
    location: str
    salary: str
    url: str
    source: str  # "Naukri" | "RemoteOK" | "Wellfound"
    scraped_at: str = ""

    def __post_init__(self):
        """Auto-set scraped_at timestamp if not provided."""
        if not self.scraped_at:
            self.scraped_at = datetime.now(timezone.utc).isoformat()

        # Normalize empty/None fields
        if not self.salary:
            self.salary = "Not disclosed"
        if not self.location:
            self.location = "Not specified"

    def to_dict(self) -> dict:
        """Convert to dictionary for CSV writing."""
        return asdict(self)

    def dedup_key(self) -> tuple:
        """Key used for deduplication: (title, company, source) lowercased."""
        return (self.title.lower().strip(), self.company.lower().strip(), self.source.lower())
