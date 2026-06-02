// ─────────────────────────────────────────────────────────────────────────────
// Janus Resilient LLM Caller — IMP-001-R-D-RES Phase 1
// CP-002-O-D-JNP v2.0 Compliance Layer
//
// Purpose: Wrap base44.integrations.Core.InvokeLLM with timeout + bounded retry.
// Single drop-in replacement for the bare callLLM patterns in:
//   - components/janus/ExecutionEngine.js
//   - components/janus/blueprintSplitCall.js
//   - components/janus/rerunEngine.js
//
// Design Invariants (NON-NEGOTIABLE):
//   1. Drop-in compatible — returns the SAME shape as InvokeLLM
//      (string when no response_json_schema; object when one is provided)
//   2. Bounded retries — max 2 retries (3 total attempts), exponential backoff
//   3. Per-call-type timeout via callLabel lookup
//   4. Throws a labeled error after exhausting retries — callers' existing
//      try/catch + domainErrors.push() pattern handles it naturally
//   5. No external dependencies — pure native Promise.race
// ─────────────────────────────────────────────────────────────────────────────

import { base44 } from "@/api/base44Client";

// ─────────────────────────────────────────────────────────────────────────────
// IMP-002-R-D-SRV Phase -1 — TEMPORARY prompt-hash capture hook
// ─────────────────────────────────────────────────────────────────────────────
// Used ONLY during Phase -1 golden run capture to record the SHA-256 of every
// prompt that successfully produced a result. The recorder is opt-in: when
// `__promptHashRecorder` is null (the default), this wrapper is a no-op and
// behavior is byte-identical to the pre-Phase-1 code.
//
// REMOVAL CHECKLIST (subtask -1.8):
//   - Delete `__promptHashRecorder` module variable
//   - Delete `setPromptHashRecorder` export
//   - Delete `__recordPromptHashIfEnabled` helper
//   - Delete the single `__recordPromptHashIfEnabled(...)` call inside
//     callLLMResilient (search for the "IMP-002 Phase -1" marker)
//   - Delete this comment block
// ─────────────────────────────────────────────────────────────────────────────

let __promptHashRecorder = null;

/**
 * IMP-002-R-D-SRV Phase -1 ONLY.
 * Install (or clear) a callback that receives `{ callLabel, prompt_sha256,
 * prompt_length, timestamp }` for every successful LLM call.
 *
 * Pass `null` to disable. Default state is disabled.
 *
 * Failures inside the recorder are swallowed — recording must NEVER affect
 * pipeline behavior. Recording happens fire-and-forget after a successful
 * call returns.
 *
 * @param {((entry: object) => void) | null} fn
 */
export function setPromptHashRecorder(fn) {
  __promptHashRecorder = typeof fn === "function" ? fn : null;
}

async function __recordPromptHashIfEnabled(callLabel, invokeParams, attempt) {
  const recorder = __promptHashRecorder;
  if (!recorder) return;
  try {
    const promptStr = typeof invokeParams?.prompt === "string" ? invokeParams.prompt : "";
    const encoder = new TextEncoder();
    const buf = await crypto.subtle.digest("SHA-256", encoder.encode(promptStr));
    const bytes = new Uint8Array(buf);
    let hex = "";
    for (let i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, "0");
    }
    recorder({
      call_label: callLabel,
      prompt_hash_sha256: hex,
      prompt_length: promptStr.length,
      attempt: attempt,
      timestamp: new Date().toISOString(),
    });
  } catch (_e) {
    // Hashing or recorder failure must never break the pipeline.
  }
}

// ─── TIMEOUT MATRIX ──────────────────────────────────────────────────────────
// Per-call-type timeout in milliseconds. Keys are stable labels passed by
// callers. Unknown labels fall back to DEFAULT_TIMEOUT_MS.
export const TIMEOUT_MATRIX = {
  // Refresh / web sweep — legitimately slow
  "refresh:websweep":      180000,

  // Core SME domains — complex JSON output
  "domain:corpus":         120000,
  "domain:cogito":         120000,
  "domain:animus":          90000,
  "domain:actus":          120000,
  "domain:synthesis":      120000,

  // Intersection pairs — smaller scope
  "intersection:corpus_x_cogito":   90000,
  "intersection:corpus_x_animus":   90000,
  "intersection:corpus_x_actus":    90000,
  "intersection:cogito_x_animus":   90000,
  "intersection:cogito_x_actus":    90000,
  "intersection:animus_x_actus":    90000,

  // Blueprint sub-calls — expansion is the largest (root cause of historical hang)
  "blueprint:skeleton":    120000,
  "blueprint:expansion":   150000,
  "blueprint:criteria":     90000,

  // Rerun labels mirror their domain counterparts
  "rerun:intersection":     90000,
  "rerun:synthesis":       120000,
  "rerun:blueprint":       150000,
};

