// Lossless export utilities — reconstructs full data from individual domain fields
// Never relies on truncated raw_json or render_md stored on the entity.

import { EXECUTION_MODES } from "./janusSchema";
import { generateMarkdown } from "./promptUtils";

const DOMAIN_KEYS = ["refresh", "corpus", "cogito", "animus", "actus", "synthesis", "blueprint"];

/**
 * Reconstruct full-fidelity JSON from the individual domain fields stored on a Run entity.
 * This bypasses the truncated raw_json field entirely.
 */
export function reconstructFullJson(run) {
  const fullData = {};

  DOMAIN_KEYS.forEach(key => {
    if (run[key] && typeof run[key] === "object" && Object.keys(run[key]).length > 0) {
      fullData[key] = run[key];
    }
  });

  // Include run metadata for completeness
  const exportObj = {
    _meta: {
      protocol: "CP-002-O-D-JNP v2.0",
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
    ...fullData,
  };

  return JSON.stringify(exportObj, null, 2);
}

/**
 * Regenerate full-fidelity markdown from the individual domain fields at export time.
 * This bypasses the truncated render_md field entirely.
 */
export function reconstructFullMarkdown(run) {
  const fullData = {};
  DOMAIN_KEYS.forEach(key => {
    if (run[key] && typeof run[key] === "object" && Object.keys(run[key]).length > 0) {
      fullData[key] = run[key];
    }
  });

  const executionMode = run.execution_mode || "standard";

  // Add metadata header
  let md = `---\nprotocol: CP-002-O-D-JNP v2.0\nrun_id: ${run.id}\nquery: ${run.query_text}\nmode: ${executionMode}\noutput: ${run.output_mode}\nblueprint_level: ${run.blueprint_level}\nnovelty: ${run.novelty_dial}\nrefresh: ${run.refresh_enabled}\ndate: ${run.created_date}\n---\n\n`;

  // Use the existing generateMarkdown function with full-fidelity data
  md += generateMarkdown(fullData, executionMode);

  return md;
}