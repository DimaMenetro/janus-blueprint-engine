import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { run_id } = await req.json();
    const runs = await base44.asServiceRole.entities.Run.filter({});
    const run = runs.find(r => r.id === run_id);
    if (!run) return Response.json({ error: "Run not found" });

    const errors = run.validation_errors || [];
    
    // Categorize errors
    const missingDomains = errors.filter(e => e.startsWith("Missing required domain"));
    const intersectionErrors = errors.filter(e => e.includes("intersection:"));
    const synthesisErrors = errors.filter(e => e.includes("synthesis"));
    const blueprintErrors = errors.filter(e => e.includes("blueprint"));
    const enumErrors = errors.filter(e => e.includes("not in allowed values"));
    const llmCallErrors = errors.filter(e => e.includes("LLM call failed"));
    const parseErrors = errors.filter(e => e.includes("Parse error"));
    const otherErrors = errors.filter(e => 
      !e.startsWith("Missing required domain") && 
      !e.includes("intersection:") && 
      !e.includes("not in allowed values") &&
      !e.includes("LLM call failed") &&
      !e.includes("Parse error")
    );

    return Response.json({
      total_errors: errors.length,
      categories: {
        missing_domains: missingDomains,
        intersection_errors: intersectionErrors,
        synthesis_errors: synthesisErrors,
        blueprint_errors: blueprintErrors,
        enum_errors: enumErrors.length,
        enum_sample: enumErrors.slice(0, 3),
        llm_call_failures: llmCallErrors,
        parse_errors: parseErrors,
        other: otherErrors
      },
      all_errors: errors
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});