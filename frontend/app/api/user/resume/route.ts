import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { ResumeProfileSchema } from "@/lib/schemas";

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
    const body = await request.json();
    const result = ResumeProfileSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: "Invalid resume format", details: result.error.format() }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { baseResume: result.data as any }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save base resume:", error);
    return NextResponse.json({ error: "Failed to save base resume" }, { status: 500 });
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
      return NextResponse.json({ error: "No base resume found" }, { status: 404 });
    }
    userId = defaultUser.id;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { baseResume: true }
    });

    if (!user || !user.baseResume) {
      return NextResponse.json({ error: "No base resume found" }, { status: 404 });
    }

    return NextResponse.json({ baseResume: user.baseResume });
  } catch (error) {
    console.error("Failed to fetch base resume:", error);
    return NextResponse.json({ error: "Failed to fetch base resume" }, { status: 500 });
  }
}
