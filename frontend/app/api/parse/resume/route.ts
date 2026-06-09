import { NextResponse } from "next/server";
import { z } from "zod";
import { parseResume } from "../../../../lib/parseResume";

export const dynamic = "force-dynamic";
export const maxDuration = 30;
const RequestSchema = z.object({
  resumeText: z.string().max(10000, "Resume text exceeds 10,000 character limit. Please shorten your input."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = RequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }

    const parsedResume = await parseResume(result.data.resumeText);
    return NextResponse.json(parsedResume);
  } catch (error) {
    console.error("Parse Resume Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to parse resume" },
      { status: 500 }
    );
  }
}

