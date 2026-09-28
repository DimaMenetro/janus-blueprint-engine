import React, { createContext, useContext, useState, useCallback } from "react";

const ExecutionContext = createContext(null);

export function ExecutionProvider({ children }) {
  const [execution, setExecution] = useState(null);
  // execution shape: { status, currentDomain, completed, total, queryText, runId }

  const startExecution = useCallback((queryText) => {
    setExecution({ status: "running", currentDomain: "", completed: 0, total: 0, queryText, runId: null });
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
    <ExecutionContext.Provider value={{ execution, startExecution, updateProgress, finishExecution, failExecution, clearExecution }}>
      {children}
    </ExecutionContext.Provider>
  );
}

export function useExecution() {
  const ctx = useContext(ExecutionContext);
  if (!ctx) throw new Error("useExecution must be inside ExecutionProvider");
  return ctx;
}