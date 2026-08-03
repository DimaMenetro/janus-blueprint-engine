// probeExecutionBudget — TR-0(c) / IMP-002 §Phase 0
// Empirically measures the server-side execution envelope:
//   phase "llm":       3 minimal InvokeLLM pings → per-call latency
//   phase "heartbeat": tick loop persisting a heartbeat every 10s into ProbeResult
//                      until maxMinutes reached (survived=true) or the platform kills
//                      the isolate (last_heartbeat reveals the wall-clock ceiling).
// Touches NO pipeline code and NO Run records.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const phase = body.phase || 'llm';

  if (phase === 'llm') {
    const pings = [];
    for (let i = 0; i < 3; i++) {
      const t0 = Date.now();
      await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: 'Reply with the single word: pong',
        model: 'claude_sonnet_4_6',
      });
      pings.push(Date.now() - t0);
    }
    return Response.json({ ok: true, phase: 'llm', ping_latencies_ms: pings });
  }

  if (phase === 'heartbeat') {
    const maxMinutes = Math.min(body.maxMinutes || 10, 30);
    const rec = await base44.asServiceRole.entities.ProbeResult.create({
      probe_type: 'wall_clock',
      started_at: new Date().toISOString(),
      last_heartbeat: new Date().toISOString(),
      tick_count: 0,
      elapsed_ms: 0,
      survived: false,
      max_minutes: maxMinutes,
    });

    const t0 = Date.now();
    let tick = 0;
    while (Date.now() - t0 < maxMinutes * 60000) {
      await new Promise((r) => setTimeout(r, 10000));
      tick++;
      await base44.asServiceRole.entities.ProbeResult.update(rec.id, {
        tick_count: tick,
        elapsed_ms: Date.now() - t0,
        last_heartbeat: new Date().toISOString(),
      });
    }

    await base44.asServiceRole.entities.ProbeResult.update(rec.id, {
      survived: true,
      elapsed_ms: Date.now() - t0,
      completed_at: new Date().toISOString(),
    });
    return Response.json({
      ok: true,
      phase: 'heartbeat',
      survived: true,
      elapsed_ms: Date.now() - t0,
      tick_count: tick,
      probe_id: rec.id,
    });
  }

  return Response.json({ error: `Unknown phase: ${phase}` }, { status: 400 });
});