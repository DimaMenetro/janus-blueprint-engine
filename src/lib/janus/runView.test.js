import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import process from "process";
import { PAIRS } from "@/lib/janus/protocolRegistry";
import { INTERSECTION_KEYS, intersectionKey } from "@/lib/janus/stageModel";
import { composeRunView, rerunNeeds } from "@/lib/janus/runView";
import { reconstructFullJson, reconstructFullMarkdown } from "@/components/janus/exportUtils";

const clone = (x) => JSON.parse(JSON.stringify(x));
const matrix = Object.fromEntries(PAIRS.map(p => [p.id, { insight: `${p.id} insight`, tension: "t", resolution: "r" }]));

// Shapes sampled from the live historical corpus (2026-10-30): retired subdomain keys, a pattern alias,
// null/empty domain fields and a non-canonical intersection key.
const legacyRun = {
  id: "run-legacy", query_text: "Design a resilient grid", execution_mode: "full", output_mode: "Blueprint", status: "completed",
  refresh: null,
  corpus: { constraints: ["c1"], subdomains: { theoretical_physics: { perspective: "p" }, physics: { perspective: "p2" } } },
  cogito: { claims: [{ id: "C1", tag: "Probable", text: "claim" }] },
  animus: { boundary_checks: ["b1"] },
  actus: { recommendations: [{ id: "R1", text: "rec", depends_on_claims: ["C1"] }] },
  synthesis: { key_takeaways: ["k1"], alignment_engine: { empathy_strategy: "e" }, intersection_matrix: { ...matrix, retired_pair: { insight: "old" } } },
  blueprint: {},
  validation_errors: [],
};
const stagedRun = { id: "run-staged", query_text: "q", execution_mode: "full", output_mode: "Blueprint", status: "completed", storage_model: "staged_v1", protocol_version: "2.0" };
const st = (key, revision, extra = {}) => ({ id: `${key}#${revision}`, run_id: stagedRun.id, stage_key: key, revision, status: "succeeded", output: { note: `${key} r${revision}` }, depends_on: [], ...extra });
const core = () => ["corpus", "cogito", "animus", "actus"].map(k => st(k, 1));
const ix = (rev, deps) => PAIRS.map(p => st(intersectionKey(p.id), rev, { output: { insight: `${p.id} r${rev}` }, depends_on: deps || p.domains.map(d => `${d}#1`) }));
const ids = (rev) => INTERSECTION_KEYS.map(k => `${k}#${rev}`);

describe("legacy adapter — historical Runs open unchanged", () => {
  it("reconstructs every present artifact losslessly and never mutates the record", () => {
    const before = clone(legacyRun);
    const view = composeRunView(legacyRun, []);
    expect(view.storage).toBe("legacy_monolithic");
    expect(legacyRun).toEqual(before);
    ["corpus", "cogito", "animus", "actus", "synthesis"].forEach(k => expect(view.artifacts[k]).toEqual(legacyRun[k]));
    expect(view.artifacts.blueprint).toBeUndefined();
    expect(view.artifacts.refresh).toBeUndefined();
    expect(view.lineage).toHaveLength(11); // 4 domains + 6 intersections + synthesis
    expect(view.lineage.every(s => s.legacy && s.revision === 0 && s.id.startsWith("legacy:") && s.lineage_state === "active")).toBe(true);
  });

  it("infers historical dependencies conservatively and labels them as inferred", () => {
    const bp = composeRunView({ ...legacyRun, blueprint: { goal: "g" } }, []).stageInfo.blueprint.active;
    expect(bp.dependency_basis).toBe("inferred");
    expect(bp.depends_on).toEqual(expect.arrayContaining(["legacy:corpus", "legacy:synthesis", `legacy:${INTERSECTION_KEYS[0]}`]));
  });
});

