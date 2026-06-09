"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTailoringSession } from "@/context/TailoringSessionContext";
import { SideBySideDiff } from "@/components/SideBySideDiff";
import { ScoreCard } from "@/components/ScoreCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { SkeletonScoreCard, SkeletonBulletCard } from "@/components/skeletons";

export default function DiffPage() {
  const { state } = useTailoringSession();
  const router = useRouter();

  // Redirect if idle
  useEffect(() => {
    if (state.status === "idle") {
      router.push("/tailor");
    }
  }, [state.status, router]);

  const isLoading = state.status === "tailoring";

  if (!isLoading && (!state.tailoredResume || !state.tailoredScore)) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center gap-4">
        {state.status === "error" ? (
          <>
            <p className="text-destructive font-semibold">Tailoring Failed: {state.errorMessage}</p>
            <Button onClick={() => router.push("/tailor/results")}>Go Back</Button>
          </>
        ) : (
          <p>No data available.</p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full p-4 md:p-8 flex flex-col gap-8 h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tailored Resume</h1>
          <p className="text-muted-foreground mt-1">Review the AI-generated changes.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.push("/tailor/results")} disabled={isLoading}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Results
          </Button>
          <Button onClick={() => router.push("/tailor/export")} disabled={isLoading}>
            Review & Export <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            {isLoading ? (
              <SkeletonScoreCard />
            ) : (
              <ScoreCard 
                score={state.tailoredScore!} 
                title="New Match Score" 
                description="Projected score after applying these changes." 
              />
            )}
          </div>
        </div>
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map(i => <SkeletonBulletCard key={i} />)}
            </div>
          ) : (
            <SideBySideDiff tailoredResume={state.tailoredResume!} />
          )}
        </div>
      </div>
    </div>
  );
}
