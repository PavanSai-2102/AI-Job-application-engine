"use client";

import { useState } from "react";
import { Search, MapPin, Briefcase, ExternalLink, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      toast.error("Please enter a job title");
      return;
    }

    setIsSearching(true);
    setJobs([]);

    try {
      // Call the Render backend directly from the browser to bypass Vercel's 10s timeout
      const backendUrl = process.env.NEXT_PUBLIC_FASTAPI_BASE_URL || "https://ai-job-application-engine.onrender.com";
      const res = await fetch(`${backendUrl}/api/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, location: location || "", sources: "all" }),
      });

      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      
      if (data.jobs && data.jobs.length > 0) {
        setJobs(data.jobs);
        toast.success(`Found ${data.jobs.length} jobs!`);
      } else {
        toast.info("No jobs found for this criteria.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch jobs");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveAndApply = async (job: any) => {
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(job),
      });

      if (!res.ok) throw new Error("Failed to save application");
      toast.success("Job saved! Ready to tailor resume.");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="flex flex-col items-center justify-center space-y-6 text-center mb-16">
          <div className="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-sm font-medium text-indigo-300">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></span>
            AI Job Discovery Engine
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Find your next <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Dream Role</span>
          </h1>
          <p className="text-slate-400 max-w-2xl text-lg">
            Our AI agents scour Naukri, RemoteOK, and Wellfound to aggregate the best opportunities tailored to your skills.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-4xl mx-auto mb-16">
          <div className="flex flex-col md:flex-row items-center gap-4 p-2 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl">
            <div className="flex-1 w-full flex items-center px-4 py-2 border-r border-slate-800">
              <Briefcase className="w-5 h-5 text-slate-500 mr-3" />
              <input
                type="text"
                placeholder="Job Title, Keywords, or Company"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent border-none text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-0 text-lg"
              />
            </div>
            <div className="flex-1 w-full flex items-center px-4 py-2">
              <MapPin className="w-5 h-5 text-slate-500 mr-3" />
              <input
                type="text"
                placeholder="Location (e.g. Remote, San Francisco)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-transparent border-none text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-0 text-lg"
              />
            </div>
            <Button 
              type="submit" 
              disabled={isSearching}
              className="w-full md:w-auto h-14 px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-lg shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-95"
            >
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Discover Jobs"}
            </Button>
          </div>
        </form>

        {/* Loading State */}
        {isSearching && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-r-2 border-cyan-500 animate-spin-reverse"></div>
              <Briefcase className="absolute inset-0 m-auto w-6 h-6 text-indigo-400" />
            </div>
            <p className="mt-6 text-slate-400 font-medium animate-pulse">Agents are scraping platforms...</p>
          </div>
        )}

        {/* Results Grid */}
        {!isSearching && jobs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job, idx) => (
              <div 
                key={idx} 
                className="group relative flex flex-col justify-between p-6 bg-slate-900 border border-slate-800 rounded-2xl hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 overflow-hidden"
              >
                {/* Glow Effect */}
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-500"></div>
                
                <div className="z-10">
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 rounded-full">
                      {job.source || "Web"}
                    </span>
                    {job.url && (
                      <a href={job.url} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-cyan-400 transition-colors">
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-100 mb-2 leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-cyan-400 transition-all duration-300">
                    {job.title}
                  </h3>
                  <p className="text-slate-400 font-medium mb-4">{job.company}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {job.location && (
                      <div className="flex items-center text-sm text-slate-500 bg-slate-800/50 px-2 py-1 rounded-md">
                        <MapPin className="w-4 h-4 mr-1" />
                        {job.location}
                      </div>
                    )}
                  </div>
                </div>

                <div className="z-10 mt-auto pt-6 border-t border-slate-800/50">
                  <Button 
                    onClick={() => handleSaveAndApply(job)}
                    className="w-full bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors duration-300"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save & Tailor Resume
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
