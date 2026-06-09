import { z } from "zod";

export const ResumeProfileSchema = z.object({
  contact: z.object({
    name: z.string().nullish().transform(v => v || ""),
    email: z.string().nullish().transform(v => v || ""),
    phone: z.string().nullish().transform(v => v || ""),
    location: z.string().nullish().transform(v => v || ""),
    linkedin: z.string().nullish().transform(v => v || ""),
    github: z.string().nullish().transform(v => v || ""),
  }).nullish().transform(v => v || { name: "", email: "", phone: "", location: "", linkedin: "", github: "" }),
  summary: z.string().nullish().transform(v => v || ""),
  skills: z.array(z.string()).nullish().transform(v => v || []),
  experience: z.array(z.object({
    company: z.string().nullish().transform(v => v || ""),
    title: z.string().nullish().transform(v => v || ""),
    startDate: z.string().nullish().transform(v => v || ""),
    endDate: z.string().nullish().transform(v => v || ""),
    bullets: z.array(z.string()).nullish().transform(v => v || []),
  })).nullish().transform(v => v || []),
  projects: z.array(z.object({
    name: z.string().nullish().transform(v => v || ""),
    description: z.string().nullish().transform(v => v || ""),
    bullets: z.array(z.string()).nullish().transform(v => v || []),
  })).nullish().transform(v => v || []),
  education: z.array(z.object({
    institution: z.string().nullish().transform(v => v || ""),
    degree: z.string().nullish().transform(v => v || ""),
    field: z.string().nullish().transform(v => v || ""),
    cgpa: z.string().nullish().transform(v => v || ""),
    graduationDate: z.string().nullish().transform(v => v || ""),
  })).nullish().transform(v => v || []),
  certifications: z.array(z.string()).nullish().transform(v => v || []),
  courses: z.array(z.string()).nullish().transform(v => v || []),
});

export const JobDescriptionProfileSchema = z.object({
  jobTitle: z.string().nullish().transform(v => v || ""),
  company: z.string().nullish().transform(v => v || ""),
  seniorityLevel: z.string().nullish().transform(v => v || ""),
  requiredSkills: z.array(z.string()).nullish().transform(v => v || []),
  preferredSkills: z.array(z.string()).nullish().transform(v => v || []),
  tools: z.array(z.string()).nullish().transform(v => v || []),
  keywords: z.array(z.string()).nullish().transform(v => v || []),
  responsibilities: z.array(z.string()).nullish().transform(v => v || []),
  qualifications: z.array(z.string()).nullish().transform(v => v || []),
  domainSignals: z.array(z.string()).nullish().transform(v => v || []),
});

export const MatchScoreSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  skillCoverageScore: z.number().int().min(0).max(100),
  responsibilityAlignmentScore: z.number().int().min(0).max(100),
  keywordScore: z.number().int().min(0).max(100),
  seniorityScore: z.number().int().min(0).max(100),
  criticalMissingRequirements: z.array(z.string()).nullish().transform(v => v || []),
  explanation: z.string(),
});

export const BulletRewriteSchema = z.object({
  original: z.string(),
  tailored: z.string(),
  changeReason: z.string(),
  keywordsAddressed: z.array(z.string()).nullish().transform(v => v || []),
  confidence: z.enum(["high", "medium", "low"]).default("medium"),
  riskFlag: z.string().max(200).optional(),
});

export const TailoredResumeSchema = z.object({
  tailoredSummary: z.string().optional(),
  tailoredSkills: z.array(z.string()),
  tailoredExperience: z.array(z.object({
    company: z.string(),
    title: z.string(),
    bullets: z.array(BulletRewriteSchema),
  })),
});

export const GapItemSchema = z.object({
  name: z.string(),
  importance: z.enum(["high", "medium", "low"]),
  jdEvidence: z.string(),
  resumeEvidence: z.string(),
  suggestedAction: z.string(),
  canSafelyAdd: z.boolean(),
});

export const GapAnalysisSchema = z.object({
  gaps: z.array(GapItemSchema),
});

export const TailoringRunSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string(), // ISO date string
  resumeRaw: z.string(),
  jdRaw: z.string(),
  parsedResume: ResumeProfileSchema,
  parsedJD: JobDescriptionProfileSchema,
  originalScore: MatchScoreSchema,
  tailoredResume: TailoredResumeSchema,
  tailoredScore: MatchScoreSchema,
  gapAnalysis: GapAnalysisSchema,
});
