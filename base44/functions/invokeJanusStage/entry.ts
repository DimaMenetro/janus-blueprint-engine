import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { internalError } from '../../shared/errorResponse.ts';

// The call for ONE attempt of ONE in-flight Janus stage revision that the caller can read. Nothing else.
// The prompt is compiled by the canonical stage compiler; this function only carries it to the integration.
// Policy is enforced at this boundary: `prompt` is the only field forwarded, so no choice of engine, attached
// file or web-context option can reach the integration. The call inherits the operator's app setting.
// No deadline is added here: the call is awaited until it settles.
// INTERIM secure transport: the platform ends a function request at 5 minutes. That ceiling is a known
// limitation of this transport, not a Janus inference deadline; the durable server path must replace it.
// If the platform ends this request, nothing is recorded and the execution slot stays taken: that state is
// UNRESOLVED, and nothing here or in the app turns it into a failure.
// INTERIM containment: operators (admins) only. The ownership mechanism below is in place; widening the
// audience is a separate, explicit operator decision.
//
// OWNERSHIP (Phase 6). This function is the single owner of a call, by three durable facts:
//  1. SLOT    Run.active_attempt_id is taken with one conditional write. A staged run cannot have two calls
//             live at once, whichever sessions or tabs ask. It is freed only after the outcome is recorded.
//  2. CLAIM   the stage's one open attempt is claimed with one conditional write. One RunAttempt is at most
//             one call, ever: a claimed or closed attempt can never be claimed again.
//  3. RECORD  when the call settles, its outcome is written to the attempt here, server-side. A session that
//             disappears loses nothing: the record is the evidence recovery reads.
// Every refusal below happens before the call and says so (evidence: not_started).
const MAX_PROMPT_CHARS = 600000;
const SLOT_FREE = { $in: ['', null] }; // empty, or never set (a run created before the slot existed)
const refuse = (status, reason, error) => Response.json({ error, reason, evidence: 'not_started' }, { status });
const took = async (write) => (await write).updated === 1;
// An id the store rejects as malformed (400) is simply not a record.
const rows = (query) => query.catch((e) => (e.status === 400 ? [] : Promise.reject(e)));
const classify = (error) => (error?.status === 429 || /quota|credit|insufficient|limit exceeded|rate limit|\b429\b/i.test(String(error?.message || error))
  ? 'quota_failure' : 'provider_error');

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return refuse(401, 'unauthorized', 'Unauthorized');
    if (user.role !== 'admin') return refuse(403, 'operators_only', 'Janus execution is limited to operators until durable stage ownership is in place');

    const { stage_id, prompt } = (await req.json().catch(() => null)) || {};
    if (typeof stage_id !== 'string' || !stage_id) return refuse(400, 'bad_request', 'stage_id is required');
    if (typeof prompt !== 'string' || !prompt.trim()) return refuse(400, 'bad_request', 'prompt is required');
    if (prompt.length > MAX_PROMPT_CHARS) return refuse(413, 'bad_request', `prompt exceeds ${MAX_PROMPT_CHARS} characters`);

    // Read as the caller: row-level security returns only the caller's own records (any record for an admin).
    const [stage] = await rows(base44.entities.RunStage.filter({ id: stage_id }));
    if (!stage) return refuse(404, 'not_found', 'Stage not found');
    if (stage.status !== 'running') return refuse(409, 'stage_settled', 'Stage is already settled');
    const [run] = await rows(base44.entities.Run.filter({ id: stage.run_id }));
    if (!run) return refuse(404, 'not_found', 'Run not found');
    if (run.status === 'cancel_requested' || run.status === 'cancelled') return refuse(409, 'cancel_requested', 'Cancellation was requested for this run: no further call is started');

    // The attempt this request is for: the stage's ONE open attempt, and only if nobody has claimed it.
    // Attempts of a revision are sequential, so anything else means a call for this stage may already exist.
    const open = await rows(base44.entities.RunAttempt.filter({ stage_id: stage.id, outcome: 'in_flight' }));
    if (open.length !== 1 || open[0].claim_state !== 'unclaimed') return refuse(409, 'attempt_claimed', 'This stage has no unclaimed attempt: one attempt is one call');
    const attempt = open[0];

    // A historical Run is never written, so it has no slot; the attempt claim alone guards it.
    const staged = run.storage_model === 'staged_v1';
    const svc = base44.asServiceRole.entities;
    const freeSlot = () => (staged ? svc.Run.updateMany({ id: run.id, active_attempt_id: attempt.id }, { $set: { active_attempt_id: '' } }) : null);
    if (staged && !(await took(svc.Run.updateMany({ id: run.id, active_attempt_id: SLOT_FREE }, { $set: { active_attempt_id: attempt.id } })))) {
      return refuse(409, 'run_busy', 'Another call of this run has not settled: no overlapping call is started');
    }
    if (!(await took(svc.RunAttempt.updateMany({ id: attempt.id, claim_state: 'unclaimed', outcome: 'in_flight' }, { $set: { claim_state: 'claimed', claimed_at: new Date().toISOString() } })))) {
      await freeSlot();
      return refuse(409, 'attempt_claimed', 'This attempt was claimed or closed by another request: one attempt is one call');
    }

    let result;
    let transport = { state: 'returned' };
    try {
      result = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
    } catch (error) {
      // A settled failure of the call is failure evidence: its class and message only. The stack stays in the logs.
      console.error(`[invokeJanusStage] attempt=${attempt.id} call failed`, error?.stack || error);
      transport = { state: 'failed', evidence: classify(error), message: String(error?.message || error).slice(0, 500), ...(Number.isInteger(error?.status) ? { http_status: error.status } : {}) };
    }

    // RECORD, then free the slot. If recording fails, the awaiting session still holds this response and
    // settles from it; the slot is then freed by that settlement. It is never freed because time passed.
    let recorded = true;
    try {
      await svc.RunAttempt.update(attempt.id, {
        transport: { ...transport, recorded_at: new Date().toISOString() },
        ...(transport.state === 'returned' ? { response_text: typeof result === 'string' ? result : JSON.stringify(result) } : {}),
      });
      await freeSlot();
    } catch (error) {
      recorded = false;
      console.error(`[invokeJanusStage] attempt=${attempt.id} outcome could not be recorded`, error?.stack || error);
    }

    if (transport.state === 'failed') return Response.json({ error: transport.message, evidence: transport.evidence, recorded }, { status: 502 });
    return Response.json({ result, recorded });
  } catch (error) {
    return internalError('invokeJanusStage', error);
  }
}