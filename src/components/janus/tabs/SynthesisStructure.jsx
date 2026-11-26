import { PAIRS, PATTERNS, DOMAINS } from "@/lib/janus/protocolRegistry";
import { intersectionKey, revisionLabel } from "@/lib/janus/stageModel";
import { stageLabel } from "@/lib/janus/executionState";

const chip = (on) => `inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${on
  ? "border-slate-300/70 dark:border-white/20 text-slate-800 dark:text-slate-100 bg-white/40 dark:bg-white/[0.06]"
  : "border-dashed border-slate-300/70 dark:border-white/15 text-slate-500 dark:text-slate-400"}`;

function Group({ title, count, note, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h4>
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{count}</span>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-2">{note}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

// What Synthesis is made of: six pair intersections and four formal patterns, kept apart, each with its provenance.
export default function SynthesisStructure({ view }) {
  const data = view.artifacts.synthesis || {};
  const byId = Object.fromEntries(view.lineage.map(s => [s.id, s]));
  const reads = (stage) => (stage?.depends_on || []).map(id => byId[id]).filter(Boolean).map(s => `${stageLabel(s.stage_key)} ${revisionLabel(s)}`).join(", ");
  const pairName = (p) => p.domains.map(d => DOMAINS[d].label).join(" × ");
  const pairs = PAIRS.map(p => ({ ...p, name: pairName(p), present: !!data.intersection_matrix?.[p.id], info: view.stageInfo[intersectionKey(p.id)] }));
  const patterns = PATTERNS.map(p => ({ ...p, present: !!data[p.id], anchor: pairName(PAIRS.find(x => x.id === p.pair)) }));
  const syn = view.stageInfo.synthesis;
  const made = pairs.filter(p => p.present).length;

  return (
    <div className="rounded-lg border border-white/60 dark:border-white/20 bg-white/[0.10] dark:bg-white/[0.04] backdrop-blur-[40px] p-4 space-y-4">
      <Group title="Six pairwise intersections" count={`${made} of ${pairs.length}`} note="One for every pair of the four domains. Each holds an insight, a tension and a resolution.">
        {pairs.map(p => (
          <span key={p.id} className={chip(p.present)}>{p.name}<span className="opacity-60">{p.present ? revisionLabel(p.info?.active) : "not produced"}</span></span>
        ))}
      </Group>
      <Group title="Four formal emergent patterns" count={`${patterns.filter(p => p.present).length} of ${patterns.length}`}
        note="Derived from all six intersections during Synthesis. They are added to the intersections and never replace them.">
        {patterns.map(p => (
          <span key={p.id} className={chip(p.present)}>{p.section} {p.name}<span className="opacity-60">{p.present ? revisionLabel(syn?.active) : "not produced"}</span></span>
        ))}
      </Group>
      {made < pairs.length && !patterns.some(p => p.present) && (
        <p className="text-xs text-slate-600 dark:text-slate-300">The patterns are produced only from all six intersections, and the Blueprint only after them.</p>
      )}
      <details>
        <summary className="text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer py-2">Provenance</summary>
        <ul className="mt-1 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
          {pairs.filter(p => p.present).map(p => (
            <li key={p.id}><strong className="font-semibold">{p.name}</strong> ({p.resolution_label}) {revisionLabel(p.info?.active)}
              {reads(p.info?.active) ? `: reads ${reads(p.info.active)}` : ""}{p.info?.stale ? `. Stale: ${p.info.stale}` : ""}</li>
          ))}
          {syn?.active && (
            <li><strong className="font-semibold">Patterns</strong> {revisionLabel(syn.active)}{reads(syn.active) ? `: read ${reads(syn.active)}` : ""}{syn.stale ? `. Stale: ${syn.stale}` : ""}</li>
          )}
          {patterns.filter(p => p.present).map(p => <li key={p.id}>{p.name}: formal model of {p.anchor}</li>)}
        </ul>
      </details>
    </div>
  );
}