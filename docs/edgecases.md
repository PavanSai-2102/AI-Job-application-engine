# Edge Cases & Mitigation Strategies

This document outlines the critical edge cases across the AI Job Application Engine and the mitigation strategies implemented (or to be implemented) to ensure system resilience.

## 1. Job Discovery & Scraping (Job Agent)
| Edge Case | Description | Mitigation Strategy |
| :--- | :--- | :--- |
| **Platform Rate Limiting** | Job boards (e.g., Naukri, Wellfound) block IP after too many concurrent requests. | Implement exponential backoff, randomized delays, and fallback to authenticated Firecrawl proxies. |
| **DOM/Structure Changes** | The target website updates its HTML structure, breaking `BeautifulSoup` scrapers. | Fail gracefully. Use `try/except` blocks per field. If traditional scraping fails, fallback to LLM-based HTML parsing via Firecrawl. |
| **Duplicate Jobs** | Same job posted multiple times or across different boards. | The `deduplicate()` function in `main.py` uses title, company, and location hashing to ensure unique results. The database also uses `findFirst` to prevent duplicate `JobOpportunity` rows. |

## 2. LLM Resume Tailoring (Resume Builder)
| Edge Case | Description | Mitigation Strategy |
| :--- | :--- | :--- |
| **LLM Hallucination** | LLM invents skills or experience the candidate does not have to match the JD. | **Guardrails**: The `applyGuardrails` function compares the generated bullets against the `BaseResume` to strip out unverifiable claims. |
| **Context Window Exceeded** | Passing a massive Job Description and a 3-page resume exceeds the LLM token limit. | Truncate the JD to the first 4000 tokens before sending to the LLM. Focus extraction on key requirements. |
| **API Timeout / Outage** | Groq API takes too long to respond or is down. | The Next.js API route has `maxDuration = 60`. Implemented graceful error handling and toast notifications so the user can retry. |

## 3. Outreach & SMTP (The Closer)
| Edge Case | Description | Mitigation Strategy |
| :--- | :--- | :--- |
| **Spam Filters** | Generated emails use words like "Free", "Urgent", or sound too robotic, landing in spam. | Prompts are heavily tuned for conversational tone. System uses `dry_run` by default to allow human review before sending. |
| **Invalid Email Addresses** | The target recipient email is malformed or bounces. | Basic regex validation in the UI before submitting to the API. Log SMTP bounces in the `OutreachLog` to track failure rates. |
| **Missing Context** | The Application record doesn't have a contact name or personalization note. | The `/api/email/draft` endpoint provides fallbacks (e.g., "Hiring Manager") and relies on the LLM to generate a generic but polite greeting if specifics are missing. |

## 4. Database & State
| Edge Case | Description | Mitigation Strategy |
| :--- | :--- | :--- |
| **Missing Base Resume** | User tries to tailor a resume but hasn't uploaded their base profile. | UI blocks the tailoring action and redirects to `/profile` or shows an alert. |
| **Simultaneous Applies** | User clicks "Save & Apply" twice quickly, creating race conditions. | Prisma `upsert` and unique constraints prevent duplicate applications for the same `userId` + `jobId`. |
