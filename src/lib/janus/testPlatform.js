/**
 * Test-only platform double (imported by *.test.js): an in-memory entity store and a deterministic
 * stand-in for the model-call backend function. No network, no credits.
 *
 * THE STORE BEHAVES AS THE REAL ONE WAS MEASURED TO (2026-11-25 and 2026-11-27, with temporary records that were
 * deleted in the same call). Every rule below is a measurement, not an assumption; a behaviour that was not
 * measured is not imitated.
 *
 *  WRITES THAT APPLY THE ENTITY SCHEMA — create(data) and update(id, patch):
 *   - a key the schema does not declare is dropped, at the top level and at every depth of an object the schema
 *     declares with properties, including the items of a declared list (this is how `provenance.method` and
 *     `provenance.refines` were lost in production before they were declared);
 *   - a declared property that was not written is stored as its declared default, as `[]` for a list, and as
 *     `null` otherwise — at the top level and inside declared objects. It is present, not absent;
 *   - an object the schema declares without properties (a stage output, the allocation, the usage) is kept exactly
 *     as written;
 *   - update touches only the top-level keys of the patch, and REPLACES a declared object as a whole: its other
 *     properties do not survive, they become null;
 *   - enumerations are not enforced: a value outside the declared list is stored as written.
 *  THE CONDITIONAL WRITE DOES NOT APPLY THE SCHEMA — updateMany(query, { $set }):
 *   - it sets exactly the given paths (a dotted path reaches inside an object) on the records matching `query`,
 *     keeps undeclared keys, fills nothing, and returns { success, updated, has_more }; of concurrent conditional
 *     writes on one record, exactly one gets updated: 1.
 *  QUERIES:
 *   - an equality condition on "" does not match a field that was never set; a condition on null does;
 *     { $in: [..., null] } does.
 *  TIMESTAMPS:
 *   - created_date and updated_date are written by the store. A READ returns them as UTC with six fractional digits
 *     and NO zone designator ("2026-11-27T02:32:49.133000"); the response to the write that produced them carries a
 *     "Z". Read as local time they are wrong by the reader's UTC offset (storeTime.js reads them);
 *   - a date-time the app writes is returned exactly as written.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { subdomainIds, PAIRS, PATTERNS, isAuthorizedModel } from "@/lib/janus/protocolRegistry";
import { QUALITY_CRITERIA } from "@/lib/janus/lifecycleContract";
import { assembleBlueprint } from "@/lib/janus/blueprintPipeline";

const clone = (x) => JSON.parse(JSON.stringify(x));
// The real schema files, found from this file's own location (src/lib/janus → the app root), not from the working
// directory, so this module needs no Node global and reads the same files wherever the tests are started from.
// The double applies them as the store does, so a field the engine relies on and the schema does not declare is
// lost here exactly as it would be in production, and the engine reads back exactly what production returns.
const ENTITY_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../base44/entities");
const SCHEMAS = Object.fromEntries(["Run", "RunStage", "RunAttempt"].map(n => [n, JSON.parse(fs.readFileSync(path.join(ENTITY_DIR, `${n}.jsonc`), "utf8"))]));
/** What the store holds for a declared property that was not written. */
const unwritten = (schema) => (schema.default !== undefined ? clone(schema.default) : schema.type === "array" ? [] : null);
/** A written value as a schema-applying write stores it. */
const conform = (schema, v) => (Array.isArray(v) ? (schema?.items ? v.map(x => conform(schema.items, x)) : v)
  : v && typeof v === "object" && schema?.properties ? conformObject(schema.properties, v)
  : v);
const conformObject = (properties, data) => Object.fromEntries(Object.entries(properties).map(([k, s]) => [k, k in data ? conform(s, data[k]) : unwritten(s)]));
/** One instant as a read returns it (no zone designator) and as the write that produced it answers (with "Z"). */
const asRead = (iso) => iso.replace("Z", "000");
const asWritten = (iso) => iso.replace("Z", "000Z");
/** The conditional write sets a path as given; a dotted path reaches inside an object. Nothing is conformed. */
const setPath = (rec, dotted, value) => {
  const keys = dotted.split(".");
  let at = rec;
  keys.slice(0, -1).forEach(k => { if (at[k] == null || typeof at[k] !== "object") at[k] = {}; at = at[k]; });
  at[keys[keys.length - 1]] = value;
};
const matches = (rec, query) => Object.entries(query).every(([k, v]) => (v && typeof v === "object" && v.$in ? v.$in.includes(rec[k] ?? null)
  : v === null ? rec[k] == null : rec[k] === v));

