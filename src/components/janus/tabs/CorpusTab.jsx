import { Badge } from "@/components/ui/badge";
import { BookOpen, AlertCircle } from "lucide-react";

export default function CorpusTab({ data }) {
  if (!data) return <div className="text-slate-500 p-6">No corpus data available.</div>;

  return (
    <div className="space-y-6 p-6">
      {data.constraints && data.constraints.length > 0 && (
        <div className="backdrop-blur-[40px] bg-white/[0.10] dark:bg-white/[0.05] border border-white/60 dark:border-white/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            <h4 className="font-semibold text-slate-900 dark:text-white">Constraints</h4>
            <Badge variant="secondary" className="ml-auto">{data.constraints.length}</Badge>
          </div>
          <ul className="space-y-2">
            {data.constraints.map((constraint, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 text-xs font-medium">
                  {idx + 1}
                </span>
                <span className="text-slate-700 dark:text-slate-200 pt-0.5">{constraint}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.feasibility_notes && data.feasibility_notes.length > 0 && (
        <div className="backdrop-blur-[40px] bg-blue-50/[0.15] dark:bg-blue-900/[0.15] border border-blue-300/60 dark:border-blue-500/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h4 className="font-semibold text-blue-900 dark:text-blue-200">Feasibility Notes</h4>
          </div>
          <ul className="space-y-2">
            {data.feasibility_notes.map((note, idx) => (
              <li key={idx} className="text-sm text-blue-800 dark:text-blue-200 pl-4 border-l-2 border-blue-300 dark:border-blue-600">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}