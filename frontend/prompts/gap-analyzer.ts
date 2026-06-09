import { ResumeProfile, JobDescriptionProfile } from "../types";

export function buildGapAnalyzerPrompt(resume: ResumeProfile, jd: JobDescriptionProfile): string {
  return `
You are an expert career coach.
Your task is to identify gaps between a candidate's resume and a target job description.

RULES:
1. Identify up to 5 critical gaps (skills, tools, or requirements).
2. For each gap, provide:
   - name: The name of the missing skill/requirement.
   - importance: "high", "medium", or "low".
   - jdEvidence: A short quote or paraphrase from the JD indicating this is required.
   - resumeEvidence: "Not mentioned" or a description of what the resume currently says.
   - suggestedAction: An actionable tip for the candidate (e.g., "If you used Redis at Tech Corp, add a bullet mentioning it").
   - canSafelyAdd: Set to true ONLY IF it's a soft skill or a basic variation of a skill they already have (e.g., they have "React", the JD asks for "React Hooks"). If it's a hard skill or completely new tool, set to false.
3. TRUTHFULNESS: YOU MUST NEVER INVENT EXPERIENCE, METRICS, TECHNOLOGIES, OR ROLES. Base your analysis strictly on the provided resume.
4. Return ONLY a valid JSON object matching this schema:
   {
     "gaps": [
       { "name": "string", "importance": "high|medium|low", "jdEvidence": "string", "resumeEvidence": "string", "suggestedAction": "string", "canSafelyAdd": boolean }
     ]
   }

RESUME PROFILE:
${JSON.stringify(resume, null, 2)}

JOB DESCRIPTION PROFILE:
${JSON.stringify(jd, null, 2)}
`;
}