const subs = (d) => Object.fromEntries(subdomainIds(d).map(id => [id, { perspective: `${id} view`, key_findings: ["f"] }]));
const step = (n, title, derived_from) => ({ step: n, title, purpose: `Purpose of ${title}`, phase: "P1", fulfils: n === 1 ? ["Q1"] : [], instructions: "Do it", inputs: ["i"], outputs: ["o"], validation: "Check it",
  depends_on_steps: n > 1 ? [1] : [], substeps: [{ substep: `${n}a`, details: "d" }], acceptance_tests: ["t"], derived_from, confidence: "Contested" });
// A Blueprint that cites only what its prompt actually showed it (so its traces resolve in every mode).
// The final refiner: it returns the assembled draft word for word (the same pipeline fixtures the engine assembles),
// restates the goal, and — where the pipeline has a self-critique (the modes with Actus) — repairs finding F1 by
// stating step 1's interface. Both changes are declared, as the transactional rule requires.
/** A derived data block of a compiled prompt, read back as the JSON the compiler put in it. */
const blockOf = (prompt, label) => {
  const m = prompt.match(new RegExp(`label=${label}>>>\\n([\\s\\S]*?)\\n<<<END_JANUS_DATA>>>`));
  return m ? JSON.parse(m[1].split("\n").map(l => l.replace(/^│ ?/, "")).join("\n")) : null;
};
// A substantive refinement: the evaluated Blueprint returned word for word, with one declared addition answering
// every deficiency it was given.
const refinedFrom = (prompt) => {
  const base = blockOf(prompt, "assembled_draft"), found = blockOf(prompt, "critique").findings;
  return { ...base, success_criteria: [...base.success_criteria, `Refined in cycle ${prompt.match(/cycle (\d+) of/)[1]}`],
    refinement: { dispositions: found.map(f => ({ finding: f.id, action: "resolved", change: "Added the missing success criterion" })),
      changes: found.map(f => ({ path: "success_criteria", finding: f.id, what: "Added a criterion" })) } };
};
const blueprintFor = (prompt = "") => {
  if (prompt.includes("SUBSTANTIVE REFINEMENT — cycle")) return refinedFrom(prompt);
  const draft = assembleBlueprint(Object.fromEntries(["brief", "candidates", "selection", "skeleton", "expansion", "criteria"].map(k => [`blueprint:${k}`, PIPELINE[`blueprint:${k}`](prompt)])));
  const critiqued = withActus(prompt);
  return {
    ...draft, goal: "Pilot",
    steps: draft.steps.map(s => (s.step === 1 && critiqued ? { ...s, interfaces: ["Operator console API"] } : s)),
    refinement: {
      dispositions: [{ finding: "F1", action: "resolved", change: "Step 1 now states its interface" }],
      changes: [{ path: "goal", what: "Restated as the pilot", reason: "The pilot is the deliverable" },
        ...(critiqued ? [{ path: "steps[1].interfaces", finding: "F1", what: "Added the operator console API" }] : [])],
    },
  };
};
// The Blueprint pipeline's sub-artifacts (Phase 9). Like the Blueprint above, the plan cites only what its prompt showed.
const withActus = (prompt) => prompt.includes("ACTUS: Key Recommendations");
const withPatterns = (prompt) => prompt.includes("[pattern:");
function dispositions(prompt = "") {
  return {
    requirement_dispositions: [{ requirement: "Q1", disposition: "implemented", where: [1], reasoning: "Step 1 scopes the pilot" }],
    ...(withActus(prompt) ? { recommendation_dispositions: [{ recommendation: "R1", disposition: "implemented", where: [2], reasoning: "Step 2 is the pilot" }] } : {}),
  };
}
const planStep = (n, title, derived_from) => ({ step: n, title, purpose: `Purpose of ${title}`, phase: "P1", depends_on_steps: n > 1 ? [1] : [], fulfils: n === 1 ? ["Q1"] : [], derived_from, confidence: "Contested" });
const planFor = (prompt) => [
  planStep(1, "Scope", ["C1", "corpus:1"]),
  ...(withActus(prompt) ? [planStep(2, "Pilot", ["R1", "animus:1"])] : []),
  ...(withPatterns(prompt) ? [planStep(3, "Scale", [PAIRS[0].id, `pattern:${PATTERNS[0].id}`])] : []),
];
const candidate = (n) => ({ id: `K${n}`, name: `Approach ${n}`, thesis: `Thesis ${n}`, mechanism: `Mechanism ${n}: how approach ${n} works`, differs_by: `Axis ${n}`,
  objective_fit: `Reaches the full objective by route ${n}`, epistemic_status: "Contested", strongest_case: `Case for ${n}`, weakest_point: `Weak point of ${n}` });
