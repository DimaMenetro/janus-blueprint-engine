import { Link } from "react-router-dom";
import { AlertTriangle, ListChecks, Play, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BackendRun() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-blue-500" />
          <h1 className="text-xl font-semibold">Backend Run</h1>
        </div>
        <Link to="/BackendRuns">
          <Button variant="outline" size="sm" className="gap-2">
            <ListChecks className="w-4 h-4" /> View Legacy Runs
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Legacy server-owned execution lane disabled
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Direct execution-budget probes measured the monolithic backend function
            terminating at about 295 seconds. Janus Standard and Full runs are
            completion-oriented and can legitimately exceed that ceiling, so forcing
            them into this transport would recreate the timeout problem at a different layer.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Historical backend runs remain available for inspection. New Janus work should
            use the browser execution lane, which now has no Janus-local LLM deadline and
            can resume from persisted checkpoints after a failed attempt.
          </p>
          <Link to="/NewQuery" className="block">
            <Button className="w-full gap-2">
              <Play className="w-4 h-4" />
              Use Completion-Oriented New Query
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
