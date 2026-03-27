import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { run_id } = await req.json();
    const runs = await base44.asServiceRole.entities.Run.filter({ id: run_id });
    const run = runs[0];
    if (!run) return Response.json({ error: "Run not found" });

    const synthesis = run.synthesis || null;
    const synthesisKeys = synthesis ? Object.keys(synthesis) : [];

    return Response.json({
      has_corpus: !!run.corpus,
      has_cogito: !!run.cogito,
      has_animus: !!run.animus,
      has_actus: !!run.actus,
      has_synthesis: !!synthesis,
      synthesis_keys: synthesisKeys,
      has_intersection_matrix: !!synthesis?.intersection_matrix,
      intersection_matrix_keys: synthesis?.intersection_matrix ? Object.keys(synthesis.intersection_matrix) : null,
      has_quantum_foresight: !!synthesis?.quantum_foresight,
      has_governed_cogito: !!synthesis?.governed_cogito,
      has_narrative_loop: !!synthesis?.narrative_loop,
      has_empathy_driven_strategy: !!synthesis?.empathy_driven_strategy,
      has_blueprint: !!run.blueprint,
      status: run.status,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});