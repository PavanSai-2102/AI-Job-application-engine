"""
CSV writer utility for persisting Job results.
Handles deduplication and append-mode writing.
"""

import csv
import os
from typing import List

from job_agent.models import Job


# CSV column headers — order matters
FIELDNAMES = ["title", "company", "location", "salary", "url", "source", "scraped_at"]


def write_jobs(jobs: List[Job], output_path: str = "output/jobs.csv") -> int:
    """
    Write a list of Job objects to a CSV file.

    - Creates the output directory if it doesn't exist.
    - Appends to existing file (preserves previous results).
    - Deduplicates within the batch being written.
    - Returns the number of jobs written.

    Args:
        jobs: List of Job objects to write.
        output_path: Path to the output CSV file.

    Returns:
        Number of unique jobs written.
    """
    if not jobs:
        return 0

    # Deduplicate within the incoming batch
    seen = set()
    unique_jobs = []
    for job in jobs:
        key = job.dedup_key()
        if key not in seen:
            seen.add(key)
            unique_jobs.append(job)

    # Also check against existing CSV entries to avoid duplicates across runs
    existing_keys = set()
    if os.path.exists(output_path):
        with open(output_path, "r", newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                key = (
                    row.get("title", "").lower().strip(),
                    row.get("company", "").lower().strip(),
                    row.get("source", "").lower(),
                )
                existing_keys.add(key)

    # Filter out jobs that already exist in the CSV
    new_jobs = [j for j in unique_jobs if j.dedup_key() not in existing_keys]

    if not new_jobs:
        return 0

    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

    # Determine if we need to write the header (new file or empty file)
    write_header = not os.path.exists(output_path) or os.path.getsize(output_path) == 0

    with open(output_path, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        if write_header:
            writer.writeheader()
        for job in new_jobs:
            writer.writerow(job.to_dict())

    return len(new_jobs)
