/**
 * JANUS DURABLE STAGE MODEL — Phase 3 (pure, no I/O).
 * Stage keys, storage markers, version identities, input fingerprints and settled-failure
 * classification shared by the engine, the legacy adapter and the frontend view model.
 */
import { PAIRS, PROTOCOL, STAGE_ORDER } from "@/lib/janus/protocolRegistry";

export const STORAGE_MODEL = { legacy: "legacy_monolithic", staged: "staged_v1" };
export const ENGINE_VERSION = `janus-engine/${PROTOCOL.version}-phase4`;
export const ORCHESTRATOR = "browser"; // transitional owner (plan §18.1); production target is server-owned

export const intersectionKey = (pairId) => `intersection:${pairId}`;
export const INTERSECTION_KEYS = PAIRS.map(p => intersectionKey(p.id));
/** Artifacts stored as their own stage. Synthesis is composed: six intersection stages + the patterns stage. */
export const DOMAIN_ARTIFACT_KEYS = STAGE_ORDER.filter(k => k !== "synthesis");
/** The independent quality evaluation of a Blueprint revision. Not a Blueprint artifact: it judges one. */
export const QUALIFICATION_KEY = "qualification";
/** Canonical lineage order: refresh → domains → six intersections → synthesis → blueprint → qualification. */
export const STAGE_KEY_ORDER = [
  ...STAGE_ORDER.filter(k => k !== "synthesis" && k !== "blueprint"),
  ...INTERSECTION_KEYS,
  "synthesis",
  "blueprint",
  QUALIFICATION_KEY,
];

export const LEGACY_ID_PREFIX = "legacy:";
export const revisionLabel = (stage) => (!stage ? "—" : stage.legacy ? "legacy" : `r${stage.revision}`);

/** sha256 over the exact inputs: stage key, template version, dependency revision IDs, compiled prompt. */
export async function fingerprintInputs({ stageKey, templateVersion, dependsOn = [], prompt = "" }) {
  const canonical = JSON.stringify({ stage_key: stageKey, prompt_template_version: templateVersion, depends_on: [...dependsOn].sort(), prompt });
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  return "sha256:" + [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
}

/** Interim settled-failure classification (plan §12.2). Phase 6 refines it with provider evidence. */
export function classifyFailure(err) {
  const m = String(err?.message || err || "");
  if (/quota|credit|insufficient|limit exceeded|\b429\b/i.test(m)) return "quota_failure";
  if (/network|failed to fetch|ECONN|socket|timed? ?out|aborted/i.test(m)) return "transport_settled_failure";
  return "provider_error";
}
export const classifyParseError = (message) => (/Missing key/i.test(message) ? "schema_failure" : "parse_failure");