import React from "react";
import { TailoredResume } from "../types";
import { BulletCard } from "./BulletCard";

export function SideBySideDiff({ tailoredResume }: { tailoredResume: TailoredResume | null }) {
  if (!tailoredResume || !tailoredResume.tailoredExperience) {
    return <div className="p-8 text-center text-muted-foreground">No tailored data available.</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Summary Diff (if exists) */}
      {tailoredResume.tailoredSummary && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Professional Summary</h3>
          <div className="p-4 border rounded-lg bg-card/50 text-sm">
            {tailoredResume.tailoredSummary}
          </div>
        </div>
      )}

      {/* Skills Diff */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Skills Ordered for JD</h3>
        <div className="flex flex-wrap gap-2">
          {tailoredResume.tailoredSkills.map((skill, i) => (
            <div key={i} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
              {skill}
            </div>
          ))}
        </div>
      </div>

      {/* Experience Diff */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold border-b pb-2">Experience Bullets</h3>
        
        {tailoredResume.tailoredExperience.map((job, jobIdx) => (
          <div key={jobIdx} className="space-y-4">
            <h4 className="font-medium text-md text-primary">
              {job.title} @ {job.company}
            </h4>
            
            <div className="flex flex-col gap-4 pl-4 border-l-2 border-muted">
              {job.bullets.map((bullet, bulletIdx) => (
                <BulletCard key={bulletIdx} bullet={bullet} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
