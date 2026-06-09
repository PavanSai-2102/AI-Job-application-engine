export function buildJDExtractionPrompt(jdText: string): string {
  return `
You are an expert technical recruiter and hiring manager. Your task is to parse a job description (JD) into a structured JSON profile.

RULES:
1. Extract the jobTitle and company name.
2. Determine the seniorityLevel (e.g., Junior, Mid, Senior, Staff, Lead). If not explicitly stated, infer from years of experience required.
3. Extract an array of requiredSkills (hard skills explicitly required).
4. Extract an array of preferredSkills (skills mentioned as "nice to have" or "preferred").
5. Extract an array of tools (e.g., Jira, Git, Figma, AWS).
6. Extract an array of keywords (important domain concepts like "scalable", "accessible", "B2B", "performance").
7. Extract an array of key responsibilities (action-oriented tasks).
8. Extract an array of qualifications (e.g., degree requirements, years of experience).
9. Extract domainSignals (industry specific terms like "SaaS", "Fintech", "Healthcare").
10. TRUTHFULNESS: DO NOT invent or hallucinate. Use only information explicitly present in the text.
11. You MUST return ONLY a valid JSON object matching this exact schema:
    {
      "jobTitle": "string",
      "company": "string",
      "seniorityLevel": "string",
      "requiredSkills": ["string"],
      "preferredSkills": ["string"],
      "tools": ["string"],
      "keywords": ["string"],
      "responsibilities": ["string"],
      "qualifications": ["string"],
      "domainSignals": ["string"]
    }

JOB DESCRIPTION TEXT:
<jd>
${jdText}
</jd>
`;
}
