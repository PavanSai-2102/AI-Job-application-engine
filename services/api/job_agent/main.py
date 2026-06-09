"""
Job Agent — CLI entry point.
Orchestrates all scrapers, merges results, deduplicates, and writes to CSV.

Usage:
    python -m src.main --title "Software Engineer"
    python -m src.main --title "Data Analyst" --output output/da_jobs.csv
    python -m src.main --title "Python Developer" --sources remoteok
"""

import argparse
import logging
import re
import sys
from typing import List

from job_agent.models import Job
from job_agent.utils.csv_writer import write_jobs
from job_agent.scrapers.remoteok import RemoteOKScraper
from job_agent.scrapers.naukri import NaukriScraper
from job_agent.scrapers.wellfound import WellfoundScraper

# --------------------------------------------------------------------------- #
# Logging setup
# --------------------------------------------------------------------------- #
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-7s │ %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# --------------------------------------------------------------------------- #
# Available scrapers registry
# --------------------------------------------------------------------------- #
SCRAPER_MAP = {
    "remoteok": RemoteOKScraper,
    "naukri": NaukriScraper,
    "wellfound": WellfoundScraper,
}


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        prog="job-agent",
        description="🔍 Job Agent — Search Naukri, RemoteOK & Wellfound for jobs and save to CSV.",
    )
    parser.add_argument(
        "--title", "-t",
        required=True,
        help="Job title to search for (e.g., 'Software Engineer', 'Data Analyst').",
    )
    parser.add_argument(
        "--output", "-o",
        default=None,
        help="Output CSV file path (default: dynamically generated in output/).",
    )
    parser.add_argument(
        "--sources", "-s",
        default="all",
        help=(
            "Comma-separated list of sources to search. "
            "Options: naukri, remoteok, wellfound, all (default: all)."
        ),
    )
    return parser.parse_args()


def get_scrapers(sources_str: str) -> list:
    """
    Instantiate the requested scrapers based on the --sources argument.

    Args:
        sources_str: Comma-separated string of source names, or 'all'.

    Returns:
        List of scraper instances.
    """
    if sources_str.strip().lower() == "all":
        source_keys = list(SCRAPER_MAP.keys())
    else:
        source_keys = [s.strip().lower() for s in sources_str.split(",")]

    scrapers = []
    for key in source_keys:
        if key in SCRAPER_MAP:
            scrapers.append(SCRAPER_MAP[key]())
        else:
            logger.warning(f"Unknown source: '{key}'. Skipping. Valid: {list(SCRAPER_MAP.keys())}")

    return scrapers


def deduplicate(jobs: List[Job]) -> List[Job]:
    """
    Deduplicate jobs by (title, company, source).

    Args:
        jobs: List of Job objects (possibly with duplicates).

    Returns:
        Deduplicated list of Job objects.
    """
    seen = set()
    unique = []
    for job in jobs:
        key = job.dedup_key()
        if key not in seen:
            seen.add(key)
            unique.append(job)
    return unique


def print_summary(results: dict, total_written: int, output_path: str):
    """Print a formatted summary table to the console."""
    print()
    print("=" * 50)
    print("  ✅  Job Search Complete!")
    print("=" * 50)
    print()
    print(f"  {'Source':<15} {'Found':>8} ")
    print(f"  {'─' * 15} {'─' * 8}")

    total = 0
    for source, count in results.items():
        print(f"  {source:<15} {count:>8}")
        total += count

    print(f"  {'─' * 15} {'─' * 8}")
    print(f"  {'Total found':<15} {total:>8}")
    print(f"  {'Written to CSV':<15} {total_written:>8}")
    print()
    print(f"  📄 Results saved to: {output_path}")
    print()


