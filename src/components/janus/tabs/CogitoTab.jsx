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
            <Brain className="w-5 h-5 text-slate-600" />
            <h4 className="font-medium text-slate-900">Claims</h4>
            <Badge variant="secondary" className="ml-auto">{data.claims.length}</Badge>
          </div>
          <div className="space-y-3">
            {data.claims.map((claim, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-slate-600">{claim.id}</span>
                    <Badge className={tagColors[claim.tag] || "bg-slate-100 text-slate-800"}>
                      {claim.tag}
                    </Badge>
                  </div>
                </div>
                <p className="text-slate-700 text-sm mb-2">{claim.text}</p>
                {claim.depends_on && claim.depends_on.length > 0 && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                    <Link className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-500">Depends on:</span>
                    {claim.depends_on.map((dep, i) => (
                      <Badge key={i} variant="outline" className="text-xs font-mono">
                        {dep}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.reasoning_map && data.reasoning_map.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Map className="w-5 h-5 text-slate-600" />
            <h4 className="font-medium text-slate-900">Reasoning Map</h4>
          </div>
          <ul className="space-y-2">
            {data.reasoning_map.map((item, idx) => (
              <li key={idx} className="text-sm text-slate-700 pl-4 border-l-2 border-slate-300">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}