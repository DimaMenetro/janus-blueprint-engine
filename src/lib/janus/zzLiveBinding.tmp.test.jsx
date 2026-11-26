// TEMPORARY verification script (removed after use): binds the real screens to a read-only copy of the live staged runs.
import { describe, it, expect, vi } from "vitest";
import fs from "fs";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/api/base44Client", async () => ({ base44: (await import("@/lib/janus/testPlatform")).platform.base44 }));

import { composeRunView } from "@/lib/janus/runView";
import { deriveExecutionState } from "@/lib/janus/executionState";
import { deriveQualification } from "@/lib/janus/qualification";
import { rerunImpact } from "@/lib/janus/rerunImpact";
import { resolveTransport } from "@/lib/janus/stageRunner";
import { light } from "@/components/ui/LiquidGlass";
import { ExecutionProvider } from "@/components/janus/ExecutionContext";
import ExecutionStatePanel from "@/components/janus/ExecutionStatePanel";
import StageLineagePanel from "@/components/janus/StageLineagePanel";
import QualificationPanel from "@/components/janus/QualificationPanel";

const live = JSON.parse(fs.readFileSync("/tmp/janus-verify/live.json", "utf8"));
const text = (html) => html.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " | ").replace(/( \| )+/g, " | ").replace(/\s+/g, " ").trim();
const render = (node) => text(renderToStaticMarkup(<ExecutionProvider>{node}</ExecutionProvider>));

describe("live binding", () => {
  for (const [id, { run, stages, attempts }] of Object.entries(live)) {
    it(`run ${id}`, () => {
      const view = composeRunView(run, stages, attempts);
      const state = deriveExecutionState(view);
      const q = deriveQualification(view);
      const report = {
        id, status: run.status, derived: { status: state.status, label: state.label, completed: state.completed, total: state.total, resumable: state.resumable, unresolved: state.unresolved, cancellable: state.cancellable, next: state.next?.key || null, live: state.live?.key || null },
        rows: state.rows.map(r => `${r.key}:${r.state}${r.attempts > 1 ? `(${r.attempts})` : ""}`),
        failures: state.failures,
        lineage: view.lineage.map(s => `${s.stage_key} r${s.revision} ${s.lineage_state}`),
        stale: Object.values(view.stageInfo).filter(i => i.stale).map(i => `${i.key}: ${i.stale}`),
        artifacts: Object.keys(view.artifacts),
        pairs: Object.keys(view.artifacts.synthesis?.intersection_matrix || {}),
        qualification: { state: q.state, blocked: q.blocked || null, action: q.evaluationAction || null, pending: q.pending || null, label: q.release?.label || q.label || null, keys: Object.keys(q) },
      };
      for (const req of [{ targets: ["animus"] }, { targets: ["cogito"], cascade: true }, { targets: ["blueprint"] }]) {
        const i = rerunImpact(view, req);
        report[`impact ${req.targets}${req.cascade ? "+cascade" : ""}`] = { plan: i.plan, supersedes: (i.supersedes || []).length, invalidated: (i.invalidated || []).map(x => x.key || x.stage_key || x), alreadyStale: (i.alreadyStale || []).length, unaffected: (i.unaffected || []).length, qualification: i.qualification, refusals: i.refusals };
      }
      const open = attempts.find(a => a.outcome === "in_flight");
      if (open) {
        const res = open.transport ? resolveTransport(open.stage_key, { state: open.transport.state, result: open.response_text, evidence: open.transport.evidence, message: open.transport.message }) : null;
        report.openAttempt = { stage: open.stage_key, n: open.attempt_number, transport: open.transport?.state || null, recordedOutcomeWouldBe: res?.outcome || "no record", message: res?.message || null };
      }
      report.screens = {
        execution: render(<ExecutionStatePanel state={state} runId={run.id} t={light} onChanged={async () => {}} isAdmin />),
        qualification: render(<QualificationPanel view={view} t={light} isAdmin onChanged={async () => {}} />),
        lineage: render(<StageLineagePanel view={view} t={light} isAdmin onChanged={async () => {}} />),
      };
      fs.writeFileSync(`/tmp/janus-verify/report-${id}.json`, JSON.stringify(report, null, 1));
      expect(view.run.id).toBe(id);
    });
  }
});