// TEMPORARY read-only verification against a copy of the live staged runs. Removed after use.
import { describe, it, expect, vi } from "vitest";
import fs from "fs";

vi.mock("@/api/base44Client", async () => ({ base44: (await import("@/lib/janus/testPlatform")).platform.base44 }));

import { composeRunView } from "@/lib/janus/runView";
import { verifyContinuation, configOf } from "@/lib/janus/stageEngine";
import { compileStage, stageInputs, templateVersionOf } from "@/lib/janus/stageCompiler";
import { fingerprintInputs } from "@/lib/janus/stageModel";
import { generateMarkdown } from "@/components/janus/promptUtils";

const live = JSON.parse(fs.readFileSync("/tmp/janus-verify/live.json", "utf8"));
const leaves = (x, out = []) => { if (typeof x === "string") out.push(x); else if (typeof x === "number") out.push(String(x)); else if (x && typeof x === "object") Object.values(x).forEach(v => leaves(v, out)); return out; };

describe("live (read-only)", () => {
  it("report", async () => {
    const report = {};
    for (const [id, { run, stages, attempts }] of Object.entries(live)) {
      const view = composeRunView(run, stages, attempts);
      const byId = Object.fromEntries(view.lineage.map(s => [s.id, s]));
      const identity = [];
      for (const s of stages) {
        const deps = (s.depends_on || []).map(d => byId[d]);
        let same = null;
        try {
          const compiled = compileStage({ stageKey: s.stage_key, config: configOf(run), inputs: Object.fromEntries(deps.map(d => [d.stage_key, d.output])) });
          same = (await fingerprintInputs({ stageKey: s.stage_key, templateVersion: compiled.templateVersion, dependsOn: s.depends_on || [], prompt: compiled.prompt })) === s.input_fingerprint;
        } catch (e) { same = `error: ${e.message}`; }
        identity.push(`${s.stage_key}: recorded ${s.prompt_template_version} | now ${templateVersionOf(s.stage_key)} | same operation: ${same}`);
      }
      const r = { status: run.status, identity };
      const actus = view.stageInfo.actus?.latest;
      if (actus?.status === "running") r.actusContinuation = await verifyContinuation(view, actus).then(v => ({ ok: v.ok, reasons: v.reasons || null }));
      const bp = view.artifacts.blueprint;
      if (bp) {
        const inputs = Object.fromEntries(stageInputs("blueprint").filter(k => view.stageInfo[k]?.active).map(k => [k, view.stageInfo[k].active.output]));
        const prompt = compileStage({ stageKey: "blueprint", config: configOf(run), inputs }).prompt;
        const md = generateMarkdown(view.artifacts, run.execution_mode);
        const all = leaves(bp);
        r.blueprint = {
          promptChars: prompt.length, contextTruncated: prompt.includes("[TRUNCATED"), queryChars: (run.query_text || "").length,
          steps: (bp.steps || []).map(s => `${s.step}. ${s.title} | substeps ${(s.substeps || []).length} | acceptance ${(s.acceptance_tests || []).length} | derived_from ${JSON.stringify(s.derived_from || [])} | ${s.confidence}`),
          alternatives: (bp.alternative_approaches || []).map(a => a.name),
          assumptions: (bp.assumptions || []).length, success: (bp.success_criteria || []).length, risks: (bp.risk_register || []).length,
          recommendations: (view.artifacts.actus?.recommendations || []).map(x => x.id),
          recommendationsCited: (view.artifacts.actus?.recommendations || []).map(x => x.id).filter(x => (bp.steps || []).some(s => (s.derived_from || []).includes(x))),
          markdownLeaves: { total: all.length, lost: all.filter(l => !md.includes(l)).length },
          blueprintChars: JSON.stringify(bp).length,
          upstreamChars: Object.fromEntries(["corpus", "cogito", "animus", "actus", "synthesis"].map(k => [k, JSON.stringify(view.artifacts[k] || {}).length])),
        };
      }
      report[id] = r;
    }
    fs.writeFileSync("/tmp/janus-verify/report2.json", JSON.stringify(report, null, 1));
    expect(Object.keys(report)).toHaveLength(2);
  });
});