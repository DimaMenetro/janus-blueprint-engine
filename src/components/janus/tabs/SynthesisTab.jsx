import { Badge } from "@/components/ui/badge";
import { Layers, AlertTriangle, Info } from "lucide-react";

export default function SynthesisTab({ data }) {
  if (!data) return <div className="text-slate-500 p-6">No synthesis data available.</div>;

  return (
    <div className="space-y-6 p-6">
      {data.key_takeaways && data.key_takeaways.length > 0 && (
        <div className="backdrop-blur-[40px] bg-white/[0.10] dark:bg-white/[0.05] border border-white/60 dark:border-white/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            <h4 className="font-semibold text-slate-900 dark:text-white">Key Takeaways</h4>
            <span className="ml-auto px-2 py-0.5 rounded text-xs font-medium backdrop-blur-[40px] bg-slate-800/[0.80] dark:bg-slate-200/[0.80] text-white dark:text-slate-900 border border-slate-700/60 dark:border-slate-300/60">{data.key_takeaways.length}</span>
          </div>
          <ul className="space-y-3">
            {data.key_takeaways.map((takeaway, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm">
                <span className="w-6 h-6 rounded-full backdrop-blur-[40px] bg-slate-800/[0.80] dark:bg-slate-200/[0.80] text-white dark:text-slate-900 border border-slate-700/60 dark:border-slate-300/60 flex items-center justify-center shrink-0 text-xs font-medium">
                  {idx + 1}
                </span>
                <span className="text-slate-700 dark:text-slate-200 pt-0.5">{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.constraint_collisions && data.constraint_collisions.length > 0 && (
        <div className="backdrop-blur-[40px] bg-amber-50/[0.15] dark:bg-amber-900/[0.15] border border-amber-300/60 dark:border-amber-500/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-300" />
            <h4 className="font-semibold text-amber-900 dark:text-amber-200">Constraint Collisions</h4>
          </div>
          <ul className="space-y-2">
            {data.constraint_collisions.map((collision, idx) => (
              <li key={idx} className="text-sm text-amber-800 dark:text-amber-200 pl-4 border-l-2 border-amber-300 dark:border-amber-600">
                {collision}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.limitation_foreground && (
        <div className="backdrop-blur-[40px] bg-blue-50/[0.15] dark:bg-blue-900/[0.15] border border-blue-300/60 dark:border-blue-500/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">Limitation Foreground</h4>
              <p className="text-blue-800 dark:text-blue-200 text-sm">{data.limitation_foreground}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}