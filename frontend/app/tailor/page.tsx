import { ResumeInput } from "@/components/ResumeInput";
import { JDInput } from "@/components/JDInput";
import { AnalyzeButton } from "@/components/AnalyzeButton";
import { TailorInitializer } from "@/components/TailorInitializer";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function TailorInputPage({ searchParams }: { searchParams: Promise<{ jobId?: string }> }) {
  let jdText = "";
  let resumeText = "";
  let applicationId = null;

  const params = await searchParams;

  if (params.jobId) {
    const session = await getServerSession(authOptions);
    let userId = session?.user ? (session.user as any).id : null;
    
    if (!userId) {
      const defaultUser = await prisma.user.findFirst({ where: { email: "demo@example.com" } });
      userId = defaultUser?.id;
    }
    
    if (userId) {
      const app = await prisma.application.findFirst({
        where: { jobId: params.jobId, userId },
        include: { job: true, user: true }
      });
      
      if (app) {
        applicationId = app.id;
        jdText = app.job.description || `Job Title: ${app.job.title}\nCompany: ${app.job.company}\nLocation: ${app.job.location}\nURL: ${app.job.url || 'N/A'}`;
        if (app.user.baseResume) {
          resumeText = typeof app.user.baseResume === 'string' 
            ? app.user.baseResume 
            : JSON.stringify(app.user.baseResume, null, 2);
        }
      }
    }
  }

  return (
    <div className="max-w-6xl mx-auto w-full p-4 md:p-8 flex flex-col gap-8 h-full">
      <TailorInitializer resumeText={resumeText} jdText={jdText} applicationId={applicationId} />
      <div className="mb-2">
        <h1 className="text-3xl font-bold tracking-tight">Input Data</h1>
        <p className="text-muted-foreground mt-1">Paste your resume and the target job description below.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
        <ResumeInput />
        <JDInput />
      </div>

      <div className="pt-4 border-t mt-4">
        <AnalyzeButton />
      </div>
    </div>
  );
}
