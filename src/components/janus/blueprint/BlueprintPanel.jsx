// One framed section of the Blueprint surface: icon, title, content. Same glass frame as the rest of the tab.
export default function BlueprintPanel({ icon: Icon, title, note, children }) {
  return (
    <div className="backdrop-blur-[40px] bg-white/[0.10] dark:bg-white/[0.05] border border-white/60 dark:border-white/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon className="w-5 h-5 text-slate-600 dark:text-slate-300 shrink-0" />}
        <h4 className="font-semibold text-slate-900 dark:text-white">{title}</h4>
        {note && <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto">{note}</span>}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}