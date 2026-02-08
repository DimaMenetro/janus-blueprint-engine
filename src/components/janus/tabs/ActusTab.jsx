import { Badge } from "@/components/ui/badge";
import { Rocket, Link, AlertCircle, ArrowRight } from "lucide-react";

const confidenceColors = {
  Established: "backdrop-blur-[40px] bg-emerald-50/[0.15] dark:bg-emerald-900/[0.15] text-emerald-700 dark:text-emerald-400 border border-emerald-300/60 dark:border-emerald-500/35",
  Contested: "backdrop-blur-[40px] bg-amber-50/[0.15] dark:bg-amber-900/[0.15] text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-500/35",
  Speculative: "backdrop-blur-[40px] bg-purple-50/[0.15] dark:bg-purple-900/[0.15] text-purple-700 dark:text-purple-400 border border-purple-300/60 dark:border-purple-500/35",
};

const probabilityColors = {
  high: "backdrop-blur-[40px] bg-emerald-500/[0.80] dark:bg-emerald-400/[0.80] border border-emerald-400/60 dark:border-emerald-300/60",
  medium: "backdrop-blur-[40px] bg-amber-500/[0.80] dark:bg-amber-400/[0.80] border border-amber-400/60 dark:border-amber-300/60",
  low: "backdrop-blur-[40px] bg-red-500/[0.80] dark:bg-red-400/[0.80] border border-red-400/60 dark:border-red-300/60",
};

export default function ActusTab({ data }) {
  if (!data) return <div className="text-slate-500 p-6">No actus data available.</div>;

  return (
    <div className="space-y-6 p-6">
      {data.recommendations && data.recommendations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Rocket className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            <h4 className="font-semibold text-slate-900 dark:text-white">Recommendations</h4>
            <span className="ml-auto px-2 py-0.5 rounded text-xs font-medium backdrop-blur-[40px] bg-slate-800/[0.80] dark:bg-slate-200/[0.80] text-white dark:text-slate-900 border border-slate-700/60 dark:border-slate-300/60">{data.recommendations.length}</span>
          </div>
          <div className="space-y-4">
            {data.recommendations.map((rec, idx) => (
              <div key={idx} className="backdrop-blur-[40px] bg-white/[0.10] dark:bg-white/[0.05] border border-white/60 dark:border-white/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-slate-600 dark:text-slate-300">{rec.id}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${confidenceColors[rec.inherited_confidence] || "backdrop-blur-[40px] bg-slate-50/[0.15] dark:bg-slate-900/[0.15] text-slate-600 dark:text-slate-400 border border-slate-300/60 dark:border-slate-500/35"}`}>
                      {rec.inherited_confidence}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${probabilityColors[rec.probability] || "backdrop-blur-[40px] bg-slate-400/[0.80] border border-slate-300/60"}`} />
                      <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">{rec.probability} probability</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-slate-700 dark:text-slate-200 text-sm mb-3">{rec.text}</p>

                {rec.depends_on_claims && rec.depends_on_claims.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <Link className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span className="text-xs text-slate-500">Based on:</span>
                    {rec.depends_on_claims.map((claim, i) => (
                      <span key={i} className="text-xs font-mono px-2 py-0.5 rounded backdrop-blur-[40px] bg-white/[0.10] dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 border border-white/60 dark:border-white/35">
                        {claim}
                      </span>
                    ))}
                  </div>
                )}

                {rec.failure_modes && rec.failure_modes.length > 0 && (
                  <div className="backdrop-blur-[40px] bg-red-50/[0.15] dark:bg-red-900/[0.15] border border-red-300/60 dark:border-red-500/35 rounded-md p-3 mb-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                      <span className="text-xs font-medium text-red-600 dark:text-red-400">Failure Modes</span>
                    </div>
                    <ul className="space-y-1">
                      {rec.failure_modes.map((mode, i) => (
                        <li key={i} className="text-xs text-red-600 dark:text-red-400 pl-3">• {mode}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {rec.next_actions && rec.next_actions.length > 0 && (
                  <div className="backdrop-blur-[40px] bg-white/[0.15] dark:bg-white/[0.08] border border-white/60 dark:border-white/35 rounded-md p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Next Actions</span>
                    </div>
                    <ul className="space-y-1">
                      {rec.next_actions.map((action, i) => (
                        <li key={i} className="text-xs text-slate-600 dark:text-slate-300 pl-3">• {action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}