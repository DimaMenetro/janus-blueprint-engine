import { Badge } from "@/components/ui/badge";
import { Shield, Ban, AlertTriangle } from "lucide-react";

export default function AnimusTab({ data }) {
  if (!data) return <div className="text-slate-500 p-6">No animus data available.</div>;

  return (
    <div className="space-y-6 p-6">
      {data.boundary_checks && data.boundary_checks.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium text-slate-900">Boundary Checks</h4>
            <Badge variant="secondary" className="ml-auto">{data.boundary_checks.length}</Badge>
          </div>
          <ul className="space-y-2">
            {data.boundary_checks.map((check, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm">
                <span className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <span className="text-slate-700">{check}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.disallowed_moves && data.disallowed_moves.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Ban className="w-5 h-5 text-red-600" />
            <h4 className="font-medium text-red-900">Disallowed Moves</h4>
            <Badge variant="destructive" className="ml-auto">{data.disallowed_moves.length}</Badge>
          </div>
          <ul className="space-y-2">
            {data.disallowed_moves.map((move, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm">
                <span className="w-2 h-2 rounded-full bg-red-400 mt-1.5 shrink-0" />
                <span className="text-red-800">{move}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.safety_notes && data.safety_notes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h4 className="font-medium text-amber-900">Safety Notes</h4>
          </div>
          <ul className="space-y-2">
            {data.safety_notes.map((note, idx) => (
              <li key={idx} className="text-sm text-amber-800 pl-4 border-l-2 border-amber-300">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}