def parse_search_query(query: str) -> tuple[str, str | None]:
    """
    Parse search query to extract clean job title and optional location.

    Examples:
        "Find Data Analyst roles in Hyderabad" -> ("Data Analyst", "Hyderabad")
        "Software Engineer in Bangalore" -> ("Software Engineer", "Bangalore")
        "React Developer" -> ("React Developer", None)
    """
    # Standardize and clean input
    cleaned = re.sub(
        r"^(find|search for|get|show me|look for)\s+",
        "",
        query.strip(),
        flags=re.IGNORECASE,
    )

    # Pattern to match "<title> [roles/jobs] in <location>"
    match = re.search(
        r"^(.*?)\s+(?:roles|jobs)?\s*in\s+([a-zA-Z\s\-]+)$",
        cleaned,
        re.IGNORECASE,
    )

    if match:
        title = match.group(1).strip()
        location = match.group(2).strip()
        # Clean trailing "roles" or "jobs" from title
        title = re.sub(r"\s+(?:roles|jobs)$", "", title, flags=re.IGNORECASE).strip()
        return title, location

    # Pattern to match "<title> [roles/jobs]"
    match_no_loc = re.search(
        r"^(.*?)\s+(?:roles|jobs)$",
        cleaned,
        re.IGNORECASE,
    )
    if match_no_loc:
        title = match_no_loc.group(1).strip()
        return title, None

    return cleaned, None


def generate_output_filename(title: str, location: str | None) -> str:
    """Generate a dynamic output filename based on title and location with a timestamp."""
    from datetime import datetime
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    clean_title = "_".join(word.capitalize() for word in title.split())
    if location:
        loc_mapping = {
            "hyderabad": "Hyd",
            "bangalore": "Blr",
            "bengaluru": "Blr",
            "chennai": "Che",
            "mumbai": "Mum",
            "pune": "Pun",
            "delhi": "Del",
            "gurgaon": "Gur",
            "noida": "Noi"
        }
        clean_loc = loc_mapping.get(location.lower(), location.title().replace(" ", "_"))
        return f"output/{clean_title}_{clean_loc}_{timestamp}.csv"
    return f"output/{clean_title}_{timestamp}.csv"


def main():
    """Main entry point for the Job Agent CLI."""
    args = parse_args()

    # Parse query to extract clean job title and location
    job_title, location = parse_search_query(args.title)

    # Initialize output path
    if not args.output:
        args.output = generate_output_filename(job_title, location)

    print()
    print("🔍 Job Agent")
    print(f"   Original Query:  \"{args.title}\"")
    print(f"   Parsed Title:    \"{job_title}\"")
    if location:
        print(f"   Parsed Location: \"{location}\"")
    print(f"   Sources:         {args.sources}")
    print(f"   Output:          {args.output}")
    print()

    # Initialize scrapers
    scrapers = get_scrapers(args.sources)
    if not scrapers:
        logger.error("No valid scrapers selected. Exiting.")
        sys.exit(1)

    # Run each scraper and collect results
    all_jobs: List[Job] = []
    results_summary = {}

    for scraper in scrapers:
        try:
            logger.info(f"Starting {scraper.source_name} scraper...")
            jobs = scraper.search(job_title, location)
            all_jobs.extend(jobs)
            results_summary[scraper.source_name] = len(jobs)
            logger.info(f"{scraper.source_name}: found {len(jobs)} jobs")
        except Exception as e:
            logger.error(f"{scraper.source_name} scraper failed: {e}")
            results_summary[scraper.source_name] = 0

    # Deduplicate
    unique_jobs = deduplicate(all_jobs)
    logger.info(f"After deduplication: {len(unique_jobs)} unique jobs (from {len(all_jobs)} total)")

    # Strict Global Location Filter Safeguard
    if location:
        filtered_jobs = []
        loc_lower = location.lower()
        for job in unique_jobs:
            # Bypass strict location filter for RemoteOK jobs as they are fundamentally remote
            if loc_lower in job.location.lower() or job.source == "RemoteOK":
                filtered_jobs.append(job)
        unique_jobs = filtered_jobs
        logger.info(f"After strict global location filter for '{location}': {len(unique_jobs)} jobs remaining")

    # Write to CSV
    written = write_jobs(unique_jobs, args.output)
    logger.info(f"Wrote {written} new jobs to {args.output}")

    # Print summary
    print_summary(results_summary, written, args.output)


if __name__ == "__main__":
    main()
