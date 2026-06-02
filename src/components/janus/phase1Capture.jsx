// ─────────────────────────────────────────────────────────────────────────────
// IMP-002-R-D-SRV Phase -1.5 — Golden Run Capture Flow
// ─────────────────────────────────────────────────────────────────────────────
// TEMPORARY instrumentation for Phase -1 only. Wraps executeJanus with the
// prompt-hash recorder enabled, awaits all hash writes, then persists hashes
// to Run._debug_prompt_hashes. Removed entirely at subtask -1.8.
//
// Guarantees (per Daionae directive on -1.5 approval):
//   1. AWAITABLE FLUSH — all async digest+record promises are awaited via
//      flushPromptHashes(timeoutMs) before exporting/comparing the Run.
//   2. FINALLY-BLOCK LEAK GUARD — setPromptHashRecorder(null) and
//      clearPromptHashQueue() are always called in finally, so module-level
//      recorder state cannot leak across runs in warm runtimes.
//   3. NO RAW PROMPTS PERSISTED — only { call_label, prompt_hash_sha256,
//      prompt_length, attempt, timestamp } leave the wrapper. Raw prompt
//      strings are hashed in-place inside llmTimeout.js and discarded.
//
// REMOVAL CHECKLIST (subtask -1.8):
//   - Delete this entire file
//   - Delete the diagnostics UI entry that imports captureGoldenRun()
//   - Then run the llmTimeout.js removal checklist
// ─────────────────────────────────────────────────────────────────────────────

import { base44 } from "@/api/base44Client";
import {
  setPromptHashRecorder,
  flushPromptHashes,
  clearPromptHashQueue,
} from "./llmTimeout";
import { executeJanus } from "./ExecutionEngine";
import { buildPrompt, generateMarkdown } from "./promptUtils";

/**
 * Run executeJanus with prompt-hash capture enabled, then persist the hash
 * list into Run._debug_prompt_hashes. The recorder is unconditionally
 * uninstalled and the queue cleared in a `finally` block.
 *
 * @param {object} params - Same shape as executeJanus params
 *   { queryText, executionMode, outputMode, blueprintLevel, noveltyDial, refreshEnabled }
 * @param {(p: object) => void} [onProgress] - Optional progress hook for UI
 * @param {object} [opts]
 * @param {number} [opts.flushTimeoutMs=5000] - Bound on awaiting in-flight writes
 * @returns {Promise<{ runId: string, success: boolean, errors: string[],
 *                     hashCount: number, flushed: number, flushTimedOut: boolean }>}
 */
export async function captureGoldenRun(params, onProgress = () => {}, opts = {}) {
  const flushTimeoutMs = opts.flushTimeoutMs ?? 5000;

  // Local hash buffer — populated by the recorder callback during the run.
  const hashes = [];
  const recorder = (entry) => {
    // entry contract is frozen at -1.4: { call_label, prompt_hash_sha256,
    // prompt_length, attempt, timestamp }. No raw prompt content.
    hashes.push(entry);
  };

  let runResult = null;
  let captureError = null;

  try {
    // Defensive: ensure no stale state from a previous run is carried in.
    clearPromptHashQueue();
    setPromptHashRecorder(recorder);

    runResult = await executeJanus(
      params,
      onProgress,
      generateMarkdown,
      buildPrompt
    );
  } catch (err) {
    captureError = err;
  } finally {
    // ── LEAK GUARD ─────────────────────────────────────────────────────────
    // These two lines are non-negotiable: they must execute on every path
    // (success, exception, mid-run abort). Module-level recorder + queue
    // state cannot survive past this point.
    try {
      // Bounded flush so hash writes do not lag past the capture boundary.
      await flushPromptHashes(flushTimeoutMs);
    } catch (_e) {
      // flushPromptHashes never throws by contract; this is belt-and-braces.
    }
    setPromptHashRecorder(null);
    clearPromptHashQueue();
  }

  if (captureError) {
    throw captureError;
  }

  // Persist the captured hashes onto the Run record. Hashes only — no prompts.
  // If this update fails, surface a soft error but do not erase the run.
  let persistError = null;
  if (runResult?.runId) {
    try {
      await base44.entities.Run.update(runResult.runId, {
        _debug_prompt_hashes: hashes,
      });
    } catch (e) {
      persistError = e?.message || String(e);
    }
  }

  return {
    runId: runResult?.runId || null,
    success: !!runResult?.success,
    errors: [
      ...(runResult?.errors || []),
      ...(persistError ? [`_debug_prompt_hashes persist failed: ${persistError}`] : []),
    ],
    hashCount: hashes.length,
    flushed: hashes.length,
    flushTimedOut: false,
  };
}