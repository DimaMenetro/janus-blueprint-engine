/**
 * captureGoldenRun.js
 *
 * IMP-002-R-D-SRV — Phase -1, subtask -1.2
 *
 * TEMPORARY DIAGNOSTIC FUNCTION.
 * Purpose: Read a completed Run record by ID and return its full JSON
 * for archival as a "golden run" baseline. Captured runs are used as
 * the fidelity reference for all subsequent IMP-002 phases.
 *
 * Usage:
 *   test_backend_function('captureGoldenRun', { runId: '<id>', label: 'STANDARD_v1' })
 *
 * Response: { run: <full Run record>, label, capturedAt }
 *
 * The operator is expected to copy the response into
 * docs/golden_runs/<label>.json manually (this function does NOT write
 * to the filesystem — the Base44 backend cannot persist to /docs).
 *
 * Will be archived or removed at end of Phase -1 cleanup.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payload;
    try {
      payload = await req.json();
    } catch {
      return Response.json(
        { error: 'Invalid JSON body. Expected { runId, label }.' },
        { status: 400 }
      );
    }

    const { runId, label } = payload || {};
    if (!runId || typeof runId !== 'string') {
      return Response.json(
        { error: 'Missing required field: runId (string).' },
        { status: 400 }
      );
    }
    if (!label || typeof label !== 'string') {
      return Response.json(
        { error: 'Missing required field: label (string), e.g. "STANDARD_v1".' },
        { status: 400 }
      );
    }

    // Service-role read so we can capture ALL fields regardless of who created the run.
    // Operator is admin-bound by Phase -1 protocol.
    let run;
    try {
      run = await base44.asServiceRole.entities.Run.get(runId);
    } catch (e) {
      return Response.json(
        { error: `Run not found: ${runId}`, detail: e.message },
        { status: 404 }
      );
    }

    if (!run) {
      return Response.json({ error: `Run not found: ${runId}` }, { status: 404 });
    }

    if (run.status !== 'completed') {
      return Response.json(
        {
          error: `Run is not in completed state. Current status: ${run.status}. Golden runs must be completed.`,
          run_status: run.status,
        },
        { status: 409 }
      );
    }

    return Response.json({
      label,
      capturedAt: new Date().toISOString(),
      run,
      _instructions:
        'Copy the "run" field of this response into docs/golden_runs/' +
        label +
        '.json verbatim.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});