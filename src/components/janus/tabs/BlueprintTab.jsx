import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Target, Lightbulb, AlertTriangle, Clock, Zap, CheckSquare, TestTube } from "lucide-react";

const impactColors = {
  low: "backdrop-blur-[40px] bg-blue-50/[0.15] dark:bg-blue-900/[0.15] text-blue-700 dark:text-blue-400 border border-blue-300/60 dark:border-blue-500/35",
  med: "backdrop-blur-[40px] bg-amber-50/[0.15] dark:bg-amber-900/[0.15] text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-500/35",
  high: "backdrop-blur-[40px] bg-red-50/[0.15] dark:bg-red-900/[0.15] text-red-700 dark:text-red-400 border border-red-300/60 dark:border-red-500/35",
};

const effortColors = {
  low: "backdrop-blur-[40px] bg-emerald-50/[0.15] dark:bg-emerald-900/[0.15] text-emerald-700 dark:text-emerald-400 border border-emerald-300/60 dark:border-emerald-500/35",
  medium: "backdrop-blur-[40px] bg-amber-50/[0.15] dark:bg-amber-900/[0.15] text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-500/35",
  high: "backdrop-blur-[40px] bg-red-50/[0.15] dark:bg-red-900/[0.15] text-red-700 dark:text-red-400 border border-red-300/60 dark:border-red-500/35",
};

