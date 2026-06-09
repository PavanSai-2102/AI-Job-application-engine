import { callLLM } from "./llm";
import { JobDescriptionProfileSchema } from "./schemas";
import { JobDescriptionProfile } from "../types";
import { buildJDExtractionPrompt } from "./prompts";

export async function parseJD(jdText: string): Promise<JobDescriptionProfile> {
  const prompt = buildJDExtractionPrompt(jdText);
  return await callLLM<JobDescriptionProfile>(prompt, JobDescriptionProfileSchema);
}
