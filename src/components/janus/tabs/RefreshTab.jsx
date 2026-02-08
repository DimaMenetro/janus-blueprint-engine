import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, List } from "lucide-react";

export default function RefreshTab({ data }) {
  if (!data) return <div className="text-slate-500 p-6">No refresh data available.</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Badge variant={data.attempted ? "default" : "secondary"} className="text-sm">
          Mode: {data.mode || "Tier 0"}
        </Badge>
        <Badge variant={data.attempted ? "default" : "outline"} className="text-sm">
          {data.attempted ? "Refresh Attempted" : "No External Refresh"}
        </Badge>
      </div>

      {data.limitations && (
        <div className="backdrop-blur-[40px] bg-amber-50/[0.15] dark:bg-amber-900/[0.15] border border-amber-300/60 dark:border-amber-500/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-medium text-amber-900 mb-1">Limitations</h4>
              <p className="text-amber-800 dark:text-amber-200 text-sm font-medium">{data.limitations}</p>
            </div>
          </div>
        </div>
      )}

      {data.would_refresh && data.would_refresh.length > 0 && (
        <div className="backdrop-blur-[40px] bg-white/[0.10] dark:bg-white/[0.05] border border-white/60 dark:border-white/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <List className="w-5 h-5 text-slate-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-slate-900 mb-3">Would Verify (if tools available)</h4>
              <ul className="space-y-2">
                {data.would_refresh.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200 font-medium">
                    <CheckCircle className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}