export default function BlueprintTab({ data, blueprintLevel }) {
  if (!data) return <div className="text-slate-500 p-6">No blueprint data available.</div>;

  const level = blueprintLevel || "L2";

  return (
    <div className="space-y-6 p-6">
      {data.goal && (
        <div className="backdrop-blur-[40px] bg-white/[0.10] dark:bg-white/[0.05] rounded-lg p-4 border border-white/60 dark:border-white/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)]">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            <h4 className="font-semibold text-slate-900 dark:text-white">Goal</h4>
          </div>
          <p className="text-slate-700 dark:text-slate-200 font-medium">{data.goal}</p>
        </div>
      )}

      {data.assumptions && data.assumptions.length > 0 && (
        <div className="backdrop-blur-[40px] bg-white/[0.10] dark:bg-white/[0.05] border border-white/60 dark:border-white/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-300" />
            <h4 className="font-semibold text-slate-900 dark:text-white">Assumptions</h4>
          </div>
          <ul className="space-y-2">
            {data.assumptions.map((assumption, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm">
                <span className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400 mt-1.5 shrink-0" />
                <span className="text-slate-700 dark:text-slate-200 font-medium">{assumption}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.alternative_approaches && data.alternative_approaches.length > 0 && (
        <div className="backdrop-blur-[40px] bg-purple-50/[0.15] dark:bg-purple-900/[0.15] border border-purple-300/60 dark:border-purple-500/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h4 className="font-semibold text-purple-900 dark:text-purple-200">Alternative Approaches Considered</h4>
          </div>
          <div className="space-y-3">
            {data.alternative_approaches.map((approach, idx) => (
              <Card key={idx} className="p-3 backdrop-blur-[40px] bg-white/[0.15] dark:bg-white/[0.08] border border-white/60 dark:border-white/35">
                <h5 className="font-medium text-slate-900 dark:text-white mb-2">{approach.name}</h5>
                {approach.pros && approach.pros.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Pros:</span>
                    <ul className="text-sm text-slate-600 dark:text-slate-300 ml-4 mt-1">
                      {approach.pros.map((pro, i) => (
                        <li key={i}>+ {pro}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {approach.cons && approach.cons.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-red-600 dark:text-red-400">Cons:</span>
                    <ul className="text-sm text-slate-600 dark:text-slate-300 ml-4 mt-1">
                      {approach.cons.map((con, i) => (
                        <li key={i}>- {con}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {approach.why_not_chosen && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-2">
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
          <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Implementation Steps</h4>
          <div className="space-y-4">
            {data.steps.map((step) => (
              <Card key={step.step} className="p-5 backdrop-blur-[40px] bg-white/[0.10] dark:bg-white/[0.05] border border-white/60 dark:border-white/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)]">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full backdrop-blur-[40px] bg-slate-800/[0.80] dark:bg-slate-200/[0.80] text-white dark:text-slate-900 border border-slate-700/60 dark:border-slate-300/60 flex items-center justify-center font-semibold text-sm shrink-0">
                      {step.step}
                    </div>
                    <div>
                      <h5 className="font-semibold text-slate-900 dark:text-white">{step.title}</h5>
                      {(level === "L2" || level === "L3") && (
                        <div className="flex items-center gap-3 mt-1">
                          {step.time_estimate && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {step.time_estimate}
                            </span>
                          )}
                          {step.effort_level && (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${effortColors[step.effort_level] || "backdrop-blur-[40px] bg-slate-50/[0.15] dark:bg-slate-900/[0.15] text-slate-600 dark:text-slate-400 border border-slate-300/60 dark:border-slate-500/35"}`}>
                              {step.effort_level} effort
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {step.depends_on_steps && step.depends_on_steps.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded backdrop-blur-[40px] bg-white/[0.10] dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 border border-white/60 dark:border-white/35">
                      Depends: {step.depends_on_steps.join(", ")}
                    </span>
                  )}
                </div>

                <p className="text-slate-700 dark:text-slate-200 text-sm mb-3 pl-11">{step.instructions}</p>

                {(level === "L2" || level === "L3") && step.substeps && step.substeps.length > 0 && (
                  <div className="pl-11 mb-3">
                    <h6 className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">Substeps:</h6>
                    <div className="space-y-2">
                      {step.substeps.map((sub, idx) => (
                        <div key={idx} className="backdrop-blur-[40px] bg-white/[0.15] dark:bg-white/[0.08] border border-white/60 dark:border-white/35 rounded p-2 text-sm">
                          <span className="font-medium text-slate-700 dark:text-slate-200">{sub.substep}</span>
                          {sub.details && <p className="text-slate-600 dark:text-slate-300 text-xs mt-1">{sub.details}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {level === "L3" && step.checklist && step.checklist.length > 0 && (
                  <div className="pl-11 mb-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <CheckSquare className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                      <h6 className="text-xs font-medium text-slate-600 dark:text-slate-300">Checklist:</h6>
                    </div>
                    <ul className="space-y-1">
                      {step.checklist.map((item, idx) => (
                        <li key={idx} className="text-sm text-slate-700 dark:text-slate-200 flex items-start gap-2">
                          <span className="text-slate-400 dark:text-slate-500 mt-0.5">☐</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {level === "L3" && step.acceptance_tests && step.acceptance_tests.length > 0 && (
                  <div className="pl-11 mb-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <TestTube className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                      <h6 className="text-xs font-medium text-slate-600 dark:text-slate-300">Acceptance Tests:</h6>
                    </div>
                    <ul className="space-y-1">
                      {step.acceptance_tests.map((test, idx) => (
                        <li key={idx} className="text-sm text-slate-700 dark:text-slate-200 font-medium backdrop-blur-[40px] bg-blue-50/[0.15] dark:bg-blue-900/[0.15] border border-blue-300/60 dark:border-blue-500/35 rounded px-2 py-1">
                          {test}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pl-11 text-sm">
                  {step.inputs && step.inputs.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Inputs:</span>
                      <ul className="mt-1 space-y-1">
                        {step.inputs.map((input, idx) => (
                          <li key={idx} className="text-slate-600 dark:text-slate-300">→ {input}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {step.outputs && step.outputs.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Outputs:</span>
                      <ul className="mt-1 space-y-1">
                        {step.outputs.map((output, idx) => (
                          <li key={idx} className="text-slate-600 dark:text-slate-300">← {output}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {step.validation && (
                    <div>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Validation:</span>
                      <p className="text-slate-600 dark:text-slate-300 mt-1">{step.validation}</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {data.success_criteria && data.success_criteria.length > 0 && (
        <div className="backdrop-blur-[40px] bg-emerald-50/[0.15] dark:bg-emerald-900/[0.15] border border-emerald-300/60 dark:border-emerald-500/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h4 className="font-semibold text-emerald-900 dark:text-emerald-200">Success Criteria</h4>
          </div>
          <ul className="space-y-2">
            {data.success_criteria.map((criterion, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-emerald-900 dark:text-emerald-200">{criterion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.risk_register && data.risk_register.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-300" />
            <h4 className="font-semibold text-slate-900 dark:text-white">Risk Register</h4>
          </div>
          <div className="space-y-3">
            {data.risk_register.map((risk, idx) => (
              <div key={idx} className="backdrop-blur-[40px] bg-white/[0.10] dark:bg-white/[0.05] border border-white/60 dark:border-white/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="font-medium text-slate-900 dark:text-white">{risk.risk}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${impactColors[risk.impact] || "backdrop-blur-[40px] bg-slate-50/[0.15] dark:bg-slate-900/[0.15] text-slate-600 dark:text-slate-400 border border-slate-300/60 dark:border-slate-500/35"}`}>
                    {risk.impact} impact
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
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