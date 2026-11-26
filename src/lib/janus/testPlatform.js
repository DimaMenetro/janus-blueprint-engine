/**
 * Test-only platform double (imported by *.test.js): an in-memory entity store and a deterministic
 * stand-in for the model-call backend function. No network, no credits.
 * The store mirrors the Base44 behaviour Janus relies on, as measured against the real store (2026-11-25):
 *  - updateMany(query, { $set }) applies to the records matching `query` only and returns
 *    { success, updated, has_more }; of concurrent conditional writes on one record, exactly one gets updated: 1;
 *  - an equality condition does not match a record that lacks the field ("" does not match "never set");
 *  - { $in: [..., null] } does match a record that lacks the field.
 */
import { subdomainIds, PAIRS, PATTERNS } from "@/lib/janus/protocolRegistry";
import { QUALITY_CRITERIA } from "@/lib/janus/lifecycleContract";

const clone = (x) => JSON.parse(JSON.stringify(x));
const matches = (rec, query) => Object.entries(query).every(([k, v]) => (v && typeof v === "object" && v.$in ? v.$in.includes(rec[k] ?? null) : rec[k] === v));

const subs = (d) => Object.fromEntries(subdomainIds(d).map(id => [id, { perspective: `${id} view`, key_findings: ["f"] }]));
const step = (n, title, derived_from) => ({ step: n, title, purpose: `Purpose of ${title}`, phase: "P1", fulfils: n === 1 ? ["Q1"] : [], instructions: "Do it", inputs: ["i"], outputs: ["o"], validation: "Check it",
  depends_on_steps: n > 1 ? [1] : [], substeps: [{ substep: `${n}a`, details: "d" }], acceptance_tests: ["t"], derived_from, confidence: "Contested" });
// A Blueprint that cites only what its prompt actually showed it (so its traces resolve in every mode).
const blueprintFor = (prompt = "") => ({
  // The refiner carries the draft's parts forward (the pipeline fixtures below produce the same ones).
  goal: "Pilot", assumptions: ["a"], phases: [{ id: "P1", name: "Pilot" }],
  selected_strategy: { name: "Approach 1", mode: "selected", built_from: ["K1"] },
  acceptance: PIPELINE["blueprint:criteria"]().acceptance, outcome_interpretation: PIPELINE["blueprint:criteria"]().outcome_interpretation,
  alternative_approaches: ["A", "B", "C"].map(name => ({ name, pros: ["p"], cons: ["c"], why_not_chosen: "w" })),
  steps: [
    step(1, "Scope", ["C1", "corpus:1"]),
    ...(prompt.includes("ACTUS: Key Recommendations") ? [step(2, "Pilot", ["R1", "animus:1"])] : []),
    ...(prompt.includes("[pattern:") ? [step(3, "Scale", [PAIRS[0].id, `pattern:${PATTERNS[0].id}`])] : []),
  ],
  success_criteria: ["s"], risk_register: [{ risk: "r", impact: "med", mitigation: "m" }],
  ...dispositions(prompt),
  refinement: { dispositions: [{ finding: "F1", action: "resolved", change: "Step 1 now states its interface" }] },
});
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
  override: {}, sequence: {}, verdicts: {}, findings: {}, calls: [], prompts: [], stages: [], gate: null };
const session = { user: { ...OPERATOR } };
let n = 0;

const entity = (name) => ({
  create: async (data) => {
    n += 1;
    const rec = { id: `${name}-${n}`, created_date: new Date(1767225600000 + n * 1000).toISOString(), ...clone(data) };
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
  // Conditional write. Matching and writing happen in one synchronous step, as one atomic store operation.
  updateMany: async (query, { $set }) => {
    const hits = db[name].filter(r => matches(r, query));
    hits.forEach(r => Object.assign(r, clone($set)));
    return { success: true, updated: hits.length, has_more: false };
  },
});
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
  const settleOnServer = async () => {
    let result, failure;
    try { result = await model(payload.prompt); } catch (e) { failure = { evidence: classify(e.message), message: e.message }; }
    await entities.RunAttempt.update(attempt.id, {
      transport: { state: failure ? "failed" : "returned", ...failure, recorded_at: new Date().toISOString() },
      ...(failure ? {} : { response_text: JSON.stringify(result) }),
    });
    await freeSlot();
    return { result, failure };
  };
  if (fault === "lost") throw networkError();
  if (fault === "http") throw httpError(504, "Gateway Timeout");
  if (fault === "late") { llm.pending.push(settleOnServer); throw networkError(); }
  const { result, failure } = await settleOnServer();
  if (fault === "drop") throw networkError();
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