const PIPELINE = {
  "blueprint:brief": () => ({ objective: "A city-wide autonomous transit service", pathway: "Pilot one district, then scale on evidence",
    requirements: [{ id: "Q1", text: "Run a bounded pilot before scaling", kind: "capability", priority: "must", basis: "the query" }],
    ambition_guard: ["A feasibility study with no pilot"] }),
  "blueprint:candidates": () => ({ problem_frame: "Trust has to be earned faster than the service scales", candidates: [1, 2, 3, 4].map(candidate) }),
  "blueprint:selection": () => ({
    comparison: [1, 2, 3, 4].map(n => ({ candidate: `K${n}`, assessment: { corpus: "c", cogito: "g", animus: "a", actus: "t", synthesis: "s", operator_requirements: "Meets Q1" },
      strongest_attack: `Attack on ${n}`, survives: n === 1 ? "yes" : "weakened", conclusion: `Finding on ${n}` })),
    decision: { mode: "selected", chosen: ["K1"], name: "Approach 1", architecture: "The architecture of approach 1", rationale: "It survives the attack",
      attack_on_favorite: "Its pilot may not generalise", residual_weaknesses: ["Generalisation"] },
    rejected: [2, 3, 4].map(n => ({ candidate: `K${n}`, reason: `Reason against ${n}` })),
  }),
  "blueprint:skeleton": (prompt) => ({ goal: "A city-wide autonomous transit service, reached through a district pilot", assumptions: ["a"],
    phases: [{ id: "P1", name: "Pilot" }], steps: planFor(prompt), ...dispositions(prompt) }),
  "blueprint:expansion": (prompt) => ({ steps: planFor(prompt).map(s => ({ step: s.step, instructions: "Do it", inputs: ["i"], outputs: ["o"], validation: "Check it",
    substeps: [{ substep: `${s.step}a`, details: "d" }], acceptance_tests: ["t"] })) }),
  "blueprint:criteria": () => ({ success_criteria: ["s"], acceptance: [{ id: "A1", criterion: "The pilot ran", verifies: ["Q1"], method: "Inspection", evidence: "Logs" }],
    outcome_interpretation: { positive: "Scale", null: "Hold", contradictory: "Re-examine the frame", inconclusive: "Extend the pilot" },
    risk_register: [{ risk: "r", impact: "med", mitigation: "m" }] }),
  "blueprint:critique": () => ({ findings: [{ id: "F1", severity: "minor", category: "implementation_gap", where: "step 1", problem: "Its interface is not stated", required_change: "State the interface" }],
    objective_check: { preserved: "yes", lost: [] }, input_restatement: [], genuine_additions: ["The staged trust mechanism"], summary: "Sound with one gap" }),
};
const OUT = {
  refresh: { mode: "tier0", attempted: false, limitations: "Training data only." },
  corpus: { constraints: ["Grid latency under 200 ms"], feasibility_notes: ["Feasible with edge nodes"], subdomains: subs("corpus") },
  cogito: { claims: [{ id: "C1", tag: "Contested", text: "Edge inference cuts latency", depends_on: [], why_believed: "b", falsifiable_by: "f", verify_later: "v" }], reasoning_map: ["r1"], subdomains: subs("cogito") },
  animus: { boundary_checks: ["No covert data capture"], disallowed_moves: [], safety_notes: [], ethical_stance: "Consent first", subdomains: subs("animus") },
  actus: { recommendations: [{ id: "R1", text: "Pilot one district", depends_on_claims: ["C1"], inherited_confidence: "Contested", probability: "medium" }], subdomains: subs("actus") },
  synthesis: { key_takeaways: ["k"], constraint_collisions: [], limitation_foreground: "l",
    ...Object.fromEntries(PATTERNS.map(p => [p.id, Object.fromEntries(p.fields.map(f => [f, f === "probability_wave" ? ["w"] : "v"]))])) },
};
// The independent evaluator: passes every critique criterion unless a test seeds a verdict.
const evaluation = () => ({
  verdicts: Object.fromEntries(QUALITY_CRITERIA.filter(c => c.method === "critique" && c.hard)
    .map(c => [c.id, { verdict: llm.verdicts[c.id] || "pass", reason: `${c.id} evidence` }])),
  strongest_objection: "o",
  intellectual_surplus: llm.findings.intellectual_surplus ?? ["A staged trust mechanism the query did not contain"], input_restatement: [],
  objective_preservation: llm.findings.objective_preservation ?? { preserved: "yes", lost: [] }, substantive_errors: llm.findings.substantive_errors ?? [],
});

