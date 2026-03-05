import { Layers, AlertTriangle, Info, Atom, Scale, MessageSquare, Crosshair, GitBranch } from "lucide-react";

const INTERSECTION_CONFIG = {
  corpus_x_cogito: { label: "Corpus × Cogito", subtitle: "Knowledge ↔ Reality Validation", color: "indigo" },
  corpus_x_animus: { label: "Corpus × Animus", subtitle: "Technical ↔ Ethical Boundary", color: "rose" },
  corpus_x_actus: { label: "Corpus × Actus", subtitle: "Quantum Foresight Origin", color: "violet" },
  cogito_x_animus: { label: "Cogito × Animus", subtitle: "Governed Cogito Origin", color: "emerald" },
  cogito_x_actus: { label: "Cogito × Actus", subtitle: "Narrative Loop Origin", color: "blue" },
  animus_x_actus: { label: "Animus × Actus", subtitle: "Empathy-Driven Strategy Origin", color: "amber" },
};

const intersectionColorMap = {
  indigo: { card: "bg-indigo-50/[0.15] dark:bg-indigo-900/[0.10] border-indigo-300/60 dark:border-indigo-500/35", text: "text-indigo-700 dark:text-indigo-300", label: "text-indigo-800 dark:text-indigo-200" },
  rose: { card: "bg-rose-50/[0.15] dark:bg-rose-900/[0.10] border-rose-300/60 dark:border-rose-500/35", text: "text-rose-700 dark:text-rose-300", label: "text-rose-800 dark:text-rose-200" },
  violet: { card: "bg-violet-50/[0.15] dark:bg-violet-900/[0.10] border-violet-300/60 dark:border-violet-500/35", text: "text-violet-700 dark:text-violet-300", label: "text-violet-800 dark:text-violet-200" },
  emerald: { card: "bg-emerald-50/[0.15] dark:bg-emerald-900/[0.10] border-emerald-300/60 dark:border-emerald-500/35", text: "text-emerald-700 dark:text-emerald-300", label: "text-emerald-800 dark:text-emerald-200" },
  blue: { card: "bg-blue-50/[0.15] dark:bg-blue-900/[0.10] border-blue-300/60 dark:border-blue-500/35", text: "text-blue-700 dark:text-blue-300", label: "text-blue-800 dark:text-blue-200" },
  amber: { card: "bg-amber-50/[0.15] dark:bg-amber-900/[0.10] border-amber-300/60 dark:border-amber-500/35", text: "text-amber-700 dark:text-amber-300", label: "text-amber-800 dark:text-amber-200" },
};

