# Problem Statement: AI Job Application Engine

## Background
The modern job search is a fragmented, repetitive, and highly manual process. Job seekers must navigate multiple platforms to find relevant listings, manually analyze job descriptions, painstakingly tailor their resumes for each application to pass Applicant Tracking Systems (ATS), and draft personalized cold emails to hiring managers to stand out. This context-switching and manual data entry are not only time-consuming but also lead to generic applications and outreach fatigue.

## Current State & The Problem
Currently, we have three powerful, yet completely isolated, tools:

1. **Job Agent (Python CLI)**: Scrapes and aggregates job listings from Naukri, RemoteOK, and Wellfound, outputting the results into a CSV file.
2. **Resume Builder (Next.js Web App)**: Takes a base resume and a specific job description, performs a gap analysis, and uses an LLM to rewrite bullet points, producing a highly tailored, ATS-friendly resume.
3. **The Closer / Cold Email Bot (Python/Streamlit)**: Ingests a list of targets (company, role, contact info) and uses an LLM to generate, preview, and send highly personalized cold outreach emails.

**The core problem is the lack of integration.** These tools operate in silos. A user must manually run the Job Agent, copy a job description, paste it into the Resume Builder, download the tailored resume, manually extract the company and role details, input them into The Closer, and then finally send the email. This disconnected workflow introduces significant friction, manual data transfer, and defeats the purpose of end-to-end automation.

## Proposed Solution
We need to integrate these three distinct projects into a single, cohesive **AI Job Application Engine**. This unified platform will seamlessly orchestrate the entire job application lifecycle from a single user interface.

### The Unified Workflow
1. **Discover**: The user enters a target job title and location. The Engine triggers the **Job Agent** to scrape relevant listings across multiple platforms.
2. **Tailor**: For each discovered job (or user-selected jobs), the Engine automatically extracts the job description and passes it, along with the user's base resume, to the **Resume Builder** engine. It instantly generates a uniquely tailored resume for that specific role.
3. **Outreach**: The Engine automatically structures the target details (Company, Role) and passes them to **The Closer**. It drafts a highly personalized cold email that highlights the candidate's fit and references the newly tailored resume.
4. **Review & Execute**: The user is presented with a unified dashboard where they can review the scraped jobs, inspect the gap analysis and tailored resume, and preview the generated cold email. With a single click, the user can approve the application and send the email.

## Key Objectives
* **End-to-End Automation**: Eliminate manual data entry and transfer between the scraping, tailoring, and outreach phases.
* **Unified Architecture**: Bridge the Next.js frontend (Resume Builder) with the Python backends (Job Agent, Cold Email Bot) either through a unified API layer, a microservices architecture, or by migrating the Python logic into the Next.js/Node environment.
* **Human-in-the-Loop**: Maintain critical safety guardrails. While the engine automates the heavy lifting, the user must always have the final say before an email is sent or an application is submitted.
* **Centralized Dashboard**: Provide a single, intuitive interface for tracking job prospects, tailored assets, and outreach statuses.
