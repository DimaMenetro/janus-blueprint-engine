// Phase 8 — Synthesis realignment (plan §5.3, §14, Phase 8 exit tests). Additions only: no existing test is edited.
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/api/base44Client", async () => ({ base44: (await import("@/lib/janus/testPlatform")).platform.base44 }));

import { platform as h } from "@/lib/janus/testPlatform";
import { executeJanus, resumeJanus, previewRerun, rerunStages, rerunSynthesis, rerunBlueprint } from "@/lib/janus/browserAdapter";
import { composeRunView } from "@/lib/janus/runView";
import { stagePlan, deriveExecutionState } from "@/lib/janus/executionState";
import { requiredInputs } from "@/lib/janus/stageCompiler";
import { PAIRS, PATTERNS } from "@/lib/janus/protocolRegistry";
import { INTERSECTION_KEYS, intersectionKey } from "@/lib/janus/stageModel";
import SynthesisStructure from "@/components/janus/tabs/SynthesisStructure";

const DOMAINS4 = ["corpus", "cogito", "animus", "actus"];
const params = (mode) => ({ queryText: "How should a city pilot autonomous transit?", executionMode: mode, outputMode: "Blueprint", blueprintLevel: "L2", noveltyDial: "medium", refreshEnabled: false });
const snapshot = (x) => JSON.parse(JSON.stringify(x));
const everything = () => snapshot({ runs: h.db.Run, stages: h.db.RunStage, attempts: h.db.RunAttempt });
const viewOf = (runId) => composeRunView(h.db.Run.find(r => r.id === runId), h.db.RunStage.filter(s => s.run_id === runId), h.db.RunAttempt.filter(a => a.run_id === runId));
const stagesOf = (key) => h.db.RunStage.filter(s => s.stage_key === key);
const calls = (key) => h.llm.stages.filter(s => s === key).length;
const promptOf = (key) => h.llm.prompts[h.llm.stages.lastIndexOf(key)];
const structure = (runId) => renderToStaticMarkup(<SynthesisStructure view={viewOf(runId)} />).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

beforeEach(() => h.reset());

describe("Synthesis is entered after the four primary domains", () => {
  it("Full plan: refresh, the four domains, the six pairs, the patterns, then the Blueprint; partial profiles have no Synthesis", async () => {
    expect(stagePlan("full")).toEqual(["refresh", ...DOMAINS4, ...INTERSECTION_KEYS, "synthesis", "blueprint"]);
    expect(stagePlan("standard")).toEqual([...DOMAINS4, "blueprint"]);
    expect(stagePlan("quick")).toEqual(["corpus", "cogito", "blueprint"]);
    const { runId, status } = await executeJanus(params("full"));
    expect(status).toBe("completed");
    expect(h.llm.stages).toEqual([...stagePlan("full"), "qualification"]); // the real call order
    expect(INTERSECTION_KEYS).toHaveLength(6);
    const view = viewOf(runId);
    INTERSECTION_KEYS.forEach(k => expect(view.stageInfo[k].active.output).toEqual(expect.objectContaining({ insight: expect.any(String), tension: expect.any(String), resolution: expect.any(String) })));
  });

  it("a run begun under the earlier order is resumed without regenerating anything: only what is missing runs", async () => {
    const run = await h.base44.entities.Run.create({ query_text: "q", execution_mode: "full", output_mode: "Blueprint", status: "running", storage_model: "staged_v1", active_attempt_id: "" });
    const pair = (id) => ({ insight: `${id} i`, tension: `${id} t`, resolution: `${id} r` });
    for (const [key, output] of [["refresh", h.out.refresh], ["corpus", h.out.corpus], ["cogito", h.out.cogito], ["intersection:corpus_x_cogito", pair("a")],
      ["animus", h.out.animus], ["intersection:corpus_x_animus", pair("b")], ["intersection:cogito_x_animus", pair("c")]]) {
      await h.base44.entities.RunStage.create({ run_id: run.id, stage_key: key, revision: 1, status: "succeeded", depends_on: [], output });
    }
    const result = await resumeJanus(run.id);
    expect(result.status).toBe("completed");
    expect(h.llm.stages).toEqual(["actus", "intersection:corpus_x_actus", "intersection:cogito_x_actus", "intersection:animus_x_actus", "synthesis", "blueprint", "qualification"]);
    expect(stagesOf("intersection:corpus_x_cogito")).toHaveLength(1);
    expect(viewOf(run.id).artifacts.synthesis.intersection_matrix.corpus_x_cogito).toEqual(pair("a"));
  });
});

