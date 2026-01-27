import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, RefreshCw, BookOpen, Brain, Shield, Rocket, Layers, Map, Download } from "lucide-react";

import RefreshTab from "@/components/janus/tabs/RefreshTab";
import CorpusTab from "@/components/janus/tabs/CorpusTab";
import CogitoTab from "@/components/janus/tabs/CogitoTab";
import AnimusTab from "@/components/janus/tabs/AnimusTab";
import ActusTab from "@/components/janus/tabs/ActusTab";
import SynthesisTab from "@/components/janus/tabs/SynthesisTab";
import BlueprintTab from "@/components/janus/tabs/BlueprintTab";
import ExportTab from "@/components/janus/tabs/ExportTab";
import StatusPill from "@/components/janus/StatusPill";

export default function Results() {
  const navigate = useNavigate();
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRun = async () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      
      if (!id) {
        navigate("/new-query");
        return;
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
              <p className="text-sm text-slate-500">
                Output Mode: <span className="font-medium text-slate-700">{run.output_mode}</span>
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="refresh" className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-slate-100 p-1 rounded-lg mb-6">
            <TabsTrigger value="refresh" className="flex items-center gap-1.5 flex-1 min-w-fit">
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </TabsTrigger>
            <TabsTrigger value="corpus" className="flex items-center gap-1.5 flex-1 min-w-fit">
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Corpus</span>
            </TabsTrigger>
            <TabsTrigger value="cogito" className="flex items-center gap-1.5 flex-1 min-w-fit">
              <Brain className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cogito</span>
            </TabsTrigger>
            <TabsTrigger value="animus" className="flex items-center gap-1.5 flex-1 min-w-fit">
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Animus</span>
            </TabsTrigger>
            <TabsTrigger value="actus" className="flex items-center gap-1.5 flex-1 min-w-fit">
              <Rocket className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Actus</span>
            </TabsTrigger>
            <TabsTrigger value="synthesis" className="flex items-center gap-1.5 flex-1 min-w-fit">
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Synthesis</span>
            </TabsTrigger>
            <TabsTrigger value="blueprint" className="flex items-center gap-1.5 flex-1 min-w-fit">
              <Map className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Blueprint</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-1.5 flex-1 min-w-fit">
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </TabsTrigger>
          </TabsList>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <TabsContent value="refresh" className="m-0">
              <RefreshTab data={run.refresh} />
            </TabsContent>
            <TabsContent value="corpus" className="m-0">
              <CorpusTab data={run.corpus} />
            </TabsContent>
            <TabsContent value="cogito" className="m-0">
              <CogitoTab data={run.cogito} />
            </TabsContent>
            <TabsContent value="animus" className="m-0">
              <AnimusTab data={run.animus} />
            </TabsContent>
            <TabsContent value="actus" className="m-0">
              <ActusTab data={run.actus} />
            </TabsContent>
            <TabsContent value="synthesis" className="m-0">
              <SynthesisTab data={run.synthesis} />
            </TabsContent>
            <TabsContent value="blueprint" className="m-0">
              <BlueprintTab data={run.blueprint} />
            </TabsContent>
            <TabsContent value="export" className="m-0">
              <ExportTab rawJson={run.raw_json} renderMd={run.render_md} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}