import { Boxes } from "lucide-react";
import BlueprintPanel from "@/components/janus/blueprint/BlueprintPanel";
import BlueprintLine from "@/components/janus/blueprint/BlueprintLine";

const has = (v) => (Array.isArray(v) ? v.length > 0 : !!v);

// The shape of the solution: components and how they relate, phases, what is in and out of scope, what must hold.
export default function BlueprintStructure({ data }) {
  const { architecture: a, phases, scope, invariants, decision_points } = data;
  if (![a, phases, scope, invariants, decision_points].some(has)) return null;
  return (
    <BlueprintPanel icon={Boxes} title="Architecture and scope">
      <BlueprintLine label="Architecture" value={a?.summary} />
      <BlueprintLine label="Components" value={(a?.components || []).map(c =>
        `${c.name}${c.id ? ` (${c.id})` : ""} — ${c.responsibility}${c.interfaces?.length ? ` · interfaces: ${c.interfaces.join("; ")}` : ""}`)} />
      <BlueprintLine label="Relationships" value={a?.relationships} />
      <BlueprintLine label="Phases" value={(phases || []).map(p => `${p.id ? `${p.id} · ` : ""}${p.name}${p.intent ? ` — ${p.intent}` : ""}`)} />
      <BlueprintLine label="In scope" value={scope?.in} />
      <BlueprintLine label="Deferred" value={(scope?.deferred || []).map(d => `${d.item} — ${d.reason}${d.revisit_when ? ` (revisit: ${d.revisit_when})` : ""}`)} />
      <BlueprintLine label="Out of scope" value={scope?.out} />
      <BlueprintLine label="Invariants" value={invariants} />
      <BlueprintLine label="Decision points" value={decision_points} />
    </BlueprintPanel>
  );
}