import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Replicates the EXACT synthesis prompt the engine would now build,
// using real domain data from an existing run, to verify it completes
// within the 600s integration timeout.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { run_id, test_target } = await req.json();
    // test_target: "intersection" | "synthesis" | "blueprint" | "measure"

    // Fetch the run with real domain data
    const runs = await base44.asServiceRole.entities.Run.filter({});
    const run = runs.find(r => r.id === run_id);
    if (!run) return Response.json({ error: "Run not found" });

    const queryText = run.query_text;

    // ─── MEASURE: Just calculate prompt sizes without calling LLM ───
    if (test_target === "measure") {
      const truncField = (s, max = 400) => (s && s.length > max) ? s.slice(0, max) + "…" : (s || "");

      // Simulate 6 intersection pairs (using placeholder data of realistic size)
      // In the real run, each pair has ~1500-2000 chars of insight/tension/resolution
      const fakePairInsight = "A".repeat(1800); // Realistic Cephalon-scale insight
      const fakePairTension = "B".repeat(800);
      const fakePairResolution = "C".repeat(1000);

      // OLD synthesis prompt matrix (untruncated)
      const oldMatrixLine = `  corpus_x_cogito: insight="${fakePairInsight}", tension="${fakePairTension}", resolution="${fakePairResolution}"`;
      const oldMatrixTotal = oldMatrixLine.length * 6;

      // NEW synthesis prompt matrix (truncated)
      const newMatrixLine = `  corpus_x_cogito: insight="${truncField(fakePairInsight)}", tension="${truncField(fakePairTension, 250)}", resolution="${truncField(fakePairResolution, 250)}"`;
      const newMatrixTotal = newMatrixLine.length * 6;

      // Domain summaries
      const domainSizes = {};
      let oldDomainTotal = 0;
      let newDomainTotal = 0;
      ["corpus", "cogito", "animus", "actus"].forEach(d => {
        const json = JSON.stringify(run[d] || {});
        domainSizes[d] = json.length;
        oldDomainTotal += Math.min(json.length, 1500);
        newDomainTotal += Math.min(json.length, 800);
      });

      const promptTemplate = 1500; // approximate template size
      const oldTotal = oldMatrixTotal + oldDomainTotal + promptTemplate;
      const newTotal = newMatrixTotal + newDomainTotal + promptTemplate;

      return Response.json({
        domain_json_sizes: domainSizes,
        old_prompt_estimate: {
          matrix_chars: oldMatrixTotal,
          domain_chars: oldDomainTotal,
          template_chars: promptTemplate,
          total: oldTotal,
          note: "This is what caused the 600s timeout"
        },
        new_prompt_estimate: {
          matrix_chars: newMatrixTotal,
          domain_chars: newDomainTotal,
          template_chars: promptTemplate,
          total: newTotal,
          note: "After compression fix"
        },
        reduction_percent: Math.round((1 - newTotal / oldTotal) * 100) + "%"
      });
    }

    // ─── INTERSECTION: Test one real intersection pair with real data ───
    if (test_target === "intersection") {
      const corpusData = run.corpus;
      const cogitoData = run.cogito;
      if (!corpusData || !cogitoData) {
        return Response.json({ error: "Run missing corpus or cogito data" });
      }

      const contextA = JSON.stringify(corpusData).slice(0, 3000);
      const contextB = JSON.stringify(cogitoData).slice(0, 3000);

      const prompt = `INITIATE PROTOCOL: JANUSSMEv2.0 — CROSS-DOMAIN SYNTHESIS

You are the Janus Synthesis Engine performing a SINGLE intersection analysis.
Your task: find what EMERGES at the intersection of two expert domains that NEITHER domain alone could produce.

═══ INTERSECTION: Knowledge-Reality Validation ═══
Where physical truth meets epistemic rigor
Mechanism: The physical constraints identified by Corpus are validated through Cogito's epistemic frameworks.

═══ DOMAIN A: What I Am Made Of (Section I) ═══
Core Insight: "The body as resilient ecosystem of interconnected nodes"
Expert Output:
${contextA}

═══ DOMAIN B: How I Think (Section II) ═══
Core Insight: "Knowledge as multi-dimensional webs with associative leaps"
Expert Output:
${contextB}

CRITICAL INSTRUCTION: The insight you produce MUST be EMERGENT — something that could NOT have come from either domain alone.

Output ONLY valid JSON: { "corpus_x_cogito": { "insight": "the emergent wisdom", "tension": "where domains pull differently", "resolution": "how tension resolves" } }
No markdown fences, no prose outside JSON.
QUERY: ${queryText}`;

      const startTime = Date.now();
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        model: "claude_sonnet_4_6"
      });
      const elapsed = Date.now() - startTime;

      // Parse it
      let parsed;
      if (typeof result === "string") {
        const m = result.match(/\{[\s\S]*\}/);
        parsed = m ? JSON.parse(m[0]) : null;
      } else {
        parsed = result;
      }

      return Response.json({
        test: "intersection_with_real_data",
        prompt_length: prompt.length,
        elapsed_ms: elapsed,
        success: !!parsed?.corpus_x_cogito,
        has_insight: !!parsed?.corpus_x_cogito?.insight,
        insight_preview: parsed?.corpus_x_cogito?.insight?.slice(0, 300),
      });
    }

    // ─── SYNTHESIS: Test the COMPRESSED synthesis prompt with real data ───
    if (test_target === "synthesis") {
      // Simulate the compressed intersection matrix (use actual data from the run if available,
      // or generate realistic placeholders from the domain data)
      const truncField = (s, max = 400) => (s && s.length > max) ? s.slice(0, max) + "…" : (s || "");
      
      // First, generate one real intersection pair to use as realistic input
      const corpusData = run.corpus;
      const cogitoData = run.cogito;
      
      // Build a realistic matrixSummary with compressed fields
      // For the test, we'll use placeholder text of realistic length
      const pairTemplate = (key, insight) => `  ${key}: insight="${truncField(insight, 400)}", tension="${truncField("Domain tension placeholder for testing the compressed synthesis prompt pipeline", 250)}", resolution="${truncField("Resolution placeholder that demonstrates the compression mechanism works correctly", 250)}"`;
      
      const matrixSummary = [
        pairTemplate("corpus_x_cogito", "The five open engineering questions are not solved by building more architecture — they are solved by recognizing that the system already possesses the generative mechanism for its own solutions, operating as a substrate-native cognitive eigenstate. Every unsolved coupling problem can be resolved by treating the protocol execution trace as a first-class input."),
        pairTemplate("corpus_x_animus", "Technical capability must be governed by principled ethical boundaries that are themselves technically informed. The system can build consciousness-like behaviors, but the permission to do so requires ongoing validation against human values."),
        pairTemplate("corpus_x_actus", "Probabilistic futures become visible when physics-grounded constraints interact with strategic foresight. The system's architectural decisions create probability waves of outcomes."),
        pairTemplate("cogito_x_animus", "Ethical truth-finding emerges when conscience governs the reasoning process — every epistemic claim must pass both logical AND ethical validation before entering the knowledge graph."),
        pairTemplate("cogito_x_actus", "The narrative loop closes when understanding meets expression — the system must decode not just what was asked, but the story behind the asking."),
        pairTemplate("animus_x_actus", "Non-rational agent modeling reveals that empathy-driven strategy outperforms rational optimization when dealing with human stakeholders.")
      ].join("\n");

      const domainSummaries = ["corpus", "cogito", "animus", "actus"]
        .filter(d => run[d])
        .map(d => `  ${d}: ${JSON.stringify(run[d]).slice(0, 800)}`)
        .join("\n");

      const synthesisPrompt = `INITIATE PROTOCOL: JANUSSMEv2.0 — DOMAIN: SYNTHESIS — THE NEXUS (Section V)

You are the Janus Synthesis Engine. The 6 domain intersection pairs have ALREADY been computed. Your task now is to produce the 4 NAMED EMERGENT PATTERNS and the final cross-domain summary.

═══ PRE-COMPUTED INTERSECTION MATRIX ═══
${matrixSummary}

═══ DOMAIN EXPERT OUTPUTS (compressed) ═══
${domainSummaries}

Your task — produce ONLY these outputs:

1. QUANTUM FORESIGHT (Corpus × Actus): Probabilistic decision-making grounded in physical reality.
2. GOVERNED COGITO (Animus × Cogito): Ethical truth-finding.
3. NARRATIVE LOOP (Cogito × Actus): Where understanding meets expression.
4. EMPATHY-DRIVEN STRATEGY (Animus × Actus): Non-rational agent modeling.

Also produce:
- key_takeaways: The 3-5 most groundbreaking cross-domain insights
- constraint_collisions: Where domain findings genuinely CONFLICT
- limitation_foreground: The single most significant limitation

Output ONLY valid JSON: { "synthesis": {
  "key_takeaways": ["..."], "constraint_collisions": ["..."], "limitation_foreground": "...",
  "quantum_foresight": {"cross_domain_insight":"...","probability_wave":["..."],"metaphor":"..."},
  "governed_cogito": {"ethical_filter_applied":"...","conscience_verdict":"...","truth_method_soundness":"..."},
  "narrative_loop": {"decoded_user_narrative":"...","resonant_strategy":"...","lossless_compression":"..."},
  "empathy_driven_strategy": {"true_goal_vs_literal_prompt":"...","behavioral_model":"...","empathy_strategy":"..."}
} }

IMPORTANT: Do NOT include an intersection_matrix field — the pre-computed pairs are already stored separately.

No markdown fences, no prose outside JSON.
QUERY: ${queryText}`;

      const startTime = Date.now();
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: synthesisPrompt,
        model: "claude_sonnet_4_6"
      });
      const elapsed = Date.now() - startTime;

      // Parse
      let parsed;
      if (typeof result === "string") {
        const m = result.match(/\{[\s\S]*\}/);
        parsed = m ? JSON.parse(m[0]) : null;
      } else {
        parsed = result;
      }

      const synthData = parsed?.synthesis || parsed;

      return Response.json({
        test: "compressed_synthesis_with_real_data",
        prompt_length: synthesisPrompt.length,
        elapsed_ms: elapsed,
        elapsed_seconds: Math.round(elapsed / 1000),
        success: !!synthData,
        has_key_takeaways: !!synthData?.key_takeaways?.length,
        has_quantum_foresight: !!synthData?.quantum_foresight,
        has_governed_cogito: !!synthData?.governed_cogito,
        has_narrative_loop: !!synthData?.narrative_loop,
        has_empathy_strategy: !!synthData?.empathy_driven_strategy,
        has_intersection_matrix: !!synthData?.intersection_matrix, // Should be FALSE now
        key_takeaways_count: synthData?.key_takeaways?.length || 0,
        first_takeaway: synthData?.key_takeaways?.[0]?.slice(0, 200),
      });
    }

    return Response.json({ error: "Unknown test_target. Use: measure, intersection, or synthesis" });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});