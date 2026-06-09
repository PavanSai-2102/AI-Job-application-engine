import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, FileText, Search, Mail, ArrowRight, Briefcase, Kanban } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center max-w-5xl mx-auto w-full">
        <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-8">
          <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
          AI-Powered End-to-End Platform
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-br from-primary to-primary/50 bg-clip-text text-transparent pb-2">
          AI Job Application Engine
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mb-16">
          From discovering opportunities to tailoring resumes to sending cold outreach emails — automate your entire job application pipeline with AI.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mb-16">
          {/* Job Search Card */}
          <Link href="/dashboard" className="group">
            <div className="flex flex-col items-center text-center p-8 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 h-full">
              <div className="bg-indigo-500/10 p-4 rounded-full mb-6 text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                <Search size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Discover Jobs</h3>
              <p className="text-muted-foreground mb-6">AI agents scour Naukri, RemoteOK, and Wellfound to find the best opportunities for you.</p>
              <span className="flex items-center text-sm font-semibold text-primary mt-auto group-hover:gap-2 transition-all">
                Start Searching <ArrowRight className="w-4 h-4 ml-1" />
              </span>
            </div>
          </Link>

          {/* Resume Tailor Card */}
          <Link href="/tailor" className="group">
            <div className="flex flex-col items-center text-center p-8 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 h-full">
              <div className="bg-emerald-500/10 p-4 rounded-full mb-6 text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                <FileText size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">2. Tailor Resume</h3>
              <p className="text-muted-foreground mb-6">Get a match score, gap analysis, and AI-rewritten bullets that align your experience with the JD.</p>
              <span className="flex items-center text-sm font-semibold text-primary mt-auto group-hover:gap-2 transition-all">
                Start Tailoring <ArrowRight className="w-4 h-4 ml-1" />
              </span>
            </div>
          </Link>

          {/* Pipeline Card */}
          <Link href="/kanban" className="group">
            <div className="flex flex-col items-center text-center p-8 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 h-full">
              <div className="bg-cyan-500/10 p-4 rounded-full mb-6 text-cyan-400 group-hover:scale-110 transition-transform duration-300">
                <Mail size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Track & Outreach</h3>
              <p className="text-muted-foreground mb-6">Manage your applications in a Kanban pipeline and send AI-drafted cold emails directly.</p>
              <span className="flex items-center text-sm font-semibold text-primary mt-auto group-hover:gap-2 transition-all">
                View Pipeline <ArrowRight className="w-4 h-4 ml-1" />
              </span>
            </div>
          </Link>
        </div>

        <Link href="/dashboard">
          <Button size="lg" className="h-14 px-8 text-lg rounded-full">
            <Sparkles className="mr-2" /> Get Started
          </Button>
        </Link>
      </main>
    </div>
  );
}