// Parsed but structurally invalid: what a model returns when it ignores the stage's output contract.
const INVALID = {
  corpus: { constraints: "not an array" },
  cogito: { claims: [{ id: "C1", tag: "Certain", text: "a claim tagged outside the confidence taxonomy" }] },
  blueprint: { goal: "Pilot", steps: [{ title: "a step with no number and no instructions" }] },
  qualification: { verdicts: { elegance: { verdict: "pass", reason: "only one criterion answered" } } },
};
const OPERATOR = { id: "user-operator", role: "admin" };
const FAIL_MESSAGE = "provider returned 500";

const db = { Run: [], RunStage: [], RunAttempt: [] };
const llm = { failOn: null, invalidOn: null, failTimes: {}, invalidTimes: {}, failMessage: FAIL_MESSAGE, transport: {}, pending: [],
  override: {}, sequence: {}, verdicts: {}, findings: {}, calls: [], prompts: [], stages: [], gate: null, effective: {}, finish: {}, raw: {}, models: [] };
const session = { user: { ...OPERATOR } };
let n = 0;

// The store's own clock for the double: one second per record created, so creation order is the order of dates.
const stamp = () => new Date(1767225600000 + n * 1000).toISOString();
const answered = (rec, at) => ({ ...clone(rec), ...(at.created ? { created_date: asWritten(at.created) } : {}), updated_date: asWritten(at.updated) });
const entity = (name) => {
  const properties = SCHEMAS[name].properties;
  return {
    // Applies the schema: undeclared keys dropped, unwritten declared properties stored as default / [] / null.
    create: async (data) => {
      n += 1;
      const at = stamp();
      const rec = { ...conformObject(properties, clone(data)), id: `${name}-${n}`, created_date: asRead(at), updated_date: asRead(at) };
      db[name].push(rec);
      return answered(rec, { created: at, updated: at });
    },
    // Applies the schema to the keys of the patch only; a declared object in the patch replaces the stored one whole.
    update: async (id, patch) => {
      const rec = db[name].find(r => r.id === id);
      if (!rec) throw new Error(`${name} ${id} not found`);
      const at = stamp();
      Object.entries(clone(patch)).filter(([k]) => k in properties).forEach(([k, v]) => { rec[k] = conform(properties[k], v); });
      rec.updated_date = asRead(at);
      return answered(rec, { updated: at });
    },
    filter: async (query) => db[name].filter(r => matches(r, query)).map(clone),
    // Conditional write. Matching and writing happen in one synchronous step, as one atomic store operation.
    // It does NOT apply the schema: the given paths are set as given.
    updateMany: async (query, { $set }) => {
      const hits = db[name].filter(r => matches(r, query));
      const at = asRead(stamp());
      hits.forEach(r => { Object.entries(clone($set)).forEach(([p, v]) => setPath(r, p, v)); r.updated_date = at; });
      return { success: true, updated: hits.length, has_more: false };
    },
  };
};
const entities = { Run: entity("Run"), RunStage: entity("RunStage"), RunAttempt: entity("RunAttempt") };
const took = async (write) => (await write).updated === 1;

