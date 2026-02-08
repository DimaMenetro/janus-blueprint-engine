import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, List } from "lucide-react";

export default function RefreshTab({ data }) {
  if (!data) return <div className="text-slate-500 p-6">No refresh data available.</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <span className={`px-2 py-1 rounded text-sm font-medium backdrop-blur-[40px] bg-slate-800/[0.80] dark:bg-slate-200/[0.80] text-white dark:text-slate-900 border border-slate-700/60 dark:border-slate-300/60`}>
          Mode: {data.mode || "Tier 0"}
        </span>
        <span className={`px-2 py-1 rounded text-sm font-medium ${
          data.attempted 
            ? "backdrop-blur-[40px] bg-blue-50/[0.15] dark:bg-blue-900/[0.15] text-blue-700 dark:text-blue-400 border border-blue-300/60 dark:border-blue-500/35"
            : "backdrop-blur-[40px] bg-slate-50/[0.15] dark:bg-slate-900/[0.15] text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-slate-500/35"
        }`}>
          {data.attempted ? "Refresh Attempted" : "No External Refresh"}
        </span>
      </div>

      {data.limitations && (
        <div className="backdrop-blur-[40px] bg-amber-50/[0.15] dark:bg-amber-900/[0.15] border border-amber-300/60 dark:border-amber-500/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-300 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-medium text-amber-900 dark:text-amber-200 mb-1">Limitations</h4>
              <p className="text-amber-800 dark:text-amber-200 text-sm">{data.limitations}</p>
            </div>
          </div>
        </div>
      )}

      {data.would_refresh && data.would_refresh.length > 0 && (
        <div className="backdrop-blur-[40px] bg-white/[0.10] dark:bg-white/[0.05] border border-white/60 dark:border-white/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <List className="w-5 h-5 text-slate-600 dark:text-slate-300 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-slate-900 dark:text-white mb-3">Would Verify (if tools available)</h4>
              <ul className="space-y-2">
                {data.would_refresh.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <CheckCircle className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
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