export default function SynthesisTab({ data }) {
  if (!data) return <div className="text-slate-500 p-6">No synthesis data available.</div>;

  // Handle both empathy_driven_strategy (v2.0) and alignment_engine (legacy) field names
  const empathyData = data.empathy_driven_strategy || data.alignment_engine;

  return (
    <div className="space-y-6 p-6">

      {/* 4 Named Synthesis Patterns — v2.0 */}
      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono uppercase tracking-widest mb-2">
        Section V — The Nexus: Emergent Cross-Domain Patterns
      </div>

      {/* ═══ INTERSECTION MATRIX — 6 Domain Pairs ═══ */}
      {data.intersection_matrix && Object.keys(data.intersection_matrix).length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <GitBranch className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <h4 className="font-semibold text-slate-900 dark:text-white text-sm uppercase tracking-wider opacity-60">
              Domain Intersection Matrix — 6 Pairs
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(INTERSECTION_CONFIG).map(([key, config]) => {
              const pair = data.intersection_matrix[key];
              if (!pair?.insight && !pair?.tension && !pair?.resolution) return null;
              const colors = intersectionColorMap[config.color];
              return (
                <div key={key} className={`backdrop-blur-[40px] ${colors.card} border shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4`}>
                  <div className="mb-2">
                    <span className={`text-xs font-bold ${colors.text} uppercase tracking-wider`}>{config.label}</span>
                    <p className={`text-[10px] ${colors.text} opacity-60`}>{config.subtitle}</p>
                  </div>
                  {pair.insight && (
                    <div className="mb-2">
                      <span className={`text-[10px] font-semibold ${colors.text} uppercase tracking-wider`}>Insight</span>
                      <p className={`text-xs ${colors.label} mt-0.5 leading-relaxed`}>{pair.insight}</p>
                    </div>
                  )}
                  {pair.tension && (
                    <div className="mb-2">
                      <span className={`text-[10px] font-semibold ${colors.text} uppercase tracking-wider`}>Tension</span>
                      <p className={`text-xs ${colors.label} mt-0.5 italic leading-relaxed`}>{pair.tension}</p>
                    </div>
                  )}
                  {pair.resolution && (
                    <div>
                      <span className={`text-[10px] font-semibold ${colors.text} uppercase tracking-wider`}>Resolution</span>
                      <p className={`text-xs ${colors.label} mt-0.5 leading-relaxed`}>{pair.resolution}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5.1 Quantum Foresight — Corpus/Physics × Actus/Game Theory */}
      {data.quantum_foresight && (
        <div className="backdrop-blur-[40px] bg-violet-50/[0.15] dark:bg-violet-900/[0.15] border border-violet-300/60 dark:border-violet-500/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-start gap-2 mb-3">
            <Atom className="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-violet-900 dark:text-violet-200">5.1 Quantum Foresight Model</h4>
              <p className="text-xs text-violet-600 dark:text-violet-400 opacity-70">Corpus × Actus — Probabilistic Decision-Making</p>
            </div>
          </div>
          {data.quantum_foresight.cross_domain_insight && (
            <div className="mb-3">
              <span className="text-xs font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wider">Cross-Domain Insight</span>
              <p className="text-sm text-violet-800 dark:text-violet-200 mt-1">{data.quantum_foresight.cross_domain_insight}</p>
            </div>
          )}
          {data.quantum_foresight.metaphor && (
            <div className="mb-3 pl-3 border-l-2 border-violet-400/60 dark:border-violet-500/60">
              <span className="text-xs font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wider">Physics Metaphor</span>
              <p className="text-sm text-violet-800 dark:text-violet-200 italic mt-1">"{data.quantum_foresight.metaphor}"</p>
            </div>
          )}
          {data.quantum_foresight.probability_wave?.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wider">Probability Wave — Plausible Futures</span>
              <ul className="mt-1 space-y-1">
                {data.quantum_foresight.probability_wave.map((f, i) => (
                  <li key={i} className="text-sm text-violet-800 dark:text-violet-200 pl-3 border-l-2 border-violet-300/60 dark:border-violet-600/60">{f}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 5.2 Governed Cogito — Animus/Ethics × Cogito/Epistemology */}
      {data.governed_cogito && (
        <div className="backdrop-blur-[40px] bg-emerald-50/[0.15] dark:bg-emerald-900/[0.15] border border-emerald-300/60 dark:border-emerald-500/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-start gap-2 mb-3">
            <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-emerald-900 dark:text-emerald-200">5.2 Governed Cogito</h4>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 opacity-70">Animus × Cogito — Ethical Truth-Finding</p>
            </div>
          </div>
          {data.governed_cogito.ethical_filter_applied && (
            <div className="mb-3">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Ethical Filter Applied</span>
              <p className="text-sm text-emerald-800 dark:text-emerald-200 mt-1">{data.governed_cogito.ethical_filter_applied}</p>
            </div>
          )}
          {data.governed_cogito.conscience_verdict && (
            <div className="mb-3">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Conscience Verdict</span>
              <p className="text-sm text-emerald-800 dark:text-emerald-200 italic mt-1">"{data.governed_cogito.conscience_verdict}"</p>
            </div>
          )}
          {data.governed_cogito.truth_method_soundness && (
            <div>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Method Soundness</span>
              <p className="text-sm text-emerald-800 dark:text-emerald-200 mt-1">{data.governed_cogito.truth_method_soundness}</p>
            </div>
          )}
        </div>
      )}

      {/* 5.3 Narrative Loop — Cogito/Linguistics × Actus/Technical Writing */}
      {data.narrative_loop && (
        <div className="backdrop-blur-[40px] bg-blue-50/[0.15] dark:bg-blue-900/[0.15] border border-blue-300/60 dark:border-blue-500/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-start gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-200">5.3 Narrative Loop</h4>
              <p className="text-xs text-blue-600 dark:text-blue-400 opacity-70">Cogito × Actus — Resonant Communication</p>
            </div>
          </div>
          {data.narrative_loop.decoded_user_narrative && (
            <div className="mb-3">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Decoded User Narrative</span>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">{data.narrative_loop.decoded_user_narrative}</p>
            </div>
          )}
          {data.narrative_loop.resonant_strategy && (
            <div className="mb-3">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Resonant Communication Strategy</span>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">{data.narrative_loop.resonant_strategy}</p>
            </div>
          )}
          {data.narrative_loop.lossless_compression && (
            <div className="pl-3 border-l-2 border-blue-400/60 dark:border-blue-500/60">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Lossless Compression — The Signal</span>
              <p className="text-sm text-blue-800 dark:text-blue-200 italic mt-1">"{data.narrative_loop.lossless_compression}"</p>
            </div>
          )}
        </div>
      )}

      {/* 5.4 Empathy-Driven Strategy — Animus/HCI × Actus/Behavioral Economics */}
      {empathyData && (
        <div className="backdrop-blur-[40px] bg-amber-50/[0.15] dark:bg-amber-900/[0.15] border border-amber-300/60 dark:border-amber-500/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-start gap-2 mb-3">
            <Crosshair className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900 dark:text-amber-200">5.4 Empathy-Driven Strategy</h4>
              <p className="text-xs text-amber-600 dark:text-amber-400 opacity-70">Animus × Actus — Non-Rational Agent Modeling</p>
            </div>
          </div>
          {(empathyData.true_goal_vs_literal_prompt) && (
            <div className="mb-3">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">True Goal vs Literal Prompt</span>
              <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">{empathyData.true_goal_vs_literal_prompt}</p>
            </div>
          )}
          {(empathyData.behavioral_model) && (
            <div className="mb-3">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">Behavioral Model</span>
              <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">{empathyData.behavioral_model}</p>
            </div>
          )}
          {(empathyData.empathy_strategy || empathyData.alignment_strategy) && (
            <div>
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">Empathy Strategy</span>
              <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">{empathyData.empathy_strategy || empathyData.alignment_strategy}</p>
            </div>
          )}
        </div>
      )}

      {/* Legacy fields — cross-domain takeaways + constraint collisions */}
      {data.key_takeaways && data.key_takeaways.length > 0 && (
        <div className="backdrop-blur-[40px] bg-white/[0.10] dark:bg-white/[0.05] border border-white/60 dark:border-white/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            <h4 className="font-semibold text-slate-900 dark:text-white">Cross-Domain Takeaways</h4>
            <span className="ml-auto px-2 py-0.5 rounded text-xs font-medium backdrop-blur-[40px] bg-slate-800/[0.80] dark:bg-slate-200/[0.80] text-white dark:text-slate-900 border border-slate-700/60 dark:border-slate-300/60">{data.key_takeaways.length}</span>
          </div>
          <ul className="space-y-3">
            {data.key_takeaways.map((takeaway, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm">
                <span className="w-6 h-6 rounded-full backdrop-blur-[40px] bg-slate-800/[0.80] dark:bg-slate-200/[0.80] text-white dark:text-slate-900 border border-slate-700/60 dark:border-slate-300/60 flex items-center justify-center shrink-0 text-xs font-medium">{idx + 1}</span>
                <span className="text-slate-700 dark:text-slate-200 pt-0.5">{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.constraint_collisions && data.constraint_collisions.length > 0 && (
        <div className="backdrop-blur-[40px] bg-amber-50/[0.10] dark:bg-amber-900/[0.10] border border-amber-300/60 dark:border-amber-500/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-300" />
            <h4 className="font-semibold text-amber-900 dark:text-amber-200">Constraint Collisions</h4>
          </div>
          <ul className="space-y-2">
            {data.constraint_collisions.map((collision, idx) => (
              <li key={idx} className="text-sm text-amber-800 dark:text-amber-200 pl-4 border-l-2 border-amber-300/60 dark:border-amber-600/60">{collision}</li>
            ))}
          </ul>
        </div>
      )}

      {data.limitation_foreground && (
        <div className="backdrop-blur-[40px] bg-blue-50/[0.15] dark:bg-blue-900/[0.15] border border-blue-300/60 dark:border-blue-500/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">Overall Limitations</h4>
              <p className="text-blue-800 dark:text-blue-200 text-sm">{data.limitation_foreground}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}