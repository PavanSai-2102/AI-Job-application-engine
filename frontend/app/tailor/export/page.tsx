"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTailoringSession } from "@/context/TailoringSessionContext";
import { PDFExportButton } from "@/components/PDFExportButton";
import { ExportReviewChecklist } from "@/components/ExportReviewChecklist";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { downloadMarkdown } from "@/lib/exportMarkdown";

export default function ExportPage() {
  const { state, dispatch } = useTailoringSession();
  const router = useRouter();
  const [reviewComplete, setReviewComplete] = useState(false);

  // Redirect if idle
  useEffect(() => {
    if (state.status === "idle") {
      router.push("/tailor");
    }
  }, [state.status, router]);

  if (!state.tailoredResume) {
    return <div className="p-12 text-center">Loading or no data available...</div>;
  }

  const handleStartOver = () => {
    dispatch({ type: "RESET" });
    router.push("/tailor");
  };

  const handleDownloadMarkdown = () => {
    if (state.tailoredResume && state.parsedResume) {
      downloadMarkdown(state.parsedResume, state.tailoredResume);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-4 md:p-8 flex flex-col gap-8 h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Export Your Resume</h1>
          <p className="text-muted-foreground mt-1">Download your tailored documents.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/tailor/diff")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Review
        </Button>
      </div>

      <ExportReviewChecklist onComplete={setReviewComplete} />

      <Card className={!reviewComplete ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="text-primary" />
            Ready for Export
          </CardTitle>
          <CardDescription>
            Your resume has been successfully tailored. Choose which document you'd like to download.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-4">
          <PDFExportButton />
          
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2" onClick={handleDownloadMarkdown}>
            <div className="flex items-center font-semibold text-base">
              <FileText className="mr-2 h-5 w-5" /> Download Markdown
            </div>
            <span className="text-xs text-muted-foreground font-normal">
              Plain text format suitable for copying and pasting.
            </span>
          </Button>

          <div className="mt-4 pt-4 border-t">
            <Button variant="ghost" onClick={handleStartOver} className="w-full sm:w-auto">
              Start Another Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
