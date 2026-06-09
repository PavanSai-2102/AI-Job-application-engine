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
    const { applicationId, subject, body, recipient_email } = await request.json();

    if (!applicationId || !subject || !body || !recipient_email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Call Python FastAPI The Closer service for SMTP sending
    const fastApiUrl = process.env.FASTAPI_BASE_URL 
      ? `${process.env.FASTAPI_BASE_URL}/api/email/send`
      : "http://localhost:8000/api/email/send";
    
    // We wrap the request in a try/catch to record the OutreachLog even if it fails
    let status = "FAILED";
    let errorMessage = null;
    let messageId = null;

    try {
      const response = await fetch(fastApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, recipient_email }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText);
      }

      const data = await response.json();
      status = "SENT";
      messageId = data.message_id;
    } catch (err: any) {
      errorMessage = err.message;
    }

    // Create or update Outreach Log
    await prisma.outreachLog.upsert({
      where: { applicationId },
      create: {
        applicationId,
        subject,
        body,
        status,
        errorMessage,
        sentAt: status === "SENT" ? new Date() : null,
      },
      update: {
        subject,
        body,
        status,
        errorMessage,
        sentAt: status === "SENT" ? new Date() : null,
      }
    });

    if (status === "SENT") {
      // Update Application status
      const application = await prisma.application.findFirst({
        where: { 
          id: applicationId,
          userId: userId
        }
      });
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: "OUTREACH_SENT" }
      });
      return NextResponse.json({ success: true, messageId });
    } else {
      return NextResponse.json({ error: "Failed to send email", details: errorMessage }, { status: 500 });
    }

  } catch (error) {
    console.error("Email Send API Error:", error);
    return NextResponse.json({ error: "Failed to process send request" }, { status: 500 });
  }
}
