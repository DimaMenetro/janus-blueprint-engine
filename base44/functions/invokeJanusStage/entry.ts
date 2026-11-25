import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { internalError } from '../../shared/errorResponse.ts';

// The model call for ONE attempt of a Janus stage the caller owns. Nothing else.
// The prompt is compiled by the canonical stage compiler; this function only carries it to the integration.
// Policy is enforced at this boundary: `prompt` is the only field forwarded, so no choice of engine, attached
// file or web-context option can reach the integration. The call inherits the operator's app setting.
//
// OWNERSHIP (Phase 6) — this function is the single owner of a model call:
//  1. the run's execution slot (Run.active_attempt_id) is taken with one conditional write, so a staged run
//     can never have two calls live at once, whatever sessions or tabs ask;
//  2. the attempt is claimed with one conditional write, so one RunAttempt is at most one call, ever;
//  3. when the call settles, its outcome is recorded on the attempt here, server-side, and only then is the
//     slot freed. A session that disappears therefore loses nothing: the record is the evidence.
// Nothing here is released because time passed. No deadline is added: the call is awaited until it settles.
// INTERIM transport: the platform ends a function request at 5 minutes. If that happens nothing is recorded
// and the slot stays taken; that ceiling is a limitation of this transport, not a Janus inference deadline.
const MAX_PROMPT_CHARS = 600000;
const refuse = (status, reason, error) => Response.json({ error, reason, evidence: 'not_started' }, { status });
const took = async (write) => (await write).updated === 1;
const first = async (query) => (await query.catch((e) => (e.status === 400 || e.status === 404 ? [] : Promise.reject(e))))[0];
const classify = (error) => (error?.status === 429 || /quota|credit|insufficient|limit exceeded|rate limit|\b429\b/i.test(String(error?.message || error))
  ? 'quota_failure' : 'provider_error');

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return refuse(401, 'unauthorized', 'Unauthorized');

    const { attempt_id, prompt } = (await req.json().catch(() => null)) || {};
    if (typeof attempt_id !== 'string' || !attempt_id) return refuse(400, 'bad_request', 'attempt_id is required');
    if (typeof prompt !== 'string' || !prompt.trim()) return refuse(400, 'bad_request', 'prompt is required');
    if (prompt.length > MAX_PROMPT_CHARS) return refuse(413, 'bad_request', `prompt exceeds ${MAX_PROMPT_CHARS} characters`);

    // Read as the caller: row-level security returns only the caller's own records (any record for an admin).
    const attempt = await first(base44.entities.RunAttempt.filter({ id: attempt_id }));
    const stage = attempt && await first(base44.entities.RunStage.filter({ id: attempt.stage_id }));
    const run = attempt && await first(base44.entities.Run.filter({ id: attempt.run_id }));
    if (!attempt || !stage || !run || stage.run_id !== run.id) return refuse(404, 'not_found', 'Attempt not found');
    if (stage.status !== 'running') return refuse(409, 'stage_settled', 'Stage is already settled');
    if (run.status === 'cancel_requested' || run.status === 'cancelled') return refuse(409, 'cancel_requested', 'Cancellation was requested for this run — no further call is started');

    // Historical Runs are never written, so they have no execution slot: model work on them stays with operators.
    const staged = run.storage_model === 'staged_v1';
    if (!staged && user.role !== 'admin') return refuse(403, 'operators_only', 'Re-running a historical run is limited to operators');

    const svc = base44.asServiceRole.entities;
    const freeSlot = () => (staged ? svc.Run.updateMany({ id: run.id, active_attempt_id: attempt.id }, { $set: { active_attempt_id: '' } }) : null);
    if (staged && !(await took(svc.Run.updateMany({ id: run.id, active_attempt_id: '' }, { $set: { active_attempt_id: attempt.id } })))) {
      return refuse(409, 'run_busy', 'Another call of this run has not settled — no overlapping call is started');
    }
    if (!(await took(svc.RunAttempt.updateMany({ id: attempt.id, claim_state: 'unclaimed', outcome: 'in_flight' }, { $set: { claim_state: 'claimed', claimed_at: new Date().toISOString() } })))) {
      await freeSlot();
      return refuse(409, 'attempt_claimed', 'This attempt was already claimed or closed — one attempt is one call');
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

    // Record the settled outcome durably, then free the slot. If recording fails the awaiting session is told,
    // so it settles from the response it holds; the slot is then freed by that settlement, never by a timer.
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