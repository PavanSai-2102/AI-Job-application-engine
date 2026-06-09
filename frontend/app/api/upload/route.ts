import { NextResponse } from "next/server";
import { extractTextFromFile } from "../../../lib/parseFile";

export const runtime = "nodejs";
export const maxDuration = 30; // seconds (Vercel Hobby: 10s, Pro: 60s)

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Request must be multipart/form-data" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log(`[Upload] File: ${file.name}, Type: ${file.type}, Size: ${file.size} bytes`);

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 5MB limit" }, { status: 400 });
    }

    // Validate MIME type
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: "${file.type}". Please upload a PDF or DOCX file.` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const text = await extractTextFromFile(buffer, file.type);

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Could not read text from this file. Please ensure it is not a scanned image, or paste text manually." },
        { status: 400 }
      );
    }

    if (text.length > 10000) {
      return NextResponse.json(
        { error: "Extracted text exceeds 10,000 characters. Please shorten your resume." },
        { status: 400 }
      );
    }

    console.log(`[Upload] Success - extracted ${text.length} characters from ${file.name}`);
    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("[Upload] Error:", error?.message || error);
    return NextResponse.json(
      { error: error.message || "Failed to process file" },
      { status: 500 }
    );
  }
}
