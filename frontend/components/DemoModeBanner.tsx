"use client";

import React, { useState, useEffect } from "react";
import { useTailoringSession } from "../context/TailoringSessionContext";
import { AlertTriangle, X } from "lucide-react";

export function DemoModeBanner() {
  const { state } = useTailoringSession();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const hasSampleResume = state.resumeText && state.resumeText.includes("Alex Chen");
    const hasSampleJD = state.jdText && state.jdText.includes("CloudSphere Inc");
    
    if (hasSampleResume || hasSampleJD) {
      if (!isDismissed) setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [state.resumeText, state.jdText, isDismissed]);

  if (!isVisible) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-700 px-4 py-2 text-sm shadow-inner shadow-amber-500/5">
      <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
        <AlertTriangle size={16} className="shrink-0" />
        <span className="flex-1 font-medium"><strong>Demo Mode Active:</strong> You are using sample data. The AI will tailor Alex's resume to the CloudSphere job description.</span>
        <button 
          className="p-1 hover:bg-amber-500/20 rounded-md transition-colors text-amber-700"
          onClick={() => {
            setIsVisible(false);
            setIsDismissed(true);
          }}
          aria-label="Dismiss banner"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
