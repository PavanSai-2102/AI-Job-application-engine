import { TailoringSessionState } from "../context/TailoringSessionContext";
import { toast } from "sonner";
import {
  ResumeProfile,
  JobDescriptionProfile,
  MatchScore,
  TailoredResume,
  GapAnalysis,
} from "../types";

export class OrchestratorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrchestratorError";
  }
}

async function fetchAPI<T>(endpoint: string, body: any): Promise<T> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new OrchestratorError(errorData.error || `API Error: ${response.status}`);
  }

  return response.json();
}

/**
 * Executes the full tailoring pipeline using the Next.js API routes.
 */
export async function runTailoringPipeline(
  resumeText: string,
  jdText: string,
  dispatch: React.Dispatch<any>
) {
  try {
    dispatch({ type: "SET_STATUS", payload: "parsing" });

    // Step 1: Parse
    const [resume, jd] = await Promise.all([
      fetchAPI<ResumeProfile>("/api/parse/resume", { resumeText }),
      fetchAPI<JobDescriptionProfile>("/api/parse/jd", { jdText }),
    ]);

    dispatch({ type: "SET_PARSED", payload: { resume, jd } });
    dispatch({ type: "SET_STATUS", payload: "scoring" });

    // Step 2: Score Original
    const originalScore = await fetchAPI<MatchScore>("/api/score", { resume, jd });
    dispatch({ type: "SET_ORIGINAL_SCORE", payload: originalScore });
    
    dispatch({ type: "SET_STATUS", payload: "done" });
    toast.success("Analysis complete!");
    
  } catch (error: any) {
    console.error("Pipeline error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    dispatch({ type: "SET_ERROR", payload: errorMessage });
    
    // Wire specific toasts based on error type
    if (error instanceof TypeError && errorMessage.toLowerCase().includes("fetch")) {
      toast.error("Network Error", { description: "A network connection error occurred. Please check your internet and try again." });
    } else if (errorMessage.toLowerCase().includes("timeout")) {
      toast.error("Request Timeout", { description: "The AI took too long to respond. Please try again." });
    } else if (errorMessage.toLowerCase().includes("rate limit") || errorMessage.includes("429")) {
      toast.error("Rate Limited", { description: "You are making requests too quickly. Please wait a moment." });
    } else {
      toast.error("Analysis Failed", { description: errorMessage });
    }
  }
}

export async function runTailoringPhase(
  state: TailoringSessionState,
  dispatch: React.Dispatch<any>
) {
  if (!state.parsedResume || !state.parsedJD || !state.originalScore) {
    dispatch({ type: "SET_ERROR", payload: "Missing required data to tailor." });
    return;
  }

  try {
    dispatch({ type: "SET_STATUS", payload: "tailoring" });

    // Step 3: Tailor & Gaps
    const { tailoredResume, gapAnalysis } = await fetchAPI<{
      tailoredResume: TailoredResume;
      gapAnalysis: GapAnalysis;
    }>("/api/tailor", {
      resume: state.parsedResume,
      jd: state.parsedJD,
      score: state.originalScore,
      applicationId: state.applicationId,
    });

    // Step 4: Score Tailored
    // We must reconstruct a ResumeProfile-like shape from the tailored diff
    // because the scoring LLM expects 'skills', 'experience', 'summary' etc.
    const reconstructedResume = {
      ...state.parsedResume,
      summary: tailoredResume.tailoredSummary || state.parsedResume.summary,
      skills: tailoredResume.tailoredSkills?.length > 0 
        ? tailoredResume.tailoredSkills
        : state.parsedResume.skills,
      experience: tailoredResume.tailoredExperience?.map((exp: any) => ({
        title: exp.title,
        company: exp.company,
        startDate: "", 
        endDate: "",
        bullets: exp.bullets.map((b: any) => b.tailored)
      })) || state.parsedResume.experience
    };

    const tailoredScore = await fetchAPI<MatchScore>("/api/score", {
      resume: reconstructedResume as any,
      jd: state.parsedJD,
    });

    dispatch({
      type: "SET_TAILORED",
      payload: { tailoredResume, tailoredScore, gapAnalysis },
    });
    
    dispatch({ type: "SET_STATUS", payload: "done" });
    toast.success("Tailoring complete!");
    
  } catch (error: any) {
    console.error("Tailoring error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    dispatch({ type: "SET_ERROR", payload: errorMessage });
    
    if (error instanceof TypeError && errorMessage.toLowerCase().includes("fetch")) {
      toast.error("Network Error", { description: "A network connection error occurred. Please check your internet and try again." });
    } else if (errorMessage.toLowerCase().includes("timeout")) {
      toast.error("Request Timeout", { description: "The AI took too long to tailor your resume. Try shortening your input." });
    } else {
      toast.error("Tailoring Failed", { description: errorMessage });
    }
  }
}
