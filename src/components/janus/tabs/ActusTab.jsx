import { Rocket, Link, AlertCircle, ArrowRight, Target, Gamepad2, FileText, TrendingUp, Plug, BarChart3 } from "lucide-react";

const confidenceColors = {
  Established: "backdrop-blur-[40px] bg-emerald-50/[0.15] dark:bg-emerald-900/[0.15] text-emerald-700 dark:text-emerald-400 border border-emerald-300/60 dark:border-emerald-500/35",
  Contested: "backdrop-blur-[40px] bg-amber-50/[0.15] dark:bg-amber-900/[0.15] text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-500/35",
  Speculative: "backdrop-blur-[40px] bg-purple-50/[0.15] dark:bg-purple-900/[0.15] text-purple-700 dark:text-purple-400 border border-purple-300/60 dark:border-purple-500/35",
};

const probabilityDot = {
  high: "bg-emerald-500 border-emerald-400",
  medium: "bg-amber-500 border-amber-400",
  low: "bg-red-500 border-red-400",
};

export default function ActusTab({ data }) {
  if (!data) return <div className="text-slate-500 p-6">No actus data available.</div>;

  return (
    <div className="space-y-6 p-6">

      {/* Technical Summary — Lossless Compression (Restored Technical Writing) */}
      {data.technical_summary && (
        <div className="backdrop-blur-[40px] bg-slate-800/[0.10] dark:bg-slate-100/[0.05] border border-slate-400/60 dark:border-slate-500/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            <h4 className="font-semibold text-slate-900 dark:text-white">Technical Summary — Lossless Compression (4.5)</h4>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-200 italic leading-relaxed">{data.technical_summary}</p>
        </div>
      )}

      {/* Strategic Plan — 4.1 */}
      {data.strategic_plan && (
        <div className="backdrop-blur-[40px] bg-blue-50/[0.15] dark:bg-blue-900/[0.15] border border-blue-300/60 dark:border-blue-500/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h4 className="font-semibold text-blue-900 dark:text-blue-200">Strategic Plan — Dual Horizon (4.1)</h4>
          </div>
          {data.strategic_plan.immediate_horizon && (
            <div className="mb-2">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Immediate Horizon</span>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">{data.strategic_plan.immediate_horizon}</p>
            </div>
          )}
          {data.strategic_plan.long_term_horizon && (
            <div className="mb-2">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Long-Term Horizon</span>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">{data.strategic_plan.long_term_horizon}</p>
            </div>
          )}
          {data.strategic_plan.key_decision_points?.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Key Decision Points</span>
              <ul className="mt-1 space-y-1">
                {data.strategic_plan.key_decision_points.map((d, i) => (
                  <li key={i} className="text-sm text-blue-800 dark:text-blue-200 pl-3 border-l-2 border-blue-300/60 dark:border-blue-600/60">{d}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Game Theory Analysis — 4.2 */}
      {data.game_theory_analysis && (
        <div className="backdrop-blur-[40px] bg-indigo-50/[0.15] dark:bg-indigo-900/[0.15] border border-indigo-300/60 dark:border-indigo-500/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Gamepad2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h4 className="font-semibold text-indigo-900 dark:text-indigo-200">Game Theory Analysis (4.2)</h4>
          </div>
          {data.game_theory_analysis.game_board && (
            <div className="mb-2">
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">Game Board</span>
              <p className="text-sm text-indigo-800 dark:text-indigo-200 mt-1">{data.game_theory_analysis.game_board}</p>
            </div>
          )}
          {data.game_theory_analysis.zero_sum_assessment && (
            <div className="mb-2">
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">Zero-Sum Assessment</span>
              <p className="text-sm text-indigo-800 dark:text-indigo-200 mt-1">{data.game_theory_analysis.zero_sum_assessment}</p>
            </div>
          )}
          {data.game_theory_analysis.nash_equilibrium && (
            <div className="mb-2">
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">Nash Equilibrium</span>
              <p className="text-sm text-indigo-800 dark:text-indigo-200 mt-1">{data.game_theory_analysis.nash_equilibrium}</p>
            </div>
          )}
          {data.game_theory_analysis.coalition_dynamics?.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">Coalition Dynamics</span>
              <ul className="mt-1 space-y-1">
                {data.game_theory_analysis.coalition_dynamics.map((c, i) => (
                  <li key={i} className="text-sm text-indigo-800 dark:text-indigo-200 pl-3 border-l-2 border-indigo-300/60 dark:border-indigo-600/60">{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Recommendations — Confidence-Propagated */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Rocket className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            <h4 className="font-semibold text-slate-900 dark:text-white">Recommendations (Confidence-Propagated)</h4>
            <span className="ml-auto px-2 py-0.5 rounded text-xs font-medium backdrop-blur-[40px] bg-slate-800/[0.80] dark:bg-slate-200/[0.80] text-white dark:text-slate-900 border border-slate-700/60 dark:border-slate-300/60">{data.recommendations.length}</span>
          </div>
          <div className="space-y-4">
            {data.recommendations.map((rec, idx) => (
              <div key={idx} className="backdrop-blur-[40px] bg-white/[0.10] dark:bg-white/[0.05] border border-white/60 dark:border-white/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-slate-600 dark:text-slate-300">{rec.id}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${confidenceColors[rec.inherited_confidence] || "border border-slate-300 text-slate-600"}`}>
                      {rec.inherited_confidence}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full border ${probabilityDot[rec.probability] || "bg-slate-400 border-slate-300"}`} />
                      <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">{rec.probability} probability</span>
                    </div>
                  </div>
                </div>
                <p className="text-slate-700 dark:text-slate-200 text-sm mb-3">{rec.text}</p>
                {rec.depends_on_claims && rec.depends_on_claims.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <Link className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span className="text-xs text-slate-500">Based on:</span>
                    {rec.depends_on_claims.map((claim, i) => (
                      <span key={i} className="text-xs font-mono px-2 py-0.5 rounded backdrop-blur-[40px] bg-white/[0.10] dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 border border-white/60 dark:border-white/35">
                        {claim}
                      </span>
                    ))}
                  </div>
                )}
                {rec.failure_modes && rec.failure_modes.length > 0 && (
                  <div className="backdrop-blur-[40px] bg-red-50/[0.15] dark:bg-red-900/[0.15] border border-red-300/60 dark:border-red-500/35 rounded-md p-3 mb-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                      <span className="text-xs font-medium text-red-600 dark:text-red-400">Failure Modes</span>
                    </div>
                    <ul className="space-y-1">
                      {rec.failure_modes.map((mode, i) => (
                        <li key={i} className="text-xs text-red-600 dark:text-red-400 pl-3">• {mode}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {rec.next_actions && rec.next_actions.length > 0 && (
                  <div className="backdrop-blur-[40px] bg-white/[0.15] dark:bg-white/[0.08] border border-white/60 dark:border-white/35 rounded-md p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Next Actions</span>
                    </div>
                    <ul className="space-y-1">
                      {rec.next_actions.map((action, i) => (
                        <li key={i} className="text-xs text-slate-600 dark:text-slate-300 pl-3">• {action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Behavioral Economics — Restored 4.6 */}
      {data.behavioral_factors && (
        <div className="backdrop-blur-[40px] bg-orange-50/[0.15] dark:bg-orange-900/[0.15] border border-orange-300/60 dark:border-orange-500/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h4 className="font-semibold text-orange-900 dark:text-orange-200">Behavioral Economics (4.6 — Restored)</h4>
          </div>
          {data.behavioral_factors.identity_economics && (
            <div className="mb-3">
              <span className="text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wider">Identity Economics</span>
              <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">{data.behavioral_factors.identity_economics}</p>
            </div>
          )}
          {data.behavioral_factors.irrational_actors?.length > 0 && (
            <div className="mb-3">
              <span className="text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wider">Irrational Actors / Bias Patterns</span>
              <ul className="mt-1 space-y-1">
                {data.behavioral_factors.irrational_actors.map((a, i) => (
                  <li key={i} className="text-sm text-orange-800 dark:text-orange-200 pl-3 border-l-2 border-orange-300/60 dark:border-orange-600/60">{a}</li>
                ))}
              </ul>
            </div>
          )}
          {data.behavioral_factors.bias_mitigations?.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wider">Bias Mitigations</span>
              <ul className="mt-1 space-y-1">
                {data.behavioral_factors.bias_mitigations.map((b, i) => (
                  <li key={i} className="text-sm text-orange-800 dark:text-orange-200 pl-3 border-l-2 border-orange-300/60 dark:border-orange-600/60">{b}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* API Design & Integration — Restored 4.7 */}
      {data.integration_contracts && data.integration_contracts.length > 0 && (
        <div className="backdrop-blur-[40px] bg-cyan-50/[0.15] dark:bg-cyan-900/[0.15] border border-cyan-300/60 dark:border-cyan-500/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Plug className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h4 className="font-semibold text-cyan-900 dark:text-cyan-200">Integration Contracts — API Design (4.7 — Restored)</h4>
          </div>
          <p className="text-xs text-cyan-700 dark:text-cyan-400 mb-3 opacity-70">APIs as social contracts between digital entities.</p>
          <ul className="space-y-2">
            {data.integration_contracts.map((contract, idx) => (
              <li key={idx} className="text-sm text-cyan-800 dark:text-cyan-200 pl-4 border-l-2 border-cyan-300/60 dark:border-cyan-600/60">{contract}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Iteration Model — 4.4 */}
      {data.iteration_model && (
        <div className="backdrop-blur-[40px] bg-teal-50/[0.15] dark:bg-teal-900/[0.15] border border-teal-300/60 dark:border-teal-500/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h4 className="font-semibold text-teal-900 dark:text-teal-200">Feedback & Iteration Model (4.4)</h4>
          </div>
          {data.iteration_model.value_stream && (
            <div className="mb-2">
              <span className="text-xs font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-wider">Value Stream</span>
              <p className="text-sm text-teal-800 dark:text-teal-200 mt-1">{data.iteration_model.value_stream}</p>
            </div>
          )}
          {data.iteration_model.adaptation_triggers?.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-wider">Adaptation Triggers</span>
              <ul className="mt-1 space-y-1">
                {data.iteration_model.adaptation_triggers.map((t, i) => (
                  <li key={i} className="text-sm text-teal-800 dark:text-teal-200 pl-3 border-l-2 border-teal-300/60 dark:border-teal-600/60">{t}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

    </div>
  );
}