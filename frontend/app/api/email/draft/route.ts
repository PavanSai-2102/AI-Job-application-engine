import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  let userId = session?.user ? (session.user as any).id : null;

  if (!userId) {
    let defaultUser = await prisma.user.findFirst({
      where: { email: "demo@example.com" }
    });
    if (!defaultUser) {
      defaultUser = await prisma.user.create({
        data: { email: "demo@example.com", name: "Demo User" }
      });
    }
    userId = defaultUser.id;
  }

  try {
    const { applicationId, recipient_email, personalization_note, recipient_name } = await request.json();

    if (!applicationId || !recipient_email) {
      return NextResponse.json({ error: "applicationId and recipient_email are required" }, { status: 400 });
    }

    // Fetch the Application, Job, and User's Tailored Resume context
    const application = await prisma.application.findUnique({
      where: { 
        id: applicationId,
        userId: userId
      },
      include: {
        job: true,
        tailoredResume: true,
        user: true,
      }
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Extract relevant context for the LLM email generator
    const company = application.job.company;
    const role = application.job.title;
    const candidate_name = application.user.name || "Candidate";
    
    // We pass the tailored resume or base resume as background
    const tailoredContent = application.tailoredResume?.tailoredContent as any;
    let candidate_background = "Experienced professional in this field.";
    
    if (tailoredContent) {
      const summary = tailoredContent.tailoredSummary || "";
      const experience = tailoredContent.tailoredExperience?.map((exp: any) => ({
        company: exp.company,
        title: exp.title,
        bullets: exp.bullets.map((b: any) => b.tailored)
      })) || [];
      
      candidate_background = JSON.stringify({ summary, experience });
    } else if (application.user.baseResume) {
      const base = application.user.baseResume as any;
      candidate_background = JSON.stringify({
        summary: base.summary,
        experience: base.experience?.map((exp: any) => ({
          company: exp.company,
          title: exp.title,
          bullets: exp.bullets
        }))
      });
    }

    // Call Python FastAPI The Closer service
    const fastApiUrl = process.env.FASTAPI_BASE_URL 
      ? `${process.env.FASTAPI_BASE_URL}/api/email/draft`
      : "http://localhost:8000/api/email/draft";

    const response = await fetch(fastApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient_email,
        company,
        role,
        candidate_name,
        candidate_background,
        recipient_name: recipient_name || null,
        personalization_note: personalization_note || null,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`FastAPI responded with ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Email Draft API Error:", error);
    return NextResponse.json({ error: "Failed to draft email from backend service" }, { status: 500 });
  }
}
