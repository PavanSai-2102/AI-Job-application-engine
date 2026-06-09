import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  // if (!session || !session.user) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }
  
  // For development/demo, bypass auth if necessary, or strictly enforce it.
  // Assuming the user is authenticated from the dashboard.

  try {
    const { title, location, sources } = await request.json();

    if (!title) {
      return NextResponse.json({ error: "Job title is required" }, { status: 400 });
    }

    // Call the Python FastAPI microservice
    const fastApiUrl = process.env.FASTAPI_BASE_URL 
      ? `${process.env.FASTAPI_BASE_URL}/api/scrape`
      : "http://localhost:8000/api/scrape";
    
    const response = await fetch(fastApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        location: location || "",
        sources: sources || "all",
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`FastAPI responded with ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Job Search API Error:", error);
    return NextResponse.json({ error: "Failed to fetch jobs from backend service" }, { status: 500 });
  }
}
