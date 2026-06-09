"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTailoringSession } from "../context/TailoringSessionContext";
import { runTailoringPipeline } from "../lib/orchestrator";
import { Button } from "./ui/button";
import { Sparkles, Loader2 } from "lucide-react";

export function AnalyzeButton() {
  const { state, dispatch } = useTailoringSession();
  const router = useRouter();

  const isEnabled = state.resumeText.length > 50 && state.jdText.length > 50;
  const isRunning =
    state.status === "parsing" ||
    state.status === "scoring" ||
    state.status === "tailoring";

  const handleAnalyze = () => {
    if (!isEnabled) return;
    
    // Start it asynchronously, don't await so we can navigate immediately
    runTailoringPipeline(state.resumeText, state.jdText, dispatch);
    
    router.push("/tailor/results");
  };

  return (
    <Button
      size="lg"
      className="w-full font-semibold text-base py-6"
      disabled={!isEnabled || isRunning}
      onClick={handleAnalyze}
    >
      {isRunning ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Analyzing ({state.status})...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-5 w-5" />
          Analyze Match
        </>
      )}
    </Button>
  );
}
