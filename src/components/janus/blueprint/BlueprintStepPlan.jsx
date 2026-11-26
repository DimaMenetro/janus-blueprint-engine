// What a step is for and where it sits in the plan: purpose, phase, the components and interfaces it touches,
// and the operator requirements it fulfils.
export default function BlueprintStepPlan({ step }) {
  const { purpose, phase, components, interfaces, fulfils } = step;
  const tags = [phase && `Phase ${phase}`, components?.length && `Components: ${components.join(", ")}`, fulfils?.length && `Fulfils: ${fulfils.join(", ")}`].filter(Boolean);
  if (!purpose && !tags.length && !interfaces?.length) return null;
  return (
    <div className="pl-11 mb-3 text-sm">
      {purpose && <p className="text-slate-700 dark:text-slate-200">{purpose}</p>}
      {tags.length > 0 && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{tags.join(" · ")}</p>}
      {interfaces?.length > 0 && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Interfaces: {interfaces.join("; ")}</p>}
    </div>
  );
}