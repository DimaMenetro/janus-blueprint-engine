// A labelled value of the Blueprint: one text, or a list. Renders nothing when the artifact does not hold it.
export default function BlueprintLine({ label, value }) {
  const items = Array.isArray(value) ? value.filter(v => v !== null && v !== undefined && v !== "") : null;
  if (items ? items.length === 0 : value === null || value === undefined || value === "") return null;
  return (
    <div className="text-sm">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      {items ? (
        <ul className="mt-1 space-y-1">
          {items.map((v, i) => <li key={i} className="text-slate-700 dark:text-slate-200">• {String(v)}</li>)}
        </ul>
      ) : (
        <p className="mt-1 text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{String(value)}</p>
      )}
    </div>
  );
}