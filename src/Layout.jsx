import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Zap, Plus, History, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import ThemeToggle from "@/components/theme/ThemeToggle";

export default function Layout({ children }) {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: "/new-query", label: "New Query", icon: Plus },
    { path: "/history", label: "History", icon: History },
    { path: "/diagnostics", label: "Diagnostics", icon: Zap },
  ];

  // Log navigation events
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const { navigationLogger } = require('@/components/diagnostics/NavigationLogger');
        const prevPath = sessionStorage.getItem('prevPath') || '';
        if (prevPath !== location.pathname) {
          navigationLogger.log(prevPath, location.pathname);
          sessionStorage.setItem('prevPath', location.pathname);
        }
      } catch (e) {
        // Navigation logger not critical
      }
    }
  }, [location.pathname]);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-pink-50 to-blue-50 dark:from-purple-950 dark:via-red-950 dark:to-purple-900 transition-colors duration-500">
        {/* Liquid Glass Navigation */}
        <nav className="sticky top-0 z-50 backdrop-blur-2xl bg-white/20 dark:bg-black/20 border-b border-white/20 dark:border-white/10 shadow-lg">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center justify-between h-14">
              <Link to="/new-query" className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600 dark:text-purple-400" />
                <span className="font-semibold text-slate-900 dark:text-white">Janus Blueprint</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">CP-002 v1.5</span>
              </Link>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {navItems.map(({ path, label, icon: Icon }) => (
                    <Link
                      key={path}
                      to={path}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                        isActive(path)
                          ? "bg-blue-500/20 dark:bg-purple-500/30 text-blue-700 dark:text-purple-200 backdrop-blur-md"
                          : "text-slate-700 dark:text-slate-300 hover:bg-white/30 dark:hover:bg-white/10 backdrop-blur-sm"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:block">{label}</span>
                    </Link>
                  ))}
                </div>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </nav>
        
        <main>{children}</main>
      </div>
    </ThemeProvider>
  );
}