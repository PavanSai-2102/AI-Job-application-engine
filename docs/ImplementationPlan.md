# Implementation Plan: AI Job Application Engine

This document provides a step-by-step roadmap to build the unified AI Job Application Engine based on the integrated architecture and problem statement.

## Phase 1: Project Setup & Foundation
**Goal:** Initialize the monorepo or set up the core integration repository and establish the database schemas.

1. **Repository Setup**:
   - Create a new directory structure for the unified platform.
   - Initialize a new Next.js project (or migrate the existing Resume Builder code as the base).
   - Set up standard tooling (Tailwind CSS, ESLint, Prettier).
2. **Database Initialization**:
   - Set up a PostgreSQL instance (e.g., Supabase or local Docker).
   - Use Prisma or Drizzle ORM to define schemas for: `Users`, `Job Opportunities`, `Applications`, `Tailored Resumes`, and `Outreach Logs`.
   - Run initial migrations.
3. **Authentication**:
   - Implement basic authentication (e.g., NextAuth.js) to manage individual user profiles.

## Phase 2: Microservices Porting (Python to FastAPI)
**Goal:** Wrap the existing Python CLI tools into scalable REST APIs.

1. **Job Agent Microservice**:
   - Create a new FastAPI project.
   - Migrate the core scraping logic (Naukri, RemoteOK, Wellfound) from the `Job Agent` project.
   - Create a `POST /api/scrape` endpoint that accepts search criteria and returns normalized JSON instead of CSV.
   - Containerize the service with Docker.
2. **The Closer Microservice**:
   - Create a second FastAPI project (or a separate router in the same FastAPI app).
   - Migrate the LLM email generation and SMTP delivery logic from `Cold Email Parser`.
   - Create endpoints: `POST /api/email/draft` and `POST /api/email/send`.
   - Containerize the service.

## Phase 3: Resume Builder Integration & Enhancement
**Goal:** Hook up the existing Next.js Resume Builder logic to the new database and job flow.

1. **Migrate Core Logic**:
   - Move the existing Next.js Resume Builder code into the new unified frontend.
2. **Database Integration**:
   - Update the builder to save the user's base resume to the database instead of local state.
   - Update the builder to save newly generated "Tailored Resumes" linked to specific `Application` records.
3. **Context Passing**:
   - Modify the tailoring prompt logic to accept a specific `Job Opportunity` object fetched from the database rather than a manually pasted job description.

## Phase 4: Job Discovery Workflow (Frontend)
**Goal:** Build the UI to allow users to search and save jobs.

1. **Search Interface**:
   - Create a dashboard page in Next.js with a search bar for Job Title and Location.
2. **API Orchestration**:
   - Wire the search bar to call the Next.js API route, which in turn calls the Python FastAPI `Job Agent` microservice.
3. **Results & Saving**:
   - Display returned jobs in a card layout.
   - Add a "Save & Apply" button that creates an `Application` record in the database for that specific job.

## Phase 5: Outreach Workflow (Frontend)
**Goal:** Build the UI to generate and send cold emails.

1. **Drafting Interface**:
   - On a specific `Application` view, add a "Draft Outreach Email" section.
   - Fetch the Company name, Job Title, and the associated `Tailored Resume` highlights.
2. **API Orchestration**:
   - Call the FastAPI `The Closer` microservice to generate the email content.
3. **Preview & Send**:
   - Display the generated email in an editable text area.
   - Provide a "Send via SMTP" button that triggers the final delivery endpoint and logs the result in the `Outreach Log` database table.

## Phase 6: End-to-End Testing & Polish
**Goal:** Ensure seamless data flow and a premium user experience.

1. **Kanban Dashboard**:
   - Build a unified view showing applications moving from `Discovered` -> `Tailored` -> `Outreach Sent`.
2. **End-to-End Testing**:
   - Run complete mock cycles: Search a job, select it, auto-tailor the resume, auto-draft the email, and send (using dry-run mode).
3. **UI/UX Polish**:
   - Ensure loading states, error handling (e.g., LLM timeouts), and micro-animations are smooth and feel premium.
4. **Deployment**:
   - Deploy Next.js to Vercel.
   - Deploy PostgreSQL database.
   - Deploy FastAPI microservices (Render/Railway).

---

> [!IMPORTANT]  
> **User Review Required**:
> Please review the above implementation phases. 
> - Does this phased approach align with your expectations?
> - Would you prefer to build a monorepo containing both Next.js and Python code, or keep them in completely separate repositories?
> - Are we good to start executing **Phase 1**?
