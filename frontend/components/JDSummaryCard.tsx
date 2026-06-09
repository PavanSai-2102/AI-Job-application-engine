import React from "react";
import { JobDescriptionProfile } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";

export function JDSummaryCard({ jd }: { jd: JobDescriptionProfile }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Job Description Summary</CardTitle>
        <CardDescription>
          {jd.jobTitle} {jd.company ? `at ${jd.company}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Required Skills</h4>
          <div className="flex flex-wrap gap-2">
            {jd.requiredSkills.map((skill, i) => (
              <Badge key={i} variant="default">{skill}</Badge>
            ))}
            {jd.requiredSkills.length === 0 && <span className="text-sm text-muted-foreground">None detected</span>}
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Preferred Skills & Tools</h4>
          <div className="flex flex-wrap gap-2">
            {jd.preferredSkills.map((skill, i) => (
              <Badge key={`pref-${i}`} variant="secondary">{skill}</Badge>
            ))}
            {jd.tools.map((tool, i) => (
              <Badge key={`tool-${i}`} variant="outline">{tool}</Badge>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Key Responsibilities</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            {jd.responsibilities.map((resp, i) => (
              <li key={i}>{resp}</li>
            ))}
            {jd.responsibilities.length === 0 && <li>None explicitly extracted</li>}
          </ul>
        </div>
        
      </CardContent>
    </Card>
  );
}
