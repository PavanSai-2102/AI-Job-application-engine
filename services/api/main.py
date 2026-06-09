from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os
from dotenv import load_dotenv
load_dotenv()

# Import Job Agent logic
from job_agent.scrapers.naukri import NaukriScraper
from job_agent.scrapers.remoteok import RemoteOKScraper
from job_agent.scrapers.wellfound import WellfoundScraper
from job_agent.main import deduplicate

# Import The Closer logic
from the_closer.core.models import ContactRecord, AppConfig
from the_closer.generator.email_generator import generate_email
from the_closer.sender.email_sender import send_email

app = FastAPI(title="The Closer & Job Agent API")

# Add CORS middleware for production frontend domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, change this to your vercel domain e.g. ["https://your-app.vercel.app"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Job Agent Models ---

class JobSearchRequest(BaseModel):
    title: str
    location: Optional[str] = None
    sources: str = "all"  # comma-separated: naukri,remoteok,wellfound,all

class DraftEmailRequest(BaseModel):
    recipient_email: str
    company: str
    role: str
    candidate_name: str
    candidate_background: str
    recipient_name: Optional[str] = None
    personalization_note: Optional[str] = None

class SendEmailRequest(BaseModel):
    subject: str
    body: str
    recipient_email: str

# --- Endpoints ---

@app.get("/")
def health_check():
    return {"status": "ok", "service": "job_application_engine_api"}

@app.post("/api/scrape")
def scrape_jobs(req: JobSearchRequest):
    """Scrapes jobs from the specified platforms."""
    scrapers = []
    sources = req.sources.lower()
    
    if "all" in sources or "naukri" in sources:
        scrapers.append(NaukriScraper())
    if "all" in sources or "remoteok" in sources:
        scrapers.append(RemoteOKScraper())
    if "all" in sources or "wellfound" in sources:
        scrapers.append(WellfoundScraper())
        
    all_jobs = []
    for scraper in scrapers:
        try:
            jobs = scraper.search(req.title, req.location)
            all_jobs.extend(jobs)
        except Exception as e:
            print(f"Error in {scraper.source_name}: {e}")
            
    unique_jobs = deduplicate(all_jobs)
    return {"status": "success", "total_found": len(unique_jobs), "jobs": [j.to_dict() for j in unique_jobs]}


@app.post("/api/email/draft")
def draft_email(req: DraftEmailRequest):
    """Drafts an email using The Closer's LLM generator."""
    contact = ContactRecord(**req.dict())
    
    # In a real setup, AppConfig would load from .env. Here we set it up with LLM enabled
    # Assuming Groq API key is in the environment
    config = AppConfig(
        llm_enabled=True,
        llm_model="llama-3.3-70b-versatile"
    )
    
    try:
        email = generate_email(contact, config)
        return {
            "status": "success", 
            "subject": email.subject, 
            "body": email.body,
            "template_used": email.template_used
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/email/send")
def send_email_endpoint(req: SendEmailRequest):
    """Sends the finalized email using SMTP."""
    # Build a minimal ContactRecord for the sender
    contact = ContactRecord(
        recipient_email=req.recipient_email,
        company="Unknown", role="Unknown", candidate_name="Unknown", candidate_background="Unknown"
    )
    
    from the_closer.core.models import GeneratedEmail
    email = GeneratedEmail(subject=req.subject, body=req.body, contact=contact)
    
    config = AppConfig(
        dry_run=False, 
        smtp_user=os.getenv("SMTP_USER", ""),
        smtp_password=os.getenv("SMTP_PASSWORD", ""),
        sender_name=os.getenv("SENDER_NAME", "")
    )
    
    try:
        result = send_email(email, config)
        if result.success:
            return {"status": "success", "message_id": result.message_id}
        else:
            raise HTTPException(status_code=500, detail=result.error_message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
