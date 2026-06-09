import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TailoringSessionProvider } from "@/context/TailoringSessionContext";
import { Toaster } from "@/components/ui/sonner";
import { ProgressBar } from "@/components/ProgressBar";
import { DemoModeBanner } from "@/components/DemoModeBanner";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Job Application Engine",
  description: "End-to-end AI-powered job search, resume tailoring, and cold email outreach platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <TailoringSessionProvider>
          <TooltipProvider>
            <div className="min-h-screen bg-background flex flex-col">
              <header className="border-b bg-card">
                <DemoModeBanner />
                <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
                  <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <h1 className="text-xl font-bold tracking-tight text-primary">AI Job Application Engine</h1>
                  </Link>
                  <Navbar />
                </div>
                <div className="border-t bg-muted/20">
                  <ProgressBar />
                </div>
              </header>
              <main className="flex-1 w-full max-w-7xl mx-auto">{children}</main>
            </div>
            <Toaster />
          </TooltipProvider>
        </TailoringSessionProvider>
      </body>
    </html>
  );
}

