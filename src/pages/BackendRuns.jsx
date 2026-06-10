// pages/BackendRuns.jsx — IMP-002 Emergency Backend Execution Lane (monitor)
// Lists SERVER-OWNED runs (execution_owner === "server") and surfaces lifecycle:
// status, current step, elapsed time, last-heartbeat age, retry/error summary,
// and a link to the existing /Results page for completed runs.
//
// Polls every 5s via react-query refetchInterval. Read-only — no engine logic.

import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Server, Plus, ExternalLink, Loader2, RefreshCw } from "lucide-react";

const STATUS_STYLES = {
  queued:     { label: "Queued",     cls: "bg-slate-200 text-slate-700" },
  running:    { label: "Running",    cls: "bg-blue-100 text-blue-700" },
  validating: { label: "Validating", cls: "bg-indigo-100 text-indigo-700" },
  completed:  { label: "Completed",  cls: "bg-green-100 text-green-700" },
  failed:     { label: "Failed",     cls: "bg-red-100 text-red-700" },
  idle:       { label: "Idle",       cls: "bg-slate-100 text-slate-500" },
};

function ageFrom(iso) {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "0s";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function elapsedOf(run) {
  const start = run.started_at || run.queued_at || run.created_date;
  const end = run.completed_at || (run.status === "completed" || run.status === "failed" ? run.updated_date : null);
  if (!start) return "—";
  const ms = (end ? new Date(end).getTime() : Date.now()) - new Date(start).getTime();
  if (ms < 0) return "0s";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

function RunRow({ run }) {
  const status = STATUS_STYLES[run.status] || STATUS_STYLES.idle;
  const retryCount = Array.isArray(run.retry_log) ? run.retry_log.length : 0;
  const errorCount = Array.isArray(run.validation_errors) ? run.validation_errors.length : 0;
  const heartbeatAge = ageFrom(run.last_heartbeat);
  const stale = run.status === "running" && run.last_heartbeat &&
    (Date.now() - new Date(run.last_heartbeat).getTime()) > 5 * 60 * 1000;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{run.query_text || "(no query)"}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
            <span className={`px-2 py-0.5 rounded-full font-medium ${status.cls}`}>{status.label}</span>
            {run.current_step && <span>Step: <code className="text-foreground">{run.current_step}</code></span>}
            <span>Elapsed: {elapsedOf(run)}</span>
            <span className={stale ? "text-amber-600 font-medium" : ""}>
              Heartbeat: {heartbeatAge}{stale ? " (stale)" : ""}
            </span>
            {retryCount > 0 && <span>Retries: {retryCount}</span>}
            {errorCount > 0 && <span className="text-red-600">Errors: {errorCount}</span>}
          </div>
          {run.status === "failed" && run.error_message && (
            <p className="mt-2 text-xs text-red-600 line-clamp-2">{run.error_message}</p>
          )}
        </div>
        <div className="shrink-0">
          {(run.status === "completed" || run.status === "failed") ? (
            <Link to={`/Results?id=${run.id}`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> Results
              </Button>
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground px-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Working
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function BackendRuns() {
  const { data: runs = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["backend-runs"],
    queryFn: () => base44.entities.Run.filter({ execution_owner: "server" }, "-created_date", 50),
    refetchInterval: 5000,
    initialData: [],
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-blue-500" />
          <h1 className="text-xl font-semibold">Backend Runs</h1>
          {isFetching && <RefreshCw className="w-3.5 h-3.5 text-muted-foreground animate-spin" />}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Link to="/BackendRun">
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> New
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : runs.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No backend-owned runs yet. Dispatch one from{" "}
          <Link to="/BackendRun" className="text-blue-600 underline">Backend Run</Link>.
        </Card>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => <RunRow key={run.id} run={run} />)}
        </div>
      )}
    </div>
  );
}