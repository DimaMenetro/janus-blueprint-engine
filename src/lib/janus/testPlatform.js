/**
 * Test-only platform double (imported by *.test.js): an in-memory entity store and a deterministic
 * stand-in for the model-call backend function. No network, no credits.
 */
import { subdomainIds, PAIRS, PATTERNS } from "@/lib/janus/protocolRegistry";
import { QUALITY_CRITERIA } from "@/lib/janus/lifecycleContract";

const clone = (x) => JSON.parse(JSON.stringify(x));
const matches = (rec, query) => Object.entries(query).every(([k, v]) => (v && typeof v === "object" && v.$in ? v.$in.includes(rec[k]) : rec[k] === v));

const subs = (d) => Object.fromEntries(subdomainIds(d).map(id => [id, { perspective: `${id} view`, key_findings: ["f"] }]));
const step = (n, title, derived_from) => ({ step: n, title, instructions: "Do it", inputs: ["i"], outputs: ["o"], validation: "Check it",
  depends_on_steps: n > 1 ? [1] : [], substeps: [{ substep: `${n}a`, details: "d" }], derived_from, confidence: "Contested" });
// A Blueprint that cites only what its prompt actually showed it (so its traces resolve in every mode).
const blueprintFor = (prompt = "") => ({
  goal: "Pilot", assumptions: [],
  alternative_approaches: ["A", "B", "C"].map(name => ({ name, pros: ["p"], cons: ["c"], why_not_chosen: "w" })),
  steps: [
    step(1, "Scope", ["C1", "corpus:1"]),
    ...(prompt.includes("ACTUS: Key Recommendations") ? [step(2, "Pilot", ["R1", "animus:1"])] : []),
    ...(prompt.includes("[pattern:") ? [step(3, "Scale", [PAIRS[0].id, `pattern:${PATTERNS[0].id}`])] : []),
  ],
  success_criteria: ["s"], risk_register: [{ risk: "r", impact: "med", mitigation: "m" }],
});
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
});

// Parsed but structurally invalid: what a model returns when it ignores the stage's output contract.
const INVALID = {
  corpus: { constraints: "not an array" },
  cogito: { claims: [{ id: "C1", tag: "Certain", text: "a claim tagged outside the confidence taxonomy" }] },
  blueprint: { goal: "Pilot", steps: [{ title: "a step with no number and no instructions" }] },
  qualification: { verdicts: { elegance: { verdict: "pass", reason: "only one criterion answered" } } },
};
const OPERATOR = { id: "user-operator", role: "admin" };

const db = { Run: [], RunStage: [], RunAttempt: [] };
const FAIL_MESSAGE = "provider returned 500";
const llm = { failOn: null, invalidOn: null, failTimes: {}, invalidTimes: {}, failMessage: FAIL_MESSAGE, transport: {}, override: {}, verdicts: {}, calls: [], prompts: [], stages: [], gate: null };
const session = { user: { ...OPERATOR } };
let n = 0;

const entity = (name) => ({
  create: async (data) => {
    n += 1;
    const rec = { id: `${name}-${n}`, created_date: new Date(1767225600000 + n * 1000).toISOString(), created_by_id: session.user?.id, ...clone(data) };
    db[name].push(rec);
    return clone(rec);
  },
  update: async (id, patch) => {
    const rec = db[name].find(r => r.id === id);
    if (!rec) throw new Error(`${name} ${id} not found`);
    Object.assign(rec, clone(patch));
    return clone(rec);
  },
  filter: async (query) => db[name].filter(r => matches(r, query)).map(clone),
  // Conditional write, as verified against the real store: applies to the matching records only, and reports how many.
  updateMany: async (query, { $set }) => {
    const hits = db[name].filter(r => matches(r, query));
    hits.forEach(r => Object.assign(r, clone($set)));
    return { success: true, updated: hits.length, has_more: false };
  },
});

