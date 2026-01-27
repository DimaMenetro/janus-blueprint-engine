import { Badge } from "@/components/ui/badge";
import { Layers, AlertTriangle, Info } from "lucide-react";

export default function SynthesisTab({ data }) {
  if (!data) return <div className="text-slate-500 p-6">No synthesis data available.</div>;

  return (
    <div className="space-y-6 p-6">
      {data.key_takeaways && data.key_takeaways.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-slate-600" />
            <h4 className="font-medium text-slate-900">Key Takeaways</h4>
            <Badge variant="secondary" className="ml-auto">{data.key_takeaways.length}</Badge>
          </div>
          <ul className="space-y-3">
            {data.key_takeaways.map((takeaway, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 text-xs font-medium">
                  {idx + 1}
                </span>
                <span className="text-slate-700 pt-0.5">{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.constraint_collisions && data.constraint_collisions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h4 className="font-medium text-amber-900">Constraint Collisions</h4>
          </div>
          <ul className="space-y-2">
            {data.constraint_collisions.map((collision, idx) => (
              <li key={idx} className="text-sm text-amber-800 pl-4 border-l-2 border-amber-300">
                {collision}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.limitation_foreground && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Limitation Foreground</h4>
              <p className="text-blue-800 text-sm">{data.limitation_foreground}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}