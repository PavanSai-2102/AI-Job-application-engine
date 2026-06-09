import { NextResponse } from "next/server";
import { z } from "zod";
import { scoreMatch } from "../../../lib/scoreMatch";
import { ResumeProfileSchema, JobDescriptionProfileSchema } from "../../../lib/schemas";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const RequestSchema = z.object({
  resume: ResumeProfileSchema,
  jd: JobDescriptionProfileSchema,
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

    const score = await scoreMatch(result.data.resume, result.data.jd);
    return NextResponse.json(score);
  } catch (error) {
    console.error("Score Match Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to score match" },
      { status: 500 }
    );
  }
}
