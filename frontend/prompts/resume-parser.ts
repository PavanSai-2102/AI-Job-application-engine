export function buildResumeParsePrompt(resumeText: string): string {
  return `
You are an expert technical recruiter. Your task is to parse a raw resume text into a highly structured JSON format.

RULES:
1. Extract the name, email, phone, location, and social links (LinkedIn, GitHub) if present.
2. Extract the professional summary.
3. Extract an array of all skills mentioned.
4. Extract the work experience. For each role, include company, title, start date, end date, and an array of bullet points EXACTLY as written.
5. Extract projects (if any), with name, description, and bullets.
6. Extract education (institution, degree, field, cgpa if present, graduation date).
7. Extract certifications as an array of strings. ONLY include items from the explicit "CERTIFICATIONS" section of the resume.
8. Extract courses/trainings as an array of strings. ONLY include items from the explicit "COURSES" section. Ensure there is NO overlap with certifications.
9. TRUTHFULNESS: YOU MUST NEVER INVENT EXPERIENCE, METRICS, TECHNOLOGIES, OR ROLES. Extract ONLY what is exactly written.
10. You MUST return ONLY a JSON object that matches this exact schema:
   {
     "contact": { "name": "string", "email": "string", "phone": "string", "location": "string", "linkedin": "string", "github": "string" },
     "summary": "string",
     "skills": ["string"],
     "experience": [ { "company": "string", "title": "string", "startDate": "string", "endDate": "string", "bullets": ["string"] } ],
     "projects": [ { "name": "string", "description": "string", "bullets": ["string"] } ],
     "education": [ { "institution": "string", "degree": "string", "field": "string", "cgpa": "string", "graduationDate": "string" } ],
     "certifications": ["string"],
     "courses": ["string"]
   }

RESUME TEXT:
<resume>
${resumeText}
</resume>
`;
}
