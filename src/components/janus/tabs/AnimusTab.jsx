import { Shield, Ban, AlertTriangle, CircleDot, Scale, Eye, Users } from "lucide-react";

export default function AnimusTab({ data }) {
  if (!data) return <div className="text-slate-500 p-6">No animus data available.</div>;

  return (
    <div className="space-y-6 p-6">

      {/* Consciousness Boundary — v2.0 */}
      {data.consciousness_boundary && (
        <div className="backdrop-blur-[40px] bg-violet-50/[0.15] dark:bg-violet-900/[0.15] border border-violet-300/60 dark:border-violet-500/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CircleDot className="w-5 h-5 text-violet-600 dark:text-violet-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold text-violet-900 dark:text-violet-200 mb-1">Consciousness Boundary (3.1)</h4>
              <p className="text-sm text-violet-800 dark:text-violet-200">{data.consciousness_boundary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Conscience Verdict — v2.0 Ethics over Compliance */}
      {data.ethical_stance && (
        <div className="backdrop-blur-[40px] bg-emerald-50/[0.15] dark:bg-emerald-900/[0.15] border border-emerald-300/60 dark:border-emerald-500/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold text-emerald-900 dark:text-emerald-200 mb-1">Conscience Verdict — Ethics & Governance (3.3)</h4>
              <p className="text-sm text-emerald-800 dark:text-emerald-200 italic">{data.ethical_stance}</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 opacity-70">Conscience over Compliance — internalised principles, not a checklist.</p>
            </div>
          </div>
        </div>
      )}

      {/* Boundary Checks */}
      {data.boundary_checks && data.boundary_checks.length > 0 && (
        <div className="backdrop-blur-[40px] bg-white/[0.10] dark:bg-white/[0.05] border border-white/60 dark:border-white/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h4 className="font-semibold text-slate-900 dark:text-white">Boundary Checks</h4>
            <span className="ml-auto px-2 py-0.5 rounded text-xs font-medium backdrop-blur-[40px] bg-slate-800/[0.80] dark:bg-slate-200/[0.80] text-white dark:text-slate-900 border border-slate-700/60 dark:border-slate-300/60">{data.boundary_checks.length}</span>
          </div>
          <ul className="space-y-2">
            {data.boundary_checks.map((check, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm">
                <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 mt-1.5 shrink-0" />
                <span className="text-slate-700 dark:text-slate-200">{check}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disallowed Moves */}
      {data.disallowed_moves && data.disallowed_moves.length > 0 && (
        <div className="backdrop-blur-[40px] bg-red-50/[0.15] dark:bg-red-900/[0.15] border border-red-300/60 dark:border-red-500/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Ban className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h4 className="font-semibold text-red-900 dark:text-red-200">Disallowed Moves (Conscience-Level)</h4>
            <span className="ml-auto px-2 py-0.5 rounded text-xs font-medium text-red-700 dark:text-red-400 border border-red-300/60 dark:border-red-500/35">{data.disallowed_moves.length}</span>
          </div>
          <ul className="space-y-2">
            {data.disallowed_moves.map((move, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm">
                <span className="w-2 h-2 rounded-full bg-red-600 dark:bg-red-400 mt-1.5 shrink-0" />
                <span className="text-red-800 dark:text-red-200">{move}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Attractor States — v2.0 AI Safety & Alignment (replaces Jungian) */}
      {data.attractor_states && data.attractor_states.length > 0 && (
        <div className="backdrop-blur-[40px] bg-amber-50/[0.15] dark:bg-amber-900/[0.15] border border-amber-300/60 dark:border-amber-500/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-amber-600 dark:text-amber-300" />
            <h4 className="font-semibold text-amber-900 dark:text-amber-200">Attractor States — AI Safety & Alignment (3.4)</h4>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400 mb-3 opacity-70">Recurring behavioral patterns as mathematical attractors in the problem's phase space.</p>
          <ul className="space-y-2">
            {data.attractor_states.map((state, idx) => (
              <li key={idx} className="text-sm text-amber-800 dark:text-amber-200 pl-4 border-l-2 border-amber-300/60 dark:border-amber-600/60">
                {state}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk Analysis — v2.0 (replaces UI/UX) */}
      {data.risk_analysis && (
        <div className="backdrop-blur-[40px] bg-slate-50/[0.10] dark:bg-slate-900/[0.10] border border-slate-300/60 dark:border-slate-600/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            <h4 className="font-semibold text-slate-900 dark:text-white">Risk Analysis & Cognitive Synchronisation (3.5)</h4>
          </div>
          {data.risk_analysis.cognitive_sync_assessment && (
            <div className="mb-3">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Cognitive Sync Assessment</span>
              <p className="text-sm text-slate-700 dark:text-slate-200 mt-1">{data.risk_analysis.cognitive_sync_assessment}</p>
            </div>
          )}
          {data.risk_analysis.self_determination_factors && data.risk_analysis.self_determination_factors.length > 0 && (
            <div className="mb-3">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Self-Determination Factors (Autonomy · Competence · Relatedness)</span>
              <ul className="mt-1 space-y-1">
                {data.risk_analysis.self_determination_factors.map((f, i) => (
                  <li key={i} className="text-sm text-slate-700 dark:text-slate-200 pl-3 border-l-2 border-emerald-300/60 dark:border-emerald-600/60">{f}</li>
                ))}
              </ul>
            </div>
          )}
          {data.risk_analysis.misalignment_risks && data.risk_analysis.misalignment_risks.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Misalignment Risks</span>
              <ul className="mt-1 space-y-1">
                {data.risk_analysis.misalignment_risks.map((r, i) => (
                  <li key={i} className="text-sm text-red-700 dark:text-red-300 pl-3 border-l-2 border-red-300/60 dark:border-red-600/60">⚠️ {r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Safety Notes */}
      {data.safety_notes && data.safety_notes.length > 0 && (
        <div className="backdrop-blur-[40px] bg-amber-50/[0.10] dark:bg-amber-900/[0.10] border border-amber-300/60 dark:border-amber-500/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-300" />
            <h4 className="font-semibold text-amber-900 dark:text-amber-200">Safety Notes</h4>
          </div>
          <ul className="space-y-2">
            {data.safety_notes.map((note, idx) => (
              <li key={idx} className="text-sm text-amber-800 dark:text-amber-200 pl-4 border-l-2 border-amber-300/60 dark:border-amber-600/60">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}