# 🚀 AI Job Application Engine

A fully automated, full-stack AI platform that integrates Job Discovery, Resume Tailoring, and Cold Email Outreach into a single, unified pipeline. Built with Next.js, FastAPI, PostgreSQL, and Groq LLMs.

## 🏗 Architecture

This platform utilizes a decoupled microservice architecture:

- **Frontend**: Next.js 15 (App Router), React, Tailwind CSS, Shadcn UI
- **Backend Services**: FastAPI (Python) for heavy scraping and LLM generation
- **Database**: PostgreSQL managed via Prisma ORM
- **LLM**: Groq (`llama-3.3-70b-versatile`)
- **Scraping**: BeautifulSoup, Playwright, Firecrawl

```mermaid
graph TD
    UI[Next.js Web Frontend]
    API[Next.js API Routes / BFF]
    DB[(PostgreSQL)]
    
    PyScraper[Job Agent Service <br/> FastAPI]
    PyEmail[The Closer Service <br/> FastAPI]
    
    UI <--> API
    API <--> DB
    API <--> PyScraper
    API <--> PyEmail
```

## ✨ Core Features

1. **Job Discovery (Job Agent)**: Scrapes jobs from RemoteOK and Naukri using BeautifulSoup and Playwright, deduplicating and saving them directly to a unified Kanban database.
2. **Resume Shapeshifter**: Automatically pulls the job description and your base resume, performs a gap analysis, and uses AI to rewrite your resume bullets to beat ATS filters.
3. **The Closer (Automated Outreach)**: Automatically drafts highly personalized cold emails to hiring managers utilizing a custom personalization note, and securely dispatches them via SMTP integration.
4. **Kanban Application Board**: Visually tracks the status of every application (`DISCOVERED` -> `TAILORING` -> `OUTREACH SENT` -> `INTERVIEW`).

## 🛠 Local Setup

### 1. Database (PostgreSQL)
Ensure you have a PostgreSQL database running (e.g. Supabase, Neon, or local Docker).
Create a `.env` in the `frontend/` directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/db"
```
Run migrations:
```bash
cd frontend
npx prisma db push
```

### 2. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

### 3. Backend (FastAPI)
Create a `.env` in the `services/api/` directory:
```env
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SENDER_NAME="Your Name"
LLM_API_KEY="your-groq-api-key"
```
Install dependencies and run:
```bash
cd services/api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
playwright install chromium
uvicorn main:app --port 8000 --reload
```

## ☁️ Deployment

1. **Backend**: Deploy the `services/api` directory to Render or Railway using the provided `Dockerfile`.
2. **Frontend**: Deploy the `frontend` directory to Vercel. Ensure you set the `FASTAPI_BASE_URL` environment variable in Vercel to point to your live Python backend URL!

---
*Built with ❤️ utilizing the power of LLMs.*
