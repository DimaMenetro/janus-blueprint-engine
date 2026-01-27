import { Badge } from "@/components/ui/badge";
import { Rocket, Link, AlertCircle, ArrowRight } from "lucide-react";

const confidenceColors = {
  Established: "bg-emerald-100 text-emerald-800",
  Contested: "bg-amber-100 text-amber-800",
  Speculative: "bg-purple-100 text-purple-800",
};

const probabilityColors = {
  high: "bg-emerald-500",
  medium: "bg-amber-500",
  low: "bg-red-500",
};

export default function ActusTab({ data }) {
  if (!data) return <div className="text-slate-500 p-6">No actus data available.</div>;

  return (
    <div className="space-y-6 p-6">
      {data.recommendations && data.recommendations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Rocket className="w-5 h-5 text-slate-600" />
            <h4 className="font-medium text-slate-900">Recommendations</h4>
            <Badge variant="secondary" className="ml-auto">{data.recommendations.length}</Badge>
          </div>
          <div className="space-y-4">
            {data.recommendations.map((rec, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-slate-600">{rec.id}</span>
                    <Badge className={confidenceColors[rec.inherited_confidence] || "bg-slate-100"}>
                      {rec.inherited_confidence}
                    </Badge>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${probabilityColors[rec.probability] || "bg-slate-400"}`} />
                      <span className="text-xs text-slate-500 capitalize">{rec.probability} probability</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-slate-700 text-sm mb-3">{rec.text}</p>

                {rec.depends_on_claims && rec.depends_on_claims.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <Link className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-500">Based on:</span>
                    {rec.depends_on_claims.map((claim, i) => (
                      <Badge key={i} variant="outline" className="text-xs font-mono">
                        {claim}
                      </Badge>
                    ))}
                  </div>
                )}

                {rec.failure_modes && rec.failure_modes.length > 0 && (
                  <div className="bg-red-50 rounded-md p-3 mb-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                      <span className="text-xs font-medium text-red-800">Failure Modes</span>
                    </div>
                    <ul className="space-y-1">
                      {rec.failure_modes.map((mode, i) => (
                        <li key={i} className="text-xs text-red-700 pl-3">• {mode}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {rec.next_actions && rec.next_actions.length > 0 && (
                  <div className="bg-slate-50 rounded-md p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                      <span className="text-xs font-medium text-slate-700">Next Actions</span>
                    </div>
                    <ul className="space-y-1">
                      {rec.next_actions.map((action, i) => (
                        <li key={i} className="text-xs text-slate-600 pl-3">• {action}</li>
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