import { useState } from "react";
import { revisionLabel } from "@/lib/janus/stageModel";
import { instantOf } from "@/lib/janus/storeTime";
import { substrateOf } from "@/lib/janus/qualification";
import { substrateLine, callLine, SUBSTITUTED, NOT_CONFIRMED } from "@/lib/janus/substrateText";

const when = (iso) => instantOf(iso)?.toLocaleString() || null;

// Every recorded version of one stage, newest first: state, origin, attempts, fingerprint, the model it was fixed
// to and the model the provider reported, and its output on demand.
export default function StageVersionList({ view, stageKey, t }) {
  const [shown, setShown] = useState(null);
  const versions = view.lineage.filter(s => s.stage_key === stageKey).reverse();
  return (
    <div style={{ flexBasis: "100%", marginTop: 4 }}>
      {versions.map(s => {
        const calls = (view.attempts?.[s.id] || []).filter(a => a.outcome !== "not_started").length;
        const meta = [s.lineage_state, s.stale && "stale", s.provenance?.origin || (s.legacy ? "historical record" : null),
          when(s.completed_at || s.started_at || s.created_date), calls && `${calls} call${calls === 1 ? "" : "s"}`,
          s.input_fingerprint && s.input_fingerprint.slice(0, 15)].filter(Boolean).join(" · ");
        const substrate = substrateOf(view, s);
        const flagged = substrate?.standing === SUBSTITUTED;
        const gap = NOT_CONFIRMED.includes(substrate?.standing);
        return (
          <div key={s.id} style={{ padding: "6px 0 6px 10px", borderLeft: `2px solid ${t.surfaceBorder}`, marginTop: 4 }}>
            <div style={{ fontSize: 12, color: t.text }}><strong>{revisionLabel(s)}</strong> <span style={{ color: t.subtitle }}>{meta}</span></div>
            {substrate && (
              <div style={{ fontSize: 11, marginTop: 2, color: flagged ? t.text : t.subtitle, fontWeight: flagged ? 600 : 400 }}>
                {flagged ? "Another model answered: " : gap ? "Model not confirmed: " : "Model: "}{substrateLine(substrate)}
                {callLine(substrate.call) && <span> · {callLine(substrate.call)}</span>}
              </div>
            )}
            {(s.stale || s.error_message) && <div style={{ fontSize: 11, color: t.subtitle, marginTop: 2 }}>{s.stale || s.error_message}</div>}
            {s.output && (
              <button onClick={() => setShown(shown === s.id ? null : s.id)} style={{ background: "none", border: "none", padding: "4px 0", minHeight: 28, fontSize: 11, fontWeight: 600, color: t.text, cursor: "pointer" }}>
                {shown === s.id ? "Hide output" : "Show output"}
              </button>
            )}
            {shown === s.id && (
              <pre style={{ fontSize: 11, maxHeight: 240, overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, padding: 8, borderRadius: 10, background: t.surface, color: t.text }}>
                {JSON.stringify(s.output, null, 2)}
              </pre>
            )}
          </div>
        );
      })}
    </div>
  );
}