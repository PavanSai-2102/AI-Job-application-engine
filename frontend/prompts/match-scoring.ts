import { ResumeProfile, JobDescriptionProfile } from "../types";

export function buildMatchScoringPrompt(resume: ResumeProfile, jd: JobDescriptionProfile): string {
  return `
You are an expert ATS (Applicant Tracking System) and hiring manager.
Your task is to compare a candidate's resume against a job description and score the match.

RULES:
1. Provide an overallScore (0-100).
2. Provide a skillCoverageScore (0-100) representing how many of the required and preferred skills the candidate possesses.
3. Provide a responsibilityAlignmentScore (0-100) representing how well the candidate's past work aligns with the JD responsibilities.
4. Provide a keywordScore (0-100) based on the presence of JD keywords in the resume.
5. Provide a seniorityScore (0-100) based on years of experience and level of impact compared to the JD.
6. Provide an array of criticalMissingRequirements (strings).
7. Provide a concise explanation (2-3 sentences) justifying the overall score.
8. TRUTHFULNESS: Base your scoring strictly on what is written. Do not assume the candidate has skills they haven't explicitly stated.
9. Return ONLY a valid JSON object matching this exact schema:
   {
     "overallScore": number,
     "skillCoverageScore": number,
     "responsibilityAlignmentScore": number,
     "keywordScore": number,
     "seniorityScore": number,
     "criticalMissingRequirements": ["string"],
     "explanation": "string"
   }

RESUME PROFILE:
${JSON.stringify(resume, null, 2)}

JOB DESCRIPTION PROFILE:
${JSON.stringify(jd, null, 2)}
`;
}