// Stand-in for the invokeJanusStage backend function (same contract as base44/functions/invokeJanusStage).
// Failures have the shape the SDK really produces for a function call: a transport error carrying the response.
const httpError = (status, data) => Object.assign(new Error(`Request failed with status code ${status}`), { status, response: { status, data } });
const refusal = (status, reason, error) => httpError(status, { error, reason, evidence: "not_started" });
const networkError = () => new Error("Network Error"); // the browser received no response at all
const classify = (message) => (/quota|credit|insufficient|limit exceeded|rate limit|\b429\b/i.test(message) ? "quota_failure" : "provider_error");
/**
 * Transport faults a test can stage for a stage key (`llm.transport[key]`; an array is consumed one per request):
 *  unreached  the request never reaches the platform: no response, nothing claimed
 *  rejected   the platform answers 500 before the function runs: nothing claimed
 *  lost       the function claims the attempt, then nothing: no response, no record, ever
 *  http       the function claims the attempt, the platform answers 504: no record
 *  late       the function claims the attempt, the session gets no response, and the call finishes on the
 *             server later, when the test calls platform.finishPending()
 *  drop       the call finishes and is recorded, but the response never reaches the session
 */
const faultFor = (key) => {
  const f = llm.transport[key];
  return Array.isArray(f) ? f.shift() || null : f || null;
};
const invoke = async (name, payload) => {
  if (name !== "invokeJanusStage") throw httpError(404, { error: `Function ${name} not found` });
  const fault = faultFor(String(payload.prompt).match(/^STAGE KEY: (\S+)$/m)?.[1]);
  if (fault === "unreached") throw networkError();
  if (fault === "rejected") throw httpError(500, "Internal Server Error");
  if (!session.user) throw refusal(401, "unauthorized", "Unauthorized");
  if (session.user.role !== "admin") throw refusal(403, "operators_only", "Janus execution is limited to operators until durable stage ownership is in place");
  llm.calls.push(Object.keys(payload));
  const stage = db.RunStage.find(s => s.id === payload.stage_id);
  if (!stage) throw refusal(404, "not_found", "Stage not found");
  if (stage.status !== "running") throw refusal(409, "stage_settled", "Stage is already settled");
  const run = db.Run.find(r => r.id === stage.run_id);
  if (!run) throw refusal(404, "not_found", "Run not found");
  if (["cancel_requested", "cancelled"].includes(run.status)) throw refusal(409, "cancel_requested", "Cancellation was requested for this run: no further call is started");
  // The substrate of the revision, read from its record: never from the request, never defaulted.
  const spec = stage.provenance?.model;
  if (!spec?.requested) throw refusal(409, "model_not_recorded", "This stage version records no model, so no call is made for it. Start a new version of the stage.");
  if (!isAuthorizedModel(spec.requested)) throw refusal(409, "model_not_authorized", `This stage version records a model Janus is not authorized to request (${spec.requested})`);
  const open = db.RunAttempt.filter(a => a.stage_id === stage.id && a.outcome === "in_flight");
  if (open.length !== 1 || open[0].claim_state !== "unclaimed") throw refusal(409, "attempt_claimed", "This stage has no unclaimed attempt: one attempt is one call");
  const attempt = open[0];

  // SLOT, then CLAIM: the same two conditional writes the function makes.
  const staged = run.storage_model === "staged_v1";
  const freeSlot = () => (staged ? entities.Run.updateMany({ id: run.id, active_attempt_id: attempt.id }, { $set: { active_attempt_id: "" } }) : null);
  if (staged && !(await took(entities.Run.updateMany({ id: run.id, active_attempt_id: { $in: ["", null] } }, { $set: { active_attempt_id: attempt.id } })))) {
    throw refusal(409, "run_busy", "Another call of this run has not settled: no overlapping call is started");
  }
  if (!(await took(entities.RunAttempt.updateMany({ id: attempt.id, claim_state: "unclaimed", outcome: "in_flight" }, { $set: { claim_state: "claimed", claimed_at: new Date().toISOString() } })))) {
    await freeSlot();
    throw refusal(409, "attempt_claimed", "This attempt was claimed or closed by another request: one attempt is one call");
  }

  // The call, then RECORD and free the slot — what the function does once the call settles.
  // What the Gateway reports back, recorded with the outcome. A test can stage a substituted model
  // (`llm.effective[key]`) or an output cut off at the output limit (`llm.finish[key]`).
  const key = stage.stage_key.replace("intersection:", "");
  const settleOnServer = async () => {
    let result, failure;
    llm.models.push(spec.requested);
    try {
      result = await model(payload.prompt);
      // As the function: no content is a provider failure, unless the provider says it stopped at the output limit.
      if (typeof result === "string" && !result.trim() && llm.finish[key] !== "length") throw new Error(`the provider returned no content (finish reason: ${llm.finish[key] || "stop"})`);
    } catch (e) { failure = { evidence: classify(e.message), message: e.message }; }
    const model_call = { requested_model: spec.requested, reasoning_effort: spec.effort, max_output_tokens: 32000,
      ...(failure ? {} : { effective_model: llm.effective[key] || spec.requested, finish_reason: llm.finish[key] || "stop", usage: { total_tokens: 1 } }) };
    await entities.RunAttempt.update(attempt.id, {
      transport: { state: failure ? "failed" : "returned", ...failure, recorded_at: new Date().toISOString() },
      model_call,
      ...(failure ? {} : { response_text: typeof result === "string" ? result : JSON.stringify(result) }),
    });
    await freeSlot();
    return { result, failure, model_call };
  };
  if (fault === "lost") throw networkError();
  if (fault === "http") throw httpError(504, "Gateway Timeout");
  if (fault === "late") { llm.pending.push(settleOnServer); throw networkError(); }
  const { result, failure, model_call } = await settleOnServer();
  if (fault === "drop") throw networkError();
  if (failure) throw httpError(502, { error: failure.message, evidence: failure.evidence, recorded: true, model_call });
  return { status: 200, data: { result, recorded: true, model_call } };
};

