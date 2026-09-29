// Domain SME activation — DERIVED from the canonical registry.
// Do not declare rosters here. Source of truth: @/lib/janus/protocolRegistry
import { DOMAINS, PAIRS, protocolLabel } from "@/lib/janus/protocolRegistry";

export const DOMAIN_SME = DOMAINS;

// Keyed by persisted pair model key (compat with historical `_model` values).
export const SYNTHESIS_MODELS = Object.fromEntries(
  PAIRS.map(p => [p.model, { id: p.model, pair: p.id, name: p.resolution_label, domains: p.domains, description: p.description, mechanism: p.mechanism }])
);

export function buildSMEIdentity(domainKey) {
  const domain = DOMAINS[domainKey];
  if (!domain) return "";

  const subdomainList = domain.subdomains.map(s => s.name).join(", ");
  const subdomainDetails = domain.subdomains
    .map((s, i) => {
      const principles = s.core_principles.map(p => `    • ${p}`).join("\n");
      return `  ${i + 1}. ${s.name}
     Objective: ${s.objective}
${principles}
     When Active: ${s.functional_model}`;
    })
    .join("\n\n");
  const guardrailText = domain.guardrails.map(g => `  • ${g}`).join("\n");

  return `═══ DOMAIN ACTIVATION: ${domain.label.toUpperCase()} — ${domain.title.toUpperCase()} (Section ${domain.section}) — ${protocolLabel()} ═══

You are consulting a Subject Matter Expert whose unified wisdom spans ${domain.subdomains.length} subdomains: ${subdomainList}.

Core Insight: "${domain.core_insight}"
Objective: ${domain.objective}

This expert draws from ALL of the following subdomain expertise SIMULTANEOUSLY — they do not think in silos. Each subdomain informs and enriches the others:

${subdomainDetails}

GUARDRAILS (constraints to keep in mind, NOT your identity):
${guardrailText}

CRITICAL INSTRUCTION: You must think FROM INSIDE this expertise. Do not produce generic observations. Every finding must reflect the depth of a genuine expert who has spent decades across these disciplines. Draw connections between your subdomains — that is where the deepest insights live.`;
}

export function buildSynthesisPrompt(priorDomains) {
  const modelInstructions = PAIRS.map(p => `  ${p.resolution_label} (${p.domains.map(d => DOMAINS[d].label).join(" × ")}):
    ${p.description}
    Mechanism: ${p.mechanism}
    → Produce: insight (what emerges at this intersection that neither domain alone could produce),
               tension (where the two domains pull in different directions),
               resolution (how the tension resolves into something greater)`).join("\n\n");

  // NOTE: 2000-char domain slice is a known cognitive-input truncation — scheduled for Phase 8.
  const contextSummary = Object.entries(priorDomains)
    .filter(([key]) => DOMAINS[key])
    .map(([key, data]) => `  ${DOMAINS[key].title}: ${JSON.stringify(data).slice(0, 2000)}`)
    .join("\n");

  return `═══ DOMAIN ACTIVATION: SYNTHESIS — THE NEXUS (Section V) ═══

You are the Synthesis Engine. Your task is to find EMERGENT patterns that NO SINGLE DOMAIN could produce alone.

You have access to the complete output of the prior domain experts:
${contextSummary}

For each of the following ${PAIRS.length} intersection pairs, find the insight that emerges WHERE THE DOMAINS MEET — not a summary of each domain, but what their INTERSECTION reveals:

${modelInstructions}

After computing all ${PAIRS.length} intersections, produce:
- key_takeaways: The 3-5 most important cross-domain insights
- constraint_collisions: Where domain findings CONFLICT with each other
- limitation_foreground: The single most significant limitation of this entire analysis
- unified_theory: If a unifying insight emerges that connects all domains, name it

CRITICAL: The synthesis must be EMERGENT. If an insight could have come from a single domain alone, it does NOT belong in the synthesis.`;
}