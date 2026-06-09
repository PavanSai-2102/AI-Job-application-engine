import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import { TailoredResumePDF } from '../components/pdf/TailoredResumePDF';
import { ComparisonPDF } from '../components/pdf/ComparisonPDF';
import { TailoredResume, ResumeProfile, MatchScore, JobDescriptionProfile, GapAnalysis } from '../types';

export async function generateTailoredResumePDF(originalProfile: ResumeProfile, tailoredResume: TailoredResume): Promise<Buffer> {
  const stream = await renderToStream(
    React.createElement(TailoredResumePDF, { originalProfile, tailoredResume }) as any
  );
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

export async function generateComparisonPDF(
  originalScore: MatchScore,
  tailoredScore: MatchScore,
  tailoredResume: TailoredResume,
  jd: JobDescriptionProfile,
  gapAnalysis: GapAnalysis
): Promise<Buffer> {
  const stream = await renderToStream(
    React.createElement(ComparisonPDF, { originalScore, tailoredScore, tailoredResume, jd, gapAnalysis }) as any
  );
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}
