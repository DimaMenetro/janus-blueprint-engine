import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, History as HistoryIcon, Zap, Wrench } from "lucide-react";
import RunCard from "@/components/janus/RunCard";

export default function History() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadRuns = async () => {
      const data = await base44.entities.Run.list("-created_date", 100);
      setRuns(data);
      setLoading(false);
    };
    loadRuns();
  }, []);

  const filteredRuns = runs.filter(run =>
    run.query_text?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <HistoryIcon className="w-7 h-7 text-blue-600 dark:text-purple-400" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Run History
            </h1>
          </div>
          <div className="flex gap-2">
            <Link to="/diagnostics">
              <Button variant="outline">
                <Wrench className="w-4 h-4 mr-2" />
                Diagnostics
              </Button>
            </Link>
            <Link to="/new-query">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Query
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
          <Input
            placeholder="Search by keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 backdrop-blur-md bg-white/20 dark:bg-black/30 border-white/30 dark:border-white/20 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 backdrop-blur-xl bg-white/40 dark:bg-black/20 rounded-2xl border border-white/20 dark:border-white/10 animate-pulse" />
            ))}
          </div>
        ) : filteredRuns.length === 0 ? (
          <div className="text-center py-16 backdrop-blur-xl bg-white/25 dark:bg-black/40 rounded-2xl border border-white/20 dark:border-white/10 shadow-xl">
            <Zap className="w-12 h-12 text-blue-300 dark:text-purple-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              {searchQuery ? "No matching runs found" : "No runs yet"}
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              {searchQuery
                ? "Try a different search term"
                : "Execute your first Janus query to get started"}
            </p>
            {!searchQuery && (
              <Link to="/new-query">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Query
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRuns.map(run => (
              <RunCard key={run.id} run={run} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}