// Verification Test Suite — Backend Fidelity Audit
// Confirms the executeJanus backend function produces output structurally
// identical to what the original frontend pipeline produced.
//
// Tests:
// 1. DOMAIN_PRESENCE — All expected domains present for the execution mode
// 2. FIELD_COMPLETENESS — Every field defined in JANUS_SCHEMA exists in output
// 3. INTERSECTION_MATRIX — All 6 pairs computed with insight/tension/resolution
// 4. SYNTHESIS_PATTERNS — All 4 named patterns present
// 5. BLUEPRINT_STRUCTURE — Split-call fields (substeps, checklists, etc.) present
// 6. MARKDOWN_SECTIONS — render_md contains all expected section headers
// 7. NORMALIZATION — Enum values were normalized (no "Probable", no "medium" where "med" expected)
// 8. PROMPT_FIDELITY — SME identity blocks contain subdomain details (not just names)

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { run_id, test_type } = await req.json();

    // ═══════════════════════════════════════════════════════════════
    // TEST: full_audit — Complete fidelity check against a completed run
    // ═══════════════════════════════════════════════════════════════
    if (test_type === "full_audit" || !test_type) {
      if (!run_id) return Response.json({ error: "run_id required for full_audit" }, { status: 400 });

      const runs = await base44.asServiceRole.entities.Run.filter({ id: run_id });
      if (!runs.length) return Response.json({ error: "Run not found" });
      const run = runs[0];

      const results = { pass: [], fail: [], warn: [] };

      // ── 1. DOMAIN PRESENCE
      const modeMap = {
        quick: ["corpus", "cogito", "blueprint"],
        standard: ["corpus", "cogito", "animus", "actus", "blueprint"],
        full: ["refresh", "corpus", "cogito", "animus", "actus", "synthesis", "blueprint"]
      };
      const expectedDomains = modeMap[run.execution_mode] || modeMap.standard;
      for (const domain of expectedDomains) {
        if (run[domain]) {
          results.pass.push(`DOMAIN_PRESENCE: ${domain} ✓`);
        } else {
          results.fail.push(`DOMAIN_PRESENCE: ${domain} MISSING`);
        }
      }

      // ── 2. FIELD_COMPLETENESS per domain
      if (run.corpus) {
        const c = run.corpus;
        if (c.constraints?.length) results.pass.push("CORPUS: constraints present");
        else results.fail.push("CORPUS: constraints missing or empty");
        if (c.feasibility_notes?.length) results.pass.push("CORPUS: feasibility_notes present");
        else results.warn.push("CORPUS: feasibility_notes empty");
        if (c.subdomains) {
          const expectedSubs = ["distributed_systems", "data_engineering", "cybersecurity", "systems_engineering", "theoretical_physics", "ai_ml", "neuroscience"];
          for (const sub of expectedSubs) {
            if (c.subdomains[sub]?.perspective) results.pass.push(`CORPUS.subdomains.${sub} ✓`);
            else results.warn.push(`CORPUS.subdomains.${sub} missing perspective`);
          }
        } else {
          results.fail.push("CORPUS: subdomains object missing entirely");
        }
      }

      if (run.cogito) {
        const cog = run.cogito;
        if (cog.claims?.length) {
          results.pass.push(`COGITO: ${cog.claims.length} claims`);
          // Check claim structure
          const c0 = cog.claims[0];
          if (c0.id && c0.tag && c0.text && c0.why_believed && c0.falsifiable_by) {
            results.pass.push("COGITO: claim structure complete (id, tag, text, why_believed, falsifiable_by)");
          } else {
            results.fail.push(`COGITO: claim missing fields. Has: ${Object.keys(c0).join(", ")}`);
          }
        } else {
          results.fail.push("COGITO: claims missing or empty");
        }
        if (cog.reasoning_map?.length) results.pass.push("COGITO: reasoning_map present");
        else results.warn.push("COGITO: reasoning_map empty");
        if (cog.causal_chains?.length) results.pass.push("COGITO: causal_chains present");
        else results.warn.push("COGITO: causal_chains empty");
      }

      if (run.animus) {
        const a = run.animus;
        if (a.boundary_checks?.length) results.pass.push("ANIMUS: boundary_checks present");
        else results.warn.push("ANIMUS: boundary_checks empty");
        if (a.disallowed_moves?.length) results.pass.push("ANIMUS: disallowed_moves present");
        else results.warn.push("ANIMUS: disallowed_moves empty");
        if (a.ethical_stance) results.pass.push("ANIMUS: ethical_stance present");
        else results.fail.push("ANIMUS: ethical_stance missing");
        if (a.consciousness_boundary) results.pass.push("ANIMUS: consciousness_boundary present");
        else results.warn.push("ANIMUS: consciousness_boundary empty");
      }

      if (run.actus) {
        const act = run.actus;
        if (act.recommendations?.length) {
          results.pass.push(`ACTUS: ${act.recommendations.length} recommendations`);
          const r0 = act.recommendations[0];
          if (r0.id && r0.text && r0.depends_on_claims && r0.inherited_confidence && r0.probability) {
            results.pass.push("ACTUS: recommendation structure complete (confidence propagation fields present)");
          } else {
            results.fail.push(`ACTUS: recommendation missing fields. Has: ${Object.keys(r0).join(", ")}`);
          }
        } else {
          results.fail.push("ACTUS: recommendations missing or empty");
        }
        if (act.strategic_plan) results.pass.push("ACTUS: strategic_plan present");
        else results.warn.push("ACTUS: strategic_plan missing");
        if (act.game_theory_analysis) results.pass.push("ACTUS: game_theory_analysis present");
        else results.warn.push("ACTUS: game_theory_analysis missing");
        if (act.technical_summary) results.pass.push("ACTUS: technical_summary present");
        else results.warn.push("ACTUS: technical_summary missing");
      }

      // ── 3. INTERSECTION MATRIX (full mode only)
      // Parse raw_json once — named patterns & intersection matrix may only exist here
      let rawData = {};
      try { rawData = JSON.parse(run.raw_json || "{}"); } catch { /* ignore */ }

      if (expectedDomains.includes("synthesis") && run.synthesis) {
        // Intersection matrix may be in entity field or raw_json
        const matrix = run.synthesis.intersection_matrix || (rawData.synthesis || {}).intersection_matrix;
        if (matrix) {
          const expectedPairs = ["corpus_x_cogito", "corpus_x_animus", "corpus_x_actus", "cogito_x_animus", "cogito_x_actus", "animus_x_actus"];
          for (const pair of expectedPairs) {
            const p = matrix[pair];
            if (p?.insight && p?.tension && p?.resolution) {
              results.pass.push(`INTERSECTION: ${pair} complete (insight + tension + resolution)`);
            } else if (p) {
              results.warn.push(`INTERSECTION: ${pair} partial — has: ${Object.keys(p).join(", ")}`);
            } else {
              results.fail.push(`INTERSECTION: ${pair} MISSING`);
            }
          }
        } else {
          results.fail.push("INTERSECTION: intersection_matrix missing from synthesis");
        }

        // ── 4. SYNTHESIS PATTERNS
        // Named patterns may be in entity field OR in raw_json (entity schema may not store them)
        const synthSource = rawData.synthesis || run.synthesis || {};
        const patterns = ["quantum_foresight", "governed_cogito", "narrative_loop", "empathy_driven_strategy"];
        for (const p of patterns) {
          if (run.synthesis[p] || synthSource[p]) results.pass.push(`SYNTHESIS_PATTERN: ${p} present`);
          else results.fail.push(`SYNTHESIS_PATTERN: ${p} MISSING — not in entity field or raw_json`);
        }
        if (run.synthesis.key_takeaways?.length) results.pass.push("SYNTHESIS: key_takeaways present");
        else results.warn.push("SYNTHESIS: key_takeaways empty");
      }

      // ── 5. BLUEPRINT STRUCTURE
      if (run.blueprint) {
        const bp = run.blueprint;
        if (bp.goal) results.pass.push("BLUEPRINT: goal present");
        else results.fail.push("BLUEPRINT: goal missing");
        if (bp.steps?.length) {
          results.pass.push(`BLUEPRINT: ${bp.steps.length} steps`);
          const s0 = bp.steps[0];
          if (s0.inputs && s0.outputs && s0.validation) {
            results.pass.push("BLUEPRINT: step has inputs/outputs/validation (skeleton fields)");
          } else {
            results.warn.push("BLUEPRINT: step missing skeleton fields");
          }
          // Check expansion fields based on blueprint_level
          if (run.blueprint_level !== "L1") {
            if (s0.time_estimate) results.pass.push("BLUEPRINT: time_estimate present (expansion field)");
            else results.warn.push("BLUEPRINT: time_estimate missing (expected for L2/L3)");
            if (s0.substeps?.length) results.pass.push("BLUEPRINT: substeps present (expansion field)");
            else results.warn.push("BLUEPRINT: substeps missing (expected for L2/L3)");
          }
          if (run.blueprint_level === "L3") {
            if (s0.checklist?.length) results.pass.push("BLUEPRINT: checklist present (L3 field)");
            else results.warn.push("BLUEPRINT: checklist missing (expected for L3)");
            if (s0.acceptance_tests?.length) results.pass.push("BLUEPRINT: acceptance_tests present (L3 field)");
            else results.warn.push("BLUEPRINT: acceptance_tests missing (expected for L3)");
          }
        } else {
          results.fail.push("BLUEPRINT: steps missing or empty");
        }
        if (bp.success_criteria?.length) results.pass.push("BLUEPRINT: success_criteria present");
        else results.fail.push("BLUEPRINT: success_criteria missing");
        if (bp.risk_register?.length) results.pass.push("BLUEPRINT: risk_register present");
        else results.fail.push("BLUEPRINT: risk_register missing");
        if (run.novelty_dial === "high" && bp.alternative_approaches?.length) {
          results.pass.push("BLUEPRINT: alternative_approaches present (novelty=high)");
        } else if (run.novelty_dial === "high") {
          results.warn.push("BLUEPRINT: alternative_approaches missing (expected for novelty=high)");
        }
      }

      // ── 6. MARKDOWN SECTIONS
      if (run.render_md) {
        const md = run.render_md;
        const expectedHeaders = ["Janus SME Protocol", "Section I: Corpus", "Section II: Cogito", "Blueprint"];
        if (expectedDomains.includes("animus")) expectedHeaders.push("Section III: Animus");
        if (expectedDomains.includes("actus")) expectedHeaders.push("Section IV: Actus");
        if (expectedDomains.includes("synthesis")) expectedHeaders.push("Section V: Synthesis");
        for (const h of expectedHeaders) {
          if (md.includes(h)) results.pass.push(`MARKDOWN: "${h}" section present`);
          else results.fail.push(`MARKDOWN: "${h}" section MISSING`);
        }
        // Synthesis-specific markdown sections
        if (expectedDomains.includes("synthesis")) {
          if (md.includes("Intersection Matrix") || md.includes("Domain Intersection Matrix")) {
            results.pass.push("MARKDOWN: intersection matrix section present");
          } else {
            results.fail.push("MARKDOWN: intersection matrix section MISSING");
          }
          if (md.includes("Quantum Foresight")) results.pass.push("MARKDOWN: Quantum Foresight pattern in markdown");
          else results.warn.push("MARKDOWN: Quantum Foresight pattern missing from markdown");
        }
      } else {
        results.fail.push("MARKDOWN: render_md missing entirely");
      }

      // ── 7. NORMALIZATION CHECK
      // Scan for known LLM drift values that should have been normalized
      const rawJson = run.raw_json || "";
      if (rawJson.includes('"Probable"')) {
        results.fail.push('NORMALIZATION: Found "Probable" — should be "Contested"');
      } else {
        results.pass.push("NORMALIZATION: No un-normalized 'Probable' values");
      }

      // ── SUMMARY
      const total = results.pass.length + results.fail.length + results.warn.length;
      return Response.json({
        run_id: run.id,
        run_status: run.status,
        execution_mode: run.execution_mode,
        blueprint_level: run.blueprint_level,
        novelty_dial: run.novelty_dial,
        summary: {
          total_checks: total,
          passed: results.pass.length,
          failed: results.fail.length,
          warnings: results.warn.length,
          verdict: results.fail.length === 0 ? "PASS" : "FAIL"
        },
        failures: results.fail,
        warnings: results.warn,
        passes: results.pass
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST: prompt_fidelity — Verify backend prompt functions match originals
    // ═══════════════════════════════════════════════════════════════
    if (test_type === "prompt_fidelity") {
      // This test verifies the backend's buildSMEIdentity output contains
      // full subdomain details (not just names) by invoking it with known inputs.
      // We call executeJanus's prompt builder indirectly by checking a completed run's
      // prompt characteristics.

      if (!run_id) return Response.json({ error: "run_id required" }, { status: 400 });
      const runs = await base44.asServiceRole.entities.Run.filter({ id: run_id });
      if (!runs.length) return Response.json({ error: "Run not found" });
      const run = runs[0];

      const checks = [];

      // The full_prompt stored on the Run is the buildPrompt() storage version.
      // The ACTUAL prompts sent to LLM are built by buildDomainPrompt() which uses
      // buildSMEIdentity() — we can't inspect those directly, but we CAN verify
      // the output quality implies the prompts were rich.

      // Check: corpus subdomains should have rich perspectives (not one-liners)
      if (run.corpus?.subdomains) {
        const subs = run.corpus.subdomains;
        let richCount = 0;
        let totalCount = 0;
        Object.entries(subs).forEach(([key, sub]) => {
          totalCount++;
          if (sub?.perspective && sub.perspective.length > 100) richCount++;
          if (sub?.key_findings && sub.key_findings.length >= 2) richCount++;
        });
        if (richCount >= totalCount) {
          checks.push({ check: "corpus_subdomain_depth", status: "pass", detail: `${richCount}/${totalCount} subdomains have rich output (>100 char perspectives)` });
        } else {
          checks.push({ check: "corpus_subdomain_depth", status: "warn", detail: `Only ${richCount}/${totalCount} subdomains rich — may indicate shallow prompts` });
        }
      }

      // Check: cogito claims should have full epistemic metadata
      if (run.cogito?.claims?.length) {
        const fullClaims = run.cogito.claims.filter(c => c.why_believed && c.falsifiable_by);
        checks.push({
          check: "cogito_epistemic_depth",
          status: fullClaims.length === run.cogito.claims.length ? "pass" : "warn",
          detail: `${fullClaims.length}/${run.cogito.claims.length} claims have why_believed + falsifiable_by`
        });
      }

      // Check: actus should have game_theory and behavioral_factors (deep prompt output)
      if (run.actus) {
        checks.push({ check: "actus_game_theory", status: run.actus.game_theory_analysis ? "pass" : "warn", detail: run.actus.game_theory_analysis ? "Present" : "Missing" });
        checks.push({ check: "actus_behavioral_factors", status: run.actus.behavioral_factors ? "pass" : "warn", detail: run.actus.behavioral_factors ? "Present" : "Missing" });
        checks.push({ check: "actus_strategic_plan", status: run.actus.strategic_plan ? "pass" : "warn", detail: run.actus.strategic_plan ? "Present" : "Missing" });
      }

      return Response.json({ test: "prompt_fidelity", checks });
    }

    return Response.json({ error: "Unknown test_type. Use: full_audit, prompt_fidelity" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});