// Deterministic model: what the integration returns for a compiled stage prompt.
const model = async (prompt) => {
  const stageKey = prompt.match(/^STAGE KEY: (\S+)$/m)[1];
  const key = stageKey.replace("intersection:", "");
  llm.prompts.push(prompt); llm.stages.push(stageKey);
  if (llm.gate?.stageKey === stageKey) { llm.gate.arrive(); await llm.gate.released; }
  const times = (bag) => { if (bag[key] > 0) { bag[key] -= 1; return true; } return false; };
  if (llm.failOn === key || times(llm.failTimes)) throw new Error(llm.failMessage);
  if (llm.raw[key] !== undefined) return llm.raw[key]; // the provider's text exactly as a test stages it (cut off, not JSON, …)
  if (llm.invalidOn === key || times(llm.invalidTimes)) return { [key]: INVALID[key] || { insight: `${key} insight only` } };
  if (llm.sequence[key]?.length) return { [key]: clone(llm.sequence[key].shift()) }; // one seeded output per call, in order
  if (llm.override[key]) return { [key]: clone(llm.override[key]) }; // structurally valid output a test wants to seed
  if (key === "blueprint") return { blueprint: blueprintFor(prompt) };
  if (PIPELINE[key]) return { [key]: PIPELINE[key](prompt) };
  if (key === "qualification") return { qualification: evaluation() };
  return { [key]: OUT[key] || { insight: `${key} insight`, tension: `${key} tension`, resolution: `${key} resolution` } };
};

export const platform = {
  db, llm, session, out: OUT, blueprintFor, pipeline: PIPELINE,
  base44: {
    entities,
    functions: { invoke },
    auth: { me: async () => { if (!session.user) throw httpError(401, { error: "Unauthorized" }); return clone(session.user); } },
  },
  reset() {
    db.Run.length = 0; db.RunStage.length = 0; db.RunAttempt.length = 0;
    session.user = { ...OPERATOR };
    llm.failOn = null; llm.invalidOn = null; llm.failTimes = {}; llm.invalidTimes = {}; llm.failMessage = FAIL_MESSAGE; llm.transport = {}; llm.pending.length = 0;
    llm.override = {}; llm.sequence = {}; llm.verdicts = {}; llm.findings = {}; llm.calls.length = 0; llm.prompts.length = 0; llm.stages.length = 0; llm.gate = null;
    llm.effective = {}; llm.finish = {}; llm.raw = {}; llm.models.length = 0;
  },
  /** Hold the model call for one stage open until release() — an unresolved, live call. */
  gateOn(stageKey) {
    let arrive, release;
    const reached = new Promise(r => { arrive = r; });
    const released = new Promise(r => { release = r; });
    llm.gate = { stageKey, arrive, released };
    return { reached, release };
  },
  /** Calls left running on the server by a `late` fault now finish there: outcome recorded, slot freed. */
  async finishPending() {
    for (const finish of llm.pending.splice(0)) await finish();
  },
};