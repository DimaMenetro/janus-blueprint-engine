import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { run_id } = await req.json();

    // Use list with a filter to avoid decompression issues on huge entities
    const runs = await base44.asServiceRole.entities.Run.filter({ id: run_id });
    if (!runs.length) return Response.json({ error: "Run not found" });
    const run = runs[0];

    return Response.json({
      id: run.id,
      status: run.status,
      has_corpus: !!run.corpus,
      has_cogito: !!run.cogito,
      has_animus: !!run.animus,
      has_actus: !!run.actus,
      has_synthesis: !!run.synthesis,
      has_blueprint: !!run.blueprint,
      synthesis_keys: run.synthesis ? Object.keys(run.synthesis) : [],
      blueprint_keys: run.blueprint ? Object.keys(run.blueprint) : [],
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});