const DEFAULT_TIMEOUT_MS = 120000;
const DEFAULT_MAX_RETRIES = 2;            // 3 total attempts (1 initial + 2 retries)
const BACKOFF_SCHEDULE_MS = [3000, 9000]; // backoff before retry attempt N+1

// ─── ERROR CLASSES ───────────────────────────────────────────────────────────

export class LLMTimeoutError extends Error {
  constructor(callLabel, timeoutMs) {
    super(`${callLabel}: LLM call exceeded timeout of ${timeoutMs}ms`);
    this.name = "LLMTimeoutError";
    this.callLabel = callLabel;
    this.timeoutMs = timeoutMs;
  }
}

export class LLMCallError extends Error {
  constructor(callLabel, attempts, lastErrorMessage) {
    super(`${callLabel}: LLM call failed after ${attempts} attempts — ${lastErrorMessage}`);
    this.name = "LLMCallError";
    this.callLabel = callLabel;
    this.attempts = attempts;
  }
}

// ─── INTERNAL HELPERS ────────────────────────────────────────────────────────

function timeoutPromise(ms, callLabel) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new LLMTimeoutError(callLabel, ms)), ms);
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isEmptyResponse(result) {
  if (result == null) return true;
  if (typeof result === "string" && result.trim().length === 0) return true;
  if (typeof result === "object" && Object.keys(result).length === 0) return true;
  return false;
}

// ─── PUBLIC API ──────────────────────────────────────────────────────────────

/**
 * Resilient LLM call. Drop-in replacement for base44.integrations.Core.InvokeLLM
 * with bounded timeout + retry.
 *
 * @param {object} invokeParams - Same shape as InvokeLLM:
 *   { prompt, model?, add_context_from_internet?, file_urls?, response_json_schema? }
 * @param {object} [options]
 * @param {string} [options.callLabel] - Label used to look up timeout (e.g. "blueprint:expansion")
 * @param {number} [options.timeoutMs] - Explicit timeout override (ms)
 * @param {number} [options.maxRetries] - Max retry attempts after initial call (default 2)
 * @param {function} [options.onRetry] - Called as ({ attempt, error, willRetry, nextDelayMs, callLabel })
 * @returns {Promise<string|object>} Same shape as InvokeLLM
 * @throws {LLMCallError|LLMTimeoutError} After exhausting retries
 */
export async function callLLMResilient(invokeParams, options = {}) {
  const callLabel = options.callLabel || "unlabeled";
  const timeoutMs = options.timeoutMs ?? TIMEOUT_MATRIX[callLabel] ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const onRetry = typeof options.onRetry === "function" ? options.onRetry : null;

  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const invokePromise = base44.integrations.Core.InvokeLLM(invokeParams);
      const result = await Promise.race([
        invokePromise,
        timeoutPromise(timeoutMs, callLabel),
      ]);

      // Empty response counts as a recoverable failure — let it retry
      if (isEmptyResponse(result)) {
        throw new Error(`${callLabel}: Empty response from LLM`);
      }

      // IMP-002 Phase -1 TEMP — opt-in prompt-hash capture (no-op when recorder unset)
      __recordPromptHashIfEnabled(callLabel, invokeParams, attempt);

      return result;
    } catch (err) {
      lastError = err;
      const willRetry = attempt <= maxRetries;
      const nextDelayMs = willRetry ? (BACKOFF_SCHEDULE_MS[attempt - 1] || 0) : 0;

      if (onRetry) {
        try {
          onRetry({
            callLabel,
            attempt,
            error: err?.message || String(err),
            willRetry,
            nextDelayMs,
          });
        } catch (_cbErr) {
          // Never let a caller-side onRetry crash bring down the retry loop.
        }
      }

      if (!willRetry) break;
      if (nextDelayMs > 0) await sleep(nextDelayMs);
    }
  }

  // All attempts exhausted
  throw new LLMCallError(callLabel, maxRetries + 1, lastError?.message || String(lastError));
}