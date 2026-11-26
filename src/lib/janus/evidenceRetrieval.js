/**
 * JANUS LIVE REFRESH RETRIEVAL — the one place the engine asks for external evidence (I/O).
 * The `retrieveJanusEvidence` function searches each canonical subdomain by name, newest first, and returns
 * provenance-bearing source records. No model is called. The records are UNTRUSTED: they reach a prompt only
 * through the evidence boundary (stageCompiler → evidenceBoundary), never as instruction.
 * Returns { evidence, retrieval }: the records, and the report of what was searched (source, time, gaps).
 * Throws when retrieval could not be performed or returned nothing: Refresh then fails closed, and no research
 * is claimed.
 */
import { base44 } from "@/api/base44Client";
import { REFRESH_UNAVAILABLE_MESSAGE } from "@/lib/janus/stageCompiler";

export async function retrieveEvidence() {
  let data;
  try {
    ({ data } = await base44.functions.invoke("retrieveJanusEvidence", {}));
  } catch (err) {
    throw new Error(`Live Refresh could not retrieve sources (${err?.response?.data?.error || err?.message || err}). Nothing was researched and no call was made.`);
  }
  const evidence = Array.isArray(data?.records) ? data.records : [];
  if (!evidence.length) throw new Error(REFRESH_UNAVAILABLE_MESSAGE);
  return { evidence, retrieval: { source: data.source, retrieved_at: data.retrieved_at, subdomains_searched: (data.swept || []).length, records: evidence.length, subdomains_without_results: data.gaps || [] } };
}