import { BookOpen, AlertCircle, Cpu, Server, Database, Shield, Brain, Atom, Settings } from "lucide-react";

const SUBDOMAIN_CONFIG = {
  ai_ml: { label: "AI / ML Systems", icon: Cpu, color: "blue" },
  distributed_systems: { label: "Distributed Systems", icon: Server, color: "indigo" },
  data_engineering: { label: "Data Engineering", icon: Database, color: "cyan" },
  cybersecurity: { label: "Cybersecurity", icon: Shield, color: "red" },
  neuroscience: { label: "Neuroscience", icon: Brain, color: "purple" },
  physics: { label: "Physics", icon: Atom, color: "violet" },
  systems_engineering: { label: "Systems Engineering", icon: Settings, color: "slate" },
};

const colorMap = {
  blue: { card: "bg-blue-50/[0.15] dark:bg-blue-900/[0.10] border-blue-300/60 dark:border-blue-500/35", badge: "text-blue-700 dark:text-blue-300", icon: "text-blue-600 dark:text-blue-400" },
  indigo: { card: "bg-indigo-50/[0.15] dark:bg-indigo-900/[0.10] border-indigo-300/60 dark:border-indigo-500/35", badge: "text-indigo-700 dark:text-indigo-300", icon: "text-indigo-600 dark:text-indigo-400" },
  cyan: { card: "bg-cyan-50/[0.15] dark:bg-cyan-900/[0.10] border-cyan-300/60 dark:border-cyan-500/35", badge: "text-cyan-700 dark:text-cyan-300", icon: "text-cyan-600 dark:text-cyan-400" },
  red: { card: "bg-red-50/[0.15] dark:bg-red-900/[0.10] border-red-300/60 dark:border-red-500/35", badge: "text-red-700 dark:text-red-300", icon: "text-red-600 dark:text-red-400" },
  purple: { card: "bg-purple-50/[0.15] dark:bg-purple-900/[0.10] border-purple-300/60 dark:border-purple-500/35", badge: "text-purple-700 dark:text-purple-300", icon: "text-purple-600 dark:text-purple-400" },
  violet: { card: "bg-violet-50/[0.15] dark:bg-violet-900/[0.10] border-violet-300/60 dark:border-violet-500/35", badge: "text-violet-700 dark:text-violet-300", icon: "text-violet-600 dark:text-violet-400" },
  slate: { card: "bg-white/[0.10] dark:bg-white/[0.05] border-white/60 dark:border-white/35", badge: "text-slate-700 dark:text-slate-300", icon: "text-slate-600 dark:text-slate-400" },
};

export default function CorpusTab({ data }) {
  if (!data) return <div className="text-slate-500 p-6">No corpus data available.</div>;

  return (
    <div className="space-y-6 p-6">

      {/* Hard Constraints */}
      {data.constraints && data.constraints.length > 0 && (
        <div className="backdrop-blur-[40px] bg-white/[0.10] dark:bg-white/[0.05] border border-white/60 dark:border-white/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            <h4 className="font-semibold text-slate-900 dark:text-white">Hard Constraints</h4>
            <span className="ml-auto px-2 py-0.5 rounded text-xs font-medium backdrop-blur-[40px] bg-slate-800/[0.80] dark:bg-slate-200/[0.80] text-white dark:text-slate-900 border border-slate-700/60 dark:border-slate-300/60">{data.constraints.length}</span>
          </div>
          <ul className="space-y-2">
            {data.constraints.map((constraint, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm">
                <span className="w-6 h-6 rounded-full backdrop-blur-[40px] bg-slate-800/[0.80] dark:bg-slate-200/[0.80] text-white dark:text-slate-900 border border-slate-700/60 dark:border-slate-300/60 flex items-center justify-center shrink-0 text-xs font-medium">
                  {idx + 1}
                </span>
                <span className="text-slate-700 dark:text-slate-200 pt-0.5">{constraint}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Feasibility Notes */}
      {data.feasibility_notes && data.feasibility_notes.length > 0 && (
        <div className="backdrop-blur-[40px] bg-blue-50/[0.15] dark:bg-blue-900/[0.15] border border-blue-300/60 dark:border-blue-500/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h4 className="font-semibold text-blue-900 dark:text-blue-200">Feasibility Notes</h4>
          </div>
          <ul className="space-y-2">
            {data.feasibility_notes.map((note, idx) => (
              <li key={idx} className="text-sm text-blue-800 dark:text-blue-200 pl-4 border-l-2 border-blue-300/60 dark:border-blue-600/60">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* v2.0 Subdomain Perspectives */}
      {data.subdomains && Object.keys(data.subdomains).length > 0 && (
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm uppercase tracking-wider opacity-60">
            7 Subdomain Perspectives — Active Functional Models
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(SUBDOMAIN_CONFIG).map(([key, config]) => {
              const sub = data.subdomains?.[key];
              if (!sub?.perspective && !sub?.key_findings?.length) return null;
              const colors = colorMap[config.color];
              const Icon = config.icon;
              return (
                <div key={key} className={`backdrop-blur-[40px] ${colors.card} border shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${colors.icon}`} />
                    <span className={`text-xs font-semibold ${colors.badge}`}>{config.label}</span>
                  </div>
                  {sub.perspective && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic mb-2 leading-relaxed">
                      {sub.perspective}
                    </p>
                  )}
                  {sub.key_findings && sub.key_findings.length > 0 && (
                    <ul className="space-y-1">
                      {sub.key_findings.map((finding, i) => (
                        <li key={i} className="text-xs text-slate-700 dark:text-slate-200 pl-3 border-l-2 border-white/40 dark:border-white/20">
                          {finding}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}