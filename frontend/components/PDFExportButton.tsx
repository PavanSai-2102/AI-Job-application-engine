"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import { Download, Loader2, FileText, LayoutTemplate } from "lucide-react";
import { useTailoringSession } from "../context/TailoringSessionContext";

export function PDFExportButton() {
  const { state } = useTailoringSession();
  const [isExportingTailored, setIsExportingTailored] = useState(false);
  const [isExportingComparison, setIsExportingComparison] = useState(false);

  const downloadPDF = async (type: "tailored" | "comparison") => {
    try {
      if (type === "tailored") setIsExportingTailored(true);
      else setIsExportingComparison(true);

      const payload = {
        type,
        hasAcknowledgedRisks: true, // Passed the frontend gate
        data: type === "tailored" 
          ? { originalProfile: state.parsedResume, tailoredResume: state.tailoredResume }
          : { 
              originalScore: state.originalScore, 
              tailoredScore: state.tailoredScore, 
              tailoredResume: state.tailoredResume, 
              jd: state.parsedJD, 
              gapAnalysis: state.gapAnalysis 
            }
      };

      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to generate PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = type === "tailored" ? "Tailored_Resume.pdf" : "Resume_Analysis_Comparison.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExportingTailored(false);
      setIsExportingComparison(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full">
      <Button 
        onClick={() => downloadPDF("tailored")} 
        disabled={isExportingTailored || isExportingComparison || !state.tailoredResume}
        className="w-full sm:w-auto"
        size="lg"
      >
        {isExportingTailored ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <FileText className="mr-2 h-5 w-5" />}
        Tailored Resume PDF
      </Button>
      <Button 
        onClick={() => downloadPDF("comparison")} 
        disabled={isExportingTailored || isExportingComparison || !state.tailoredScore}
        variant="outline"
        className="w-full sm:w-auto"
        size="lg"
      >
        {isExportingComparison ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LayoutTemplate className="mr-2 h-5 w-5" />}
        Comparison PDF
      </Button>
    </div>
  );
}
