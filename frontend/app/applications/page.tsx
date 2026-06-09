"use client";

import { useState, useEffect } from "react";
import { Loader2, Kanban, Plus, MoreHorizontal, Briefcase, MapPin, Mail, ExternalLink, Calendar, PenTool } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Job = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  url: string | null;
  source: string;
};

type Application = {
  id: string;
  jobId: string;
  status: string;
  createdAt: string;
  job: Job;
  tailoredResume?: any;
};

const COLUMNS = [
  { id: "DISCOVERED", title: "Discovered" },
  { id: "TAILORING", title: "Tailored" },
  { id: "OUTREACH_SENT", title: "Outreach Sent" },
  { id: "INTERVIEW", title: "Interview" },
  { id: "REJECTED", title: "Rejected" },
];

export default function KanbanDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/applications");
      if (!response.ok) throw new Error("Failed to fetch applications");
      const data = await response.json();
      setApplications(data.applications || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load applications");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DISCOVERED": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "TAILORING": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "OUTREACH_SENT": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "INTERVIEW": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "REJECTED": return "bg-red-500/10 text-red-400 border-red-500/20";
      default: return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 flex items-center gap-3">
            <Kanban className="w-8 h-8 text-blue-500" />
            Application Board
          </h1>
          <p className="text-gray-400 mt-2">Track and manage your automated job applications.</p>
        </div>
        <Link href="/dashboard">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)]">
            <Plus className="w-4 h-4 mr-2" />
            Find New Jobs
          </Button>
        </Link>
      </div>

      {/* Kanban Board */}
      <div className="max-w-7xl mx-auto overflow-x-auto pb-8">
        <div className="flex gap-6 min-w-max">
          {COLUMNS.map((col) => {
            const columnApps = applications.filter(app => app.status === col.id);
            
            return (
              <div key={col.id} className="w-80 flex flex-col gap-4">
                {/* Column Header */}
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-gray-200">{col.title}</h2>
                    <span className="bg-[#1C1C1F] text-gray-400 text-xs py-0.5 px-2 rounded-full border border-[#2D2D30]">
                      {columnApps.length}
                    </span>
                  </div>
                  <MoreHorizontal className="w-4 h-4 text-gray-500 cursor-pointer hover:text-gray-300" />
                </div>

                {/* Cards Container */}
                <div className="bg-[#131316] rounded-2xl p-3 min-h-[500px] border border-[#2D2D30] flex flex-col gap-3">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                    </div>
                  ) : columnApps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-500 text-sm border-2 border-dashed border-[#2D2D30] rounded-xl">
                      No applications
                    </div>
                  ) : (
                    columnApps.map((app) => (
                      <div 
                        key={app.id} 
                        className="bg-[#1C1C1F] border border-[#2D2D30] hover:border-[#3D3D40] rounded-xl p-4 shadow-lg transition-all duration-200 group cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusColor(app.status)}`}>
                            {col.title}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(app.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        
                        <h3 className="font-semibold text-white mb-1 line-clamp-2">{app.job.title}</h3>
                        <p className="text-sm text-gray-400 flex items-center gap-2 mb-3">
                          <Briefcase className="w-3.5 h-3.5" />
                          {app.job.company}
                        </p>

                        <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-[#2D2D30]">
                          {app.status === "DISCOVERED" && (
                            <Link href={`/tailor?jobId=${app.job.id}`} className="w-full">
                              <Button variant="secondary" size="sm" className="w-full bg-[#252529] hover:bg-[#2D2D30] text-gray-200">
                                <PenTool className="w-3.5 h-3.5 mr-2" /> Tailor Resume
                              </Button>
                            </Link>
                          )}
                          
                          {app.status === "TAILORING" && (
                            <Link href={`/applications/${app.id}/outreach`} className="w-full">
                              <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                                <Mail className="w-3.5 h-3.5 mr-2" /> Draft Outreach
                              </Button>
                            </Link>
                          )}

                          {app.status === "OUTREACH_SENT" && (
                            <Button variant="outline" size="sm" className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 cursor-default">
                              Awaiting Reply
                            </Button>
                          )}
                          
                          {app.job.url && (
                            <a href={app.job.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center text-xs text-gray-500 hover:text-blue-400 mt-1 transition-colors">
                              View original posting <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
