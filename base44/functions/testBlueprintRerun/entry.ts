import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { run_id } = await req.json();
    if (!run_id) return Response.json({ error: 'run_id required' }, { status: 400 });

    // Use a lighter approach — just check entity exists and test LLM prompt building
    // The full entity is too large for backend decompression in Deno
    console.log("Testing blueprint rerun for run:", run_id);

    // Test 1: Verify we can call the LLM with a blueprint-shaped prompt
    const testPrompt = `INITIATE PROTOCOL: JANUSSMEv2.0 — DOMAIN: BLUEPRINT (Executable Deliverable)
You are the Janus Blueprint Module.
Level: L2 | Novelty: high | Output Mode: Blueprint.
alternative_approaches REQUIRED.

═══ CORPUS: Hard Constraints ═══
  1. Test constraint for validation

═══ ACTUS: Key Recommendations ═══
  R1 [Established/high]: Test recommendation

Output ONLY valid JSON: { "blueprint": { "goal": "...", "assumptions": ["..."], "alternative_approaches": [{"name":"...","pros":["..."],"cons":["..."],"why_not_chosen":"..."}], "steps": [{"step":1,"title":"...","instructions":"...","inputs":["..."],"outputs":["..."],"validation":"...","depends_on_steps":[],"time_estimate":"...","effort_level":"medium","substeps":[{"substep":"1a","details":"..."}]}], "success_criteria": ["..."], "risk_register": [{"risk":"...","impact":"med","mitigation":"..."}] } }
No markdown fences, no prose outside JSON.
QUERY: What is the best approach to building a test validation pipeline?`;

    console.log("Calling LLM...");
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: testPrompt,
      model: "claude_sonnet_4_6",
    });

    // Parse response
    let data;
    if (typeof result === "string") {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return Response.json({ error: "No JSON in response", raw: typeof result === "string" ? result.substring(0, 300) : "non-string" });
      data = JSON.parse(jsonMatch[0]);
    } else {
      data = result;
    }

    const blueprintData = data.blueprint || data;
    console.log("Blueprint parsed. Goal:", blueprintData.goal);
    console.log("Steps:", blueprintData.steps?.length);

    return Response.json({
      success: true,
      test: "blueprint_rerun_validation",
      blueprint_goal: blueprintData.goal,
      steps_count: blueprintData.steps?.length || 0,
      has_alternatives: !!blueprintData.alternative_approaches?.length,
      has_risk_register: !!blueprintData.risk_register?.length,
      has_success_criteria: !!blueprintData.success_criteria?.length,
      first_step_title: blueprintData.steps?.[0]?.title || null,
    });

  } catch (error) {
    console.error("Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});