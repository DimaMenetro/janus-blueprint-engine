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
              <Badge variant="outline" className="text-xs">
                {run.output_mode || "Blueprint"}
              </Badge>
              {run.refresh?.attempted === false && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  No Refresh
                </Badge>
              )}
            </div>
          </div>
          <Badge 
            variant={run.status === "completed" ? "default" : run.status === "failed" ? "destructive" : "secondary"}
            className="shrink-0"
          >
            {run.status || "idle"}
          </Badge>
        </div>
      </Card>
    </Link>
  );
}