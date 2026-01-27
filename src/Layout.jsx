import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Zap, Plus, History, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Layout({ children }) {
  const location = useLocation();
  
  const isActive = (page) => {
    const pageUrl = createPageUrl(page);
    return location.pathname === pageUrl || location.pathname + location.search === pageUrl;
  };

  const navItems = [
    { page: "NewQuery", label: "New Query", icon: Plus },
    { page: "History", label: "History", icon: History },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            <Link to={createPageUrl("NewQuery")} className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-slate-900" />
              <span className="font-semibold text-slate-900">Janus Blueprint</span>
              <span className="text-xs text-slate-400 hidden sm:block">CP-002 v1.5</span>
            </Link>
            
            <div className="flex items-center gap-1">
              {navItems.map(({ page, label, icon: Icon }) => (
                <Link
                  key={page}
                  to={createPageUrl(page)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive(page)
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:block">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>
      
      <main>{children}</main>
    </div>
  );
}