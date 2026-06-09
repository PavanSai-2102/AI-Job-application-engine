import { ResumeProfile, TailoredResume } from "../types";

export function exportToMarkdown(original: ResumeProfile, tailored: TailoredResume): string {
  let md = "";

  // Contact Info
  md += `# ${original.contact.name}\n\n`;
  
  const contact = [];
  if (original.contact.email) contact.push(original.contact.email);
  if (original.contact.phone) contact.push(original.contact.phone);
  if (original.contact.location) contact.push(original.contact.location);
  if (original.contact.linkedin) contact.push(original.contact.linkedin);
  if (original.contact.github) contact.push(original.contact.github);
  
  if (contact.length > 0) {
    md += contact.join(" | ") + "\n\n";
  }

  // Summary
  if (tailored.tailoredSummary) {
    md += `## Professional Summary\n\n${tailored.tailoredSummary}\n\n`;
  } else if (original.summary) {
    md += `## Professional Summary\n\n${original.summary}\n\n`;
  }

  // Skills
  if (tailored.tailoredSkills && tailored.tailoredSkills.length > 0) {
    md += `## Core Competencies\n\n`;
    md += `${tailored.tailoredSkills.join(" • ")}\n\n`;
  }

  // Experience
  if (tailored.tailoredExperience && tailored.tailoredExperience.length > 0) {
    md += `## Professional Experience\n\n`;
    tailored.tailoredExperience.forEach((exp) => {
      md += `### ${exp.title}\n`;
      md += `**${exp.company}**\n\n`;
      exp.bullets.forEach((bullet) => {
        md += `- ${bullet.tailored}\n`;
      });
      md += `\n`;
    });
  }

  // Education
  if (original.education.length > 0) {
    md += `## Education\n\n`;
    original.education.forEach((edu) => {
      md += `**${edu.institution}**\n`;
      md += `${edu.degree} | ${edu.graduationDate}\n\n`;
    });
  }

  return md;
}

export function downloadMarkdown(original: ResumeProfile, tailored: TailoredResume, filename: string = "tailored-resume.md") {
  const mdContent = exportToMarkdown(original, tailored);
  const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