describe("durable lineage — staged runs", () => {
  it("composes synthesis from the six intersection stages plus the patterns stage", () => {
    const view = composeRunView(stagedRun, [...core(), ...ix(1), st("synthesis", 1, { output: { key_takeaways: ["k"] }, depends_on: ids(1) })]);
    expect(view.storage).toBe("staged_v1");
    expect(view.artifacts.synthesis.key_takeaways).toEqual(["k"]);
    expect(Object.keys(view.artifacts.synthesis.intersection_matrix).sort()).toEqual(PAIRS.map(p => p.id).sort());
  });

  it("active = latest succeeded revision; a failed newer revision never erases it", () => {
    const view = composeRunView(stagedRun, [...core(), st("blueprint", 1, { depends_on: ["corpus#1"] }), st("blueprint", 2, { status: "failed", output: undefined, error_class: "provider_error" })]);
    expect(view.artifacts.blueprint).toEqual({ note: "blueprint r1" });
    expect(view.stageInfo.blueprint.latest.status).toBe("failed");
    expect(view.lineage.filter(s => s.stage_key === "blueprint").map(s => s.lineage_state)).toEqual(["active", "failed"]);
    expect(rerunNeeds(view).blueprint).toBe(true);
  });

  it("staleness follows exact dependency revisions, transitively", () => {
    const { stageInfo, lineage } = composeRunView(stagedRun, [
      ...core(), ...ix(1), ...ix(2),
      st("synthesis", 1, { depends_on: ids(1) }), st("synthesis", 2, { depends_on: ids(2) }),
      st("blueprint", 1, { depends_on: [ids(1)[0], "corpus#1"] }),
      st("blueprint:criteria", 1, { depends_on: ["blueprint#1"] }),
    ]);
    expect(stageInfo.corpus.stale).toBeNull();
    expect(stageInfo.synthesis.stale).toBeNull();
    expect(stageInfo.blueprint.stale).toBe(`${INTERSECTION_KEYS[0]} r1 superseded by r2`);
    expect(stageInfo["blueprint:criteria"].stale).toMatch(/^upstream blueprint is stale/);
    expect(lineage.filter(s => s.lineage_state === "superseded")).toHaveLength(7);
  });

  it("legacy overlay: a real revision supersedes the historical artifact and stales its dependents", () => {
    const stages = [
      ...ix(1, ["legacy:corpus", "legacy:cogito"]).map(s => ({ ...s, run_id: legacyRun.id })),
      { ...st("synthesis", 1, { depends_on: ids(1), output: { key_takeaways: ["new"] } }), run_id: legacyRun.id },
    ];
    const view = composeRunView({ ...legacyRun, blueprint: { goal: "g" } }, stages);
    expect(view.artifacts.synthesis.key_takeaways).toEqual(["new"]);
    expect(Object.keys(view.artifacts.synthesis.intersection_matrix)).toHaveLength(6);
    expect(view.stageInfo.blueprint.active.legacy).toBe(true);
    expect(view.stageInfo.blueprint.stale).toMatch(/legacy superseded by r1/);
    expect(rerunNeeds(view)).toMatchObject({ blueprint: true });
  });
});

describe("export works for both storage models", () => {
  it("historical Run", () => {
    const view = composeRunView(legacyRun, []);
    const json = JSON.parse(reconstructFullJson(view));
    expect(json._meta.storage_model).toBe("legacy_monolithic");
    expect(json._meta.run_protocol_version).toMatch(/unrecorded/);
    expect(json.corpus).toEqual(legacyRun.corpus);
    expect(json.synthesis).toEqual(legacyRun.synthesis);
    expect(json._lineage).toHaveLength(11);
    expect(json._lineage.every(s => s.dependency_basis === "inferred")).toBe(true);
    expect(reconstructFullMarkdown(view)).toContain("storage: legacy_monolithic");
  });

  it("staged Run carries exact lineage provenance", () => {
    const stages = [...core(), st("blueprint", 1, { depends_on: ["corpus#1"], input_fingerprint: "sha256:abc", output: { goal: "g" } })];
    const json = JSON.parse(reconstructFullJson(composeRunView(stagedRun, stages)));
    expect(json._meta.storage_model).toBe("staged_v1");
    expect(json.blueprint).toEqual({ goal: "g" });
    expect(json._lineage.find(s => s.stage_key === "blueprint")).toMatchObject({ revision: 1, depends_on: ["corpus#1"], input_fingerprint: "sha256:abc", lineage_state: "active", dependency_basis: "recorded" });
  });
});

describe("one durable truth", () => {
  it("frontend surfaces never read cognition straight off the Run record", () => {
    const root = path.resolve(process.cwd(), "src");
    const ALLOW = ["components/janus/RunCard.jsx"]; // unmounted historical card (no importers); Phase 12 decides its fate
    const hits = [];
    const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) return walk(p);
      const rel = path.relative(root, p);
      if (!/\.(jsx?|tsx?)$/.test(e.name) || /\.test\./.test(e.name) || ALLOW.includes(rel)) return;
      if (/\brun\.(refresh|corpus|cogito|animus|actus|synthesis|blueprint)\b/.test(fs.readFileSync(p, "utf8"))) hits.push(rel);
    });
    ["pages", "components"].forEach(d => walk(path.join(root, d)));
    expect(hits).toEqual([]);
  });
});