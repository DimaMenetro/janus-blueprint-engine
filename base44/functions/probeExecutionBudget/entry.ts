import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Probe A (2026-11-27, branch janus-pipeline-expansion) — DIAGNOSTIC ONLY, never called by the app.
// Re-measures how long one backend function request may run, with the donor probe's method
// (probeExecutionBudget @ 3f25d14c: a heartbeat on a fixed tick; the last one before the end marks the
// ceiling) and two differences: no model call of any kind, and no record of any kind. Every heartbeat is
// a function log line; the platform adds its own line with the response status when the request ends.
// It also writes a line if the runtime reports that the caller disconnected.
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
    if (body.phase !== 'heartbeat') return Response.json({ error: 'phase must be ping or heartbeat' }, { status: 400 });

    const maxSeconds = Math.min(Math.max(Number(body.max_seconds) || 0, 1), 900);
    let disconnectedMs = null;
    if (req.signal && typeof req.signal.addEventListener === 'function') {
      req.signal.addEventListener('abort', () => { disconnectedMs = Date.now() - t0; line('client_disconnected'); });
    }
    line('start', { max_seconds: maxSeconds, signal_observable: !!req.signal });

    let tick = 0;
    while (Date.now() - t0 < maxSeconds * 1000) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      tick += 1;
      line('heartbeat', { tick });
    }
    line('survived', { tick, client_disconnected_ms: disconnectedMs });
    return Response.json({ ok: true, label, survived: true, elapsed_ms: Date.now() - t0, ticks: tick, client_disconnected_ms: disconnectedMs });
  } catch (error) {
    console.error('[probeExecutionBudget] failed', error?.stack || error);
    return Response.json({ error: 'Probe failed' }, { status: 500 });
  }
}