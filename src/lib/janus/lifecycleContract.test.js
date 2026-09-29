import { describe, it, expect } from "vitest";
import { PAIRS, PATTERNS, DOMAIN_ORDER, subdomainIds } from "@/lib/janus/protocolRegistry";
import {
  LIFECYCLE_STATES, TRANSITIONS, TERMINAL_STATES, canTransition, releaseDecision, qualify, QUALITY_CRITERIA,
  enforceConfidencePropagation, completionManifest, UI_STATES, outcomeAfterStageFailure, RETRY_POLICY,
} from "@/lib/janus/lifecycleContract";

const subs = (d) => Object.fromEntries(subdomainIds(d).map(id => [id, { perspective: "x" }]));
const fullArtifacts = () => ({
  refresh: { limitations: "Refresh off — training knowledge only" },
  corpus: { constraints: ["c"], subdomains: subs("corpus") },
  cogito: { claims: [{ id: "C1", tag: "Established", text: "a" }, { id: "C2", tag: "Speculative", text: "b", depends_on: ["C1"] }], subdomains: subs("cogito") },
  animus: { boundary_checks: ["b"], subdomains: subs("animus") },
  actus: { recommendations: [{ id: "R1", text: "r", depends_on_claims: ["C1", "C2"], inherited_confidence: "Established" }], subdomains: subs("actus") },
  synthesis: {
    intersections: Object.fromEntries(PAIRS.map(p => [p.id, { insight: "i" }])),
    emergent_patterns: Object.fromEntries(PATTERNS.map(p => [p.id, Object.fromEntries(p.fields.map(f => [f, "v"]))])),
  },
  blueprint: { goal: "g", steps: [{ step: 1, title: "t", instructions: "i", validation: "v" }], success_criteria: ["s"],
    risk_register: [{ risk: "r" }], alternative_approaches: [{ name: "a" }, { name: "b" }, { name: "c" }] },
});

describe("lifecycle state machine", () => {
  it("every state has a transition entry; terminals have none", () => {
    expect(Object.keys(TRANSITIONS).sort()).toEqual([...LIFECYCLE_STATES].sort());
    TERMINAL_STATES.forEach(s => expect(TRANSITIONS[s]).toEqual([]));
  });
  it("cancellation only resolves via cancel_requested → cancelled", () => {
    expect(canTransition("running", "cancelled")).toBe(false);
    expect(canTransition("cancel_requested", "cancelled")).toBe(true);
  });
  it("every lifecycle state has a UI representation", () => {
    LIFECYCLE_STATES.forEach(s => expect(UI_STATES[s]).toBeDefined());
  });
  it("no local deadline; stage failure preserves artifacts", () => {
    expect(RETRY_POLICY.local_inference_deadline).toBeNull();
    expect(outcomeAfterStageFailure(3)).toBe("partial");
    expect(outcomeAfterStageFailure(0)).toBe("failed");
  });
});

describe("confidence propagation", () => {
  it("code lowers an over-claimed inherited confidence", () => {
    const r = enforceConfidencePropagation(fullArtifacts().cogito.claims, fullArtifacts().actus.recommendations);
    expect(r.recommendations[0].inherited_confidence).toBe("Speculative");
    expect(r.corrections).toHaveLength(1);
  });
  it("Probable normalizes to Contested", () => {
    const r = enforceConfidencePropagation([{ id: "C1", tag: "Probable" }], [{ id: "R", depends_on_claims: ["C1"], inherited_confidence: "Contested" }]);
    expect(r.corrections).toHaveLength(0);
  });
  it("unanchored recommendation is an error", () => {
    expect(enforceConfidencePropagation([], [{ id: "R", depends_on_claims: [] }]).errors).toHaveLength(1);
  });
});

describe("completion manifest", () => {
  it("valid Full artifacts are a protocol-complete candidate", () => {
    const m = completionManifest("full", fullArtifacts());
    expect(m.blocking).toEqual([]);
    expect(m.completion_label).toMatch(/protocol-complete candidate/);
  });
  it("missing intersection, pattern field or subdomain blocks Full", () => {
    const a = fullArtifacts();
    delete a.synthesis.intersections[PAIRS[0].id];
    delete a.synthesis.emergent_patterns[PATTERNS[0].id][PATTERNS[0].fields[0]];
    delete a.corpus.subdomains[subdomainIds("corpus")[0]];
    expect(completionManifest("full", a).blocking).toHaveLength(3);
  });
  it("Refresh ON requires provenance and 25-subdomain coverage", () => {
    const m = completionManifest("full", fullArtifacts(), { refreshEnabled: true });
    expect(m.complete).toBe(false);
    const a = fullArtifacts();
    a.refresh = { sources: [{ url: "u" }], subdomain_updates: Object.fromEntries(DOMAIN_ORDER.flatMap(d => subdomainIds(d)).map(id => [id, "no sufficiently strong current update established"])) };
    expect(completionManifest("full", a, { refreshEnabled: true }).complete).toBe(true);
  });
  it("Full requires ≥3 alternatives", () => {
    const a = fullArtifacts(); a.blueprint.alternative_approaches = [{ name: "a" }];
    expect(completionManifest("full", a).complete).toBe(false);
  });
  it("partial profiles never claim Full completion", () => {
    const m = completionManifest("quick", fullArtifacts());
    expect(m.complete).toBe(true);
    expect(m.completion_label).toMatch(/partial/i);
  });
});

describe("qualification & release", () => {
  const all = (v) => Object.fromEntries(QUALITY_CRITERIA.map(c => [c.id, v]));
  it("constitution has 14 criteria", () => expect(QUALITY_CRITERIA).toHaveLength(14));
  it("structural completion alone never releases", () => {
    expect(releaseDecision("completed", "not_started").released).toBe(false);
    expect(releaseDecision("validating", "qualified").released).toBe(false);
  });
  it("all-pass qualifies; any fail requires refinement; missing keeps qualifying", () => {
    expect(qualify(all("pass")).state).toBe("qualified");
    expect(qualify({ ...all("pass"), elegance: "fail" }).state).toBe("refinement_required");
    expect(qualify({}).state).toBe("qualifying");
    expect(releaseDecision("completed", "qualified").label).toBe("JANUS-QUALIFIED");
  });
});