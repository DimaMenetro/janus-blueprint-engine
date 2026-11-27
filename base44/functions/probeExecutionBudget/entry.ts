import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { waitUntil } from 'base44:runtime';

// Probe A (2026-11-27, branch janus-pipeline-expansion). DIAGNOSTIC ONLY, never called by the app.
// Measures how a backend request ends. No model call and no record of any kind: every observation is a log
// line, and the platform adds its own line with the request's status when it ends.
//   ping       one log line, answers at once.
//   heartbeat  the caller waits; a log line every 5 s until max_seconds.
//   detach     answers at once; the same loop continues after the response under waitUntil().
// side_every_seconds > 0 adds a second witness: every N s the loop calls this function's ping as a separate
// request, so a loop that is still alive leaves lines that the original request's own log context cannot affect.
export default async function(req) {
  const t0 = Date.now();
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const label = String(body.label || 'probe').slice(0, 40);
    const line = (event, extra = {}) => console.log(JSON.stringify({
      probe: 'execution_budget', label, event, elapsed_ms: Date.now() - t0, at: new Date().toISOString(), ...extra,
    }));

    if (body.phase === 'ping') {
      line('ping');
      return Response.json({ ok: true, label, at: new Date().toISOString() });
    }
    if (body.phase !== 'heartbeat' && body.phase !== 'detach') {
      return Response.json({ error: 'phase must be ping, heartbeat or detach' }, { status: 400 });
    }

    const maxSeconds = Math.min(Math.max(Number(body.max_seconds) || 0, 1), 900);
    const sideEvery = Math.max(Number(body.side_every_seconds) || 0, 0);
    const loop = async (mode) => {
      let tick = 0;
      let lastSide = Date.now();
      while (Date.now() - t0 < maxSeconds * 1000) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        tick += 1;
        line('heartbeat', { tick, mode });
        if (sideEvery && Date.now() - lastSide >= sideEvery * 1000) {
          lastSide = Date.now();
          const side = await base44.functions.invoke('probeExecutionBudget', { phase: 'ping', label: `${label}-side-${tick}` })
            .then(() => 'ok', (e) => `failed ${e?.response?.status ?? e?.message}`);
          line('side_ping', { tick, side });
        }
      }
      line('survived', { tick, mode });
      return tick;
    };

    if (body.phase === 'detach') {
      line('detach', { max_seconds: maxSeconds });
      waitUntil(loop('after_response').catch((e) => line('background_failed', { error: String(e?.message || e) })));
      return Response.json({ ok: true, label, detached: true, answered_ms: Date.now() - t0 });
    }

    if (req.signal && typeof req.signal.addEventListener === 'function') {
      req.signal.addEventListener('abort', () => line('client_disconnected'));
    }
    line('start', { max_seconds: maxSeconds, signal_observable: !!req.signal });
    const ticks = await loop('attached');
    return Response.json({ ok: true, label, survived: true, elapsed_ms: Date.now() - t0, ticks });
  } catch (error) {
    console.error('[probeExecutionBudget] failed', error?.stack || error);
    return Response.json({ error: 'Probe failed' }, { status: 500 });
  }
}