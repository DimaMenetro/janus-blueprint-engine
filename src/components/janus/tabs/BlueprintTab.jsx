import { Badge } from "@/components/ui/badge";
import { Target, CheckCircle, AlertTriangle, ArrowRight, Link } from "lucide-react";

const impactColors = {
  low: "bg-emerald-100 text-emerald-800",
  med: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

export default function BlueprintTab({ data }) {
  if (!data) return <div className="text-slate-500 p-6">No blueprint data available.</div>;

  return (
    <div className="space-y-6 p-6">
      {data.goal && (
        <div className="bg-slate-900 text-white rounded-lg p-5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5" />
            <h4 className="font-medium">Goal</h4>
          </div>
          <p className="text-slate-200">{data.goal}</p>
        </div>
      )}

      {data.assumptions && data.assumptions.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h4 className="font-medium text-slate-900 mb-3">Assumptions</h4>
          <ul className="space-y-2">
            {data.assumptions.map((assumption, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className="text-slate-400">•</span>
                <span className="text-slate-700">{assumption}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.steps && data.steps.length > 0 && (
        <div>
          <h4 className="font-medium text-slate-900 mb-4">Steps</h4>
          <div className="space-y-4">
            {data.steps.map((step, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-semibold">
                    {step.step}
                  </span>
                  <h5 className="font-medium text-slate-900">{step.title}</h5>
                </div>
                
                <p className="text-sm text-slate-700 mb-4">{step.instructions}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {step.inputs && step.inputs.length > 0 && (
                    <div className="bg-slate-50 rounded-md p-3">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Inputs</span>
                      <ul className="mt-2 space-y-1">
                        {step.inputs.map((input, i) => (
                          <li key={i} className="text-slate-700">• {input}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {step.outputs && step.outputs.length > 0 && (
                    <div className="bg-slate-50 rounded-md p-3">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Outputs</span>
                      <ul className="mt-2 space-y-1">
                        {step.outputs.map((output, i) => (
                          <li key={i} className="text-slate-700">• {output}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {step.validation && (
                  <div className="mt-3 flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span className="text-slate-600"><strong>Validation:</strong> {step.validation}</span>
                  </div>
                )}

                {step.depends_on_steps && step.depends_on_steps.length > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <Link className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-500">Depends on steps:</span>
                    {step.depends_on_steps.map((dep, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        Step {dep}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.success_criteria && data.success_criteria.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h4 className="font-medium text-emerald-900">Success Criteria</h4>
          </div>
          <ul className="space-y-2">
            {data.success_criteria.map((criterion, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-emerald-800">
                <ArrowRight className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{criterion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.risk_register && data.risk_register.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h4 className="font-medium text-slate-900">Risk Register</h4>
          </div>
          <div className="space-y-3">
            {data.risk_register.map((risk, idx) => (
              <div key={idx} className="border border-slate-100 rounded-md p-3">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-sm font-medium text-slate-900">{risk.risk}</span>
                  <Badge className={impactColors[risk.impact] || "bg-slate-100"}>
                    {risk.impact} impact
                  </Badge>
                </div>
                {risk.mitigation && (
                  <p className="text-sm text-slate-600">
                    <strong>Mitigation:</strong> {risk.mitigation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}