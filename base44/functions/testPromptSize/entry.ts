import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { run_id } = await req.json();

    // Fetch the run
    const runs = await base44.asServiceRole.entities.Run.filter({});
    const run = runs.find(r => r.id === run_id);
    if (!run) {
      return Response.json({ error: "Run not found" });
    }

    // Simulate what the synthesis prompt would look like with REAL data
    // This is exactly what buildDomainPrompt("synthesis",...) does

    // Step 1: Check intersection data in raw_json
    let rawData = {};
    try {
      rawData = JSON.parse(run.raw_json || "{}");
    } catch (e) {
      return Response.json({ error: "Failed to parse raw_json", msg: e.message });
    }

    // Step 2: Simulate intersection context building
    const intersectionKeys = ["corpus_x_cogito", "corpus_x_animus", "corpus_x_actus", "cogito_x_animus", "cogito_x_actus", "animus_x_actus"];
    const intersectionStatus = {};
    
    // Check if intersections exist in the synthesis data or raw_json
    const synthesisData = rawData.synthesis || {};
    const matrix = synthesisData.intersection_matrix || {};
    
    intersectionKeys.forEach(key => {
      intersectionStatus[key] = {
        in_matrix: !!matrix[key],
        has_insight: !!matrix[key]?.insight,
        has_tension: !!matrix[key]?.tension,
        has_resolution: !!matrix[key]?.resolution
      };
    });

    // Step 3: Measure domain data sizes (what would be fed to synthesis prompt)
    const domainSizes = {};
    ["refresh", "corpus", "cogito", "animus", "actus"].forEach(d => {
      const data = run[d];
      if (data) {
        const json = JSON.stringify(data);
        domainSizes[d] = {
          exists: true,
          json_length: json.length,
          compressed_1500: json.slice(0, 1500).length
        };
      } else {
        domainSizes[d] = { exists: false };
      }
    });

    // Step 4: Build what the ACTUAL synthesis prompt context would be
    // (mimicking lines 234-243 of ExecutionEngine)
    const mockIntersections = {}; // This would be the in-memory intersections object
    // In the real engine, intersections are built incrementally in memory
    // The question is: did they get built at all?
    
    // Check raw_json for intersection evidence
    const rawJsonStr = run.raw_json || "";
    const intersectionEvidence = {
      corpus_x_cogito_in_raw: rawJsonStr.includes("corpus_x_cogito"),
      corpus_x_animus_in_raw: rawJsonStr.includes("corpus_x_animus"),
      corpus_x_actus_in_raw: rawJsonStr.includes("corpus_x_actus"),
      cogito_x_animus_in_raw: rawJsonStr.includes("cogito_x_animus"),
      cogito_x_actus_in_raw: rawJsonStr.includes("cogito_x_actus"),
      animus_x_actus_in_raw: rawJsonStr.includes("animus_x_actus"),
    };

    // Step 5: Calculate total domain context that would be sent to synthesis
    const totalDomainContextSize = Object.values(domainSizes)
      .filter(d => d.exists)
      .reduce((sum, d) => sum + Math.min(d.json_length, 1500), 0);

    // Step 6: Check what the matrixSummary would look like
    // In the real run, matrixSummary is built from the in-memory `intersections` object
    // NOT from raw_json. The intersections object is populated during execution.
    // If any intersection LLM call failed, that pair would be missing from the object.

    return Response.json({
      run_status: run.status,
      run_mode: run.execution_mode,
      raw_json_length: rawJsonStr.length,
      domain_sizes: domainSizes,
      total_domain_context_for_synthesis: totalDomainContextSize,
      intersection_in_raw_json: intersectionEvidence,
      intersection_matrix_status: intersectionStatus,
      has_synthesis_in_raw: rawJsonStr.includes('"synthesis"'),
      has_blueprint_in_raw: rawJsonStr.includes('"blueprint"'),
      validation_errors_count: (run.validation_errors || []).length,
      first_5_errors: (run.validation_errors || []).slice(0, 5),
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});