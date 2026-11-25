import { stepTrace } from "@/lib/janus/qualification";

// What a Blueprint step is built on: its effective confidence and the upstream handles it cites.
export default function BlueprintStepTrace({ step, index }) {
  const { refs, declared, effective, corrected } = stepTrace(step, index);
  if (!refs.length && !effective) return null;

  return (
    <div className="pl-11 mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
      {effective && (
        <span className="font-medium" title={corrected ? "Set by code to the weakest confidence of the material this step cites" : undefined}>
          Confidence: {effective}{corrected ? ` (labelled ${declared || "none"})` : ""}
        </span>
      )}
      {refs.length > 0 && <span>Derived from:</span>}
      {refs.map(r => (
        <span
          key={r.id}
          title={r.found ? undefined : "This handle does not exist in the upstream stages"}
          className={`px-1.5 py-0.5 rounded border font-mono ${r.found ? "border-slate-300/60 dark:border-white/25" : "border-red-400/60 line-through"}`}
        >
          {r.id}
        </span>
      ))}
    </div>
  );
}