/**
 * BLUEPRINT → MARKDOWN, lossless (Phase 9). Every string and number the Blueprint artifact holds is written out:
 * the known contract in a readable layout, and anything else the artifact carries (later pipeline fields, fields a
 * historical run has) under its own label. Nothing is dropped because this file does not know a key.
 */
const label = (k) => String(k).replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase());
const text = (v) => {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.map(text).filter(Boolean).join("; ");
  if (typeof v === "object") return Object.entries(v).map(([k, x]) => `${label(k)}: ${text(x)}`).join("; ");
  return String(v);
};
const filled = (v) => (Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && v !== "");
const line = (name, v) => (filled(v) ? `**${name}:** ${text(v)}\n\n` : "");
const bullets = (name, items, mark = "-") => (Array.isArray(items) && items.length ? `**${name}**\n${items.map(i => `${mark} ${text(i)}`).join("\n")}\n\n` : "");
/** Whatever `obj` holds beyond `known`: lists as bullets, everything else as a labelled line. */
const rest = (obj, known) => Object.entries(obj).filter(([k, v]) => !known.includes(k) && filled(v))
  .map(([k, v]) => (Array.isArray(v) ? bullets(label(k), v) : line(label(k), v))).join("");

function stepMarkdown(s) {
  let md = `#### Step ${s.step ?? ""}: ${s.title ?? ""}\n\n`;
  md += line("Purpose", s.purpose);
  md += line("Depends on steps", s.depends_on_steps);
  md += line("Confidence", s.confidence);
  md += line("Derived from", s.derived_from);
  md += line("Time estimate", s.time_estimate);
  md += line("Effort", s.effort_level);
  if (filled(s.instructions)) md += `${text(s.instructions)}\n\n`;
  md += bullets("Inputs", s.inputs) + bullets("Outputs", s.outputs);
  if (Array.isArray(s.substeps) && s.substeps.length) {
    md += `**Substeps**\n${s.substeps.map(x => (x && typeof x === "object" ? `- ${text(x.substep)}${filled(x.details) ? ` — ${text(x.details)}` : ""}${rest(x, ["substep", "details"]).trim() ? ` (${rest(x, ["substep", "details"]).trim().replace(/\n+/g, " ")})` : ""}` : `- ${text(x)}`)).join("\n")}\n\n`;
  }
  md += bullets("Checklist", s.checklist, "- [ ]");
  md += line("Validation", s.validation);
  md += bullets("Acceptance tests", s.acceptance_tests);
  md += rest(s, ["step", "title", "purpose", "depends_on_steps", "confidence", "derived_from", "time_estimate", "effort_level", "instructions",
    "inputs", "outputs", "substeps", "checklist", "validation", "acceptance_tests"]);
  return md;
}

export function blueprintMarkdown(bp) {
  if (!bp) return "";
  let md = "## Blueprint\n\n";
  md += line("Goal", bp.goal);
  md += bullets("Assumptions", bp.assumptions);
  if (Array.isArray(bp.alternative_approaches) && bp.alternative_approaches.length) {
    md += "### Alternatives Considered\n\n";
    bp.alternative_approaches.forEach(a => {
      if (!a || typeof a !== "object") { md += `- ${text(a)}\n\n`; return; }
      md += `#### ${text(a.name)}\n\n` + bullets("Pros", a.pros) + bullets("Cons", a.cons) + line("Why not chosen", a.why_not_chosen) + rest(a, ["name", "pros", "cons", "why_not_chosen"]);
    });
  }
  if (Array.isArray(bp.steps) && bp.steps.length) md += `### Steps\n\n${bp.steps.map(s => (s && typeof s === "object" ? stepMarkdown(s) : `- ${text(s)}\n\n`)).join("")}`;
  if (Array.isArray(bp.success_criteria) && bp.success_criteria.length) md += `### Success Criteria\n${bp.success_criteria.map(c => `- ${text(c)}`).join("\n")}\n\n`;
  if (Array.isArray(bp.risk_register) && bp.risk_register.length) {
    md += "### Risk Register\n\n";
    bp.risk_register.forEach(r => {
      if (!r || typeof r !== "object") { md += `- ${text(r)}\n\n`; return; }
      md += `- **${text(r.risk)}**\n${filled(r.impact) ? `  - Impact: ${text(r.impact)}\n` : ""}${filled(r.mitigation) ? `  - Mitigation: ${text(r.mitigation)}\n` : ""}`;
      Object.entries(r).filter(([k, v]) => !["risk", "impact", "mitigation"].includes(k) && filled(v)).forEach(([k, v]) => { md += `  - ${label(k)}: ${text(v)}\n`; });
      md += "\n";
    });
  }
  const others = Object.entries(bp).filter(([k, v]) => !["goal", "assumptions", "alternative_approaches", "steps", "success_criteria", "risk_register"].includes(k) && filled(v));
  others.forEach(([k, v]) => { md += `### ${label(k)}\n\n${Array.isArray(v) ? `${v.map(i => `- ${text(i)}`).join("\n")}\n\n` : `${text(v)}\n\n`}`; });
  return md;
}