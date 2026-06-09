import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

import nodemailer from "nodemailer";

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

    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const senderName = process.env.SENDER_NAME || "AI Job Application Engine";

    if (!smtpUser || !smtpPassword) {
      return NextResponse.json(
        { error: "SMTP credentials (SMTP_USER, SMTP_PASSWORD) are not configured in Vercel." }, 
        { status: 400 }
      );
    }

    let status = "FAILED";
    let errorMessage = null;
    let messageId = null;

    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
        connectionTimeout: 5000,
        socketTimeout: 5000,
      });

      const info = await transporter.sendMail({
        from: `"${senderName}" <${smtpUser}>`,
        to: recipient_email,
        subject: subject,
        text: body,
      });

      status = "SENT";
      messageId = info.messageId;
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
