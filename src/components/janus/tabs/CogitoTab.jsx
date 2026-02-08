import { Badge } from "@/components/ui/badge";
import { Brain, Link, Map } from "lucide-react";

const tagColors = {
  Established: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Contested: "bg-amber-100 text-amber-800 border-amber-200",
  Speculative: "bg-purple-100 text-purple-800 border-purple-200",
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
            <Badge variant="secondary" className="ml-auto">{data.claims.length}</Badge>
          </div>
          <div className="space-y-4">
            {data.claims.map((claim, idx) => (
              <div key={idx} className="backdrop-blur-[40px] bg-white/[0.10] dark:bg-white/[0.05] border border-white/60 dark:border-white/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),0_2px_10px_rgba(0,0,0,0.05)] rounded-lg p-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-slate-600 dark:text-slate-300">{claim.id}</span>
                    <Badge className={tagColors[claim.tag] || "bg-slate-100 text-slate-800"}>
                      {claim.tag}
                    </Badge>
                  </div>
                </div>
                <p className="text-slate-700 dark:text-slate-200 text-sm mb-3">{claim.text}</p>
                
                {claim.depends_on && claim.depends_on.length > 0 && (
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/30 dark:border-white/20">
                    <Link className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span className="text-xs text-slate-500">Depends on:</span>
                    {claim.depends_on.map((dep, i) => (
                      <Badge key={i} variant="outline" className="text-xs font-mono">
                        {dep}
                      </Badge>
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
              <li key={idx} className="text-sm text-slate-700 dark:text-slate-200 pl-4 border-l-2 border-slate-300 dark:border-slate-600">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}