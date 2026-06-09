"use client";

import { useEffect, useState } from "react";
import { Briefcase, PenTool, MailCheck, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function KanbanPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/applications");
      if (!res.ok) throw new Error("Failed to fetch applications");
      const data = await res.json();
      setApplications(data.applications || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const discovered = applications.filter(a => a.status === "DISCOVERED");
  const tailored = applications.filter(a => a.status === "TAILORING");
  const outreach = applications.filter(a => a.status === "OUTREACH_SENT");

  const Column = ({ title, icon: Icon, color, items, actionLabel, getActionLink }: any) => (
    <div className={`flex flex-col bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden h-full`}>
      <div className={`p-4 border-b border-slate-800 flex items-center justify-between ${color}`}>
        <div className="flex items-center font-bold text-lg">
          <Icon className="w-5 h-5 mr-2" />
          {title}
        </div>
        <span className="bg-slate-950 px-3 py-1 rounded-full text-xs font-bold shadow-inner">
          {items.length}
        </span>
      </div>
      <div className="p-4 flex-1 space-y-4 overflow-y-auto min-h-[400px]">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 py-10">
            <Icon className="w-12 h-12 mb-3" />
            <p>No applications here</p>
          </div>
        ) : (
          items.map((app: any) => (
            <div key={app.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-lg hover:border-slate-700 transition-all group">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-100 line-clamp-2">{app.job.title}</h3>
                {app.job.url && (
                  <a href={app.job.url} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-cyan-400">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              <p className="text-sm text-slate-400 mb-4">{app.job.company}</p>
              
              {actionLabel && getActionLink && (
                <Link href={getActionLink(app.id)}>
                  <Button className="w-full bg-slate-800 hover:bg-slate-700 text-xs py-1 h-8">
                    {actionLabel}
                  </Button>
                </Link>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              Application Pipeline
            </h1>
            <p className="text-slate-400 mt-1">Track and manage your automated outreach.</p>
          </div>
          <Button onClick={fetchApplications} variant="outline" className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {isLoading && applications.length === 0 ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Column 
              title="Discovered" 
              icon={Briefcase} 
              color="text-slate-300" 
              items={discovered} 
              actionLabel="Tailor Resume"
              getActionLink={(id: string) => `/tailor?applicationId=${id}`}
            />
            <Column 
              title="Tailored" 
              icon={PenTool} 
              color="text-indigo-400" 
              items={tailored} 
              actionLabel="Draft Outreach"
              getActionLink={(id: string) => `/applications/${id}/outreach`}
            />
            <Column 
              title="Outreach Sent" 
              icon={MailCheck} 
              color="text-emerald-400" 
              items={outreach} 
              actionLabel="View Status"
              getActionLink={(id: string) => `/applications/${id}/outreach`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
