import { Badge } from "@/components/ui/badge";
import { Shield, Ban, AlertTriangle } from "lucide-react";

export default function AnimusTab({ data }) {
  if (!data) return <div className="text-slate-500 p-6">No animus data available.</div>;

  return (
    <div className="space-y-6 p-6">
      {data.boundary_checks && data.boundary_checks.length > 0 && (
        <div className="backdrop-blur-[40px] bg-white/[0.10] dark:bg-white/[0.05] border border-white/60 dark:border-white/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h4 className="font-semibold text-slate-900 dark:text-white">Boundary Checks</h4>
            <span className="ml-auto px-2 py-0.5 rounded text-xs font-medium backdrop-blur-[40px] bg-slate-800/[0.80] dark:bg-slate-200/[0.80] text-white dark:text-slate-900 border border-slate-700/60 dark:border-slate-300/60">{data.boundary_checks.length}</span>
          </div>
          <ul className="space-y-2">
            {data.boundary_checks.map((check, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm">
                <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 mt-1.5 shrink-0" />
                <span className="text-slate-700 dark:text-slate-200">{check}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.disallowed_moves && data.disallowed_moves.length > 0 && (
        <div className="backdrop-blur-[40px] bg-red-50/[0.15] dark:bg-red-900/[0.15] border border-red-300/60 dark:border-red-500/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Ban className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h4 className="font-semibold text-red-900 dark:text-red-200">Disallowed Moves</h4>
            <span className="ml-auto px-2 py-0.5 rounded text-xs font-medium backdrop-blur-[40px] bg-red-50/[0.15] dark:bg-red-900/[0.15] text-red-700 dark:text-red-400 border border-red-300/60 dark:border-red-500/35">{data.disallowed_moves.length}</span>
          </div>
          <ul className="space-y-2">
            {data.disallowed_moves.map((move, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm">
                <span className="w-2 h-2 rounded-full bg-red-600 dark:bg-red-400 mt-1.5 shrink-0" />
                <span className="text-red-800 dark:text-red-200">{move}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.safety_notes && data.safety_notes.length > 0 && (
        <div className="backdrop-blur-[40px] bg-amber-50/[0.15] dark:bg-amber-900/[0.15] border border-amber-300/60 dark:border-amber-500/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-300" />
            <h4 className="font-semibold text-amber-900 dark:text-amber-200">Safety Notes</h4>
          </div>
          <ul className="space-y-2">
            {data.safety_notes.map((note, idx) => (
              <li key={idx} className="text-sm text-amber-800 dark:text-amber-200 pl-4 border-l-2 border-amber-300 dark:border-amber-600">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}