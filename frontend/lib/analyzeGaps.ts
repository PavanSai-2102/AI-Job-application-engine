import { callLLM } from "./llm";
import { GapAnalysisSchema } from "./schemas";
import { ResumeProfile, JobDescriptionProfile, GapAnalysis } from "../types";
import { buildGapAnalyzerPrompt } from "./prompts";

export async function analyzeGaps(resume: ResumeProfile, jd: JobDescriptionProfile): Promise<GapAnalysis> {
  const prompt = buildGapAnalyzerPrompt(resume, jd);
  return await callLLM<GapAnalysis>(prompt, GapAnalysisSchema);
}