describe("6/6 pairs are required, and there is no premature Blueprint", () => {
  it("the compiler states the rule: patterns need all six pairs; a Full Blueprint needs the Synthesis; partial profiles do not", () => {
    expect(requiredInputs("synthesis", "full")).toEqual(INTERSECTION_KEYS);
    expect(requiredInputs("blueprint", "full")).toEqual(["synthesis"]);
    expect(requiredInputs("blueprint", "standard")).toEqual([]);
    expect(requiredInputs("blueprint", "quick")).toEqual([]);
    expect(requiredInputs(INTERSECTION_KEYS[0], "full")).toEqual(PAIRS[0].domains);
  });

  it("with one pair failed, the patterns are not produced and the Blueprint is not started; the five valid pairs are kept", async () => {
    const lost = PAIRS[2];
    h.llm.invalidOn = lost.id;
    const { runId, status } = await executeJanus(params("full"));
    expect(status).toBe("partial");
    expect(calls(intersectionKey(lost.id))).toBe(3); // its own bounded attempts
    expect(calls("synthesis")).toBe(0);
    expect(calls("blueprint")).toBe(0);
    expect(calls("qualification")).toBe(0);
    const view = viewOf(runId);
    expect(Object.keys(view.artifacts.synthesis.intersection_matrix).sort()).toEqual(PAIRS.filter(p => p !== lost).map(p => p.id).sort());
    expect(PATTERNS.some(p => view.artifacts.synthesis[p.id])).toBe(false);
    expect(view.artifacts.blueprint).toBeUndefined();
    expect(h.db.Run[0]).toMatchObject({ status: "partial", released_blueprint_stage_id: "" });
    expect(h.db.Run[0].completion_manifest.complete).toBe(false);
    expect(structure(runId)).toMatch(/Six pairwise intersections 5 of 6/);
    expect(structure(runId)).toMatch(/Four formal emergent patterns 0 of 4/);

    // Neither can be forced past the rule: both re-runs are refused, and nothing is written.
    h.llm.invalidOn = null;
    const before = everything();
    expect((await previewRerun(runId, { targets: ["blueprint"] })).refusals).toEqual([expect.stringMatching(/^blueprint needs synthesis, which has no valid revision$/)]);
    expect((await previewRerun(runId, { targets: ["synthesis"] })).refusals).toEqual([expect.stringMatching(new RegExp(`^synthesis needs ${intersectionKey(lost.id)}, which has no valid revision$`))]);
    await expect(rerunStages(runId, { targets: ["blueprint"] })).rejects.toThrow(/blueprint needs synthesis/);
    await expect(rerunBlueprint(runId)).rejects.toThrow(/blueprint needs synthesis/);
    expect(everything()).toEqual(before);

    // The explicit path: the Synthesis re-run, then the Blueprint.
    await rerunSynthesis(runId);
    expect(viewOf(runId).stageInfo.synthesis.active).toMatchObject({ revision: 1, status: "succeeded" });
    expect(viewOf(runId).stageInfo.synthesis.active.depends_on).toHaveLength(6);
    await rerunBlueprint(runId);
    const after = viewOf(runId);
    expect(after.stageInfo.blueprint.active.depends_on).toContain(after.stageInfo.synthesis.active.id);
    expect(h.db.Run[0]).toMatchObject({ status: "completed", qualification_state: "qualified" });
    expect(stagesOf(intersectionKey(lost.id)).map(s => [s.revision, s.status])).toEqual([[1, "failed"], [2, "succeeded"]]); // the failed revision is kept
  });

  it("with the patterns stage failed, the Blueprint is not started either", async () => {
    h.llm.failOn = "synthesis";
    const { runId, status } = await executeJanus(params("full"));
    expect(status).toBe("partial");
    expect(calls("synthesis")).toBe(3);
    expect(calls("blueprint")).toBe(0);
    expect(Object.keys(viewOf(runId).artifacts.synthesis.intersection_matrix)).toHaveLength(6); // the six pairs stand
    expect(deriveExecutionState(viewOf(runId)).rows.find(r => r.key === "blueprint").state).toBe("pending");
  });

  it("Standard and Quick are unchanged: their Blueprint has no Synthesis to wait for", async () => {
    for (const mode of ["standard", "quick"]) {
      h.reset();
      const { status } = await executeJanus(params(mode));
      expect(status).toBe("completed");
      expect(h.llm.stages).toEqual([...stagePlan(mode), "qualification"]);
    }
  });
});

