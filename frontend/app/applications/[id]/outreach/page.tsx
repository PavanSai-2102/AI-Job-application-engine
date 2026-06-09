"use client";

import { useState, useEffect, use } from "react";
import { Mail, Send, PenTool, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function OutreachPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const applicationId = unwrappedParams.id;
  
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [note, setNote] = useState("");
  
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  
  const [isDrafting, setIsDrafting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<"IDLE" | "DRAFTED" | "SENT">("IDLE");

  const handleDraft = async () => {
    if (!recipientEmail) {
      toast.error("Please enter a recipient email");
      return;
    }
    
    setIsDrafting(true);
    try {
      const res = await fetch("/api/email/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: applicationId,
          recipient_email: recipientEmail,
          recipient_name: recipientName,
          personalization_note: note,
        }),
      });
      
      if (!res.ok) throw new Error("Failed to draft email");
      const data = await res.json();
      
      setSubject(data.subject);
      setBody(data.body);
      setStatus("DRAFTED");
      toast.success("Email drafted successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleSend = async () => {
    setIsSending(true);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: applicationId,
          subject,
          body,
          recipient_email: recipientEmail,
        }),
      });
      
      if (!res.ok) throw new Error("Failed to send email");
      setStatus("SENT");
      toast.success("Email sent successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSending(false);
    }
  };

  if (status === "SENT") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <CheckCircle2 className="w-24 h-24 text-green-500 mb-6 animate-bounce" />
        <h1 className="text-4xl font-bold text-white mb-4">Outreach Sent!</h1>
        <p className="text-slate-400 text-lg mb-8 text-center max-w-md">
          Your tailored email has been dispatched. The status has been updated in your dashboard.
        </p>
        <Button onClick={() => window.location.href = "/dashboard"} className="bg-indigo-600 hover:bg-indigo-500">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans p-6 md:p-12">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Controls Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center text-indigo-400">
              <Mail className="w-5 h-5 mr-2" />
              Target Contact
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Recipient Email *</label>
                <input 
                  type="email" 
                  value={recipientEmail}
                  onChange={e => setRecipientEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="hiring@company.com"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Recipient Name (Optional)</label>
                <input 
                  type="text" 
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Personalization Note</label>
                <textarea 
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full h-24 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  placeholder="Mention I loved their recent blog post on AI..."
                />
              </div>
              
              <Button 
                onClick={handleDraft}
                disabled={isDrafting}
                className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold py-6 rounded-xl mt-4 shadow-lg shadow-indigo-500/20"
              >
                {isDrafting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <PenTool className="w-5 h-5 mr-2" />}
                {status === "DRAFTED" ? "Regenerate Draft" : "Draft Outreach"}
              </Button>
            </div>
          </div>
          
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6">
            <h3 className="flex items-center text-indigo-300 font-semibold mb-2">
              <AlertCircle className="w-4 h-4 mr-2" />
              How it works
            </h3>
            <p className="text-sm text-slate-400">
              The AI will automatically aggregate your tailored resume, the job description, and the contact details to craft a highly personalized cold email.
            </p>
          </div>
        </div>

        {/* Editor Main */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-6 text-white">Email Composer</h2>
            
            <div className="space-y-4 flex-1 flex flex-col">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Subject Line</label>
                <input 
                  type="text" 
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  disabled={status === "IDLE"}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                  placeholder="AI generated subject will appear here..."
                />
              </div>
              
              <div className="flex-1 flex flex-col min-h-[400px]">
                <label className="text-sm text-slate-400 mb-1 block">Email Body</label>
                <textarea 
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  disabled={status === "IDLE"}
                  className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none leading-relaxed disabled:opacity-50"
                  placeholder="Your tailored outreach email will be generated here..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button 
                onClick={handleSend}
                disabled={status !== "DRAFTED" || isSending}
                className="bg-green-600 hover:bg-green-500 text-white px-8 py-6 rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
                Send via SMTP
              </Button>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
