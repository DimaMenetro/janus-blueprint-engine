import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { FileText, Clock, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

export default function RunCard({ run }) {
  const shortTitle = run.query_text?.substring(0, 60) + (run.query_text?.length > 60 ? "..." : "");
  
  return (
    <Link to={`/results?id=${run.id}`}>
      <Card className="p-4 hover:shadow-xl transition-all cursor-pointer backdrop-blur-[40px] bg-white/[0.10] dark:bg-white/[0.05] border border-white/60 dark:border-white/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5),0_4px_20px_rgba(0,0,0,0.1)] hover:bg-white/[0.15] dark:hover:bg-white/[0.08]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-blue-500 dark:text-purple-400 shrink-0" />
              <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {shortTitle || "Untitled Query"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{run.created_date ? format(new Date(run.created_date), "MMM d, yyyy HH:mm") : "—"}</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded backdrop-blur-[40px] bg-white/[0.10] dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 border border-white/60 dark:border-white/35">
                {run.output_mode || "Blueprint"}
              </span>
              {run.refresh?.attempted === false && (
                <span className="text-xs px-2 py-0.5 rounded backdrop-blur-[40px] bg-slate-50/[0.15] dark:bg-slate-900/[0.15] text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-slate-500/35 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  No Refresh
                </span>
              )}
            </div>
          </div>
          <span className={`shrink-0 px-2 py-1 rounded text-xs font-medium ${
            run.status === "completed" 
              ? "backdrop-blur-[40px] bg-emerald-50/[0.15] dark:bg-emerald-900/[0.15] text-emerald-700 dark:text-emerald-400 border border-emerald-300/60 dark:border-emerald-500/35"
              : run.status === "failed" 
              ? "backdrop-blur-[40px] bg-red-50/[0.15] dark:bg-red-900/[0.15] text-red-700 dark:text-red-400 border border-red-300/60 dark:border-red-500/35"
              : "backdrop-blur-[40px] bg-slate-50/[0.15] dark:bg-slate-900/[0.15] text-slate-600 dark:text-slate-400 border border-slate-300/60 dark:border-slate-500/35"
          }`}>
            {run.status || "idle"}
          </span>
        </div>
      </Card>
    </Link>
  );
}