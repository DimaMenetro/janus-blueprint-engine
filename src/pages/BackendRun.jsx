// pages/BackendRun.jsx — IMP-002 Emergency Backend Execution Lane (submission)
// Submits a Standard, SERVER-OWNED Janus run, then dispatches the backend
// orchestrator (functions/runJanusPipeline) fire-and-forget and routes the
// operator to /BackendRuns to monitor lifecycle.
//
// Bounded scope: this is a parallel backend-owned path. It does NOT replace
// /NewQuery and does NOT alter the browser execution path.

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Server, Play, Loader2, ListChecks, AlertCircle } from "lucide-react";

export default function BackendRun() {
  const navigate = useNavigate();
  const [queryText, setQueryText] = useState("");
  const [outputMode, setOutputMode] = useState("Blueprint");
  const [blueprintLevel, setBlueprintLevel] = useState("L2");
  const [noveltyDial, setNoveltyDial] = useState("medium");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!queryText.trim()) {
      setError("Enter a query before dispatching a backend run.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      // 1. Create the server-owned Run in the queued state.
      const run = await base44.entities.Run.create({
        query_text: queryText.trim(),
        execution_mode: "standard",
        output_mode: outputMode,
        blueprint_level: blueprintLevel,
        novelty_dial: noveltyDial,
        refresh_enabled: false,
        status: "queued",
        execution_owner: "server",
        queued_at: new Date().toISOString(),
        validation_errors: [],
        raw_json: "{}",
      });

      // 2. Dispatch the server orchestrator FIRE-AND-FORGET. We do NOT await —
      //    the pipeline runs 8–22 min server-side. The Run is already queued, so
      //    if the dispatch is interrupted it remains visible in /BackendRuns.
      base44.functions.invoke("runJanusPipeline", { runId: run.id }).catch(() => {});

      // 3. Move the operator to the monitor view immediately.
      navigate("/BackendRuns");
    } catch (e) {
      setError(e?.message || "Failed to create the backend run.");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-blue-500" />
          <h1 className="text-xl font-semibold">Backend Run</h1>
        </div>
        <Link to="/BackendRuns">
          <Button variant="outline" size="sm" className="gap-2">
            <ListChecks className="w-4 h-4" /> View Runs
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Submit a server-owned Standard run
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Execution is owned by the server (functions/runJanusPipeline) and persists
            independently of this browser tab. Same engine, same prompts as /NewQuery.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="What should the Janus engine analyze?"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            className="min-h-32"
            disabled={submitting}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Output Mode</label>
              <Select value={outputMode} onValueChange={setOutputMode} disabled={submitting}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Blueprint">Blueprint</SelectItem>
                  <SelectItem value="Research Plan">Research Plan</SelectItem>
                  <SelectItem value="Product Spec">Product Spec</SelectItem>
                  <SelectItem value="Technical Architecture">Technical Architecture</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Blueprint Level</label>
              <Select value={blueprintLevel} onValueChange={setBlueprintLevel} disabled={submitting}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="L1">L1</SelectItem>
                  <SelectItem value="L2">L2</SelectItem>
                  <SelectItem value="L3">L3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Novelty</label>
              <Select value={noveltyDial} onValueChange={setNoveltyDial} disabled={submitting}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-md p-3">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button onClick={handleSubmit} disabled={submitting} className="w-full gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {submitting ? "Dispatching…" : "Dispatch Backend Run"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}