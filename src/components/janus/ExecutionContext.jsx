import React, { createContext, useContext, useState, useCallback } from "react";

const ExecutionContext = createContext(null);

export function ExecutionProvider({ children }) {
  const [execution, setExecution] = useState(null);
  // execution shape: {
  //   status, currentDomain, completed, total, queryText, runId,
  //   // Phase 6 additions (IMP-001-R-D-RES) — all optional, undefined on legacy reads:
  //   retryCount?: number,     // total retries observed during this execution
  //   lastError?: string|null, // most recent retry error message (transient)
  // }

  const startExecution = useCallback((queryText) => {
    // Phase 6: seed retryCount + lastError so consumers always read defined values during an active run.
    setExecution({
      status: "running",
      currentDomain: "",
      completed: 0,
      total: 0,
      queryText,
      runId: null,
      retryCount: 0,
      lastError: null,
    });
  }, []);

  const updateProgress = useCallback(({ domain, status, completedDomains, totalDomains, runId }) => {
    setExecution(prev => prev ? {
      ...prev,
      status: status || prev.status,
      currentDomain: domain ?? prev.currentDomain,
      completed: completedDomains ?? prev.completed,
      total: totalDomains ?? prev.total,
      runId: runId ?? prev.runId,
    } : prev);
  }, []);

  // Phase 6 (IMP-001-R-D-RES): Record a retry event surfaced from the engine via onProgress.
  // Increments retryCount and stashes the most recent error message for transient display.
  // Intentionally state-only — no UI change in this phase, no side effects, no DB writes.
  // The engine already persists retry events to Run.retry_log; this is the parallel in-memory mirror.
  const recordRetry = useCallback(({ step, attempt, error } = {}) => {
    setExecution(prev => prev ? {
      ...prev,
      retryCount: (prev.retryCount || 0) + 1,
      lastError: error || null,
      // currentDomain doubles as the step indicator — if caller passed a step label,
      // adopt it so consumers can see which step retried without scraping retry_log.
      currentDomain: step ?? prev.currentDomain,
      // attempt is informational; not stored to keep shape additions minimal per blueprint §3.6
      _lastRetryAttempt: attempt, // underscore-prefixed: internal-ish, not part of the public contract
    } : prev);
  }, []);

  const finishExecution = useCallback((runId) => {
    setExecution(prev => prev ? { ...prev, status: "completed", runId } : null);
    // Auto-clear after a brief moment so user sees the completed state
    setTimeout(() => setExecution(null), 3000);
  }, []);

  const failExecution = useCallback(() => {
    setExecution(prev => prev ? { ...prev, status: "failed" } : null);
    setTimeout(() => setExecution(null), 5000);
  }, []);

  const clearExecution = useCallback(() => setExecution(null), []);

  return (
    <ExecutionContext.Provider value={{
      execution,
      startExecution,
      updateProgress,
      recordRetry,       // Phase 6 addition
      finishExecution,
      failExecution,
      clearExecution,
    }}>
      {children}
    </ExecutionContext.Provider>
  );
}

export function useExecution() {
  const ctx = useContext(ExecutionContext);
  if (!ctx) throw new Error("useExecution must be inside ExecutionProvider");
  return ctx;
}