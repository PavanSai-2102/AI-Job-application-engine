import { TailoredResume, ResumeProfile } from "../types";

/**
 * Extracts proper nouns, acronyms, and capitalized terms (like React, Next.js, AWS, CI/CD).
 * Ignores common action verbs that usually start sentences in resumes.
 */
function extractProperNouns(text: string): Set<string> {
  // Match acronyms, words starting with a capital letter, and optionally allowing hyphens or dots (e.g., Node.js, Next.js)
  const matches = text.match(/\b([A-Z][a-z0-9\-.]+|[A-Z]{2,}(?:\/[A-Z]{2,})?)\b/g) || [];
  
  // Common sentence starters to ignore
  const commonVerbs = new Set([
    'Developed', 'Built', 'Created', 'Led', 'Managed', 'Designed', 'Implemented', 
    'Improved', 'Increased', 'Decreased', 'Reduced', 'Collaborated', 'Worked', 
    'Used', 'Utilized', 'Spearheaded', 'Orchestrated', 'Architected', 'Engineered',
    'Maintained', 'Deployed', 'Integrated', 'Optimized', 'Resolved', 'Streamlined',
    'Ensured', 'Established', 'Fostered', 'Authored', 'Migrated', 'Transformed',
    'The', 'A', 'An', 'In', 'On', 'At', 'To', 'For', 'With', 'By', 'From'
  ]);
  
  const nouns = new Set<string>();
  matches.forEach(m => {
    const clean = m.trim().replace(/[.,!?:;]+$/, '');
    if (!commonVerbs.has(clean) && clean.length > 1) {
      nouns.add(clean.toLowerCase());
    }
  });
  return nouns;
}

/**
 * Validates the tailored resume against the original resume.
 * If the LLM has injected new proper nouns (like technologies or metrics) that
 * do not exist anywhere in the original resume, it flags the bullet.
 */
export function applyGuardrails(originalResume: ResumeProfile, tailoredResume: TailoredResume): TailoredResume {
  // Extract all proper nouns from the entire original resume text to create an "allowed list"
  // We stringify the profile to easily capture everything (skills, bullet points, titles)
  const originalText = JSON.stringify(originalResume);
  const allowedNouns = extractProperNouns(originalText);

  // Deep clone to avoid mutating the original object
  const validatedResume = JSON.parse(JSON.stringify(tailoredResume)) as TailoredResume;

  validatedResume.tailoredExperience?.forEach((job) => {
    job.bullets.forEach((bullet) => {
      const tailoredNouns = extractProperNouns(bullet.tailored);
      const suspiciousNouns: string[] = [];

      tailoredNouns.forEach(noun => {
        if (!allowedNouns.has(noun)) {
          suspiciousNouns.push(noun);
        }
      });

      if (suspiciousNouns.length > 0) {
        bullet.confidence = "low";
        bullet.riskFlag = `NEEDS_REVIEW: Contains potentially invented terms (${suspiciousNouns.slice(0, 3).join(", ")}).`;
      }
    });
  });

  return validatedResume;
}