// Stand-in for the invokeJanusStage backend function (same contract as base44/functions/invokeJanusStage).
// Failures have the shape the SDK really produces for a function call: a transport error carrying the response.
const httpError = (status, data) => Object.assign(new Error(`Request failed with status code ${status}`), { status, response: { status, data } });
const refusal = (status, reason, error) => httpError(status, { error, reason, evidence: "not_started" });
const networkError = () => new Error("Network Error"); // the browser got no response at all
const classify = (message) => (/quota|credit|insufficient|limit exceeded|rate limit|\b429\b/i.test(message) ? "quota_failure" : "provider_error");
const invoke = async (name, payload) => {
  if (name !== "invokeJanusStage") throw httpError(404, { error: `Function ${name} not found` });
  const user = session.user;
  if (!user) throw refusal(401, "unauthorized", "Unauthorized");
  const mine = (rec) => rec && (user.role === "admin" || rec.created_by_id === user.id); // row-level security
  const attempt = db.RunAttempt.find(a => a.id === payload.attempt_id);
  const stage = attempt && db.RunStage.find(s => s.id === attempt.stage_id);
  const run = attempt && db.Run.find(r => r.id === attempt.run_id);
  if (![attempt, stage, run].every(mine)) throw refusal(404, "not_found", "Attempt not found");
  if (stage.status !== "running") throw refusal(409, "stage_settled", "Stage is already settled");
  if (["cancel_requested", "cancelled"].includes(run.status)) throw refusal(409, "cancel_requested", "Cancellation was requested for this run — no further call is started");
  const staged = run.storage_model === "staged_v1";
  if (!staged && user.role !== "admin") throw refusal(403, "operators_only", "Re-running a historical run is limited to operators");
  // The two conditional writes: the run's execution slot, then the attempt's single claim.
  if (staged && run.active_attempt_id !== "") throw refusal(409, "run_busy", "Another call of this run has not settled — no overlapping call is started");
  if (staged) run.active_attempt_id = attempt.id;
  if (attempt.claim_state !== "unclaimed" || attempt.outcome !== "in_flight") {
    if (staged) run.active_attempt_id = "";
    throw refusal(409, "attempt_claimed", "This attempt was already claimed or closed — one attempt is one call");
  }
  Object.assign(attempt, { claim_state: "claimed", claimed_at: new Date().toISOString() });
  llm.calls.push(Object.keys(payload));

  const fault = llm.transport[stage.stage_key];
  if (fault === "lost") throw networkError();                       // the server never reports back and records nothing
  if (fault === "platform") throw httpError(504, "Gateway Timeout"); // the platform ended the request: nothing recorded
  let result, failure;
  try { result = await model(payload.prompt); } catch (e) { failure = { evidence: classify(e.message), message: e.message }; }
  attempt.transport = { state: failure ? "failed" : "returned", ...failure, recorded_at: new Date().toISOString() };
  if (!failure) attempt.response_text = JSON.stringify(result);
  if (staged && run.active_attempt_id === attempt.id) run.active_attempt_id = "";
  if (fault === "drop") throw networkError();                       // the call settled and was recorded; the session never heard
  if (failure) throw httpError(502, { error: failure.message, evidence: failure.evidence, recorded: true });
  return { status: 200, data: { result, recorded: true } };
};

// Deterministic model: what the integration returns for a compiled stage prompt.
const model = async (prompt) => {
  const stageKey = prompt.match(/^STAGE KEY: (\S+)$/m)[1];
  const key = stageKey.replace("intersection:", "");
  llm.prompts.push(prompt); llm.stages.push(stageKey);
  if (llm.gate?.stageKey === stageKey) { llm.gate.arrive(); await llm.gate.released; }
  const times = (bag) => { if (bag[key] > 0) { bag[key] -= 1; return true; } return false; };
  if (llm.failOn === key || times(llm.failTimes)) throw new Error(llm.failMessage);
  if (llm.invalidOn === key || times(llm.invalidTimes)) return { [key]: INVALID[key] || { insight: `${key} insight only` } };
  if (llm.override[key]) return { [key]: clone(llm.override[key]) }; // structurally valid output a test wants to seed
  if (key === "blueprint") return { blueprint: blueprintFor(prompt) };
  if (key === "qualification") return { qualification: evaluation() };
  return { [key]: OUT[key] || { insight: `${key} insight`, tension: `${key} tension`, resolution: `${key} resolution` } };
};

export const platform = {
  db, llm, session, out: OUT, blueprintFor,
  base44: {
    entities: { Run: entity("Run"), RunStage: entity("RunStage"), RunAttempt: entity("RunAttempt") },
    functions: { invoke },
    auth: { me: async () => { if (!session.user) throw httpError(401, { error: "Unauthorized" }); return clone(session.user); } },
  },
  reset() {
    db.Run.length = 0; db.RunStage.length = 0; db.RunAttempt.length = 0;
    session.user = { ...OPERATOR };
    llm.failOn = null; llm.invalidOn = null; llm.failTimes = {}; llm.invalidTimes = {}; llm.failMessage = FAIL_MESSAGE; llm.transport = {}; llm.override = {}; llm.verdicts = {}; llm.calls.length = 0; llm.prompts.length = 0; llm.stages.length = 0; llm.gate = null;
  },
  /** Hold the model call for one stage open until release() — an unresolved, live call. */
  gateOn(stageKey) {
    let arrive, release;
    const reached = new Promise(r => { arrive = r; });
    const released = new Promise(r => { release = r; });
    llm.gate = { stageKey, arrive, released };
    return { reached, release };
  },
};