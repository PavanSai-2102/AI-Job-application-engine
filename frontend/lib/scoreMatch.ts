import { callLLM } from "./llm";
import { MatchScoreSchema } from "./schemas";
import { ResumeProfile, JobDescriptionProfile, MatchScore } from "../types";
import { buildMatchScoringPrompt } from "./prompts";

export async function scoreMatch(resume: ResumeProfile, jd: JobDescriptionProfile): Promise<MatchScore> {
  const prompt = buildMatchScoringPrompt(resume, jd);
  return await callLLM<MatchScore>(prompt, MatchScoreSchema);
}
