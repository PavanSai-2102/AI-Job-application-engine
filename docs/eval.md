# Evaluation Metrics & Testing Plan

This document defines how we will evaluate the success, accuracy, and performance of the AI Job Application Engine.

## 1. System Performance Metrics
| Metric | Target | Measurement Method |
| :--- | :--- | :--- |
| **Scraping Latency** | < 15 seconds | Time from hitting "Discover" to rendering jobs in the Next.js UI. |
| **LLM Generation Speed** | < 10 seconds | Time to generate Tailored Resume + Gap Analysis using Groq. |
| **Database Sync** | < 1 second | Prisma transaction time for saving Applications and updating statuses. |

## 2. LLM Accuracy & Quality Evaluation (Evals)
To ensure the LLM isn't degrading the user's resume, we will manually test and score the outputs on the following rubrics:

### 2.1 Tailoring Quality (Scale 1-5)
- **1 (Poor):** Missed key keywords, hallucinations present, bad formatting.
- **3 (Acceptable):** Keywords added, but bullets feel generic or robotic.
- **5 (Excellent):** Bullets are highly relevant, metric-driven, and sound human-written.

### 2.2 Outreach Email Quality
- **Personalization:** Does the email successfully incorporate the `personalization_note` naturally?
- **Tone:** Is it professional yet conversational? (We want to avoid standard corporate jargon).
- **Call to Action:** Is the CTA clear and low-friction?

## 3. End-to-End Manual Testing Checklist
Before going to production, execute the following flows:

### [x] Workflow 1: The Golden Path
1. Search for "Frontend Developer" in "Remote".
2. Verify jobs load from multiple sources.
3. Click "Save & Tailor" on a job.
4. Verify the Application appears in the `/kanban` dashboard under "Discovered".
5. Run the Tailoring. Verify the tailored resume is saved.
6. Open the Outreach tab. Draft an email and verify the LLM uses the tailored context.
7. Send the email (Dry Run) and verify the Kanban status updates to "Outreach Sent".

### [x] Workflow 2: Error Handling
1. Search with empty criteria (Should show UI validation error).
2. Attempt to draft an email without providing a recipient email (Should block action).
3. Attempt to push an email with bad SMTP credentials (Should log `FAILED` in the database).

## 4. Future Evaluation (V2)
In the next iteration, we will implement **Automated LLM Evals** using an LLM-as-a-Judge approach:
- A secondary LLM agent will evaluate the tailored resume against the original JD and assign a Match Score independently to verify the primary agent's work.
