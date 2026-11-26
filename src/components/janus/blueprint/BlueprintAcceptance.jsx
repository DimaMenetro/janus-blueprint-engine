import { ClipboardCheck } from "lucide-react";
import BlueprintPanel from "@/components/janus/blueprint/BlueprintPanel";
import BlueprintLine from "@/components/janus/blueprint/BlueprintLine";

const OUTCOMES = [["positive", "If the evidence is positive"], ["null", "If there is no effect"], ["contradictory", "If the evidence contradicts the plan"], ["inconclusive", "If the evidence is inconclusive"]];

// How the result is judged: each acceptance entry with what it verifies, and what every kind of outcome would mean.
export default function BlueprintAcceptance({ data }) {
  const { acceptance, outcome_interpretation: o } = data;
  if (!acceptance?.length && !o) return null;
  return (
    <BlueprintPanel icon={ClipboardCheck} title="Acceptance and outcome interpretation">
      {acceptance?.length > 0 && (
        <ul className="space-y-3">
          {acceptance.map((a, i) => (
            <li key={i} className="text-sm">
              <div className="flex flex-wrap items-baseline gap-2">
                {a.id && <span className="font-mono text-xs px-1.5 py-0.5 rounded border border-slate-300/60 dark:border-white/25 text-slate-700 dark:text-slate-200">{a.id}</span>}
                <span className="font-medium text-slate-900 dark:text-white">{a.criterion}</span>
                {a.verifies?.length > 0 && <span className="text-xs text-slate-500 dark:text-slate-400">verifies {a.verifies.join(", ")}</span>}
              </div>
              {a.method && <p className="mt-1 text-slate-600 dark:text-slate-300"><span className="font-medium">Method:</span> {a.method}</p>}
              {a.evidence && <p className="mt-1 text-slate-600 dark:text-slate-300"><span className="font-medium">Evidence:</span> {a.evidence}</p>}
            </li>
          ))}
        </ul>
      )}
      {o && OUTCOMES.map(([key, label]) => <BlueprintLine key={key} label={label} value={o[key]} />)}
    </BlueprintPanel>
  );
}