describe("the six pairs and the four patterns are distinct artifacts, read in full", () => {
  it("a pair reads both of its domains in full, and the patterns read all six pairs in full: nothing is cut", async () => {
    const tail = "END-OF-CORPUS-OUTPUT";
    h.llm.override.corpus = { ...snapshot(h.out.corpus), feasibility_notes: ["x".repeat(30000), tail] };
    const long = { insight: `${"y".repeat(25000)} END-OF-PAIR-INSIGHT`, tension: "t", resolution: "r" };
    h.llm.override[PAIRS[5].id] = long;
    const { status } = await executeJanus(params("full"));
    expect(status).toBe("completed");
    PAIRS.filter(p => p.domains.includes("corpus")).forEach(p => {
      expect(promptOf(intersectionKey(p.id))).toContain(tail);
      expect(promptOf(intersectionKey(p.id))).not.toContain("[TRUNCATED");
    });
    expect(promptOf("synthesis")).toContain("END-OF-PAIR-INSIGHT");
    expect(promptOf("synthesis")).not.toContain("[TRUNCATED");
    expect(promptOf("synthesis")).not.toContain("(not computed)");
  });

  it("the four formal patterns are added beside the six pairs and never overwrite them", async () => {
    // A model that ignores the contract and returns its own intersection matrix inside the patterns output.
    h.llm.override.synthesis = { ...snapshot(h.out.synthesis), intersection_matrix: { [PAIRS[0].id]: { insight: "OVERWRITTEN", tension: "x", resolution: "x" } } };
    const { runId, status } = await executeJanus(params("full"));
    expect(status).toBe("completed");
    const view = viewOf(runId);
    const matrix = view.artifacts.synthesis.intersection_matrix;
    expect(Object.keys(matrix)).toEqual(PAIRS.map(p => p.id));
    PAIRS.forEach(p => expect(matrix[p.id]).toEqual(view.stageInfo[intersectionKey(p.id)].active.output));
    expect(matrix[PAIRS[0].id].insight).not.toBe("OVERWRITTEN");
    PATTERNS.forEach(p => expect(Object.keys(view.artifacts.synthesis[p.id]).sort()).toEqual([...p.fields].sort()));
    // Seven durable artifacts: six pair revisions and one patterns revision that read exactly those six.
    INTERSECTION_KEYS.forEach(k => expect(stagesOf(k).map(s => [s.revision, s.status])).toEqual([[1, "succeeded"]]));
    expect([...view.stageInfo.synthesis.active.depends_on].sort()).toEqual(INTERSECTION_KEYS.map(k => view.stageInfo[k].active.id).sort());
    const shown = structure(runId);
    expect(shown).toMatch(/Six pairwise intersections 6 of 6/);
    expect(shown).toMatch(/Four formal emergent patterns 4 of 4/);
    expect(shown).toContain("Provenance");
    expect(shown).toMatch(/Corpus × Cogito[^.]*reads Corpus r1, Cogito r1/);
  });
});