"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTailoringSession } from "@/context/TailoringSessionContext";
import { ScoreCard } from "@/components/ScoreCard";
import { JDSummaryCard } from "@/components/JDSummaryCard";
import { GapAnalysis } from "@/components/GapAnalysis";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2, Wand2 } from "lucide-react";
import { runTailoringPhase } from "@/lib/orchestrator";

import { SkeletonScoreCard, SkeletonGapList } from "@/components/skeletons";

export default function ResultsPage() {
  const { state, dispatch } = useTailoringSession();
  const router = useRouter();

  // Redirect if idle
  useEffect(() => {
    if (state.status === "idle") {
      router.push("/tailor");
    }
  }, [state.status, router]);

  const isLoading = state.status === "parsing" || state.status === "scoring";

  if (!isLoading && (!state.parsedResume || !state.parsedJD || !state.originalScore)) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center gap-4">
        {state.status === "error" ? (
          <>
            <p className="text-destructive font-semibold">Analysis Failed: {state.errorMessage}</p>
            <Button onClick={() => router.push("/tailor")}>Go Back</Button>
          </>
        ) : (
          <p>No data available.</p>
        )}
      </div>
    );
  }

  const handleGenerateTailored = async () => {
    await runTailoringPhase(state, dispatch);
    if (state.status !== "error") {
      router.push("/tailor/diff");
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full p-4 md:p-8 flex flex-col gap-8 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analysis Results</h1>
          <p className="text-muted-foreground mt-1">Review your match score and identified gaps before tailoring.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/tailor")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Input
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          {isLoading ? (
            <SkeletonScoreCard />
          ) : (
            <ScoreCard score={state.originalScore!} title="Original Match Score" />
          )}
        </div>
        <div className="lg:col-span-2 flex flex-col gap-8">
          {isLoading ? (
             <div className="space-y-4">
               <div className="h-6 bg-muted rounded w-48 animate-pulse mb-4"></div>
               <div className="h-24 bg-muted rounded w-full animate-pulse"></div>
               <div className="h-24 bg-muted rounded w-full animate-pulse"></div>
             </div>
          ) : (
             <JDSummaryCard jd={state.parsedJD!} />
          )}

          {isLoading ? (
            <SkeletonGapList />
          ) : state.gapAnalysis ? (
             <GapAnalysis analysis={state.gapAnalysis} />
          ) : (
             <div className="p-8 border rounded-lg bg-card text-center text-muted-foreground">
               <Wand2 className="mx-auto h-8 w-8 mb-4 opacity-50" />
               <p>Gap analysis and suggestions will be generated during the tailoring phase.</p>
             </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t mt-4 flex flex-col gap-4 items-end">
        {state.status === "error" && (
          <div className="w-full p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-sm">
            <strong>Error:</strong> {state.errorMessage || "An unexpected error occurred."}
          </div>
        )}
        <Button size="lg" onClick={handleGenerateTailored} disabled={state.status === "tailoring"}>
          {state.status === "tailoring" ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating...</>
          ) : (
            <>Generate Tailored Resume <ArrowRight className="ml-2 h-5 w-5" /></>
          )}
        </Button>
      </div>
    </div>
  );
}
