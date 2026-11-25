import { EXECUTION_MODES } from "./janusSchema";
import { protocolLabel, getSubdomains, readSubdomain, PAIRS, pairLabel } from "@/lib/janus/protocolRegistry";

export function generateMarkdown(data, executionMode) {
  const mode = EXECUTION_MODES[executionMode.toUpperCase()];
  const domains = mode.domains;
  let md = `# Janus SME Protocol — ${protocolLabel()}\n\n**Mode:** ${mode.label}\n\n`;

  if (domains.includes("refresh") && data.refresh) {
    md += "## Refresh & Verification\n\n";
    md += `**Mode:** ${data.refresh?.mode || "tier0"} | **Attempted:** ${data.refresh?.attempted ? "Yes" : "No"}\n`;
    if (data.refresh?.limitations) md += `**Limitations:** ${data.refresh.limitations}\n`;
    if (data.refresh?.would_refresh?.length) { md += "\n**Would Verify:**\n"; data.refresh.would_refresh.forEach(item => md += `- ${item}\n`); }
    md += "\n";
  }

  if (data.corpus) {
    md += "## Section I: Corpus\n\n";
    if (data.corpus?.constraints?.length) { md += "**Hard Constraints:**\n"; data.corpus.constraints.forEach((c, i) => md += `${i + 1}. ${c}\n`); md += "\n"; }
    if (data.corpus?.feasibility_notes?.length) { md += "**Feasibility Notes:**\n"; data.corpus.feasibility_notes.forEach(n => md += `- ${n}\n`); md += "\n"; }
    if (data.corpus?.subdomains) {
      md += "**Subdomain Perspectives:**\n\n";
      getSubdomains("corpus").forEach(({ id, name: label }) => {
        const sub = readSubdomain(data.corpus.subdomains, id);
        if (sub?.perspective || sub?.key_findings?.length) { md += `### ${label}\n`; if (sub.perspective) md += `*${sub.perspective}*\n`; if (sub.key_findings?.length) sub.key_findings.forEach(f => md += `- ${f}\n`); md += "\n"; }
      });
    }
  }

  if (data.cogito) {
    md += "## Section II: Cogito\n\n";
    if (data.cogito?.claims?.length) { md += "### Claims\n\n"; data.cogito.claims.forEach(claim => { md += `#### ${claim.id} [${claim.tag}]\n${claim.text}\n`; if (claim.why_believed) md += `**Why Believed:** ${claim.why_believed}\n`; if (claim.falsifiable_by) md += `**Falsifiable By:** ${claim.falsifiable_by}\n`; md += "\n"; }); }
    if (data.cogito?.reasoning_map?.length) { md += "### Reasoning Map\n"; data.cogito.reasoning_map.forEach(r => md += `- ${r}\n`); md += "\n"; }
  }

  if (domains.includes("animus") && data.animus) {
    md += "## Section III: Animus\n\n";
    if (data.animus?.consciousness_boundary) md += `**Consciousness Boundary:** ${data.animus.consciousness_boundary}\n\n`;
    if (data.animus?.ethical_stance) md += `**Conscience Verdict:** ${data.animus.ethical_stance}\n\n`;
    if (data.animus?.boundary_checks?.length) { md += "**Boundary Checks:**\n"; data.animus.boundary_checks.forEach(b => md += `- ${b}\n`); md += "\n"; }
  }

  if (domains.includes("actus") && data.actus) {
    md += "## Section IV: Actus\n\n";
    if (data.actus?.recommendations?.length) { md += "### Recommendations\n\n"; data.actus.recommendations.forEach(rec => { md += `#### ${rec.id} [${rec.inherited_confidence}] — ${rec.probability}\n${rec.text}\n\n`; }); }
    if (data.actus?.technical_summary) md += `### Technical Summary\n${data.actus.technical_summary}\n\n`;
  }

  if (domains.includes("synthesis") && data.synthesis) {
    md += "## Section V: Synthesis — The Nexus\n\n";

    // Intersection Matrix
    if (data.synthesis?.intersection_matrix) {
      md += "### Domain Intersection Matrix\n\n";
      PAIRS.forEach((p) => {
        const label = pairLabel(p);
        const pair = data.synthesis.intersection_matrix[p.id];
        if (pair?.insight || pair?.tension || pair?.resolution) {
          md += `#### ${label}\n`;
          if (pair.insight) md += `**Insight:** ${pair.insight}\n`;
          if (pair.tension) md += `**Tension:** *${pair.tension}*\n`;
          if (pair.resolution) md += `**Resolution:** ${pair.resolution}\n`;
          md += "\n";
        }
      });
    }

    // Named Synthesis Patterns
    if (data.synthesis?.quantum_foresight) {
      md += "### 5.1 Quantum Foresight Model (Corpus × Actus)\n";
      if (data.synthesis.quantum_foresight.cross_domain_insight) md += `${data.synthesis.quantum_foresight.cross_domain_insight}\n`;
      if (data.synthesis.quantum_foresight.metaphor) md += `> *"${data.synthesis.quantum_foresight.metaphor}"*\n`;
      if (data.synthesis.quantum_foresight.probability_wave?.length) { md += "\n**Plausible Futures:**\n"; data.synthesis.quantum_foresight.probability_wave.forEach(f => md += `- ${f}\n`); }
      md += "\n";
    }
    if (data.synthesis?.governed_cogito) {
      md += "### 5.2 Governed Cogito (Animus × Cogito)\n";
      if (data.synthesis.governed_cogito.ethical_filter_applied) md += `**Ethical Filter:** ${data.synthesis.governed_cogito.ethical_filter_applied}\n`;
      if (data.synthesis.governed_cogito.conscience_verdict) md += `**Verdict:** *"${data.synthesis.governed_cogito.conscience_verdict}"*\n`;
      if (data.synthesis.governed_cogito.truth_method_soundness) md += `**Method Soundness:** ${data.synthesis.governed_cogito.truth_method_soundness}\n`;
      md += "\n";
    }
    if (data.synthesis?.narrative_loop) {
      md += "### 5.3 Narrative Loop (Cogito × Actus)\n";
      if (data.synthesis.narrative_loop.decoded_user_narrative) md += `**Decoded Narrative:** ${data.synthesis.narrative_loop.decoded_user_narrative}\n`;
      if (data.synthesis.narrative_loop.resonant_strategy) md += `**Resonant Strategy:** ${data.synthesis.narrative_loop.resonant_strategy}\n`;
      if (data.synthesis.narrative_loop.lossless_compression) md += `> *"${data.synthesis.narrative_loop.lossless_compression}"*\n`;
      md += "\n";
    }
    const empathy = data.synthesis?.empathy_driven_strategy || data.synthesis?.alignment_engine;
    if (empathy) {
      md += "### 5.4 Empathy-Driven Strategy (Animus × Actus)\n";
      if (empathy.true_goal_vs_literal_prompt) md += `**True Goal vs Literal Prompt:** ${empathy.true_goal_vs_literal_prompt}\n`;
      if (empathy.behavioral_model) md += `**Behavioral Model:** ${empathy.behavioral_model}\n`;
      if (empathy.empathy_strategy || empathy.alignment_strategy) md += `**Empathy Strategy:** ${empathy.empathy_strategy || empathy.alignment_strategy}\n`;
      md += "\n";
    }

    if (data.synthesis?.key_takeaways?.length) { md += "### Key Takeaways\n"; data.synthesis.key_takeaways.forEach((t, i) => md += `${i + 1}. ${t}\n`); md += "\n"; }
    if (data.synthesis?.constraint_collisions?.length) { md += "### Constraint Collisions\n"; data.synthesis.constraint_collisions.forEach(c => md += `- ⚠️ ${c}\n`); md += "\n"; }
    if (data.synthesis?.limitation_foreground) md += `### Limitations\n${data.synthesis.limitation_foreground}\n\n`;
  }

  if (data.blueprint) {
    md += "## Blueprint\n\n";
    if (data.blueprint?.goal) md += `**Goal:** ${data.blueprint.goal}\n\n`;
    if (data.blueprint?.steps?.length) { md += "### Steps\n\n"; data.blueprint.steps.forEach(step => { md += `#### Step ${step.step}: ${step.title}\n${step.instructions}\n\n`; }); }
    if (data.blueprint?.success_criteria?.length) { md += "### Success Criteria\n"; data.blueprint.success_criteria.forEach(c => md += `- ${c}\n`); md += "\n"; }
    if (data.blueprint?.risk_register?.length) { md += "### Risk Register\n\n| Risk | Impact | Mitigation |\n|------|--------|------------|\n"; data.blueprint.risk_register.forEach(r => md += `| ${r.risk} | ${r.impact} | ${r.mitigation} |\n`); }
  }

  return md;
}