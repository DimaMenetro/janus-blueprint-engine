import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, BookOpen, Brain, Shield, Rocket, Layers, Map, Download, AlertTriangle } from "lucide-react";

import RefreshTab from "@/components/janus/tabs/RefreshTab";
import CorpusTab from "@/components/janus/tabs/CorpusTab";
import CogitoTab from "@/components/janus/tabs/CogitoTab";
import AnimusTab from "@/components/janus/tabs/AnimusTab";
import ActusTab from "@/components/janus/tabs/ActusTab";
import SynthesisTab from "@/components/janus/tabs/SynthesisTab";
import BlueprintTab from "@/components/janus/tabs/BlueprintTab";
import ExportTab from "@/components/janus/tabs/ExportTab";
import StatusPill from "@/components/janus/StatusPill";
import { EXECUTION_MODES } from "@/components/janus/janusSchema";

export default function Results() {
  const navigate = useNavigate();
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadRun = async () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      
      if (!id) {
        navigate("/new-query");
        return;
      }

      // Check if current user is admin
      try {
        const user = await base44.auth.me();
        setIsAdmin(user.role === 'admin');
      } catch {
        setIsAdmin(false);
      }

      const runs = await base44.entities.Run.filter({ id });
      if (runs.length > 0) {
        setRun(runs[0]);
      }
      setLoading(false);
    };

    loadRun();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Run not found</p>
          <Button onClick={() => navigate("/new-query")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to New Query
          </Button>
        </div>
      </div>
    );
  }

  const mode = EXECUTION_MODES[run.execution_mode?.toUpperCase()] || EXECUTION_MODES.STANDARD;
  const availableTabs = mode.domains;
  const hasFailed = run.status === "failed";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/history")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to History
          </Button>
          <StatusPill status={run.status} />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-slate-900 mb-2">
                {run.query_text?.substring(0, 100)}{run.query_text?.length > 100 ? "..." : ""}
              </h1>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span>
                  Mode: <span className="font-medium text-slate-700">{mode.label}</span>
                </span>
                <span>•</span>
                <span>
                  Output: <span className="font-medium text-slate-700">{run.output_mode}</span>
                </span>
                {run.refresh_enabled && (
                  <>
                    <span>•</span>
                    <Badge variant="secondary" className="text-xs">Refresh Enabled</Badge>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {hasFailed && run.validation_errors && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="text-red-900 font-semibold mb-2">Validation Failed</h3>
                <p className="text-sm text-red-700 mb-3">
                  The LLM output did not match the expected schema. See errors below:
                </p>
                <ul className="space-y-1">
                  {run.validation_errors.map((err, idx) => (
                    <li key={idx} className="text-sm text-red-800 font-mono bg-red-100 px-3 py-1 rounded">
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {run.raw_json && (
              <details className="mt-4">
                <summary className="text-sm font-medium text-red-900 cursor-pointer hover:underline">
                  View Raw JSON Output
                </summary>
                <pre className="mt-2 text-xs text-red-800 whitespace-pre-wrap font-mono bg-red-100 p-4 rounded-lg overflow-auto max-h-96">
                  {run.raw_json}
                </pre>
              </details>
            )}
          </div>
        )}

        {hasFailed && !run.validation_errors && run.error_message && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="text-red-900 font-semibold mb-2">Execution Failed</h3>
                <pre className="text-sm text-red-800 whitespace-pre-wrap font-mono bg-red-100 p-4 rounded-lg overflow-auto max-h-96">
                  {run.error_message}
                </pre>
              </div>
            </div>
          </div>
        )}

        {!hasFailed && (
          <Tabs defaultValue={availableTabs[0]} className="w-full">
            <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-slate-100 p-1 rounded-lg mb-6">
              {availableTabs.includes("refresh") && (
                <TabsTrigger value="refresh" className="flex items-center gap-1.5 flex-1 min-w-fit">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Refresh</span>
                </TabsTrigger>
              )}
              {availableTabs.includes("corpus") && (
                <TabsTrigger value="corpus" className="flex items-center gap-1.5 flex-1 min-w-fit">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Corpus</span>
                </TabsTrigger>
              )}
              {availableTabs.includes("cogito") && (
                <TabsTrigger value="cogito" className="flex items-center gap-1.5 flex-1 min-w-fit">
                  <Brain className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cogito</span>
                </TabsTrigger>
              )}
              {availableTabs.includes("animus") && (
                <TabsTrigger value="animus" className="flex items-center gap-1.5 flex-1 min-w-fit">
                  <Shield className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Animus</span>
                </TabsTrigger>
              )}
              {availableTabs.includes("actus") && (
                <TabsTrigger value="actus" className="flex items-center gap-1.5 flex-1 min-w-fit">
                  <Rocket className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Actus</span>
                </TabsTrigger>
              )}
              {availableTabs.includes("synthesis") && (
                <TabsTrigger value="synthesis" className="flex items-center gap-1.5 flex-1 min-w-fit">
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Synthesis</span>
                </TabsTrigger>
              )}
              {availableTabs.includes("blueprint") && (
                <TabsTrigger value="blueprint" className="flex items-center gap-1.5 flex-1 min-w-fit">
                  <Map className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Blueprint</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="export" className="flex items-center gap-1.5 flex-1 min-w-fit">
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </TabsTrigger>
            </TabsList>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {availableTabs.includes("refresh") && (
                <TabsContent value="refresh" className="m-0">
                  <RefreshTab data={run.refresh} />
                </TabsContent>
              )}
              {availableTabs.includes("corpus") && (
                <TabsContent value="corpus" className="m-0">
                  <CorpusTab data={run.corpus} />
                </TabsContent>
              )}
              {availableTabs.includes("cogito") && (
                <TabsContent value="cogito" className="m-0">
                  <CogitoTab data={run.cogito} />
                </TabsContent>
              )}
              {availableTabs.includes("animus") && (
                <TabsContent value="animus" className="m-0">
                  <AnimusTab data={run.animus} />
                </TabsContent>
              )}
              {availableTabs.includes("actus") && (
                <TabsContent value="actus" className="m-0">
                  <ActusTab data={run.actus} />
                </TabsContent>
              )}
              {availableTabs.includes("synthesis") && (
                <TabsContent value="synthesis" className="m-0">
                  <SynthesisTab data={run.synthesis} />
                </TabsContent>
              )}
              {availableTabs.includes("blueprint") && (
                <TabsContent value="blueprint" className="m-0">
                  <BlueprintTab data={run.blueprint} blueprintLevel={run.blueprint_level} />
                </TabsContent>
              )}
              <TabsContent value="export" className="m-0">
                <ExportTab rawJson={run.raw_json} renderMd={run.render_md} fullPrompt={run.full_prompt} isAdmin={isAdmin} />
              </TabsContent>
            </div>
          </Tabs>
        )}
      </div>
    </div>
  );
}