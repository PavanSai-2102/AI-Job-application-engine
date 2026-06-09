import { callLLM } from "./llm";
import { ResumeProfileSchema } from "./schemas";
import { ResumeProfile } from "../types";
import { buildResumeParsePrompt } from "./prompts";

export async function parseResume(resumeText: string): Promise<ResumeProfile> {
  const prompt = buildResumeParsePrompt(resumeText);
  return await callLLM<ResumeProfile>(prompt, ResumeProfileSchema);
}
