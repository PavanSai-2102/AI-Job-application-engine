import React, { useState } from "react";
import { BulletRewrite } from "../types";
import { Badge } from "./ui/badge";
import { Info, AlertTriangle, AlertCircle, ArrowRight } from "lucide-react";

export function BulletCard({ bullet }: { bullet: BulletRewrite }) {
  // We'll highlight keywords in the tailored bullet
  // A simple implementation: we just render the raw string for now
  // In Phase 5, we can add a proper regex highlighter here.
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div className={`flex flex-col border rounded-lg overflow-hidden bg-card text-card-foreground ${bullet.riskFlag && !acknowledged ? 'border-destructive/50 shadow-sm shadow-destructive/20' : ''}`}>
      {/* Risk Banner */}
      {bullet.riskFlag && (
        <div className={`flex items-center justify-between p-3 border-b text-sm font-medium transition-colors ${acknowledged ? 'bg-muted/50 text-muted-foreground border-border' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>🚩 Needs Review: {bullet.riskFlag}</span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-xs">
            <input 
              type="checkbox" 
              checked={acknowledged} 
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="rounded border-destructive/50 text-destructive focus:ring-destructive"
            />
            Acknowledge & Accept
          </label>
        </div>
      )}

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Original */}
        <div className="flex flex-col gap-2">
          <div className="text-xs uppercase font-semibold text-muted-foreground flex items-center gap-1">
            Original
          </div>
          <p className="text-sm line-through opacity-70">{bullet.original}</p>
        </div>

        {/* Tailored */}
        <div className="flex flex-col gap-2">
          <div className="text-xs uppercase font-semibold text-primary flex items-center gap-1">
            Tailored
            {bullet.confidence === "low" && (
              <Badge variant="outline" className="ml-2 border-amber-500 text-amber-500 bg-amber-500/10 h-5 px-1.5 text-[10px]">
                ⚠ Low Confidence
              </Badge>
            )}
          </div>
          <p className={`text-sm ${bullet.confidence === "low" ? "italic" : ""}`}>
            {bullet.tailored}
          </p>
        </div>
      </div>

      {/* Metadata Footer */}
      <div className="bg-muted/30 p-3 border-t text-xs flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <Info size={14} className="text-muted-foreground shrink-0 mt-0.5" />
          <span className="text-muted-foreground">
            <strong>Reason:</strong> {bullet.changeReason}
          </span>
        </div>
        
        {bullet.keywordsAddressed.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mt-1 pl-5">
            <span className="text-muted-foreground font-medium">Keywords:</span>
            {bullet.keywordsAddressed.map((kw, i) => (
              <Badge key={i} variant="secondary" className="text-[10px] h-5">
                {kw}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
