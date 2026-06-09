import { NextResponse } from "next/server";
import { generateTailoredResumePDF, generateComparisonPDF } from "@/lib/generatePDF";

// Enforce Node.js runtime because @react-pdf/renderer uses native Node APIs (like fs, path, etc.)
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function stripEmojis(obj: any): any {
  if (typeof obj === 'string') {
    return obj.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  }
  if (Array.isArray(obj)) {
    return obj.map(stripEmojis);
  }
  if (obj !== null && typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = stripEmojis(obj[key]);
    }
    return newObj;
  }
  return obj;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const type = body.type;
    const hasAcknowledgedRisks = body.hasAcknowledgedRisks;
    const data = stripEmojis(body.data);

    if (!type || !data) {
      return NextResponse.json({ error: "Missing type or data" }, { status: 400 });
    }

    if (!hasAcknowledgedRisks) {
      return NextResponse.json({ error: "Must acknowledge risks before exporting" }, { status: 403 });
    }

    let pdfBuffer: Buffer;
    let filename: string;

    if (type === "tailored") {
      const { originalProfile, tailoredResume } = data;
      if (!originalProfile || !tailoredResume) {
        return NextResponse.json({ error: "Missing required data for tailored PDF" }, { status: 400 });
      }
      pdfBuffer = await generateTailoredResumePDF(originalProfile, tailoredResume);
      filename = "Tailored_Resume.pdf";
    } else if (type === "comparison") {
      const { originalScore, tailoredScore, tailoredResume, jd, gapAnalysis } = data;
      if (!originalScore || !tailoredScore || !tailoredResume || !jd || !gapAnalysis) {
        return NextResponse.json({ error: "Missing required data for comparison PDF" }, { status: 400 });
      }
      pdfBuffer = await generateComparisonPDF(originalScore, tailoredScore, tailoredResume, jd, gapAnalysis);
      filename = "Resume_Analysis_Comparison.pdf";
    } else {
      return NextResponse.json({ error: "Invalid type. Must be 'tailored' or 'comparison'" }, { status: 400 });
    }

    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("PDF Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
