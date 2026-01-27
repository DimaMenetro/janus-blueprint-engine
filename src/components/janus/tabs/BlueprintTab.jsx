import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Target, Lightbulb, AlertTriangle, Clock, Zap, CheckSquare, TestTube } from "lucide-react";

const impactColors = {
  low: "bg-blue-100 text-blue-800",
  med: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

const effortColors = {
  low: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
};

export default function BlueprintTab({ data, blueprintLevel }) {
  if (!data) return <div className="text-slate-500 p-6">No blueprint data available.</div>;

  const level = blueprintLevel || "L2";

  return (
    <div className="space-y-6 p-6">
      {data.goal && (
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-slate-600" />
            <h4 className="font-semibold text-slate-900">Goal</h4>
          </div>
          <p className="text-slate-700">{data.goal}</p>
        </div>
      )}

      {data.assumptions && data.assumptions.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h4 className="font-medium text-slate-900">Assumptions</h4>
          </div>
          <ul className="space-y-2">
            {data.assumptions.map((assumption, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm">
                <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span className="text-slate-700">{assumption}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.alternative_approaches && data.alternative_approaches.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-purple-600" />
            <h4 className="font-medium text-purple-900">Alternative Approaches Considered</h4>
          </div>
          <div className="space-y-3">
            {data.alternative_approaches.map((approach, idx) => (
              <Card key={idx} className="p-3 bg-white">
                <h5 className="font-medium text-slate-900 mb-2">{approach.name}</h5>
                {approach.pros && approach.pros.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-emerald-700">Pros:</span>
                    <ul className="text-sm text-slate-600 ml-4 mt-1">
                      {approach.pros.map((pro, i) => (
                        <li key={i}>+ {pro}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {approach.cons && approach.cons.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-red-700">Cons:</span>
                    <ul className="text-sm text-slate-600 ml-4 mt-1">
                      {approach.cons.map((con, i) => (
                        <li key={i}>- {con}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {approach.why_not_chosen && (
                  <p className="text-xs text-slate-500 italic mt-2">
                    Not chosen: {approach.why_not_chosen}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {data.steps && data.steps.length > 0 && (
        <div>
          <h4 className="font-semibold text-slate-900 mb-4">Implementation Steps</h4>
          <div className="space-y-4">
            {data.steps.map((step) => (
              <Card key={step.step} className="p-5 bg-white border-slate-200">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-sm shrink-0">
                      {step.step}
                    </div>
                    <div>
                      <h5 className="font-semibold text-slate-900">{step.title}</h5>
                      {(level === "L2" || level === "L3") && (
                        <div className="flex items-center gap-3 mt-1">
                          {step.time_estimate && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {step.time_estimate}
                            </span>
                          )}
                          {step.effort_level && (
                            <Badge className={effortColors[step.effort_level] || "bg-slate-100"}>
                              {step.effort_level} effort
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {step.depends_on_steps && step.depends_on_steps.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Depends: {step.depends_on_steps.join(", ")}
                    </Badge>
                  )}
                </div>

                <p className="text-slate-700 text-sm mb-3 pl-11">{step.instructions}</p>

                {(level === "L2" || level === "L3") && step.substeps && step.substeps.length > 0 && (
                  <div className="pl-11 mb-3">
                    <h6 className="text-xs font-medium text-slate-600 mb-2">Substeps:</h6>
                    <div className="space-y-2">
                      {step.substeps.map((sub, idx) => (
                        <div key={idx} className="bg-slate-50 rounded p-2 text-sm">
                          <span className="font-medium text-slate-700">{sub.substep}</span>
                          {sub.details && <p className="text-slate-600 text-xs mt-1">{sub.details}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {level === "L3" && step.checklist && step.checklist.length > 0 && (
                  <div className="pl-11 mb-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <CheckSquare className="w-3.5 h-3.5 text-slate-600" />
                      <h6 className="text-xs font-medium text-slate-600">Checklist:</h6>
                    </div>
                    <ul className="space-y-1">
                      {step.checklist.map((item, idx) => (
                        <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                          <span className="text-slate-400 mt-0.5">☐</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {level === "L3" && step.acceptance_tests && step.acceptance_tests.length > 0 && (
                  <div className="pl-11 mb-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <TestTube className="w-3.5 h-3.5 text-slate-600" />
                      <h6 className="text-xs font-medium text-slate-600">Acceptance Tests:</h6>
                    </div>
                    <ul className="space-y-1">
                      {step.acceptance_tests.map((test, idx) => (
                        <li key={idx} className="text-sm text-slate-700 bg-blue-50 rounded px-2 py-1">
                          {test}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pl-11 text-sm">
                  {step.inputs && step.inputs.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-slate-500">Inputs:</span>
                      <ul className="mt-1 space-y-1">
                        {step.inputs.map((input, idx) => (
                          <li key={idx} className="text-slate-600">→ {input}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {step.outputs && step.outputs.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-slate-500">Outputs:</span>
                      <ul className="mt-1 space-y-1">
                        {step.outputs.map((output, idx) => (
                          <li key={idx} className="text-slate-600">← {output}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {step.validation && (
                    <div>
                      <span className="text-xs font-medium text-slate-500">Validation:</span>
                      <p className="text-slate-600 mt-1">{step.validation}</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {data.success_criteria && data.success_criteria.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h4 className="font-medium text-emerald-900">Success Criteria</h4>
          </div>
          <ul className="space-y-2">
            {data.success_criteria.map((criterion, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-emerald-900">{criterion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.risk_register && data.risk_register.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h4 className="font-medium text-slate-900">Risk Register</h4>
          </div>
          <div className="space-y-3">
            {data.risk_register.map((risk, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="font-medium text-slate-900">{risk.risk}</span>
                  <Badge className={impactColors[risk.impact] || "bg-slate-100"}>
                    {risk.impact} impact
                  </Badge>
                </div>
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Mitigation:</span> {risk.mitigation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}