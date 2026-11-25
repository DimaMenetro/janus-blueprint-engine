/**
 * Test-only platform double (imported by *.test.js): an in-memory entity store and a deterministic
 * stand-in for the model-call backend function. No network, no credits.
 */
const clone = (x) => JSON.parse(JSON.stringify(x));
const matches = (rec, query) => Object.entries(query).every(([k, v]) => (v && typeof v === "object" && v.$in ? v.$in.includes(rec[k]) : rec[k] === v));

const OUT = {
  refresh: { mode: "tier0", attempted: false, limitations: "Training data only." },
  corpus: { constraints: ["Grid latency under 200 ms"], feasibility_notes: ["Feasible with edge nodes"], subdomains: {} },
  cogito: { claims: [{ id: "C1", tag: "Contested", text: "Edge inference cuts latency", depends_on: [], why_believed: "b", falsifiable_by: "f", verify_later: "v" }], reasoning_map: ["r1"] },
  animus: { boundary_checks: ["No covert data capture"], disallowed_moves: [], safety_notes: [], ethical_stance: "Consent first" },
  actus: { recommendations: [{ id: "R1", text: "Pilot one district", depends_on_claims: ["C1"], inherited_confidence: "Contested", probability: "medium" }] },
  synthesis: { key_takeaways: ["k"], constraint_collisions: [], limitation_foreground: "l" },
  blueprint: { goal: "Pilot", assumptions: [], steps: [{ step: 1, title: "Scope", instructions: "Define the district" }], success_criteria: ["s"], risk_register: [{ risk: "r", impact: "med", mitigation: "m" }] },
};

// Parsed but structurally invalid: what a model returns when it ignores the stage's output contract.
const INVALID = {
  corpus: { constraints: "not an array" },
  blueprint: { goal: "Pilot", steps: [{ title: "a step with no number and no instructions" }] },
};
const OPERATOR = { id: "user-operator", role: "admin" };

const db = { Run: [], RunStage: [], RunAttempt: [] };
const llm = { failOn: null, invalidOn: null, calls: [], prompts: [], stages: [], gate: null };
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
});

// Stand-in for the invokeJanusStage backend function (same contract as base44/functions/invokeJanusStage).
// Failures have the shape the SDK really produces for a function call: a transport error carrying the response.
const httpError = (status, error) => Object.assign(new Error(`Request failed with status code ${status}`), { status, response: { status, data: { error } } });
const invoke = async (name, payload) => {
  if (name !== "invokeJanusStage") throw httpError(404, `Function ${name} not found`);
  if (!session.user) throw httpError(401, "Unauthorized");
  if (session.user.role !== "admin") throw httpError(403, "Janus execution is limited to operators until durable stage ownership is in place");
  llm.calls.push(Object.keys(payload));
  const stage = db.RunStage.find(s => s.id === payload.stage_id);
  if (!stage) throw httpError(404, "Stage not found");
  if (stage.status !== "running") throw httpError(409, "Stage is already settled");
  try { return { status: 200, data: { result: await model(payload.prompt) } }; }
  catch (e) { throw httpError(502, e.message); }
};

// Deterministic model: what the integration returns for a compiled stage prompt.
const model = async (prompt) => {
  const stageKey = prompt.match(/^STAGE KEY: (\S+)$/m)[1];
  const key = stageKey.replace("intersection:", "");
  llm.prompts.push(prompt); llm.stages.push(stageKey);
  if (llm.gate?.stageKey === stageKey) { llm.gate.arrive(); await llm.gate.released; }
  if (llm.failOn === key) throw new Error("provider returned 500");
  if (llm.invalidOn === key) return { [key]: INVALID[key] || { insight: `${key} insight only` } };
  return { [key]: OUT[key] || { insight: `${key} insight`, tension: `${key} tension`, resolution: `${key} resolution` } };
};

export const platform = {
  db, llm, session, out: OUT,
  base44: {
    entities: { Run: entity("Run"), RunStage: entity("RunStage"), RunAttempt: entity("RunAttempt") },
    functions: { invoke },
    auth: { me: async () => { if (!session.user) throw httpError(401, "Unauthorized"); return clone(session.user); } },
  },
  reset() {
    db.Run.length = 0; db.RunStage.length = 0; db.RunAttempt.length = 0;
    session.user = { ...OPERATOR };
    llm.failOn = null; llm.invalidOn = null; llm.calls.length = 0; llm.prompts.length = 0; llm.stages.length = 0; llm.gate = null;
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