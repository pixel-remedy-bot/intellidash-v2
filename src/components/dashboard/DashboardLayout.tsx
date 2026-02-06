import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-glass-border bg-glass backdrop-blur-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[#46b7c6]" />
            <h1 className="text-xl font-bold text-white">IntelliDash AI</h1>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <span className="hover:text-white transition-colors cursor-pointer">Dashboard</span>
            <span className="hover:text-white transition-colors cursor-pointer">Analytics</span>
            <span className="hover:text-white transition-colors cursor-pointer">Settings</span>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {children}
        </div>
      </main>
    </div>
  );
}
