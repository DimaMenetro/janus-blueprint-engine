import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { internalError } from '../../shared/errorResponse.ts';

// The model call for ONE in-flight Janus stage revision that the caller can read. Nothing else.
// The prompt is compiled by the canonical stage compiler; this function only carries it to the integration.
// Policy is enforced at this boundary: `prompt` is the only field forwarded, so no choice of engine, attached
// file or web-context option can reach the integration. The call inherits the operator's app setting.
// No deadline is added here: the call is awaited until it settles (the platform ends a request at 5 minutes).
const MAX_PROMPT_CHARS = 600000;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { stage_id, prompt } = (await req.json().catch(() => null)) || {};
    if (typeof stage_id !== 'string' || !stage_id) return Response.json({ error: 'stage_id is required' }, { status: 400 });
    if (typeof prompt !== 'string' || !prompt.trim()) return Response.json({ error: 'prompt is required' }, { status: 400 });
    if (prompt.length > MAX_PROMPT_CHARS) return Response.json({ error: `prompt exceeds ${MAX_PROMPT_CHARS} characters` }, { status: 413 });

    // Read as the caller: row-level security returns only the caller's own stages (any stage for an admin).
    // An id the store rejects as malformed (400) is simply not a stage.
    const [stage] = await base44.entities.RunStage.filter({ id: stage_id }).catch((e) => (e.status === 400 ? [] : Promise.reject(e)));
    if (!stage) return Response.json({ error: 'Stage not found' }, { status: 404 });
    if (stage.status !== 'running') return Response.json({ error: 'Stage is already settled' }, { status: 409 });

    let result;
    try {
      result = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
    } catch (error) {
      // A settled failure of the call is the caller's failure evidence: its message only. The stack stays in the logs.
      console.error(`[invokeJanusStage] stage=${stage_id} call failed`, error?.stack || error);
      return Response.json({ error: String(error?.message || error).slice(0, 500) }, { status: 502 });
    }
    return Response.json({ result });
  } catch (error) {
    return internalError('invokeJanusStage', error);
  }
}