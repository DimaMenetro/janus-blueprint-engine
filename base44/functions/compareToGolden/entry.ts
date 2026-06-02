/**
 * compareToGolden.js
 *
 * IMP-002-R-D-SRV — Phase -1, subtask -1.3
 *
 * Structural diff utility comparing a Run record against a captured
 * golden baseline. Used as the fidelity gate for every IMP-002 phase.
 *
 * Per the blueprint (§5.2 Phase -1), this comparator checks:
 *   - Field presence (populated vs missing) for every top-level
 *     Run property
 *   - Array lengths for steps, intersections, claims, recommendations,
 *     subdomains, etc.
 *   - Prompt hashes from _debug_prompt_hashes (if both records carry them)
 *   - render_md byte-length delta within ±1% tolerance
 *   - validation_errors content equality
 *   - error_message presence-only (NOT byte-identical — stack traces
 *     legitimately differ across environments)
 *
 * Usage (operator-driven):
 *   test_backend_function('compareToGolden', {
 *     candidateRunId: '<id>',
 *     goldenRun: <full golden run JSON pasted in>
 *   })
 *
 * OR (self-diff sanity check, AT -1.B):
 *   test_backend_function('compareToGolden', {
 *     candidateGoldenRun: <golden A>,
 *     goldenRun: <golden A>
 *   })
 *
 * Response:
 *   {
 *     verdict: 'PERFECT_MATCH' | 'STRUCTURAL_DIFF' | 'CONTENT_DIFF',
 *     diffs: [ { path, kind, expected, actual } ],
 *     summary: { totalChecks, mismatches }
 *   }
 *
 * Will be RETAINED beyond Phase -1 — this is the regression harness
 * used in Phases 1, 2, 3, 4, 5, 6, 7, 8.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ──────────────────────────────────────────────────────────────────────
// Top-level Run fields we expect to be present on a completed run.
// Derived from entities/Run.json. Used for presence-check pass.
// ──────────────────────────────────────────────────────────────────────
const TOP_LEVEL_FIELDS = [
  'query_text',
  'full_prompt',
  'execution_mode',
  'output_mode',
  'blueprint_level',
  'novelty_dial',
  'refresh_enabled',
  'status',
  'corpus',
  'cogito',
  'animus',
  'actus',
  'synthesis',
  'blueprint',
  'raw_json',
  'render_md',
];

// Optional fields — checked for presence parity but not flagged if both missing.
const OPTIONAL_FIELDS = [
  'refresh',
  'validation_errors',
  'error_message',
  'current_step',
  'last_heartbeat',
  'retry_log',
  '_debug_prompt_hashes',
];

// Array-length parity checks. Each entry: { path, label }
// path is dot-notation into the run object.
const ARRAY_LENGTH_CHECKS = [
  { path: 'corpus.constraints', label: 'corpus.constraints[]' },
  { path: 'corpus.feasibility_notes', label: 'corpus.feasibility_notes[]' },
  { path: 'cogito.claims', label: 'cogito.claims[]' },
  { path: 'cogito.reasoning_map', label: 'cogito.reasoning_map[]' },
  { path: 'cogito.graphrag_connections', label: 'cogito.graphrag_connections[]' },
  { path: 'cogito.causal_chains', label: 'cogito.causal_chains[]' },
  { path: 'cogito.neuro_symbolic_insights', label: 'cogito.neuro_symbolic_insights[]' },
  { path: 'animus.boundary_checks', label: 'animus.boundary_checks[]' },
  { path: 'animus.disallowed_moves', label: 'animus.disallowed_moves[]' },
  { path: 'animus.safety_notes', label: 'animus.safety_notes[]' },
  { path: 'animus.attractor_states', label: 'animus.attractor_states[]' },
  { path: 'actus.recommendations', label: 'actus.recommendations[]' },
  { path: 'actus.integration_contracts', label: 'actus.integration_contracts[]' },
  { path: 'synthesis.key_takeaways', label: 'synthesis.key_takeaways[]' },
  { path: 'synthesis.constraint_collisions', label: 'synthesis.constraint_collisions[]' },
  { path: 'blueprint.assumptions', label: 'blueprint.assumptions[]' },
  { path: 'blueprint.alternative_approaches', label: 'blueprint.alternative_approaches[]' },
  { path: 'blueprint.steps', label: 'blueprint.steps[]' },
  { path: 'blueprint.success_criteria', label: 'blueprint.success_criteria[]' },
  { path: 'blueprint.risk_register', label: 'blueprint.risk_register[]' },
];

// Subdomain keys in corpus.subdomains (per Run.json schema)
const CORPUS_SUBDOMAIN_KEYS = [
  'distributed_systems',
  'data_engineering',
  'cybersecurity',
  'systems_engineering',
  'theoretical_physics',
  'physics',
  'ai_ml',
  'neuroscience',
];

// Intersection matrix keys in synthesis.intersection_matrix
const INTERSECTION_KEYS = [
  'corpus_x_cogito',
  'corpus_x_animus',
  'corpus_x_actus',
  'cogito_x_animus',
  'cogito_x_actus',
  'animus_x_actus',
];

// Tolerance for render_md byte-length comparison (per blueprint §5.2 Phase -1)
const RENDER_MD_TOLERANCE_PCT = 0.01;

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────
function getPath(obj, path) {
  if (!obj) return undefined;
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function isPopulated(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.length > 0;
  if (Array.isArray(value)) return true; // presence, not non-empty
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

function compareRuns(golden, candidate) {
  const diffs = [];
  let totalChecks = 0;

  // ─── 1. Top-level required field presence ───
  for (const field of TOP_LEVEL_FIELDS) {
    totalChecks++;
    const gPresent = isPopulated(golden?.[field]);
    const cPresent = isPopulated(candidate?.[field]);
    if (gPresent !== cPresent) {
      diffs.push({
        path: field,
        kind: 'presence_mismatch',
        expected: gPresent ? 'populated' : 'missing',
        actual: cPresent ? 'populated' : 'missing',
      });
    }
  }

  // ─── 2. Optional field parity (presence only) ───
  for (const field of OPTIONAL_FIELDS) {
    totalChecks++;
    const gPresent = isPopulated(golden?.[field]);
    const cPresent = isPopulated(candidate?.[field]);
    if (gPresent !== cPresent) {
      diffs.push({
        path: field,
        kind: 'optional_presence_mismatch',
        expected: gPresent ? 'populated' : 'missing',
        actual: cPresent ? 'populated' : 'missing',
      });
    }
  }

  // ─── 3. Array length parity ───
  for (const { path, label } of ARRAY_LENGTH_CHECKS) {
    totalChecks++;
    const gVal = getPath(golden, path);
    const cVal = getPath(candidate, path);
    const gLen = Array.isArray(gVal) ? gVal.length : null;
    const cLen = Array.isArray(cVal) ? cVal.length : null;
    if (gLen !== cLen) {
      diffs.push({
        path: label,
        kind: 'array_length_mismatch',
        expected: gLen,
        actual: cLen,
      });
    }
  }

  // ─── 4. Corpus subdomain presence parity ───
  for (const key of CORPUS_SUBDOMAIN_KEYS) {
    totalChecks++;
    const gPresent = isPopulated(getPath(golden, `corpus.subdomains.${key}`));
    const cPresent = isPopulated(getPath(candidate, `corpus.subdomains.${key}`));
    if (gPresent !== cPresent) {
      diffs.push({
        path: `corpus.subdomains.${key}`,
        kind: 'subdomain_presence_mismatch',
        expected: gPresent ? 'populated' : 'missing',
        actual: cPresent ? 'populated' : 'missing',
      });
    }
  }

  // ─── 5. Intersection matrix presence parity ───
  for (const key of INTERSECTION_KEYS) {
    totalChecks++;
    const gPresent = isPopulated(getPath(golden, `synthesis.intersection_matrix.${key}`));
    const cPresent = isPopulated(getPath(candidate, `synthesis.intersection_matrix.${key}`));
    if (gPresent !== cPresent) {
      diffs.push({
        path: `synthesis.intersection_matrix.${key}`,
        kind: 'intersection_presence_mismatch',
        expected: gPresent ? 'populated' : 'missing',
        actual: cPresent ? 'populated' : 'missing',
      });
    }
  }

  // ─── 6. render_md byte-length within tolerance ───
  totalChecks++;
  const gMd = typeof golden?.render_md === 'string' ? golden.render_md : '';
  const cMd = typeof candidate?.render_md === 'string' ? candidate.render_md : '';
  const gLen = gMd.length;
  const cLen = cMd.length;
  if (gLen === 0 && cLen === 0) {
    // both empty — fine
  } else if (gLen === 0 || cLen === 0) {
    diffs.push({
      path: 'render_md',
      kind: 'render_md_presence_mismatch',
      expected: gLen,
      actual: cLen,
    });
  } else {
    const delta = Math.abs(gLen - cLen);
    const pct = delta / gLen;
    if (pct > RENDER_MD_TOLERANCE_PCT) {
      diffs.push({
        path: 'render_md',
        kind: 'render_md_length_out_of_tolerance',
        expected: `${gLen} chars (±${(RENDER_MD_TOLERANCE_PCT * 100).toFixed(1)}%)`,
        actual: `${cLen} chars (delta ${(pct * 100).toFixed(2)}%)`,
      });
    }
  }

  // ─── 7. validation_errors content equality ───
  totalChecks++;
  const gErr = Array.isArray(golden?.validation_errors) ? golden.validation_errors : [];
  const cErr = Array.isArray(candidate?.validation_errors) ? candidate.validation_errors : [];
  if (gErr.length !== cErr.length || gErr.some((e, i) => e !== cErr[i])) {
    diffs.push({
      path: 'validation_errors',
      kind: 'validation_errors_content_mismatch',
      expected: gErr,
      actual: cErr,
    });
  }

  // ─── 8. error_message presence-only ───
  totalChecks++;
  const gErrMsg = isPopulated(golden?.error_message);
  const cErrMsg = isPopulated(candidate?.error_message);
  if (gErrMsg !== cErrMsg) {
    diffs.push({
      path: 'error_message',
      kind: 'error_message_presence_mismatch',
      expected: gErrMsg ? 'populated' : 'missing',
      actual: cErrMsg ? 'populated' : 'missing',
    });
  }

  // ─── 9. _debug_prompt_hashes parity (Phase -1 only) ───
  // If both runs carry prompt hashes, compare them call-by-call.
  // If only one carries them, that's a mismatch (expected during Phase -1
  // self-diff, but a signal during cross-environment comparisons).
  const gHashes = Array.isArray(golden?._debug_prompt_hashes)
    ? golden._debug_prompt_hashes
    : null;
  const cHashes = Array.isArray(candidate?._debug_prompt_hashes)
    ? candidate._debug_prompt_hashes
    : null;
  if (gHashes && cHashes) {
    totalChecks++;
    if (gHashes.length !== cHashes.length) {
      diffs.push({
        path: '_debug_prompt_hashes',
        kind: 'prompt_hash_count_mismatch',
        expected: gHashes.length,
        actual: cHashes.length,
      });
    } else {
      for (let i = 0; i < gHashes.length; i++) {
        const g = gHashes[i] || {};
        const c = cHashes[i] || {};
        if (g.call_label !== c.call_label) {
          diffs.push({
            path: `_debug_prompt_hashes[${i}].call_label`,
            kind: 'prompt_hash_label_mismatch',
            expected: g.call_label,
            actual: c.call_label,
          });
        }
        if (g.prompt_sha256 !== c.prompt_sha256) {
          diffs.push({
            path: `_debug_prompt_hashes[${i}].prompt_sha256`,
            kind: 'prompt_hash_mismatch',
            expected: g.prompt_sha256,
            actual: c.prompt_sha256,
            call_label: g.call_label,
          });
        }
      }
    }
  }

  // ─── Verdict ───
  let verdict;
  if (diffs.length === 0) {
    verdict = 'PERFECT_MATCH';
  } else {
    const hasStructural = diffs.some(
      (d) =>
        d.kind === 'presence_mismatch' ||
        d.kind === 'array_length_mismatch' ||
        d.kind === 'subdomain_presence_mismatch' ||
        d.kind === 'intersection_presence_mismatch' ||
        d.kind === 'render_md_presence_mismatch'
    );
    verdict = hasStructural ? 'STRUCTURAL_DIFF' : 'CONTENT_DIFF';
  }

  return {
    verdict,
    diffs,
    summary: {
      totalChecks,
      mismatches: diffs.length,
    },
  };
}

// ──────────────────────────────────────────────────────────────────────
// Handler
// ──────────────────────────────────────────────────────────────────────
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
        {
          error:
            'Invalid JSON body. Expected { goldenRun, candidateRunId } OR { goldenRun, candidateGoldenRun }.',
        },
        { status: 400 }
      );
    }

    const { goldenRun, candidateRunId, candidateGoldenRun } = payload || {};

    if (!goldenRun || typeof goldenRun !== 'object') {
      return Response.json(
        { error: 'Missing required field: goldenRun (full Run JSON object).' },
        { status: 400 }
      );
    }

    let candidate;
    if (candidateGoldenRun && typeof candidateGoldenRun === 'object') {
      // Self-diff / paste-in mode — used for AT -1.B (sanity check the comparator)
      candidate = candidateGoldenRun;
    } else if (candidateRunId && typeof candidateRunId === 'string') {
      // Fetch candidate from DB
      try {
        candidate = await base44.asServiceRole.entities.Run.get(candidateRunId);
      } catch (e) {
        return Response.json(
          { error: `Candidate run not found: ${candidateRunId}`, detail: e.message },
          { status: 404 }
        );
      }
      if (!candidate) {
        return Response.json(
          { error: `Candidate run not found: ${candidateRunId}` },
          { status: 404 }
        );
      }
    } else {
      return Response.json(
        {
          error:
            'Provide either candidateRunId (string) OR candidateGoldenRun (object).',
        },
        { status: 400 }
      );
    }

    const result = compareRuns(goldenRun, candidate);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});