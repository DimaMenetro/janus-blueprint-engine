// Phase 9: the Markdown export of a Blueprint loses nothing the artifact holds.
import { describe, it, expect } from "vitest";
import { blueprintMarkdown } from "@/lib/janus/blueprintMarkdown";

const leaves = (x, out = []) => {
  if (typeof x === "string" || typeof x === "number") out.push(String(x));
  else if (x && typeof x === "object") Object.values(x).forEach(v => leaves(v, out));
  return out;
};

const blueprint = {
  goal: "Pilot autonomous transit on one corridor",
  assumptions: ["The corridor has dedicated lanes", "Operators stay on board in year one"],
  alternative_approaches: [
    { name: "City-wide launch", pros: ["Faster coverage"], cons: ["Unbounded safety exposure"], why_not_chosen: "No evidence base yet", cost_class: "very high" },
  ],
  steps: [{
    step: 1, title: "Instrument the corridor", purpose: "Establish the measurement baseline", instructions: "Install roadside units at every signalised junction.",
    inputs: ["Junction survey"], outputs: ["Calibrated sensor map"], validation: "Sensor map matches survey within 10 cm",
    depends_on_steps: [], time_estimate: "6 weeks", effort_level: "high", confidence: "Established", derived_from: ["corpus:1", "C2", "pattern:quantum_foresight"],
    substeps: [{ substep: "Procure units", details: "Two vendors, split order", owner: "Procurement lead" }],
    checklist: ["Permits filed"], acceptance_tests: ["Drive-through detects all 14 junctions"], rollback: "Remove units and restore signage",
  }],
  success_criteria: ["Zero injury incidents in 90 days"],
  risk_register: [{ risk: "Sensor drift", impact: "False clearances", mitigation: "Weekly recalibration", likelihood: "medium" }],
  open_questions: ["Who carries liability in mixed traffic?"],
};

describe("Blueprint Markdown export", () => {
  it("writes every value the Blueprint holds, including fields this layout does not name", () => {
    const md = blueprintMarkdown(blueprint);
    expect(leaves(blueprint).filter(l => !md.includes(l))).toEqual([]);
  });

  it("produces nothing for an absent Blueprint", () => {
    expect(blueprintMarkdown(undefined)).toBe("");
    expect(blueprintMarkdown(null)).toBe("");
  });
});