import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/api/base44Client", async () => ({ base44: (await import("@/lib/janus/testPlatform")).platform.base44 }));

import { platform as h } from "@/lib/janus/testPlatform";
import { executeJanus, rerunSynthesis, rerunBlueprint, REFRESH_UNAVAILABLE_MESSAGE } from "@/lib/janus/browserAdapter";
import { validateJanusOutput } from "@/components/janus/janusSchema";
import { composeRunView, rerunNeeds } from "@/lib/janus/runView";
import { PAIRS, STAGE_ORDER } from "@/lib/janus/protocolRegistry";
import { INTERSECTION_KEYS, intersectionKey } from "@/lib/janus/stageModel";

const params = (mode, extra = {}) => ({ queryText: "How should a city pilot autonomous transit?", executionMode: mode, outputMode: "Blueprint", blueprintLevel: "L2", noveltyDial: "medium", refreshEnabled: false, ...extra });
const execute = (mode, extra) => executeJanus(params(mode, extra));
const stagesOf = (runId) => h.db.RunStage.filter(s => s.run_id === runId);
const byKey = (runId, key) => stagesOf(runId).filter(s => s.stage_key === key).sort((a, b) => a.revision - b.revision);
const viewOf = (runId) => composeRunView(h.db.Run.find(r => r.id === runId), stagesOf(runId));

beforeEach(() => h.reset());

describe("execution — durable stages (Phase 3 exit tests, on the canonical engine)", () => {
  it("new run: every stage is a durable revision with exact dependencies; the Run holds no cognition", async () => {
    const result = await execute("full");
    expect(result.success).toBe(true);
    const run = h.db.Run[0];
    expect(run.storage_model).toBe("staged_v1");
    STAGE_ORDER.forEach(k => expect(run[k]).toBeUndefined());

    const stages = stagesOf(run.id);
    expect(stages).toHaveLength(13); // 7 stages + 6 intersections
    expect(stages.every(s => s.status === "succeeded" && s.revision === 1 && /^sha256:[0-9a-f]{64}$/.test(s.input_fingerprint))).toBe(true);
    const id = (k) => byKey(run.id, k)[0].id;
    expect(byKey(run.id, "cogito")[0].depends_on).toEqual([id("refresh"), id("corpus")]);
    PAIRS.forEach(p => expect(byKey(run.id, intersectionKey(p.id))[0].depends_on).toEqual(p.domains.map(d => id(d))));
    expect([...byKey(run.id, "synthesis")[0].depends_on].sort()).toEqual(INTERSECTION_KEYS.map(id).sort());
    expect([...byKey(run.id, "blueprint")[0].depends_on].sort()).toEqual(["refresh", "corpus", "animus", "actus", ...INTERSECTION_KEYS].map(id).sort());

    expect(h.db.RunAttempt).toHaveLength(13);
    expect(h.db.RunAttempt.every(a => a.outcome === "succeeded" && stages.some(s => s.id === a.stage_id))).toBe(true);
    expect(h.llm.calls.every(keys => keys.join() === "stage_id,prompt")).toBe(true); // no per-call model override
  });

  it("the frontend view and the backend caches are the same durable truth", async () => {
    await execute("full");
    const run = h.db.Run[0];
    const view = viewOf(run.id);
    expect(Object.keys(view.artifacts).sort()).toEqual([...STAGE_ORDER].sort());
    expect(Object.keys(view.artifacts.synthesis.intersection_matrix)).toHaveLength(6);
    expect(JSON.parse(run.raw_json)).toEqual(JSON.parse(JSON.stringify(validateJanusOutput(view.artifacts, STAGE_ORDER).normalized)));
  });

  it("one failed stage does not erase prior stages", async () => {
    h.llm.failOn = "blueprint";
    const result = await execute("full");
    const run = h.db.Run[0];
    const bp = byKey(run.id, "blueprint")[0];
    expect(bp).toMatchObject({ status: "failed", error_class: "provider_error" });
    expect(h.db.RunAttempt.find(a => a.stage_id === bp.id).outcome).toBe("provider_error");
    expect(stagesOf(run.id).filter(s => s.status === "succeeded")).toHaveLength(12);
    const view = viewOf(run.id);
    expect(view.artifacts.blueprint).toBeUndefined();
    expect(view.artifacts.corpus).toBeDefined();
    expect(rerunNeeds(view).blueprint).toBe(true);
    expect(result.errors.some(e => e.startsWith("blueprint: LLM call failed"))).toBe(true);
  });

  it("Refresh ON still fails closed before any record or model call", async () => {
    await expect(execute("full", { refreshEnabled: true })).rejects.toThrow(REFRESH_UNAVAILABLE_MESSAGE);
    expect(h.db.Run).toHaveLength(0);
    expect(h.llm.calls).toHaveLength(0);
  });
});

describe("reruns — versioned revisions", () => {
  it("synthesis rerun supersedes intersections and stales only the dependent blueprint; blueprint rerun clears it", async () => {
    const { runId } = await execute("full");
    await rerunSynthesis(runId);
    let view = viewOf(runId);
    expect(view.stageInfo[INTERSECTION_KEYS[0]].active.revision).toBe(2);
    expect(view.stageInfo.synthesis.active.revision).toBe(2);
    expect(view.stageInfo.corpus.stale).toBeNull();
    expect(view.stageInfo.blueprint.stale).toMatch(/superseded by r2/);
    expect(rerunNeeds(view)).toMatchObject({ blueprint: true });
    expect(view.lineage.filter(s => s.lineage_state === "superseded")).toHaveLength(7);

    await rerunBlueprint(runId);
    view = viewOf(runId);
    expect(view.stageInfo.blueprint.active.revision).toBe(2);
    expect(view.stageInfo.blueprint.stale).toBeNull();
    expect(rerunNeeds(view).blueprint).toBe(false);
    expect(h.db.Run[0].status).toBe("completed");
  });

  it("a rerun on a historical Run never writes the Run record", async () => {
    const legacy = {
      id: "legacy-1", query_text: "q", execution_mode: "full", output_mode: "Blueprint", blueprint_level: "L2", novelty_dial: "medium", status: "failed",
      corpus: { constraints: ["c"] }, cogito: { claims: [{ id: "C1", tag: "Established", text: "t" }] },
      animus: { boundary_checks: ["b"] }, actus: { recommendations: [{ id: "R1", text: "r", depends_on_claims: ["C1"] }] },
      synthesis: { key_takeaways: ["k"], intersection_matrix: Object.fromEntries(PAIRS.map(p => [p.id, { insight: "i", tension: "t", resolution: "r" }])) },
      blueprint: { goal: "old" }, validation_errors: ["blueprint: steps missing"],
    };
    h.db.Run.push(JSON.parse(JSON.stringify(legacy)));
    expect(rerunNeeds(viewOf("legacy-1")).blueprint).toBe(true); // historical error on the record

    await rerunBlueprint("legacy-1");
    expect(h.db.Run[0]).toEqual(legacy);
    const bp = byKey("legacy-1", "blueprint")[0];
    expect(bp.revision).toBe(1);
    expect(bp.depends_on).toEqual(expect.arrayContaining(["legacy:actus", "legacy:corpus", "legacy:animus", `legacy:${INTERSECTION_KEYS[0]}`]));
    const view = viewOf("legacy-1");
    expect(view.artifacts.blueprint.goal).toBe("Pilot");
    expect(view.lineage.find(s => s.id === "legacy:blueprint").lineage_state).toBe("superseded");
    expect(rerunNeeds(view).blueprint).toBe(false);
  });
});