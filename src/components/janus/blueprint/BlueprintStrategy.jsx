import { Compass } from "lucide-react";
import BlueprintPanel from "@/components/janus/blueprint/BlueprintPanel";
import BlueprintLine from "@/components/janus/blueprint/BlueprintLine";

const MODE = { selected: "One candidate selected", combined: "Candidates combined", higher_order: "Higher-order synthesis of the candidates" };

// What the operator asked for, and the strategy chosen to reach it — with the strongest case made against that choice.
export default function BlueprintStrategy({ data }) {
  const s = data.selected_strategy;
  if (!data.objective && !data.pathway && !s) return null;
  return (
    <BlueprintPanel icon={Compass} title="Objective and selected strategy" note={s?.mode ? MODE[s.mode] || s.mode : undefined}>
      <BlueprintLine label="Operator objective" value={data.objective} />
      <BlueprintLine label="Pathway" value={data.pathway} />
      {s && (
        <>
          <BlueprintLine label="Strategy" value={[s.name, s.built_from?.length ? `built from ${s.built_from.join(", ")}` : ""].filter(Boolean).join(" — ")} />
          <BlueprintLine label="Architecture" value={s.architecture} />
          <BlueprintLine label="Why this one" value={s.rationale} />
          <BlueprintLine label="Strongest attack on this choice" value={s.attack_on_favorite} />
          <BlueprintLine label="Weaknesses that remain" value={s.residual_weaknesses} />
          <BlueprintLine label="Taken from other candidates" value={(s.integrated_strengths || []).map(x => `${x.from}: ${x.what}`)} />
          <BlueprintLine label="Built on" value={s.derived_from?.join(", ")} />
        </>
      )}
    </BlueprintPanel>
  );
}