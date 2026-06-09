import { z } from "zod";
import {
  ResumeProfileSchema,
  JobDescriptionProfileSchema,
  MatchScoreSchema,
  BulletRewriteSchema,
  TailoredResumeSchema,
  GapItemSchema,
  GapAnalysisSchema,
  TailoringRunSchema,
} from "../lib/schemas";

export type ResumeProfile = z.infer<typeof ResumeProfileSchema>;
export type JobDescriptionProfile = z.infer<typeof JobDescriptionProfileSchema>;
export type MatchScore = z.infer<typeof MatchScoreSchema>;
export type BulletRewrite = z.infer<typeof BulletRewriteSchema>;
export type TailoredResume = z.infer<typeof TailoredResumeSchema>;
export type GapItem = z.infer<typeof GapItemSchema>;
export type GapAnalysis = z.infer<typeof GapAnalysisSchema>;
export type TailoringRun = z.infer<typeof TailoringRunSchema>;
