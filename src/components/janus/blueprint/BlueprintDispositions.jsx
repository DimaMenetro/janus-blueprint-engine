import { ListChecks } from "lucide-react";
import BlueprintPanel from "@/components/janus/blueprint/BlueprintPanel";

const TONE = {
  implemented: "text-emerald-700 dark:text-emerald-400 border-emerald-300/60 dark:border-emerald-500/35",
  integrated: "text-emerald-700 dark:text-emerald-400 border-emerald-300/60 dark:border-emerald-500/35",
  deferred: "text-amber-700 dark:text-amber-400 border-amber-300/60 dark:border-amber-500/35",
  alternative: "text-blue-700 dark:text-blue-400 border-blue-300/60 dark:border-blue-500/35",
  rejected: "text-red-700 dark:text-red-400 border-red-300/60 dark:border-red-500/35",
};

function Rows({ title, rows, subject, texts }) {
  if (!rows?.length) return null;
  return (
    <div>
      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">{title}</div>
      <ul className="space-y-2">
        {rows.map((d, i) => (
          <li key={i} className="text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs px-1.5 py-0.5 rounded border border-slate-300/60 dark:border-white/25 text-slate-700 dark:text-slate-200">{d[subject]}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded border ${TONE[d.disposition] || "text-slate-600 dark:text-slate-300 border-slate-300/60 dark:border-white/25"}`}>{d.disposition}</span>
              {d.where?.length > 0 && <span className="text-xs text-slate-500 dark:text-slate-400">step {d.where.join(", ")}</span>}
              {texts[d[subject]]?.priority && <span className="text-xs text-slate-500 dark:text-slate-400">{texts[d[subject]].priority}</span>}
            </div>
            {texts[d[subject]]?.text && <p className="mt-1 text-slate-700 dark:text-slate-200">{texts[d[subject]].text}</p>}
            {d.reasoning && <p className="mt-1 text-slate-600 dark:text-slate-300">{d.reasoning}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

// What became of every operator requirement and every Actus recommendation: carried into which steps, deferred, or answered otherwise.
export default function BlueprintDispositions({ data, brief, actus }) {
  if (!data.requirement_dispositions?.length && !data.recommendation_dispositions?.length) return null;
  const byId = (items) => Object.fromEntries((items || []).map(x => [x.id, x]));
  return (
    <BlueprintPanel icon={ListChecks} title="Requirements and recommendations">
      <Rows title="Operator requirements" rows={data.requirement_dispositions} subject="requirement" texts={byId(brief?.requirements)} />
      <Rows title="Actus recommendations" rows={data.recommendation_dispositions} subject="recommendation" texts={byId(actus?.recommendations)} />
    </BlueprintPanel>
  );
}