import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { loadRunView, findOpenStagedRun } from "@/lib/janus/stageStore";
import { deriveExecutionState } from "@/lib/janus/executionState";
import { deriveQualification } from "@/lib/janus/qualification";

const ExecutionContext = createContext(null);

/**
 * Execution observer. It holds the durable view of the run being watched and nothing else:
 * progress, current stage, failures and cancellation are all derived from stage records.
 * The only local fact is whether this session is the one scheduling the run.
 */
export function ExecutionProvider({ children }) {
  const [view, setView] = useState(null);
  const [drivingId, setDrivingId] = useState(null);

  const observe = useCallback(async (runId) => {
    const next = await loadRunView(runId);
    setView(next);
    return next;
  }, []);

  // Run an engine action. Every durable change it reports is re-read from storage before it is shown.
  const drive = useCallback(async (action) => {
    let runId = null;
    const onDurableChange = async (id) => {
      if (runId !== id) { runId = id; setDrivingId(id); }
      await observe(id);
    };
    try {
      return await action({ onDurableChange });
    } finally {
      setDrivingId(null);
      if (runId) await observe(runId);
    }
  }, [observe]);

  const dismiss = useCallback(() => setView(null), []);

  // After a reload: find work that was in progress and reconstruct it from durable state.
  useEffect(() => {
    findOpenStagedRun().then(async (run) => {
      if (!run) return;
      const open = await loadRunView(run.id);
      setView(prev => prev || open);
    });
  }, []);

  const execution = useMemo(() => {
    if (!view) return null;
    const driving = drivingId === view.run.id;
    const qualification = view.storage === "staged_v1" ? deriveQualification(view) : null;
    return { view, runId: view.run.id, driving, state: deriveExecutionState(view, { driving }), qualification };
  }, [view, drivingId]);

  return (
    <ExecutionContext.Provider value={{ execution, observe, drive, dismiss, busy: !!drivingId }}>
      {children}
    </ExecutionContext.Provider>
  );
}

export function useExecution() {
  const ctx = useContext(ExecutionContext);
  if (!ctx) throw new Error("useExecution must be inside ExecutionProvider");
  return ctx;
}