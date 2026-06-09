# Resume Shapeshifter — Architecture Document

> **Version:** 1.0  
> **Last Updated:** 2026-05-29  
> **Status:** Draft

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [Core Engines](#6-core-engines)
7. [LLM Integration Layer](#7-llm-integration-layer)
8. [Data Models & Schemas](#8-data-models--schemas)
9. [API Design](#9-api-design)
10. [PDF Generation Pipeline](#10-pdf-generation-pipeline)
11. [Storage Strategy](#11-storage-strategy)
12. [Data Flow Diagrams](#12-data-flow-diagrams)
13. [Directory Structure](#13-directory-structure)
14. [Error Handling & Guardrails](#14-error-handling--guardrails)
15. [Phased Implementation Plan](#15-phased-implementation-plan)
16. [Risks & Mitigations](#16-risks--mitigations)

---

## 1. System Overview

**Resume Shapeshifter** is a JD-to-resume tailoring engine. It accepts a user's existing resume and a target job description (JD), and produces:

- A structured analysis of how well the resume matches the JD.
- An AI-rewritten version of the resume that improves alignment without fabricating experience.
- A gap analysis identifying missing skills, tools, and requirements.
- A side-by-side comparison PDF that serves as the primary proof artifact.

The product is built as a **Next.js full-stack application** with a React frontend and API routes for backend logic. LLM calls are orchestrated through the Groq API using structured JSON outputs and separated prompt files.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Browser (Next.js / React)                    │
│                                                                     │
│  ┌───────────┐  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Resume   │  │    JD    │  │   Analysis   │  │  Side-by-Side│  │
│  │   Input   │  │  Input   │  │   Results    │  │   Diff View  │  │
│  └───────────┘  └──────────┘  └──────────────┘  └──────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                     PDF Export (browser-side)                 │  │
│  └───────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTP (fetch / API routes)
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Next.js API Routes (/app/api/*)                 │
│                                                                     │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────────────┐   │
│  │  /parse       │  │  /score       │  │  /tailor             │   │
│  │  (Resume +    │  │  (Match       │  │  (Bullet Rewriter +  │   │
│  │   JD Parser)  │  │   Engine)     │  │   Gap Engine)        │   │
│  └───────────────┘  └───────────────┘  └──────────────────────┘   │
│                                                                     │
│  ┌───────────────┐                                                  │
│  │  /export      │                                                  │
│  │  (PDF Gen)    │                                                  │
│  └───────────────┘                                                  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ Groq API (structured JSON)
                                └─────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────┐
│                         LLM Layer (Groq)                            │
│                                                                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────┐  │
│  │ JD Extract │ │ Resume     │ │ Match      │ │ Bullet         │  │
│  │ Prompt     │ │ Parse      │ │ Scoring    │ │ Rewrite Prompt │  │
│  │            │ │ Prompt     │ │ Prompt     │ │                │  │
│  └────────────┘ └────────────┘ └────────────┘ └────────────────┘  │
│                                                                     │
│  ┌────────────┐ ┌────────────┐                                     │
│  │ Gap        │ │ Resume     │                                     │
│  │ Analysis   │ │ Assembly   │                                     │
│  │ Prompt     │ │ Prompt     │                                     │
│  └────────────┘ └────────────┘                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Tech Stack

| Layer              | Technology                             | Rationale                                                    |
|--------------------|----------------------------------------|--------------------------------------------------------------|
| **Framework**      | Next.js 14 (App Router)                | Full-stack, API routes, SSR, file-based routing              |
| **Language**       | TypeScript                             | Type safety for all data models                              |
| **UI Framework**   | React                                  | Component model, hooks, re-usable UI                         |
| **Styling**        | Tailwind CSS + Shadcn UI               | Rapid design system, accessible components                   |
| **LLM**            | Groq API (`llama-3.3-70b-versatile`) | Blazing fast generation, structured JSON output, reliable function calling            |
| **Schema Validation** | Zod                                 | Runtime validation of LLM responses and API payloads         |
| **PDF Generation** | `@react-pdf/renderer`                  | React-based PDF, works in Node.js API routes                 |
| **Document Parsing** | `pdf-parse` + `mammoth`              | PDF and DOCX resume extraction                               |
| **Storage (MVP)**  | Local state + `localStorage`           | No server persistence needed in MVP                          |
| **Storage (v2)**   | Supabase (PostgreSQL)                  | User sessions, saved runs, history                           |

---

## 4. Frontend Architecture

### 4.1 Pages (App Router)

| Route                  | Component File                    | Description                                       |
|------------------------|-----------------------------------|---------------------------------------------------|
| `/`                    | `app/page.tsx`                    | Landing page with CTA                             |
| `/tailor`              | `app/tailor/page.tsx`             | Main app: Resume + JD input                       |
| `/tailor/results`      | `app/tailor/results/page.tsx`     | Analysis results, score, gap analysis             |
| `/tailor/diff`         | `app/tailor/diff/page.tsx`        | Side-by-side bullet diff view                     |
| `/tailor/export`       | `app/tailor/export/page.tsx`      | PDF export controls and preview                   |

### 4.2 Component Hierarchy

```
app/
└── tailor/
    └── page.tsx
        ├── <ResumeInput />          # Text area + file upload (PDF/DOCX)
        ├── <JDInput />              # Text area for pasting job description
        └── <AnalyzeButton />        # Triggers /api/parse then /api/score

    results/page.tsx
        ├── <ScoreCard />            # Original + tailored match scores with explanation
        ├── <JDSummaryCard />        # Extracted JD: title, company, skills, etc.
        ├── <GapAnalysis />          # List of gaps with importance + suggested actions
        └── <TailorButton />         # Triggers /api/tailor

    diff/page.tsx
        └── <SideBySideDiff />       # Column view: original bullet | tailored bullet
            ├── <BulletCard />       # Individual bullet with reason, confidence, risk
            └── <ChangeHighlight />  # Inline diff highlight of changed words

    export/page.tsx
        └── <PDFExportButton />      # Calls /api/export and triggers download
```

### 4.3 State Management

State is managed with **React Context + `useReducer`** across a `TailoringSessionContext`. No external state library is required for MVP.

```
TailoringSessionContext
├── resumeText: string
├── jdText: string
├── parsedResume: ResumeProfile | null
├── parsedJD: JobDescriptionProfile | null
├── originalScore: MatchScore | null
├── tailoredResume: TailoredResume | null
├── tailoredScore: MatchScore | null
├── gapAnalysis: GapAnalysis | null
└── status: "idle" | "parsing" | "scoring" | "tailoring" | "done" | "error"
```

---

## 5. Backend Architecture

### 5.1 API Routes

All backend logic lives in Next.js API routes under `app/api/`.

| Route                  | Method | Input                                | Output                          | Description                             |
|------------------------|--------|--------------------------------------|---------------------------------|-----------------------------------------|
| `/api/parse/resume`    | POST   | `{ resumeText: string }`             | `ResumeProfile`                 | Parses raw resume text into structured JSON |
| `/api/parse/jd`        | POST   | `{ jdText: string }`                 | `JobDescriptionProfile`         | Extracts structured JD data             |
| `/api/score`           | POST   | `{ resume, jd }`                     | `MatchScore`                    | Scores resume against JD                |
| `/api/tailor`          | POST   | `{ resume, jd, score }`              | `TailoredResume + GapAnalysis`  | Rewrites bullets + runs gap analysis    |
| `/api/export/pdf`      | POST   | `{ resume, tailored, score, gaps }`  | PDF binary stream               | Generates side-by-side comparison PDF   |

### 5.2 Service Layer

Each API route delegates to a corresponding service function in `/lib/`:

```
lib/
├── parseResume.ts        # Calls LLM to parse raw resume text
├── parseJD.ts            # Calls LLM to extract structured JD data
├── scoreMatch.ts         # Calls LLM with resume + JD → MatchScore
├── tailorResume.ts       # Calls LLM to rewrite bullets and summarize
├── analyzeGaps.ts        # Calls LLM to identify and classify gaps
├── generatePDF.ts        # Renders React PDF component → binary
├── schemas.ts            # All Zod schemas for runtime validation
├── prompts.ts            # Re-exports all prompt builders
└── llm.ts                # Groq client wrapper with retry + JSON parsing
```

---

## 6. Core Engines

### 6.1 Resume Parser

**Input:** Raw text (pasted) or extracted text (from PDF/DOCX via `pdf-parse` / `mammoth`)

**Process:**
1. Pre-process: remove excessive whitespace, normalize line endings.
2. Pass to LLM with `resume-parser` prompt requesting structured JSON.
3. Validate response against `ResumeProfileSchema` (Zod).
4. Return `ResumeProfile`.

**Fallback:** If LLM JSON is malformed, retry once with a stricter prompt, then return a partial parse with an error flag.

---

### 6.2 JD Parser

**Input:** Raw JD text (pasted)

**Process:**
1. Pass to LLM with `jd-extraction` prompt.
2. Validate response against `JobDescriptionProfileSchema` (Zod).
3. Return `JobDescriptionProfile`.

**Key extractions:**
- `jobTitle`, `company`, `seniorityLevel`
- `requiredSkills[]`, `preferredSkills[]`
- `tools[]`, `keywords[]`, `responsibilities[]`, `qualifications[]`
- `domainSignals[]` (e.g., "fintech", "B2B SaaS")

---

### 6.3 Match Engine

**Input:** `ResumeProfile` + `JobDescriptionProfile`

**Process:**
1. Pass both to LLM with `match-scoring` prompt.
2. Compute sub-scores:
   - `skillCoverageScore` — % of required skills found in resume.
   - `responsibilityAlignmentScore` — semantic overlap of bullet actions with JD responsibilities.
   - `keywordScore` — % of JD keywords found verbatim or semantically in resume.
   - `seniorityScore` — alignment of implied seniority level.
3. Weighted aggregate → `overallScore` (0–100).
4. Include `criticalMissingRequirements[]` and `explanation` string.
5. Validate against `MatchScoreSchema`.

**Scoring weights (default):**

| Sub-Score                     | Weight |
|-------------------------------|--------|
| Required Skill Coverage       | 35%    |
| Responsibility Alignment      | 25%    |
| Keyword Alignment             | 20%    |
| Preferred Skill Coverage      | 10%    |
| Seniority Alignment           | 10%    |

---

### 6.4 Tailoring Engine

**Input:** `ResumeProfile` + `JobDescriptionProfile` + `MatchScore`

**Process:**
1. Pass to LLM with `bullet-rewriter` prompt.
2. For each experience bullet, the LLM outputs:
   - `original` — unchanged source bullet.
   - `tailored` — rewritten version.
   - `changeReason` — plain-English rationale.
   - `keywordsAddressed[]` — JD keywords incorporated.
   - `confidence` — `"high" | "medium" | "low"`.
   - `riskFlag` — if the rewrite may overstate experience.
3. Also rewrite `summary` and reorder `skills`.
4. Validate against `TailoredResumeSchema`.

**Guardrails enforced in prompt:**
- Never invent experience, metrics, or employer names.
- Only use evidence from the original resume.
- Mark any uncertain suggestions as requiring user confirmation.
- Flag low-confidence rewrites with `riskFlag`.

---

### 6.5 Gap Engine

**Input:** `ResumeProfile` + `JobDescriptionProfile` + `TailoredResume`

**Process:**
1. Pass to LLM with `gap-analysis` prompt.
2. For each identified gap:
   - `name` — name of the missing skill/requirement.
   - `importance` — `"high" | "medium" | "low"`.
   - `jdEvidence` — quote from JD.
   - `resumeEvidence` — resume reference, or `"Not mentioned"`.
   - `suggestedAction` — actionable next step.
   - `canSafelyAdd` — `boolean` (false if not supported by resume).
3. Validate against `GapAnalysisSchema`.

---

## 7. LLM Integration Layer

### 7.1 Client Wrapper (`lib/llm.ts`)

```typescript
// Pseudocode
async function callLLM<T>(
  prompt: string,
  schema: ZodSchema<T>,
  options: { model: string; temperature: number; maxRetries: number }
): Promise<T>
```

- Uses `groq.chat.completions.create()` with `response_format: { type: "json_object" }`.
- Parses and validates response with Zod schema.
- Retries up to 2 times on parse/validation failure with a tightened prompt.
- Throws a typed `LLMError` on persistent failure.

### 7.2 Prompt Files

Each prompt lives in a dedicated file under `/prompts/`:

| File                         | Purpose                                         |
|------------------------------|-------------------------------------------------|
| `prompts/jd-extraction.ts`   | Extract structured data from raw JD text        |
| `prompts/resume-parser.ts`   | Parse raw resume text into `ResumeProfile`      |
| `prompts/match-scoring.ts`   | Score resume vs JD, produce sub-scores          |
| `prompts/bullet-rewriter.ts` | Rewrite resume bullets with JD alignment        |
| `prompts/gap-analysis.ts`    | Identify missing skills and requirements        |
| `prompts/resume-assembly.ts` | Assemble final tailored resume from parts       |

Each prompt file exports a builder function:

```typescript
export function buildJDExtractionPrompt(jdText: string): string { ... }
```

### 7.3 Model Selection

| Task                  | Recommended Model   | Rationale                                    |
|-----------------------|---------------------|----------------------------------------------|
| Resume/JD Parsing     | `llama-3.3-70b-versatile` | Fast, structured extraction           |
| Match Scoring         | `llama-3.3-70b-versatile` | Fast, reliable scoring with clear schema     |
| Bullet Rewriting      | `llama-3.3-70b-versatile` | High quality rewrites, nuanced reasoning   |
| Gap Analysis          | `llama-3.3-70b-versatile` | Rule-based classification, structured output |

---

## 8. Data Models & Schemas

All schemas are defined in `lib/schemas.ts` using Zod and exported as TypeScript types.

### 8.1 `ResumeProfile`

```typescript
const ResumeProfileSchema = z.object({
  contact: z.object({
    name: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
  }),
  summary: z.string().optional(),
  skills: z.array(z.string()),
  experience: z.array(z.object({
    company: z.string(),
    title: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    bullets: z.array(z.string()),
  })),
  projects: z.array(z.object({
    name: z.string(),
    description: z.string(),
    bullets: z.array(z.string()),
  })),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    field: z.string().optional(),
    graduationDate: z.string().optional(),
  })),
  certifications: z.array(z.string()),
});
export type ResumeProfile = z.infer<typeof ResumeProfileSchema>;
```

### 8.2 `JobDescriptionProfile`

```typescript
const JobDescriptionProfileSchema = z.object({
  jobTitle: z.string(),
  company: z.string().optional(),
  seniorityLevel: z.string(),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  tools: z.array(z.string()),
  keywords: z.array(z.string()),
  responsibilities: z.array(z.string()),
  qualifications: z.array(z.string()),
  domainSignals: z.array(z.string()),
});
export type JobDescriptionProfile = z.infer<typeof JobDescriptionProfileSchema>;
```

### 8.3 `MatchScore`

```typescript
const MatchScoreSchema = z.object({
  overallScore: z.number().min(0).max(100),
  skillCoverageScore: z.number().min(0).max(100),
  responsibilityAlignmentScore: z.number().min(0).max(100),
  keywordScore: z.number().min(0).max(100),
  seniorityScore: z.number().min(0).max(100),
  criticalMissingRequirements: z.array(z.string()),
  explanation: z.string(),
});
export type MatchScore = z.infer<typeof MatchScoreSchema>;
```

### 8.4 `TailoredResume`

```typescript
const BulletRewriteSchema = z.object({
  original: z.string(),
  tailored: z.string(),
  changeReason: z.string(),
  keywordsAddressed: z.array(z.string()),
  confidence: z.enum(["high", "medium", "low"]),
  riskFlag: z.string().optional(),
});

const TailoredResumeSchema = z.object({
  tailoredSummary: z.string().optional(),
  tailoredSkills: z.array(z.string()),
  tailoredExperience: z.array(z.object({
    company: z.string(),
    title: z.string(),
    bullets: z.array(BulletRewriteSchema),
  })),
});
export type TailoredResume = z.infer<typeof TailoredResumeSchema>;
```

### 8.5 `GapAnalysis`

```typescript
const GapItemSchema = z.object({
  name: z.string(),
  importance: z.enum(["high", "medium", "low"]),
  jdEvidence: z.string(),
  resumeEvidence: z.string(),
  suggestedAction: z.string(),
  canSafelyAdd: z.boolean(),
});

const GapAnalysisSchema = z.object({
  gaps: z.array(GapItemSchema),
});
export type GapAnalysis = z.infer<typeof GapAnalysisSchema>;
```

### 8.6 `TailoringRun` (full session envelope)

```typescript
type TailoringRun = {
  id: string;                          // UUID
  createdAt: string;                   // ISO timestamp
  resumeRaw: string;
  jdRaw: string;
  parsedResume: ResumeProfile;
  parsedJD: JobDescriptionProfile;
  originalScore: MatchScore;
  tailoredResume: TailoredResume;
  tailoredScore: MatchScore;
  gapAnalysis: GapAnalysis;
};
```

---

## 9. API Design

### `POST /api/parse/resume`

**Request:**
```json
{ "resumeText": "John Doe\nSoftware Engineer\n..." }
```

**Response:**
```json
{
  "contact": { "name": "John Doe", "email": "..." },
  "summary": "...",
  "skills": ["Python", "React", ...],
  "experience": [...],
  "projects": [...],
  "education": [...],
  "certifications": [...]
}
```

---

### `POST /api/parse/jd`

**Request:**
```json
{ "jdText": "We are looking for a Senior Software Engineer..." }
```

**Response:**
```json
{
  "jobTitle": "Senior Software Engineer",
  "company": "Acme Corp",
  "seniorityLevel": "Senior",
  "requiredSkills": ["Python", "Kubernetes", ...],
  "preferredSkills": ["Rust", ...],
  ...
}
```

---

### `POST /api/score`

**Request:**
```json
{
  "resume": { ...ResumeProfile },
  "jd": { ...JobDescriptionProfile }
}
```

**Response:**
```json
{
  "overallScore": 62,
  "skillCoverageScore": 70,
  "responsibilityAlignmentScore": 55,
  "keywordScore": 60,
  "seniorityScore": 75,
  "criticalMissingRequirements": ["Kubernetes", "CI/CD"],
  "explanation": "The resume covers 70% of required skills but lacks cloud infrastructure keywords..."
}
```

---

### `POST /api/tailor`

**Request:**
```json
{
  "resume": { ...ResumeProfile },
  "jd": { ...JobDescriptionProfile },
  "score": { ...MatchScore }
}
```

**Response:**
```json
{
  "tailoredResume": { ...TailoredResume },
  "gapAnalysis": { ...GapAnalysis }
}
```

---

### `POST /api/export/pdf`

**Request:**
```json
{
  "run": { ...TailoringRun }
}
```

**Response:** `application/pdf` binary stream (side-by-side comparison document)

---

## 10. PDF Generation Pipeline

The PDF generation uses `@react-pdf/renderer` running inside a Next.js API route.

### 10.1 Side-by-Side Comparison PDF Structure

```
┌────────────────────────────────────────────────────────┐
│  Header: Job Title @ Company                           │
│  Match Score: [Original: 62] → [Tailored: 81]         │
├──────────────────────────┬─────────────────────────────┤
│  JD Requirements Summary │  Gap Analysis Summary       │
├──────────────────────────┴─────────────────────────────┤
│  ORIGINAL RESUME          │  TAILORED RESUME           │
│  ─────────────────────    │  ──────────────────────    │
│  Work Experience          │  Work Experience           │
│  ● [Original Bullet 1]    │  ● [Tailored Bullet 1] ←  │
│  ● [Original Bullet 2]    │  ● [Tailored Bullet 2]     │
│                           │                            │
│  (changed bullets         │  (highlighted in           │
│   greyed out)             │   green)                   │
├───────────────────────────────────────────────────────┤
│  Bullet-Level Change Explanations                      │
│  [Bullet] → [Reason] [Keywords] [Confidence]          │
├───────────────────────────────────────────────────────┤
│  DISCLAIMER: Review all content before use.           │
│  This tool does not fabricate experience.             │
└───────────────────────────────────────────────────────┘
```

### 10.2 Tailored Resume PDF

A clean, single-column resume PDF generated from `TailoredResume` data. Uses a minimal professional template.

---

## 11. Storage Strategy

### MVP (Phase 1–3): Session-Only

- All state lives in the browser via `TailoringSessionContext`.
- `localStorage` can optionally cache the last `TailoringRun` for page refresh resilience.
- No user authentication required.

### v2 (Phase 4+): Persistent with Supabase

| Table              | Key Columns                                         | Notes                          |
|--------------------|-----------------------------------------------------|--------------------------------|
| `users`            | `id`, `email`, `created_at`                         | Auth via Supabase Auth         |
| `resumes`          | `id`, `user_id`, `raw_text`, `parsed_json`          | Reusable parsed resumes        |
| `job_descriptions` | `id`, `user_id`, `raw_text`, `parsed_json`          | Cached JD parses               |
| `tailoring_runs`   | `id`, `user_id`, `resume_id`, `jd_id`, `run_json`  | Full `TailoringRun` snapshot   |
| `exports`          | `id`, `run_id`, `pdf_url`, `type`                   | Links to Supabase Storage PDFs |

---

## 12. Data Flow Diagrams

### 12.1 Full User Journey

```
User Input
    │
    ├─► Paste/Upload Resume ──► /api/parse/resume ──► ResumeProfile
    │
    └─► Paste JD Text ─────────► /api/parse/jd ────────► JobDescriptionProfile
                                        │
                                        ▼
                           /api/score (ResumeProfile + JD)
                                        │
                                        ▼
                                   MatchScore (original)
                                        │
                                        ▼
                           /api/tailor (Resume + JD + Score)
                                        │
                          ┌─────────────┴─────────────┐
                          ▼                           ▼
                   TailoredResume               GapAnalysis
                          │
                          ▼
                   /api/score (TailoredResume + JD)
                          │
                          ▼
                   MatchScore (tailored)
                          │
                          ▼
              /api/export/pdf (full TailoringRun)
                          │
                          ▼
               Side-by-Side Comparison PDF
```

### 12.2 LLM Call Sequence

```
callLLM(prompt, schema)
    │
    ├─► Build prompt string
    ├─► POST to Groq (json_object mode)
    ├─► Receive raw JSON string
    ├─► JSON.parse()
    ├─► Zod.safeParse(schema)
    │       ├── SUCCESS → return typed object
    │       └── FAILURE → retry (up to 2x with tightened prompt)
    └─► Throw LLMParseError if all retries fail
```

---

## 13. Directory Structure

```
resume-shapeshifter/
├── app/
│   ├── layout.tsx                         # Root layout (font, metadata)
│   ├── page.tsx                           # Landing page
│   ├── tailor/
│   │   ├── page.tsx                       # Resume + JD input
│   │   ├── results/
│   │   │   └── page.tsx                   # Score + gap analysis
│   │   ├── diff/
│   │   │   └── page.tsx                   # Side-by-side bullet diff
│   │   └── export/
│   │       └── page.tsx                   # PDF export page
│   └── api/
│       ├── parse/
│       │   ├── resume/
│       │   │   └── route.ts               # POST /api/parse/resume
│       │   └── jd/
│       │       └── route.ts               # POST /api/parse/jd
│       ├── score/
│       │   └── route.ts                   # POST /api/score
│       ├── tailor/
│       │   └── route.ts                   # POST /api/tailor
│       └── export/
│           └── pdf/
│               └── route.ts               # POST /api/export/pdf
│
├── components/
│   ├── ResumeInput.tsx                    # Resume text area + file upload
│   ├── JDInput.tsx                        # JD text area
│   ├── AnalyzeButton.tsx                  # Triggers parse + score
│   ├── ScoreCard.tsx                      # Before/after score display
│   ├── JDSummaryCard.tsx                  # Extracted JD requirements
│   ├── GapAnalysis.tsx                    # Gap list with importance labels
│   ├── SideBySideDiff.tsx                 # Two-column bullet comparison
│   ├── BulletCard.tsx                     # Single bullet with metadata
│   ├── ChangeHighlight.tsx                # Inline diff highlight
│   └── PDFExportButton.tsx                # Download trigger
│
├── lib/
│   ├── llm.ts                             # Groq client wrapper
│   ├── schemas.ts                         # All Zod schemas + TS types
│   ├── parseResume.ts                     # Resume parsing service
│   ├── parseJD.ts                         # JD parsing service
│   ├── scoreMatch.ts                      # Match scoring service
│   ├── tailorResume.ts                    # Bullet rewriting service
│   ├── analyzeGaps.ts                     # Gap analysis service
│   ├── generatePDF.ts                     # PDF generation service
│   └── prompts.ts                         # Re-exports all prompt builders
│
├── prompts/
│   ├── jd-extraction.ts                   # JD extraction prompt builder
│   ├── resume-parser.ts                   # Resume parsing prompt builder
│   ├── match-scoring.ts                   # Scoring prompt builder
│   ├── bullet-rewriter.ts                 # Bullet rewrite prompt builder
│   ├── gap-analysis.ts                    # Gap analysis prompt builder
│   └── resume-assembly.ts                 # Final assembly prompt builder
│
├── context/
│   └── TailoringSessionContext.tsx        # Global session state
│
├── types/
│   └── index.ts                           # Re-exports all types from schemas.ts
│
├── docs/
│   ├── ProblemStatement.md                # Product requirements
│   └── architecture.md                   # This document
│
├── public/
│   └── sample/
│       ├── sample-resume.txt              # Demo resume for testing
│       └── sample-jd.txt                 # Demo JD for testing
│
├── .env.local                             # GROQ_API_KEY etc.
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 14. Error Handling & Guardrails

### 14.1 LLM Failure Modes

| Failure Type              | Handling Strategy                                               |
|---------------------------|-----------------------------------------------------------------|
| Malformed JSON            | Retry with stricter prompt, then return `LLMParseError`        |
| Schema validation fail    | Retry with schema hint in prompt, then surface partial result  |
| Rate limit / 429          | Exponential backoff, max 3 retries                             |
| Token limit exceeded      | Chunk resume by section and merge results                       |
| Hallucinated experience   | Prompt-level guardrail + confidence flagging + risk flags       |

### 14.2 Truthfulness Enforcement

All LLM prompts include the following hard constraints:

```
TRUTHFULNESS RULES (MANDATORY):
- You MUST NOT invent work history, employers, job titles, or dates.
- You MUST NOT add skills, certifications, or degrees not in the resume.
- You MUST NOT add metrics or quantified achievements unless they appear in the resume.
- If a JD requirement is not present in the resume, flag it as a GAP — do not invent it.
- When uncertain about meaning, preserve the original phrasing.
- Mark any suggestion that requires user confirmation with riskFlag: "NEEDS_REVIEW".
```

### 14.3 Input Validation

- All API routes validate request bodies with Zod before processing.
- Max resume text length: 10,000 characters.
- Max JD text length: 5,000 characters.
- File uploads: PDF and DOCX only, max 5MB.

### 14.4 User-Facing Guardrails

- Low-confidence rewrites (`confidence: "low"`) are visually flagged in the diff view.
- Risk-flagged bullets show a warning indicator and require explicit user acknowledgment.
- The PDF includes a mandatory disclaimer: *"Review all content before use. This tool does not fabricate experience."*
- `canSafelyAdd: false` gaps are clearly labeled "Do not add unless true."

---

## 15. Phased Implementation Plan

### Phase 1 — Static Prototype

**Goal:** Working UI with mocked data. No LLM calls.

- [ ] Set up Next.js project with Tailwind + Shadcn UI.
- [ ] Build `ResumeInput` and `JDInput` components.
- [ ] Build `TailoringSessionContext` with mock data.
- [ ] Build `ScoreCard`, `GapAnalysis`, `SideBySideDiff` with mock state.
- [ ] Add routing between tailor → results → diff → export pages.

---

### Phase 2 — LLM Integration

**Goal:** All five core LLM calls wired up with real Groq API.

- [ ] Implement `lib/llm.ts` wrapper.
- [ ] Write all prompt files under `/prompts/`.
- [ ] Implement `/api/parse/resume` route.
- [ ] Implement `/api/parse/jd` route.
- [ ] Implement `/api/score` route.
- [ ] Implement `/api/tailor` route (bullet rewriting + gap analysis).
- [ ] Wire API calls to frontend context.
- [ ] Add Zod validation to all routes.

---

### Phase 3 — PDF Export

**Goal:** Downloadable PDFs for tailored resume and side-by-side comparison.

- [ ] Implement `lib/generatePDF.ts` using `@react-pdf/renderer`.
- [ ] Design side-by-side comparison PDF layout.
- [ ] Design single-column tailored resume PDF layout.
- [ ] Implement `/api/export/pdf` route.
- [ ] Wire `PDFExportButton` component.

---

### Phase 4 — Guardrails & Validation

**Goal:** Robust truthfulness enforcement and user confirmation flow.

- [ ] Add `riskFlag` display and user acknowledgment in diff view.
- [ ] Add low-confidence visual indicators.
- [ ] Harden all Zod schemas with stricter constraints.
- [ ] Add unsupported-claim detection post-LLM.
- [ ] Add pre-export review checklist.

---

### Phase 5 — Polish & Demo Readiness

**Goal:** Portfolio-quality product ready for demo.

- [ ] Add loading states and skeleton screens.
- [ ] Add error toasts and retry UI.
- [ ] Bundle sample resume + JD in `/public/sample/`.
- [ ] Add "Load Sample" button for quick demo.
- [ ] Improve PDF styling.
- [ ] Add optional markdown / DOCX export.
- [ ] Final UI polish pass.

---

## 16. Risks & Mitigations

| Risk                                       | Likelihood | Impact | Mitigation                                                         |
|--------------------------------------------|------------|--------|--------------------------------------------------------------------|
| LLM adds unsupported claims                | High       | High   | Strict prompt constraints + `riskFlag` + user review gate          |
| Multi-column PDF parse failure             | Medium     | Medium | Warn user; suggest pasting plain text instead                      |
| Inconsistent LLM JSON output               | Medium     | High   | Zod validation + retry logic in `callLLM`                          |
| Score feels opaque or misleading           | Medium     | Medium | Always show sub-scores + `explanation` string                      |
| User trusts output without reviewing       | High       | High   | Mandatory disclaimer in PDF + risk flags + pre-export checklist    |
| Token limits with long resumes             | Medium     | Medium | Section-level chunking + summarization for very long resumes       |
| JD text too vague to extract structure     | Medium     | Medium | Gracefully return partial JD with null fields; flag in UI          |
| Rate limits on Groq API                  | Low        | Medium | Exponential backoff + user-facing loading state                    |

---

*This document should be kept in sync with `docs/ProblemStatement.md` as requirements evolve.*
