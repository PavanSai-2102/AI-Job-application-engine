import React from "react";
import { MatchScore } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Progress } from "./ui/progress";

interface ScoreCardProps {
  score: MatchScore;
  title?: string;
  description?: string;
}

export function ScoreCard({ 
  score, 
  title = "Match Score", 
  description = "How well this resume aligns with the job description." 
}: ScoreCardProps) {
  
  const getScoreColor = (value: number) => {
    if (value >= 80) return "text-emerald-500";
    if (value >= 60) return "text-amber-500";
    return "text-red-500";
  };

  const getProgressColor = (value: number) => {
    if (value >= 80) return "bg-emerald-500";
    if (value >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-6">
        <div className="flex flex-col items-center justify-center p-4">
          <div className={`text-6xl font-bold tracking-tighter ${getScoreColor(score.overallScore)}`}>
            {score.overallScore}
          </div>
          <div className="text-sm text-muted-foreground mt-1 uppercase tracking-wider font-semibold">
            Overall Match
          </div>
        </div>

        <div className="space-y-4">
          <SubScore label="Required Skills" value={score.skillCoverageScore} getColor={getProgressColor} />
          <SubScore label="Responsibilities" value={score.responsibilityAlignmentScore} getColor={getProgressColor} />
          <SubScore label="Keywords" value={score.keywordScore} getColor={getProgressColor} />
          <SubScore label="Seniority" value={score.seniorityScore} getColor={getProgressColor} />
        </div>

        <div className="mt-4 p-4 bg-muted/50 rounded-lg text-sm leading-relaxed border">
          <p><strong>Analysis:</strong> {score.explanation}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SubScore({ label, value, getColor }: { label: string; value: number; getColor: (v: number) => string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm font-medium">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      {/* Shadcn progress uses primary color by default, we can force a generic div for colored bars or use a custom class */}
      <div className="h-2 w-full bg-secondary overflow-hidden rounded-full">
        <div 
          className={`h-full ${getColor(value)} transition-all duration-500 ease-in-out`} 
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
