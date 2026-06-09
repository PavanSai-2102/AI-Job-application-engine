import { v4 as uuidv4 } from "uuid";
import { TailoringRun } from "../types";

export const fixtureRun: TailoringRun = {
  id: uuidv4(),
  createdAt: new Date().toISOString(),
  resumeRaw: "John Doe\nSoftware Engineer\n...",
  jdRaw: "We are looking for a Senior Software Engineer...",
  parsedResume: {
    contact: {
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "",
      location: "",
      linkedin: "",
      github: "",
    },
    summary: "Experienced software engineer with a focus on frontend.",
    skills: ["React", "TypeScript", "Node.js", "Tailwind CSS"],
    experience: [
      {
        company: "Tech Corp",
        title: "Software Engineer",
        startDate: "2020",
        endDate: "Present",
        bullets: [
          "Developed web applications using React.",
          "Collaborated with design team.",
        ],
      },
    ],
    projects: [],
    education: [
      {
        institution: "State University",
        degree: "B.S. Computer Science",
        field: "Computer Science",
        cgpa: "3.8",
        graduationDate: "2019",
      },
    ],
    certifications: [],
    courses: [],
  },
  parsedJD: {
    jobTitle: "Senior Frontend Engineer",
    company: "Startup Inc",
    seniorityLevel: "Senior",
    requiredSkills: ["React", "TypeScript", "Next.js"],
    preferredSkills: ["GraphQL", "Tailwind CSS"],
    tools: ["Git", "Jira"],
    keywords: ["performance", "accessible"],
    responsibilities: [
      "Build scalable UI components.",
      "Mentor junior developers.",
    ],
    qualifications: ["4+ years experience"],
    domainSignals: ["SaaS"],
  },
  originalScore: {
    overallScore: 58,
    skillCoverageScore: 66,
    responsibilityAlignmentScore: 50,
    keywordScore: 40,
    seniorityScore: 60,
    criticalMissingRequirements: ["Next.js", "Mentorship experience"],
    explanation:
      "Good foundational skills in React and TypeScript, but lacks explicit mention of Next.js and senior-level responsibilities like mentoring.",
  },
  tailoredResume: {
    tailoredSummary:
      "Experienced frontend engineer specializing in React, TypeScript, and accessible web applications.",
    tailoredSkills: ["React", "TypeScript", "Tailwind CSS", "Node.js"],
    tailoredExperience: [
      {
        company: "Tech Corp",
        title: "Software Engineer",
        bullets: [
          {
            original: "Developed web applications using React.",
            tailored:
              "Developed scalable web applications using React and TypeScript, focusing on performance and accessibility.",
            changeReason: "Added keywords 'scalable', 'TypeScript', 'performance', and 'accessible'.",
            keywordsAddressed: ["TypeScript", "performance", "accessible"],
            confidence: "high",
          },
          {
            original: "Collaborated with design team.",
            tailored: "Collaborated with design team to build scalable UI components.",
            changeReason: "Aligned with JD responsibility.",
            keywordsAddressed: ["UI components"],
            confidence: "medium",
          },
        ],
      },
    ],
  },
  tailoredScore: {
    overallScore: 82,
    skillCoverageScore: 80,
    responsibilityAlignmentScore: 85,
    keywordScore: 75,
    seniorityScore: 60,
    criticalMissingRequirements: ["Next.js", "Mentorship experience"],
    explanation:
      "The tailored resume better highlights performance, accessibility, and UI component building, matching the JD closely. However, Next.js and mentorship are still missing.",
  },
  gapAnalysis: {
    gaps: [
      {
        name: "Next.js",
        importance: "high",
        jdEvidence: "Required: Next.js",
        resumeEvidence: "Not mentioned",
        suggestedAction: "If you have used Next.js, add a bullet describing a project built with it.",
        canSafelyAdd: false,
      },
      {
        name: "Mentorship",
        importance: "medium",
        jdEvidence: "Mentor junior developers.",
        resumeEvidence: "Not mentioned",
        suggestedAction: "Have you informally mentored or onboarded anyone? Consider adding a bullet about it.",
        canSafelyAdd: false,
      },
    ],
  },
};
