import { Badge } from "@/components/ui/badge";
import { Brain, Link, Map } from "lucide-react";

const tagColors = {
  Established: "backdrop-blur-[40px] bg-emerald-50/[0.15] dark:bg-emerald-900/[0.15] text-emerald-700 dark:text-emerald-400 border border-emerald-300/60 dark:border-emerald-500/35",
  Contested: "backdrop-blur-[40px] bg-amber-50/[0.15] dark:bg-amber-900/[0.15] text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-500/35",
  Speculative: "backdrop-blur-[40px] bg-purple-50/[0.15] dark:bg-purple-900/[0.15] text-purple-700 dark:text-purple-400 border border-purple-300/60 dark:border-purple-500/35",
};

export default function CogitoTab({ data }) {
  if (!data) return <div className="text-slate-500 p-6">No cogito data available.</div>;

  return (
    <div className="space-y-6 p-6">
      {data.claims && data.claims.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            <h4 className="font-semibold text-slate-900 dark:text-white">Claims (with Evidence Discipline)</h4>
            <span className="ml-auto px-2 py-0.5 rounded text-xs font-medium backdrop-blur-[40px] bg-slate-800/[0.80] dark:bg-slate-200/[0.80] text-white dark:text-slate-900 border border-slate-700/60 dark:border-slate-300/60">{data.claims.length}</span>
          </div>
          <div className="space-y-4">
            {data.claims.map((claim, idx) => (
              <div key={idx} className="backdrop-blur-[40px] bg-white/[0.10] dark:bg-white/[0.05] border border-white/60 dark:border-white/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),0_2px_10px_rgba(0,0,0,0.05)] rounded-lg p-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-slate-600 dark:text-slate-300">{claim.id}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${tagColors[claim.tag] || "backdrop-blur-[40px] bg-slate-50/[0.15] dark:bg-slate-900/[0.15] text-slate-600 dark:text-slate-400 border border-slate-300/60 dark:border-slate-500/35"}`}>
                      {claim.tag}
                    </span>
                  </div>
                </div>
                <p className="text-slate-700 dark:text-slate-200 text-sm mb-3">{claim.text}</p>
                
                {claim.depends_on && claim.depends_on.length > 0 && (
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/60 dark:border-white/35">
                    <Link className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span className="text-xs text-slate-500">Depends on:</span>
                    {claim.depends_on.map((dep, i) => (
                      <span key={i} className="text-xs font-mono px-2 py-0.5 rounded backdrop-blur-[40px] bg-white/[0.10] dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 border border-white/60 dark:border-white/35">
                        {dep}
                      </span>
                    ))}
                  </div>
                )}

                {(claim.why_believed || claim.falsifiable_by || claim.verify_later) && (
                  <div className="space-y-2">
                    {claim.why_believed && (
                      <div className="text-xs">
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">Why Believed:</span>
                        <p className="text-slate-600 dark:text-slate-300 mt-1">{claim.why_believed}</p>
                      </div>
                    )}
                    {claim.falsifiable_by && (
                      <div className="text-xs">
                        <span className="font-medium text-red-600 dark:text-red-400">Falsifiable By:</span>
                        <p className="text-slate-600 dark:text-slate-300 mt-1">{claim.falsifiable_by}</p>
                      </div>
                    )}
                    {claim.verify_later && (
                      <div className="text-xs">
                        <span className="font-medium text-amber-600 dark:text-amber-300">Verify Later:</span>
                        <p className="text-slate-600 dark:text-slate-300 mt-1">{claim.verify_later}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.reasoning_map && data.reasoning_map.length > 0 && (
        <div className="backdrop-blur-[40px] bg-white/[0.10] dark:bg-white/[0.05] border border-white/60 dark:border-white/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Map className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            <h4 className="font-semibold text-slate-900 dark:text-white">Reasoning Map</h4>
          </div>
          <ul className="space-y-2">
            {data.reasoning_map.map((item, idx) => (
              <li key={idx} className="text-sm text-slate-700 dark:text-slate-200 pl-4 border-l-2 border-slate-300/60 dark:border-slate-600/60">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}