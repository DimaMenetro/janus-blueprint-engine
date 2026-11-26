import { useState } from "react";
import { Wrench } from "lucide-react";
import { glassBtn } from "@/components/ui/LiquidGlass";
import { refineJanus } from "@/lib/janus/browserAdapter";
import { useExecution } from "@/components/janus/ExecutionContext";

const btn = (t, off) => ({ ...glassBtn(t), minHeight: 40, padding: "0 16px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", opacity: off ? 0.5 : 1 });
const line = (t, strong) => ({ margin: "8px 0 0", fontSize: 12, color: strong ? t.text : t.subtitle });

// Substantive refinement of a Blueprint that failed qualification: one cycle per press, bounded, on the operator's
// decision. A cycle writes a new Blueprint version against the evaluation and then evaluates it once.
export default function RefinementControls({ q, runId, t, onChanged }) {
  const { drive, busy } = useExecution();
  const [note, setNote] = useState(null);
  const { used, max, available } = q.refinement;
  if (!available) return null;
  const refine = async () => {
    setNote(null);
    try {
      const r = await drive(hooks => refineJanus(runId, hooks));
      if (r.unresolved) setNote("A call of this refinement has not settled; its outcome is unknown.");
      else if (r.failure) setNote(`The refined Blueprint was not accepted, so the evaluated version stays in place: ${r.failure.message}`);
      else if (r.refused) setNote(r.refused.message);
    } catch (e) { setNote(e.message); }
    await onChanged();
  };
  return (
    <div>
      <p style={line(t)}>
        Refinement cycle {used + 1} of {max}: the Blueprint is rewritten against each failed criterion as a new version, then evaluated again. The current version is kept.
      </p>
      <div style={{ marginTop: 10 }}>
        <button onClick={refine} disabled={busy} style={btn(t, busy)}><Wrench style={{ width: 14, height: 14 }} />Refine Blueprint</button>
      </div>
      {note && <p style={line(t, true)}>{note}</p>}
    </div>
  );
}