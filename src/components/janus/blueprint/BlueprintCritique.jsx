import { ScanSearch } from "lucide-react";
import BlueprintPanel from "@/components/janus/blueprint/BlueprintPanel";
import BlueprintLine from "@/components/janus/blueprint/BlueprintLine";

const SEVERITY = {
  blocking: "text-red-700 dark:text-red-400 border-red-300/60 dark:border-red-500/35",
  major: "text-amber-700 dark:text-amber-400 border-amber-300/60 dark:border-amber-500/35",
  minor: "text-slate-600 dark:text-slate-300 border-slate-300/60 dark:border-white/25",
};
const PRESERVED = { yes: "preserved", partly: "only partly preserved", no: "replaced" };

// The self-critique of the assembled draft, and what the final Blueprint did about each finding.
export default function BlueprintCritique({ critique, refinement }) {
  const findings = critique?.findings || [];
  const answers = Object.fromEntries((refinement?.dispositions || []).map(d => [d.finding, d]));
  if (!critique && !refinement) return null;
  return (
    <BlueprintPanel icon={ScanSearch} title="Self-critique and refinement" note={critique ? `${findings.length} finding${findings.length === 1 ? "" : "s"}` : undefined}>
      <BlueprintLine label="Critique" value={critique?.summary} />
      {critique?.objective_check && (
        <BlueprintLine label="Operator objective" value={`${PRESERVED[critique.objective_check.preserved] || critique.objective_check.preserved}${critique.objective_check.lost?.length ? ` — lost: ${critique.objective_check.lost.join("; ")}` : ""}`} />
      )}
      {findings.map(f => (
        <div key={f.id} className="text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs px-1.5 py-0.5 rounded border border-slate-300/60 dark:border-white/25 text-slate-700 dark:text-slate-200">{f.id}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded border ${SEVERITY[f.severity] || SEVERITY.minor}`}>{f.severity}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{[f.category?.replace(/_/g, " "), f.where].filter(Boolean).join(" · ")}</span>
          </div>
          <p className="mt-1 text-slate-700 dark:text-slate-200">{f.problem}</p>
          {f.evidence && <p className="mt-1 text-slate-600 dark:text-slate-300"><span className="font-medium">Evidence:</span> {f.evidence}</p>}
          <p className="mt-1 text-slate-600 dark:text-slate-300"><span className="font-medium">Required change:</span> {f.required_change}</p>
          {answers[f.id] && (
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              <span className="font-medium">{answers[f.id].action === "resolved" ? "Resolved:" : "Declined:"}</span> {answers[f.id].change || answers[f.id].reason}
            </p>
          )}
        </div>
      ))}
      <BlueprintLine label="What the draft genuinely adds" value={critique?.genuine_additions} />
      <BlueprintLine label="What only restates the operator's material" value={critique?.input_restatement} />
      <BlueprintLine label="Scope changed in refinement" value={(refinement?.scope_changes || []).map(c => `${c.requirement ? `${c.requirement}: ` : ""}${c.what} — ${c.reason}`)} />
      <BlueprintLine label="Changed in refinement" value={(refinement?.changes || []).map(c => `${c.path}: ${c.what}${c.finding ? ` (answers ${c.finding})` : c.reason ? ` — ${c.reason}` : ""}`)} />
      <BlueprintLine label="Removed in refinement" value={(refinement?.removals || []).map(r => `${r.path} — ${r.reason}`)} />
      <BlueprintLine label="Refinement" value={refinement?.summary} />
    </BlueprintPanel>
  );
}