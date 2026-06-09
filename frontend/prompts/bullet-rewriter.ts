import { ResumeProfile, JobDescriptionProfile, MatchScore } from "../types";

export function buildBulletRewriterPrompt(resume: ResumeProfile, jd: JobDescriptionProfile, score: MatchScore): string {
  return `
You are an elite career coach and resume writer.
Your task is to rewrite the candidate's professional summary, skills list, and experience bullets to better align with the target job description.

RULES:
1. TRUTHFULNESS: YOU MUST NEVER INVENT EXPERIENCE, METRICS, TECHNOLOGIES, OR ROLES. You may only highlight, rephrase, or re-frame existing information to better match the JD keywords.
2. If the original bullet does not relate to the JD, leave it mostly as-is, but improve its impact (e.g., using the STAR method).
3. If the original bullet relates to the JD, aggressively rewrite it to incorporate JD keywords and responsibilities, PROVIDED it does not violate Rule 1.
4. For each rewritten bullet, provide:
   - original: The exact original text.
   - tailored: The newly rewritten text.
   - changeReason: A brief explanation of why you changed it (e.g., "Aligned with responsibility X").
   - keywordsAddressed: An array of JD keywords successfully incorporated into this bullet.
   - confidence: "high", "medium", or "low". Use "low" if you had to stretch the truth or make assumptions.
   - riskFlag: A string describing any potential risk (e.g., "Assumed 'frontend' meant React"). Omit if no risk.
5. Provide a tailoredSummary (optional, if a summary existed).
6. Provide a tailoredSkills array (re-order the skills so the ones matching the JD appear first).
7. Return ONLY a valid JSON object matching this exact structure:
   {
     "tailoredSummary": "string",
     "tailoredSkills": ["string"],
     "tailoredExperience": [
       {
         "company": "string",
         "title": "string",
         "bullets": [
           {
             "original": "string",
             "tailored": "string",
             "changeReason": "string",
             "keywordsAddressed": ["string"],
             "confidence": "high|medium|low",
             "riskFlag": "string (optional)"
           }
         ]
       }
     ]
   }

ORIGINAL RESUME PROFILE:
${JSON.stringify(resume, null, 2)}

JOB DESCRIPTION PROFILE:
${JSON.stringify(jd, null, 2)}

CURRENT MATCH SCORE (For context):
${JSON.stringify(score, null, 2)}
`;
}
