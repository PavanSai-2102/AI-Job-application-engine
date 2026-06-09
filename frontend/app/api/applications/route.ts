import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  // For demo/development, if not authenticated, fallback to a default user
  let userId = session?.user ? (session.user as any).id : null;

  if (!userId) {
    // Automatically create or fetch a default user for testing
    let defaultUser = await prisma.user.findFirst({
      where: { email: "demo@example.com" }
    });
    
    if (!defaultUser) {
      defaultUser = await prisma.user.create({
        data: {
          email: "demo@example.com",
          name: "Demo User"
        }
      });
    }
    userId = defaultUser.id;
  }

  try {
    const jobData = await request.json();
    
    // 1. Create or Find the Job Opportunity
    // We check if a job with the same URL or title+company already exists to prevent duplicates
    let job = await prisma.jobOpportunity.findFirst({
      where: {
        OR: [
          { url: jobData.url },
          { 
            title: jobData.title,
            company: jobData.company 
          }
        ]
      }
    });

    if (!job) {
      job = await prisma.jobOpportunity.create({
        data: {
          title: jobData.title,
          company: jobData.company,
          location: jobData.location || null,
          salary: jobData.salary || null,
          url: jobData.url || null,
          source: jobData.source || "Unknown",
          description: jobData.description || null,
        }
      });
    }

    // 2. Check if Application already exists for this user and job
    let application = await prisma.application.findFirst({
      where: {
        userId: userId,
        jobId: job.id,
      }
    });

    if (!application) {
      // 3. Create Application
      application = await prisma.application.create({
        data: {
          userId: userId,
          jobId: job.id,
          status: "DISCOVERED"
        }
      });
    }

    return NextResponse.json({ success: true, application, job });
  } catch (error) {
    console.error("Save Application API Error:", error);
    return NextResponse.json({ error: "Failed to save application" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  let userId = session?.user ? (session.user as any).id : null;

  if (!userId) {
    let defaultUser = await prisma.user.findFirst({
      where: { email: "demo@example.com" }
    });
    if (!defaultUser) {
      return NextResponse.json({ applications: [] });
    }
    userId = defaultUser.id;
  }

  try {
    const applications = await prisma.application.findMany({
      where: { userId: userId },
      include: {
        job: true,
        tailoredResume: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ applications });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}
