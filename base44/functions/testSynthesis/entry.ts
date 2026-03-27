import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { test_type, run_id } = await req.json();

    // Test 1: Test intersection pair parsing
    if (test_type === "intersection") {
      const prompt = `INITIATE PROTOCOL: JANUSSMEv2.0 — CROSS-DOMAIN SYNTHESIS

You are the Janus Synthesis Engine performing a SINGLE intersection analysis.
Your task: find what EMERGES at the intersection of two expert domains that NEITHER domain alone could produce.

═══ INTERSECTION: Knowledge-Reality Validation ═══
Where physical truth meets epistemic rigor
Mechanism: The physical constraints identified by Corpus are validated through Cogito's epistemic frameworks.

═══ DOMAIN A: What I Am Made Of (Section I) ═══
Core Insight: "The body as resilient ecosystem of interconnected nodes"
Expert Output:
{"constraints":["Physical law is non-negotiable","tanh bounding prevents unbounded growth"],"feasibility_notes":["Eigenstate memory compression is buildable today"]}

═══ DOMAIN B: How I Think (Section II) ═══
Core Insight: "Knowledge as multi-dimensional webs with associative leaps"
Expert Output:
{"claims":[{"id":"C1","tag":"Established","text":"Crystal matrix provides stable identity anchor"}],"reasoning_map":["Step 1: Verify mathematical foundations"]}

Output ONLY valid JSON: { "corpus_x_cogito": { "insight": "the emergent wisdom", "tension": "where domains pull differently", "resolution": "how tension resolves" } }
No markdown fences, no prose outside JSON.
QUERY: Test query for intersection parsing`;

      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        model: "claude_sonnet_4_6"
      });

      return Response.json({
        test: "intersection",
        result_type: typeof result,
        result_is_string: typeof result === "string",
        result_is_object: typeof result === "object" && result !== null,
        result_keys: typeof result === "object" && result !== null ? Object.keys(result) : null,
        has_corpus_x_cogito: typeof result === "object" && result !== null ? ("corpus_x_cogito" in result) : null,
        raw_result: typeof result === "string" ? result.slice(0, 2000) : JSON.stringify(result).slice(0, 2000),
        // Try the exact parsing logic from ExecutionEngine
        parse_test: (() => {
          let data;
          if (typeof result === "string") {
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return { error: "No JSON found in string response" };
            data = JSON.parse(jsonMatch[0]);
          } else {
            data = result;
          }
          const expectedKey = "corpus_x_cogito";
          if (data && data[expectedKey]) {
            return { path: "direct_key_match", data: data[expectedKey] };
          }
          if (data && !data[expectedKey] && typeof data === "object" && Object.keys(data).length > 0) {
            return { path: "fallback_whole_object", keys: Object.keys(data), data };
          }
          return { path: "no_match", error: "Missing key" };
        })()
      });
    }

    // Test 2: Test synthesis domain parsing
    if (test_type === "synthesis") {
      const prompt = `INITIATE PROTOCOL: JANUSSMEv2.0 — DOMAIN: SYNTHESIS — THE NEXUS (Section V)

You are the Janus Synthesis Engine. The 6 domain intersection pairs have ALREADY been computed. Your task now is to produce the 4 NAMED EMERGENT PATTERNS and the final cross-domain summary.

═══ PRE-COMPUTED INTERSECTION MATRIX ═══
  corpus_x_cogito: insight="Test insight A", tension="Test tension A", resolution="Test resolution A"
  corpus_x_animus: insight="Test insight B", tension="Test tension B", resolution="Test resolution B"
  corpus_x_actus: insight="Test insight C", tension="Test tension C", resolution="Test resolution C"
  cogito_x_animus: insight="Test insight D", tension="Test tension D", resolution="Test resolution D"
  cogito_x_actus: insight="Test insight E", tension="Test tension E", resolution="Test resolution E"
  animus_x_actus: insight="Test insight F", tension="Test tension F", resolution="Test resolution F"

═══ DOMAIN EXPERT OUTPUTS (compressed) ═══
  What I Am Made Of: {"constraints":["test constraint"]}
  How I Think: {"claims":[{"id":"C1","tag":"Established","text":"test claim"}]}
  Who I Am: {"ethical_stance":"test ethics"}
  What I Do: {"recommendations":[{"id":"R1","text":"test rec"}]}

Your task — produce ONLY these outputs:

1. QUANTUM FORESIGHT (Corpus × Actus)
2. GOVERNED COGITO (Animus × Cogito)
3. NARRATIVE LOOP (Cogito × Actus)
4. EMPATHY-DRIVEN STRATEGY (Animus × Actus)

Also produce:
- key_takeaways, constraint_collisions, limitation_foreground

Output ONLY valid JSON: { "synthesis": {
  "key_takeaways": ["..."], "constraint_collisions": ["..."], "limitation_foreground": "...",
  "intersection_matrix": { "corpus_x_cogito": {"insight":"...","tension":"...","resolution":"..."}, "corpus_x_animus": {"insight":"...","tension":"...","resolution":"..."}, "corpus_x_actus": {"insight":"...","tension":"...","resolution":"..."}, "cogito_x_animus": {"insight":"...","tension":"...","resolution":"..."}, "cogito_x_actus": {"insight":"...","tension":"...","resolution":"..."}, "animus_x_actus": {"insight":"...","tension":"...","resolution":"..."} },
  "quantum_foresight": {"cross_domain_insight":"...","probability_wave":["..."],"metaphor":"..."},
  "governed_cogito": {"ethical_filter_applied":"...","conscience_verdict":"...","truth_method_soundness":"..."},
  "narrative_loop": {"decoded_user_narrative":"...","resonant_strategy":"...","lossless_compression":"..."},
  "empathy_driven_strategy": {"true_goal_vs_literal_prompt":"...","behavioral_model":"...","empathy_strategy":"..."}
} }
No markdown fences, no prose outside JSON.
QUERY: Test query for synthesis parsing`;

      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        model: "claude_sonnet_4_6"
      });

      return Response.json({
        test: "synthesis",
        result_type: typeof result,
        result_is_string: typeof result === "string",
        result_is_object: typeof result === "object" && result !== null,
        result_keys: typeof result === "object" && result !== null ? Object.keys(result) : null,
        has_synthesis_key: typeof result === "object" && result !== null ? ("synthesis" in result) : null,
        raw_result: typeof result === "string" ? result.slice(0, 3000) : JSON.stringify(result).slice(0, 3000),
        // Try the exact parsing logic
        parse_test: (() => {
          let data;
          if (typeof result === "string") {
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return { error: "No JSON found in string response" };
            data = JSON.parse(jsonMatch[0]);
          } else {
            data = result;
          }
          const expectedKey = "synthesis";
          if (data && data[expectedKey]) {
            return { path: "direct_key_match", keys: Object.keys(data[expectedKey]) };
          }
          if (data && !data[expectedKey] && typeof data === "object" && Object.keys(data).length > 0) {
            return { path: "fallback_whole_object", keys: Object.keys(data) };
          }
          return { path: "no_match", error: "Missing key" };
        })()
      });
    }

    // Test 3: Check the actual run's validation_errors
    if (test_type === "check_run") {
      const runs = await base44.asServiceRole.entities.Run.filter({ id: run_id });
      if (!runs || runs.length === 0) {
        return Response.json({ error: "Run not found" });
      }
      const run = runs[0];
      return Response.json({
        status: run.status,
        execution_mode: run.execution_mode,
        has_refresh: !!run.refresh,
        has_corpus: !!run.corpus,
        has_cogito: !!run.cogito,
        has_animus: !!run.animus,
        has_actus: !!run.actus,
        has_synthesis: !!run.synthesis,
        has_blueprint: !!run.blueprint,
        has_render_md: !!run.render_md,
        has_raw_json: !!run.raw_json,
        validation_errors: run.validation_errors,
        error_message: run.error_message,
        raw_json_length: run.raw_json ? run.raw_json.length : 0,
        raw_json_has_synthesis: run.raw_json ? run.raw_json.includes('"synthesis"') : false,
        raw_json_has_blueprint: run.raw_json ? run.raw_json.includes('"blueprint"') : false,
      });
    }

    return Response.json({ error: "Unknown test_type. Use: intersection, synthesis, or check_run" });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});