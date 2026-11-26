/**
 * JANUS BLUEPRINT REFINEMENT BY EDITS (pure, no I/O).
 * The intelligence produces the intellectual contribution; the application performs the mechanical integration.
 * (The principle of the historical blueprintSplitCall: the model generated step detail and code merged it into the
 * steps, so nothing had to be reproduced to be kept.)
 *
 * The benchmark run asked the model to return the complete Blueprint again, word for word, and to declare by hand
 * every difference. Thirteen of its fourteen rejected calls were that stage: substeps and specifications lost,
 * undeclared rewrites, declared changes that did not exist, zero-based indexes where step numbers were expected.
 * None of that is thinking. The final stage now returns EDITS against the draft it was shown:
 *
 *   set     replace what is at an address (a field, an entry, a whole part) or create a field that is not there
 *   append  add an entry to a list (a step, a substep, a specification, a risk, a component, …)
 *   remove  delete an entry or a field, with the reason
 *
 * Code applies them to a copy of the draft. Everything not addressed is carried forward exactly, because it is never
 * regenerated; what changed is recorded by code from the edits themselves (refinement.changes), not declared from
 * memory. An edit may be as small as one sentence or as large as a new architecture: the form constrains the
 * mechanics, never the size of the idea.
 *
 * What still has to be TRUE is unchanged and is checked on the integrated result (blueprintPipeline.refinementErrors):
 * a repair must be an actual change, a finding marked resolved must be answered by an edit that cites it, no step or
 * alternative disappears, no requirement is weakened silently.
 */
import { entryKey, TRACE_FIELDS } from "@/lib/janus/blueprintPipeline";

const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const isObj = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const said = (s) => typeof s === "string" && /[\p{L}\p{N}]/u.test(s);
const OPS = ["set", "append", "remove"];

/** The final stage returned edits (the current contract) rather than a whole Blueprint (earlier revisions). */
export const isRefinementPatch = (o) => isObj(o) && Array.isArray(o.edits) && !("goal" in o);

const segments = (path) => [...String(path).matchAll(/\[([^\]]+)\]|([^.[\]]+)/g)]
  .map(m => (m[1] !== undefined ? { key: m[1].trim() } : { field: m[2].trim() }));
