"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, FileText, Kanban, Sparkles } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Job Search", icon: Search },
  { href: "/tailor", label: "Resume Tailor", icon: FileText },
  { href: "/kanban", label: "Pipeline", icon: Kanban },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <item.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
