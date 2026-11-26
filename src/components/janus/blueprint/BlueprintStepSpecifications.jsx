// The written-out specifications of a step: the algorithm, formula, structure, contract or test a builder would
// otherwise have to invent. Shown in full, as recorded.
const KIND = { algorithm: "Algorithm", formula: "Formula", data_structure: "Data structure", state_machine: "State machine", interface_contract: "Interface contract",
  procedure: "Procedure", tolerance: "Tolerance", experiment: "Experiment", failure_handling: "Failure handling", physical_mechanism: "Physical mechanism" };

export default function BlueprintStepSpecifications({ step }) {
  const specs = (step.specifications || []).filter(s => s?.content);
  if (!specs.length) return null;
  return (
    <div className="pl-11 mb-3">
      <h6 className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">Specifications:</h6>
      <ul className="space-y-2">
        {specs.map((s, i) => (
          <li key={i} className="text-sm border-l-2 border-slate-300 dark:border-slate-600 pl-3">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{KIND[s.kind] || s.kind}{s.name ? ` · ${s.name}` : ""}</p>
            <p className="mt-1 text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-words">{s.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}