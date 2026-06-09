import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJD } from "../../../../lib/parseJD";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const RequestSchema = z.object({
  jdText: z.string().min(10).max(5000, "Job description exceeds 5,000 character limit. Please shorten your input."),
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

    const text = result.data.jdText;

    const parsedJD = await parseJD(text);
    return NextResponse.json(parsedJD);
  } catch (error) {
    console.error("Parse JD Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to parse job description" },
      { status: 500 }
    );
  }
}