const positionOf = (list, key) => (/^#\d+$/.test(key) ? Number(key.slice(1)) - 1 : list.findIndex((x, i) => String(entryKey(x, i)) === key));
const entries = (list) => list.map((x, i) => `[${entryKey(x, i)}]`).join(", ") || "none";

/** Resolve an address against a Blueprint. `at` is its canonical form; `list` the list it is an entry of, if any. */
function locate(root, path) {
  const segs = segments(path);
  if (!segs.length) return { error: "the address is empty" };
  let node = root, parent = null, ref = null, at = "", list = null;
  for (let i = 0; i < segs.length; i += 1) {
    const s = segs[i];
    parent = node;
    if (s.field !== undefined) {
      if (!isObj(node)) return { error: `${at || "the Blueprint"} has no field "${s.field}"` };
      list = null; ref = s.field; at = at ? `${at}.${s.field}` : s.field;
      if (!(s.field in node)) return i === segs.length - 1 ? { parent, ref, at, list: null, exists: false } : { error: `${at} does not exist in the draft` };
      node = node[s.field];
    } else {
      if (!Array.isArray(node)) return { error: `${at || "the Blueprint"} is not a list, so it has no entry [${s.key}]` };
      const idx = positionOf(node, s.key);
      if (idx < 0 || idx >= node.length) return { error: `${at} has no entry [${s.key}]. Its entries are ${entries(node)} (a step is addressed by its number, an entry without an identifier by #position)` };
      list = at; ref = idx; at = `${at}[${entryKey(node[idx], idx)}]`; node = node[idx];
    }
  }
  return { parent, ref, at, list, exists: true, value: node };
}
const isTrace = (path) => segments(path).some(s => TRACE_FIELDS.includes(s.field));

/**
 * Apply a refinement to its base. Returns { blueprint, errors }: `blueprint` is the base with the edits integrated
 * and its `refinement` record written by code; `errors` name every edit that could not be applied (the output is
 * then refused as a whole — a refinement is a transaction).
 * Addresses always refer to the draft AS SHOWN: replacements and additions never move an entry, and removals are
 * applied last, from the end of each list, so no edit shifts the position another edit names.
 */
export function applyRefinement(base, patch) {
  const bp = clone(base) || {};
  delete bp.refinement;
  const errors = [], changes = [], trace = [], removals = [], pending = [];
  const record = (edit, path) => (isTrace(path) ? trace : changes).push({ path, ...(edit.finding ? { finding: edit.finding } : {}), what: edit.what, ...(said(edit.reason) ? { reason: edit.reason } : {}) });

  (patch.edits || []).forEach((edit, i) => {
    const where = `edits[#${i + 1}]${said(edit?.path) ? ` (${edit.path})` : ""}`;
    const fail = (m) => { errors.push(`${where}: ${m}`); };
    if (!isObj(edit) || !said(edit.path)) return fail("path missing");
    if (!OPS.includes(edit.op)) return fail(`op must be exactly one of ${OPS.map(o => `"${o}"`).join(" | ")}`);
    if (edit.op !== "remove" && (edit.value === undefined || edit.value === null)) return fail(`"${edit.op}" needs a value`);
    if (edit.op !== "remove" && !said(edit.what)) return fail('"what" missing — say what this edit does');
    if (!edit.finding && !said(edit.reason)) return fail("needs the finding id it answers, or its reason");
    const loc = locate(bp, edit.path);
    if (loc.error) return fail(loc.error);

    if (edit.op === "set") {
      if (loc.exists && same(loc.value, edit.value)) return fail("sets this address to what it already holds: a repair must be an actual change");
      if (loc.list !== null && loc.exists && isObj(loc.value)) {
        const was = String(entryKey(loc.value, loc.ref)), now = String(entryKey(edit.value, loc.ref));
        if (!was.startsWith("#") && was !== now) return fail(`replaces entry [${was}] with one that identifies itself as [${now}]: keep its identifier`);
      }
      loc.parent[loc.ref] = clone(edit.value);
      // A member of a plain list is content of that list; an entry of an object list is addressed as itself.
      return record(edit, loc.list !== null && !isObj(edit.value) && !isObj(loc.value) ? loc.list : loc.at);
    }
    if (edit.op === "append") {
      if (loc.exists && !Array.isArray(loc.value)) return fail("is not a list: use \"set\" to replace it");
      const list = loc.exists ? loc.value : (loc.parent[loc.ref] = []);
      const key = isObj(edit.value) ? String(entryKey(edit.value, list.length)) : null;
      if (key && !key.startsWith("#") && list.some((x, j) => String(entryKey(x, j)) === key)) return fail(`the list already has an entry [${key}]: give the new entry its own identifier, or "set" the existing one`);
      list.push(clone(edit.value));
      return record(edit, key ? `${loc.at}[${key}]` : loc.at);
    }
    if (!loc.exists) return fail("there is nothing at this address to remove");
    if (!said(edit.reason)) return fail("a removal needs its reason");
    return pending.push({ loc, edit });
  });

  pending.sort((a, b) => (typeof b.loc.ref === "number" ? b.loc.ref : -1) - (typeof a.loc.ref === "number" ? a.loc.ref : -1)).forEach(({ loc, edit }) => {
    if (Array.isArray(loc.parent)) loc.parent.splice(loc.ref, 1); else delete loc.parent[loc.ref];
    removals.push({ path: loc.list !== null ? loc.list : loc.at, ...(edit.finding ? { finding: edit.finding } : {}), reason: edit.reason });
  });

  if (Array.isArray(bp.steps)) {
    bp.steps.forEach(s => { if (!Number.isInteger(s?.step)) errors.push(`steps: an entry has no whole-number "step" (${JSON.stringify(s?.step)})`); });
    bp.steps.sort((x, y) => x.step - y.step);
  }
  bp.refinement = { dispositions: patch.dispositions || [], scope_changes: patch.scope_changes || [], removals, changes,
    ...(trace.length ? { trace_changes: trace } : {}), ...(said(patch.summary) ? { summary: patch.summary } : {}) };
  return { blueprint: bp, errors };
}

/**
 * THE ADDRESSES OF A DRAFT, as the final stage is shown them: every list with the address of each of its entries.
 * Built with the same entryKey the integration and the validator use, so the three cannot disagree.
 */
export function addressIndex(v, path = "", out = []) {
  if (Array.isArray(v)) {
    if (v.some(isObj)) {
      out.push(`${path} — entries: ${v.map((x, i) => `${path}[${entryKey(x, i)}]${said(x?.title || x?.name) ? ` "${x.title || x.name}"` : ""}`).join(" · ")}`);
      v.forEach((x, i) => addressIndex(x, `${path}[${entryKey(x, i)}]`, out));
    } else out.push(`${path} — ${v.length ? `${v.length} entr${v.length === 1 ? "y" : "ies"}, in the order shown: ${path}[#1]${v.length > 1 ? ` … ${path}[#${v.length}]` : ""}` : "empty list"}`);
  } else if (isObj(v)) Object.entries(v).forEach(([k, x]) => { if (k !== "refinement") addressIndex(x, path ? `${path}.${k}` : k, out); });
  return out;
}