import { NextResponse } from "next/server";
import { z } from "zod";
import { tailorResume } from "../../../lib/tailorResume";
import { analyzeGaps } from "../../../lib/analyzeGaps";
import { applyGuardrails } from "../../../lib/guardrails";
import { ResumeProfileSchema, JobDescriptionProfileSchema, MatchScoreSchema } from "../../../lib/schemas";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Tailor runs 2 parallel LLM calls

const RequestSchema = z.object({
  resume: ResumeProfileSchema,
  jd: JobDescriptionProfileSchema,
  score: MatchScoreSchema,
  applicationId: z.string().optional(),
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

    const { resume, jd, score } = result.data;

    // Run tailor and gap analysis in parallel
    const [tailoredResumeRaw, gapAnalysis] = await Promise.all([
      tailorResume(resume, jd, score),
      analyzeGaps(resume, jd),
    ]);

    // Apply truthfulness guardrails post-LLM
    const tailoredResume = applyGuardrails(resume, tailoredResumeRaw);

    if (result.data.applicationId) {
      // Save the tailored resume to the database
      await prisma.tailoredResume.upsert({
        where: { applicationId: result.data.applicationId },
        create: {
          applicationId: result.data.applicationId,
          tailoredContent: tailoredResume as any,
          matchScore: score as any,
          gapAnalysis: gapAnalysis as any
        },
        update: {
          tailoredContent: tailoredResume as any,
          matchScore: score as any,
          gapAnalysis: gapAnalysis as any
        }
      });
      
      // Update application status
      await prisma.application.update({
        where: { id: result.data.applicationId },
        data: { status: "TAILORING" }
      });
    }

    return NextResponse.json({ tailoredResume, gapAnalysis });
  } catch (error) {
    console.error("Tailor Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to tailor resume and analyze gaps" },
      { status: 500 }
    );
  }
}
