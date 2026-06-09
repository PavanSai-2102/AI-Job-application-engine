"use client";
import React from "react";
import { useTailoringSession } from "../context/TailoringSessionContext";
import { Check, CircleDot } from "lucide-react";
import { usePathname } from "next/navigation";

export function ProgressBar() {
  const { state } = useTailoringSession();
  const pathname = usePathname();

  // Only show progress bar in the /tailor flows
  if (!pathname.startsWith("/tailor")) return null;

  const steps = [
    { label: "Input", path: "/tailor" },
    { label: "Analysis", path: "/tailor/results" },
    { label: "Tailored", path: "/tailor/diff" },
    { label: "Export", path: "/tailor/export" },
  ];

  let currentIndex = steps.findIndex(s => s.path === pathname);
  if (currentIndex === -1) currentIndex = 0; // Fallback to first step

  return (
    <div className="w-full max-w-2xl mx-auto py-2">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-4 -translate-y-1/2 w-full h-1 bg-muted rounded-full -z-10"></div>
        <div className="absolute left-0 top-4 -translate-y-1/2 h-1 bg-primary rounded-full -z-10 transition-all duration-500 ease-in-out" style={{ width: `${Math.max(0, currentIndex) * (100 / (steps.length - 1))}%` }}></div>
        
        {steps.map((step, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isFuture = i > currentIndex;
          
          // Also check state status to show loading indicator if current step is actively processing
          const isProcessing = isCurrent && (state.status === "parsing" || state.status === "scoring" || state.status === "tailoring");

          return (
            <div key={i} className="flex flex-col items-center gap-1.5 bg-card px-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                isCompleted ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20" : 
                isCurrent ? "bg-background border-primary text-primary shadow-sm shadow-primary/20" : 
                "bg-muted border-muted text-muted-foreground"
              }`}>
                {isCompleted ? <Check size={16} /> : isProcessing ? <CircleDot size={16} className="animate-spin" /> : <span className="text-xs font-semibold">{i + 1}</span>}
              </div>
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isCurrent ? "text-primary" : isFuture ? "text-muted-foreground" : "text-foreground"}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
