/**
 * Content Density Calculator — Liquid Glass Step 5
 * 
 * Computes a density hint based on how much content a blueprint contains.
 * Used by glass containers to become more translucent when content is heavy,
 * preventing the page from feeling visually claustrophobic.
 * 
 * Returns: "normal" (default) | "sparse" (lighter glass for heavy content)
 * 
 * Note: "dense" and "focused" are reserved for scroll-reactive and
 * focus-state systems respectively — content density only shifts toward sparse.
 */

const SPARSE_THRESHOLD = 12;

export function computeContentDensity(blueprint) {
  if (!blueprint) return "normal";

  const steps = blueprint.steps?.length || 0;
  const risks = blueprint.risk_register?.length || 0;
  const alts = blueprint.alternative_approaches?.length || 0;
  const assumptions = blueprint.assumptions?.length || 0;
  const criteria = blueprint.success_criteria?.length || 0;

  const totalItems = steps + risks + alts + assumptions + criteria;

  if (totalItems > SPARSE_THRESHOLD) return "sparse";
  return "normal";
}