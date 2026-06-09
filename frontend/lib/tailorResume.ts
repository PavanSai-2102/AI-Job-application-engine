import { callLLM } from "./llm";
import { TailoredResumeSchema } from "./schemas";
import { ResumeProfile, JobDescriptionProfile, MatchScore, TailoredResume } from "../types";
import { buildBulletRewriterPrompt } from "./prompts";

export async function tailorResume(
  resume: ResumeProfile, 
  jd: JobDescriptionProfile, 
  score: MatchScore
): Promise<TailoredResume> {
  const prompt = buildBulletRewriterPrompt(resume, jd, score);
  // Using 70b-versatile for high quality rewrites
  return await callLLM<TailoredResume>(prompt, TailoredResumeSchema);
}
