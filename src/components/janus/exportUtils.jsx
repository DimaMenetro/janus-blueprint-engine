// Lossless export utilities — reconstructs full data from the durable run view
// (stage revisions for staged runs, the legacy adapter for historical Runs).
// Never relies on the truncated raw_json or render_md caches stored on the Run.

import { PROTOCOL } from "@/lib/janus/protocolRegistry";
import { generateMarkdown } from "./promptUtils";

/** Provenance travels with the artifact: every revision, its exact dependencies and fingerprint. */
const lineageExport = (lineage) => lineage.map(s => ({
  id: s.id, stage_key: s.stage_key, revision: s.revision, status: s.status,
  lineage_state: s.lineage_state, stale: s.stale, depends_on: s.depends_on || [],
  dependency_basis: s.dependency_basis || "recorded", input_fingerprint: s.input_fingerprint || null,
  prompt_template_version: s.prompt_template_version || null, engine_version: s.engine_version || null,
  started_at: s.started_at || null, completed_at: s.completed_at || null, error_class: s.error_class || null,
}));

/** Full-fidelity JSON export from the durable view. */
export function reconstructFullJson(view) {
  const { run, artifacts, lineage, storage } = view;
  const exportObj = {
    _meta: {
      protocol: `${PROTOCOL.id} v${PROTOCOL.version}`,
      protocol_edition: PROTOCOL.edition,
      registry_schema_version: PROTOCOL.registry_schema_version,
      run_protocol_version: run.protocol_version || "unrecorded (historical run)",
      engine_version: run.engine_version || null,
      storage_model: storage,
      run_id: run.id,
      query_text: run.query_text,
      execution_mode: run.execution_mode,
      output_mode: run.output_mode,
      blueprint_level: run.blueprint_level,
      novelty_dial: run.novelty_dial,
      refresh_enabled: run.refresh_enabled,
      status: run.status,
      created_date: run.created_date,
      updated_date: run.updated_date,
    },
    ...artifacts,
    _lineage: lineageExport(lineage),
  };

  return JSON.stringify(exportObj, null, 2);
}

/** Full-fidelity markdown regenerated from the durable view at export time. */
export function reconstructFullMarkdown(view) {
  const { run, artifacts, storage } = view;
  const executionMode = run.execution_mode || "standard";

  let md = `---\nprotocol: ${PROTOCOL.id} v${PROTOCOL.version} (${PROTOCOL.edition})\nrun_id: ${run.id}\nstorage: ${storage}\nquery: ${run.query_text}\nmode: ${executionMode}\noutput: ${run.output_mode}\nblueprint_level: ${run.blueprint_level}\nnovelty: ${run.novelty_dial}\nrefresh: ${run.refresh_enabled}\ndate: ${run.created_date}\n---\n\n`;

  md += generateMarkdown(artifacts, executionMode);

  return md;
}