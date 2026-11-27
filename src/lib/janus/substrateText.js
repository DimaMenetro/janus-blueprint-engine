/**
 * How the recorded substrate of a stage version is said on screen (Stage lineage, Diagnostics, the Quality panel).
 * Pure: it reads what qualification.substrateOf returned and adds nothing to it.
 */
import { modelLabel } from "@/lib/janus/protocolRegistry";

/** Standings that are a finding the operator must see, and standings that are a gap in the evidence. */
export const SUBSTITUTED = "substituted";
export const NOT_CONFIRMED = ["unconfirmed", "unreported", "unrecorded"];

/** "Claude Opus 5.5 · effort high — answered by …", or what is known when no model is recorded. */
export function substrateLine(s) {
  if (!s) return null;
  if (!s.requested) return s.note.charAt(0).toUpperCase() + s.note.slice(1);
  return `${modelLabel(s.requested)}${s.effort ? ` · effort ${s.effort}` : ""} — ${s.note}`;
}

/** Why generation stopped and what the transport reported as usage, exactly as recorded. */
export function callLine(call) {
  if (!call) return null;
  const usage = call.usage && typeof call.usage === "object"
    ? Object.entries(call.usage).filter(([, v]) => typeof v === "number").map(([k, v]) => `${k.replace(/_/g, " ")} ${v.toLocaleString()}`) : [];
  const parts = [call.finish_reason && `finish: ${call.finish_reason}`, ...usage].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

/** Numeric usage fields summed over calls, as the transport named them (it is recorded as reported, not interpreted). */
export function usageTotals(calls) {
  const totals = {};
  calls.forEach(call => Object.entries(call?.usage && typeof call.usage === "object" ? call.usage : {})
    .filter(([, v]) => typeof v === "number").forEach(([k, v]) => { totals[k] = (totals[k] || 0) + v; }));
  return totals;
}