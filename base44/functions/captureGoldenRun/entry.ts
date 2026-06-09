/**
 * captureGoldenRun.js
 *
 * IMP-002-R-D-SRV — Phase -1, subtask -1.5/-1.6
 *
 * Returns a compact REFERENCE CARD for a completed golden Run, suitable for
 * writing to docs/golden_runs/<label>.json. The card embeds:
 *   - Run metadata (query, mode, level, novelty, status, timestamps)
 *   - 8-gate verification results
 *   - Field sizes (render_md, raw_json byte lengths)
 *   - SHA-256 content hashes of render_md and raw_json (drift detection)
 *   - Structural fingerprints (array lengths per domain) for cheap comparison
 *   - Full prompt-hash array (7 entries for Standard) — preserved verbatim
 *   - retry_log + validation_errors (full)
 *
 * The full Run payload remains in the database. `compareToGolden` supports
 * runId-based fetch when byte-identical comparison is needed.
 *
 * Card size: ~3-5 KB. Fits within tool response budgets.
 *
 * Usage:
 *   test_backend_function('captureGoldenRun', { runId: '<id>', label: 'STANDARD_v1' })
 *
 * Will be archived or removed at end of Phase -1 cleanup.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const EXPECTED_HASH_LABELS_STANDARD = [
  'domain:corpus', 'domain:cogito', 'domain:animus', 'domain:actus',
  'blueprint:skeleton', 'blueprint:expansion', 'blueprint:criteria',
];

async function sha256Hex(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s || ''));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function len(x) {
  return Array.isArray(x) ? x.length : 0;
}

function buildStructuralFingerprint(run) {
  const corpus = run.corpus || {};
  const cogito = run.cogito || {};
  const animus = run.animus || {};
  const actus = run.actus || {};
  const blueprint = run.blueprint || {};
  const synthesis = run.synthesis || null;

  return {
    corpus: {
      constraints_count: len(corpus.constraints),
      feasibility_notes_count: len(corpus.feasibility_notes),
      subdomain_keys: corpus.subdomains ? Object.keys(corpus.subdomains).sort() : [],
    },
    cogito: {
      claims_count: len(cogito.claims),
      reasoning_map_count: len(cogito.reasoning_map),
      graphrag_connections_count: len(cogito.graphrag_connections),
      causal_chains_count: len(cogito.causal_chains),
      neuro_symbolic_insights_count: len(cogito.neuro_symbolic_insights),
    },
    animus: {
      boundary_checks_count: len(animus.boundary_checks),
      disallowed_moves_count: len(animus.disallowed_moves),
      safety_notes_count: len(animus.safety_notes),
      attractor_states_count: len(animus.attractor_states),
      has_risk_analysis: !!animus.risk_analysis,
    },
    actus: {
      recommendations_count: len(actus.recommendations),
      has_strategic_plan: !!actus.strategic_plan,
      has_game_theory_analysis: !!actus.game_theory_analysis,
      integration_contracts_count: len(actus.integration_contracts),
    },
    synthesis: synthesis ? {
      key_takeaways_count: len(synthesis.key_takeaways),
      constraint_collisions_count: len(synthesis.constraint_collisions),
      intersection_matrix_keys: synthesis.intersection_matrix
        ? Object.keys(synthesis.intersection_matrix).sort() : [],
    } : null,
    blueprint: {
      assumptions_count: len(blueprint.assumptions),
      alternative_approaches_count: len(blueprint.alternative_approaches),
      steps_count: len(blueprint.steps),
      success_criteria_count: len(blueprint.success_criteria),
      risk_register_count: len(blueprint.risk_register),
      has_goal: !!blueprint.goal,
    },
  };
}

function evaluateGates(run) {
  const hashes = run.debug_prompt_hashes || [];
  const labels = [...new Set(hashes.map((h) => h.call_label))];
  const expected = run.execution_mode === 'full'
    ? [...EXPECTED_HASH_LABELS_STANDARD] // Full mode TBD; Phase -1.6 will extend
    : EXPECTED_HASH_LABELS_STANDARD;
  const missingLabels = expected.filter((l) => !labels.includes(l));
  const hexRe = /^[a-f0-9]{64}$/;
  const invalidHashCount = hashes.filter((h) => !hexRe.test(h.prompt_hash_sha256 || '')).length;
  const errs = run.validation_errors || [];
  const fatalRe = /(missing required domain|LLM call failed|exceeded timeout|orphan)/i;
  const fatalCount = errs.filter((e) => fatalRe.test(e)).length;

  const gates = {
    g1_status_completed: run.status === 'completed',
    g2_all_domains_present: !!(run.corpus && run.cogito && run.animus && run.actus && run.blueprint),
    g3_render_md_present: !!run.render_md && run.render_md.length > 0,
    g4_raw_json_nontrivial: !!run.raw_json && run.raw_json !== '{}' && run.raw_json.length > 10,
    g5_hashes_present: hashes.length > 0,
    g6_all_labels_present: missingLabels.length === 0,
    g7_all_hex_valid: invalidHashCount === 0,
    g8_no_fatal_errors: fatalCount === 0,
  };
  const all_pass = Object.values(gates).every(Boolean);
  return { gates, all_pass, missing_labels: missingLabels, invalid_hash_count: invalidHashCount, fatal_error_count: fatalCount };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let payload;
    try {
      payload = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body. Expected { runId, label }.' }, { status: 400 });
    }

    const { runId, label } = payload || {};
    if (!runId || typeof runId !== 'string') {
      return Response.json({ error: 'Missing required field: runId (string).' }, { status: 400 });
    }
    if (!label || typeof label !== 'string') {
      return Response.json({ error: 'Missing required field: label (string), e.g. "STANDARD_v1".' }, { status: 400 });
    }

    let run;
    try {
      run = await base44.asServiceRole.entities.Run.get(runId);
    } catch (e) {
      return Response.json({ error: `Run not found: ${runId}`, detail: e.message }, { status: 404 });
    }
    if (!run) return Response.json({ error: `Run not found: ${runId}` }, { status: 404 });

    if (run.status !== 'completed') {
      return Response.json(
        { error: `Run is not completed. Status: ${run.status}.`, run_status: run.status },
        { status: 409 }
      );
    }

    const gateResult = evaluateGates(run);
    const renderMd = run.render_md || '';
    const rawJson = run.raw_json || '';

    const card = {
      label,
      schema_version: '1.0',
      captured_at: new Date().toISOString(),
      run_id: run.id,
      run_meta: {
        query_text: run.query_text,
        execution_mode: run.execution_mode,
        output_mode: run.output_mode,
        blueprint_level: run.blueprint_level,
        novelty_dial: run.novelty_dial,
        refresh_enabled: !!run.refresh_enabled,
        status: run.status,
        created_date: run.created_date,
        updated_date: run.updated_date,
      },
      gates: gateResult.gates,
      all_pass: gateResult.all_pass,
      gate_details: {
        missing_labels: gateResult.missing_labels,
        invalid_hash_count: gateResult.invalid_hash_count,
        fatal_error_count: gateResult.fatal_error_count,
      },
      field_sizes: {
        render_md: renderMd.length,
        raw_json: rawJson.length,
      },
      content_hashes: {
        render_md_sha256: await sha256Hex(renderMd),
        raw_json_sha256: await sha256Hex(rawJson),
      },
      structural_fingerprint: buildStructuralFingerprint(run),
      prompt_hashes: run.debug_prompt_hashes || [],
      retry_log: run.retry_log || [],
      validation_errors: run.validation_errors || [],
      _notes: [
        'Full Run payload retrievable via base44.asServiceRole.entities.Run.get(run_id).',
        'compareToGolden supports runId-based fetch for byte-level comparison.',
        'Do not delete the Run record referenced by this card without first migrating to an embedded archive.',
      ].join(' '),
    };

    return Response.json(card);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});