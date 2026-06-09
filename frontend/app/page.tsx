import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, FileText, CheckCircle } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center max-w-5xl mx-auto w-full">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-br from-primary to-primary/50 bg-clip-text text-transparent pb-2">
          Resume Shapeshifter
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mb-12">
          Tailor your resume to any job description instantly. We analyze the gap and rewrite your bullets to match what recruiters are looking for—without inventing experience.
        </p>

        <Link href="/tailor">
          <Button size="lg" className="h-14 px-8 text-lg rounded-full">
            <Sparkles className="mr-2" /> Start Tailoring Now
          </Button>
        </Link>

        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-12 w-full text-left">
          <div className="flex flex-col items-center text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-6 text-primary">
              <FileText size={32} />
            </div>
            <h3 className="text-xl font-bold mb-3">1. Paste</h3>
            <p className="text-muted-foreground">Drop in your current resume and the target job description.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-6 text-primary">
              <Sparkles size={32} />
            </div>
            <h3 className="text-xl font-bold mb-3">2. Analyze & Tailor</h3>
            <p className="text-muted-foreground">Get a match score, gap analysis, and AI-rewritten bullets.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-6 text-primary">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-xl font-bold mb-3">3. Export</h3>
            <p className="text-muted-foreground">Download a pristine, ATS-friendly PDF ready to submit.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
