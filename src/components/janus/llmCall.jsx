// Janus Completion-Oriented LLM Caller
// Replaces IMP-001 fixed elapsed-time cutoffs.
//
// Governing execution rule:
//   A healthy Janus LLM call is allowed to take as long as the provider allows.
//   Janus does NOT infer failure from elapsed wall-clock time.
//
// Retries occur only AFTER InvokeLLM has explicitly settled as a failure (or
// returned an empty response). This prevents overlapping paid calls caused by
// local elapsed-time races that abandon a still-running provider promise.
//
// Call labels remain for diagnostics only. They never select a time budget.

import { base44 } from "@/api/base44Client";

const DEFAULT_MAX_RETRIES = 1;

export class LLMCallError extends Error {
  constructor(callLabel, attempts, lastErrorMessage) {
    super(`${callLabel}: LLM call failed after ${attempts} attempt${attempts === 1 ? "" : "s"} — ${lastErrorMessage}`);
    this.name = "LLMCallError";
    this.callLabel = callLabel;
    this.attempts = attempts;
  }
}

function isEmptyResponse(result) {
  if (result == null) return true;
  if (typeof result === "string" && result.trim().length === 0) return true;
  if (typeof result === "object" && Object.keys(result).length === 0) return true;
  return false;
}

function isExplicitlyRetryableError(error) {
  if (error?.retryable === true) return true;

  const message = (error?.message || String(error) || "").toLowerCase();

  // Deterministic/operator/account failures should surface immediately.
  if (
    message.includes("unauthorized") ||
    message.includes("forbidden") ||
    message.includes("invalid request") ||
    message.includes("bad request") ||
    message.includes("monthly integration") ||
    message.includes("insufficient credit") ||
    message.includes("insufficient fund") ||
    message.includes("quota exceeded") ||
    /\b(400|401|403|404)\b/.test(message)
  ) {
    return false;
  }

  // Retry only explicit provider/transport failures after the prior promise has
  // settled. Provider-level timeout errors are real upstream failures; they are
  // distinct from the removed Janus-local elapsed-time deadlines.
  return (
    message.includes("network error") ||
    message.includes("fetch failed") ||
    message.includes("econnreset") ||
    message.includes("connection reset") ||
    message.includes("connection timed out") ||
    message.includes("litellm.timeout") ||
    message.includes("service unavailable") ||
    message.includes("temporarily unavailable") ||
    message.includes("bad gateway") ||
    message.includes("gateway timeout") ||
    /\b(502|503|504)\b/.test(message)
  );
}

/**
 * Await InvokeLLM to completion with no Janus-local time limit.
 *
 * @param {object} invokeParams Same shape as base44.integrations.Core.InvokeLLM.
 * @param {{callLabel?: string, maxRetries?: number, onRetry?: Function}} [options]
 *   Optional diagnostic label, bounded retry count, and retry/failure telemetry callback.
 */
export async function callLLMCompletionOriented(invokeParams, options = {}) {
  const callLabel = options.callLabel || "unlabeled";
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const onRetry = typeof options.onRetry === "function" ? options.onRetry : null;

  let lastError = null;
  let attempts = 0;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    attempts = attempt;

    try {
      // Deliberately await the provider call directly. No local wall-clock
      // budget, timer-driven race, or locally inferred deadline.
      const result = await base44.integrations.Core.InvokeLLM(invokeParams);

      if (isEmptyResponse(result)) {
        throw Object.assign(
          new Error(`${callLabel}: Empty response from LLM`),
          { retryable: true }
        );
      }

      return result;
    } catch (error) {
      lastError = error;
      const retryable = isExplicitlyRetryableError(error);
      const willRetry = retryable && attempt <= maxRetries;

      if (onRetry) {
        try {
          await onRetry({
            callLabel,
            attempt,
            error: error?.message || String(error),
            willRetry,
            nextDelayMs: 0,
            failureKind: retryable ? "explicit_transient_failure" : "explicit_terminal_failure",
          });
        } catch (_callbackError) {
          // Diagnostic persistence must never become an execution failure.
        }
      }

      if (!willRetry) break;
    }
  }

  throw new LLMCallError(
    callLabel,
    attempts,
    lastError?.message || String(lastError)
  );
}
