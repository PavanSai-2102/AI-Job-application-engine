import React from "react";
import { GapAnalysis as GapAnalysisType } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";

export function GapAnalysis({ analysis }: { analysis: GapAnalysisType }) {
  if (!analysis || analysis.gaps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="text-emerald-500" />
            No Significant Gaps Found
          </CardTitle>
          <CardDescription>Your resume aligns very well with the requirements.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Sort by importance (high -> medium -> low)
  const sortedGaps = [...analysis.gaps].sort((a, b) => {
    const weights = { high: 3, medium: 2, low: 1 };
    return weights[b.importance] - weights[a.importance];
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gap Analysis</CardTitle>
        <CardDescription>Missing skills or requirements and suggested actions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedGaps.map((gap, i) => (
          <div key={i} className="p-4 rounded-lg border bg-card flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-base">{gap.name}</h4>
                {gap.importance === "high" && <Badge variant="destructive">High Priority</Badge>}
                {gap.importance === "medium" && <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">Medium</Badge>}
                {gap.importance === "low" && <Badge variant="outline">Low</Badge>}
              </div>
              
              <div className="flex items-center gap-1.5 text-xs font-medium">
                {gap.canSafelyAdd ? (
                  <span className="flex items-center text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                    <CheckCircle2 size={14} className="mr-1" /> ✓ Can safely add
                  </span>
                ) : (
                  <span className="flex items-center text-destructive bg-destructive/10 px-2 py-1 rounded-full">
                    <XCircle size={14} className="mr-1" /> 🚫 Do not add unless true
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-1">
              <div>
                <span className="text-muted-foreground block text-xs uppercase font-semibold mb-1">JD Evidence</span>
                <p className="italic bg-muted/50 p-2 rounded border-l-2 border-primary/20">"{gap.jdEvidence}"</p>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase font-semibold mb-1">Suggested Action</span>
                <p className="p-2">{gap.suggestedAction}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
