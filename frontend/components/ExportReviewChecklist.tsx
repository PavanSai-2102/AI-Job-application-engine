import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { AlertCircle } from "lucide-react";

interface ExportReviewChecklistProps {
  onComplete: (isComplete: boolean) => void;
}

export function ExportReviewChecklist({ onComplete }: ExportReviewChecklistProps) {
  const [checks, setChecks] = useState([false, false, false, false]);

  useEffect(() => {
    onComplete(checks.every((c) => c));
  }, [checks, onComplete]);

  const toggleCheck = (index: number) => {
    const newChecks = [...checks];
    newChecks[index] = !newChecks[index];
    setChecks(newChecks);
  };

  const checklistItems = [
    "I have individually reviewed all '🚩 Needs Review' bullets and confirmed they are truthful.",
    "I have verified that all tailored skills listed match my actual abilities.",
    "I understand that the AI may hallucinate metrics or technologies to match the JD.",
    "I take full responsibility for the accuracy of this tailored resume."
  ];

  return (
    <Card className="border-amber-500/50 bg-amber-500/5 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-amber-700 flex items-center gap-2">
          <AlertCircle size={20} />
          Mandatory Pre-Export Review
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {checklistItems.map((text, i) => (
            <label key={i} className="flex items-start gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={checks[i]} 
                onChange={() => toggleCheck(i)} 
                className="mt-1 w-4 h-4 rounded border-amber-500/50 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-sm font-medium leading-snug group-hover:text-amber-900 transition-colors">
                {text}
              </span>
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
