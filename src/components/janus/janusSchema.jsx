// Janus output schema — protocol identity & roster from @/lib/janus/protocolRegistry
import { subdomainIds, MODE_PROFILES, PAIRS, PATTERNS } from "@/lib/janus/protocolRegistry";
import { BLUEPRINT_SCHEMA, PIPELINE_SCHEMAS } from "@/lib/janus/blueprintPipeline";
// Schema, constants, validation, and normalization

// What each formal emergent pattern DOES (CP-002 §5.1–5.4), given a structure it can be expressed in.
const rows = (properties) => ({ type: "array", items: { type: "object", properties: Object.fromEntries(properties.map(k => [k, { type: "string" }])) } });
const PATTERN_DEPTH = {
  quantum_foresight: { futures: rows(["future", "conditions", "likelihood", "leading_indicators", "strategic_response"]) },
  governed_cogito: { method_audit: rows(["method", "what_it_can_establish", "what_it_cannot", "ethical_condition"]) },
  narrative_loop: { operator_intent: { type: "string" }, communication_design: { type: "string" } },
  empathy_driven_strategy: { actors: rows(["actor", "motivation", "non_rational_drivers", "predicted_behavior", "strategy_response"]) },
};

export const JANUS_SCHEMA = {
  type: "object",
  properties: {

    // ── REFRESH ──────────────────────────────────────────────────
    refresh: {
      type: "object",
      properties: {
        mode: { type: "string" },
        attempted: { type: "boolean" },
        limitations: { type: "string" },
        would_refresh: { type: "array", items: { type: "string" } }
      },
      required: ["mode", "attempted"]
    },

    // ── CORPUS ───────────────────────────────────────────────────
    // Section I: Technical & Physical Reality (7 subdomains)
    corpus: {
      type: "object",
      properties: {
        // Legacy fields (v1.5 compat)
        constraints: { type: "array", items: { type: "string" } },
        feasibility_notes: { type: "array", items: { type: "string" } },
        // Final Form — the faculty's own reasoning, not only its limits: how things work, the system as a whole,
        // and what must exist or be discovered for the objective to be reachable.
        mechanisms: { type: "array", items: { type: "object", properties: {
          name: { type: "string" }, operation: { type: "string" }, relationships: { type: "string" }, limits: { type: "string" } } } },
        system_model: { type: "string" },
        enabling_dependencies: { type: "array", items: { type: "string" } },
        // v2.0 — Subdomain Perspectives
        subdomains: {
          type: "object",
          // Derived from canonical registry
          properties: Object.fromEntries(subdomainIds("corpus").map(id => [id, {
            type: "object",
            properties: {
              perspective: { type: "string" },
              key_findings: { type: "array", items: { type: "string" } }
            }
          }]))
        }
      }
    },

    // ── COGITO ───────────────────────────────────────────────────
    // Section II: Reasoning & Epistemic Mechanics (6 subdomains)
    cogito: {
      type: "object",
      properties: {
        // Core (v1.5 compat)
        claims: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              tag: { type: "string", enum: ["Established", "Contested", "Speculative"] },
              text: { type: "string" },
              depends_on: { type: "array", items: { type: "string" } }, // logical: ids of other claims in this list
              sources: { type: "array", items: { type: "string" } },    // provenance: named documents / evidence
              implications: { type: "string" },                         // what follows for the design if the claim holds
              why_believed: { type: "string" },
              falsifiable_by: { type: "string" },
              verify_later: { type: "string" }
            },
            required: ["id", "tag", "text", "why_believed", "falsifiable_by", "verify_later"]
          }
        },
        reasoning_map: { type: "array", items: { type: "string" } },
        // v2.0 — New Cogito subdomains
        graphrag_connections: { type: "array", items: { type: "string" } },
        causal_chains: {
          type: "array",
          items: {
            type: "object",
            properties: {
              cause: { type: "string" },
              effect: { type: "string" },
              mechanism: { type: "string" },
              confidence: { type: "string", enum: ["Established", "Contested", "Speculative"] }
            }
          }
        },
        neuro_symbolic_insights: { type: "array", items: { type: "string" } },
        // Final Form — theory, formal structure and associative reach, each with its honest status.
        hypotheses: { type: "array", items: { type: "object", properties: {
          id: { type: "string" }, statement: { type: "string" }, rationale: { type: "string" }, test: { type: "string" },
          status: { type: "string", enum: ["Established", "Contested", "Speculative"] } } } },
        formal_models: { type: "array", items: { type: "object", properties: {
          name: { type: "string" }, variables: { type: "string" }, relations: { type: "string" }, predicts: { type: "string" } } } },
        associative_leaps: { type: "array", items: { type: "object", properties: {
          from: { type: "string" }, to: { type: "string" }, bridge: { type: "string" }, payoff: { type: "string" } } } },
        open_questions: { type: "array", items: { type: "string" } }
      }
    },

    // ── ANIMUS ───────────────────────────────────────────────────
    // Section III: Agency, Identity & Boundary Constraints (5 subdomains)
    animus: {
      type: "object",
      properties: {
        // Core (v1.5 compat)
        boundary_checks: { type: "array", items: { type: "string" } },
        disallowed_moves: { type: "array", items: { type: "string" } },
        safety_notes: { type: "array", items: { type: "string" } },
        // v2.0 — New Animus subdomains
        consciousness_boundary: { type: "string" },
        attractor_states: { type: "array", items: { type: "string" } },
        ethical_stance: { type: "string" },
        risk_analysis: {
          type: "object",
          properties: {
            cognitive_sync_assessment: { type: "string" },
            self_determination_factors: { type: "array", items: { type: "string" } },
            misalignment_risks: { type: "array", items: { type: "string" } }
          }
        },
        // Final Form — conscience as reasoning: what is really wanted, how the moral question resolves, and what
        // the objective is right to pursue (not only what it must not do).
        intent_model: { type: "object", properties: { stated_goal: { type: "string" }, true_goal: { type: "string" }, divergence: { type: "string" } } },
        moral_reasoning: { type: "array", items: { type: "object", properties: {
          question: { type: "string" }, rules_view: { type: "string" }, outcomes_view: { type: "string" }, virtue_view: { type: "string" }, verdict: { type: "string" } } } },
        affirmed_pursuits: { type: "array", items: { type: "string" } },
        stakeholders: { type: "array", items: { type: "object", properties: { who: { type: "string" }, stake: { type: "string" }, autonomy_risk: { type: "string" } } } }
      }
    },

    // ── ACTUS ────────────────────────────────────────────────────
    // Section IV: Strategy, Execution & Consequence (7 subdomains)
    actus: {
      type: "object",
      properties: {
        // Core (v1.5 compat) — confidence propagation maintained
        recommendations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              text: { type: "string" },
              depends_on_claims: { type: "array", items: { type: "string" } },
              inherited_confidence: { type: "string", enum: ["Established", "Contested", "Speculative"] },
              probability: { type: "string", enum: ["low", "medium", "high"] },
              failure_modes: { type: "array", items: { type: "string" } },
              next_actions: { type: "array", items: { type: "string" } },
              rationale: { type: "string" },
              mechanism: { type: "string" },
              expected_effect: { type: "string" }
            },
            required: ["id", "text", "depends_on_claims", "inherited_confidence", "probability"]
          }
        },
        // v2.0 — Restored & new Actus subdomains
        strategic_plan: {
          type: "object",
          properties: {
            immediate_horizon: { type: "string" },
            long_term_horizon: { type: "string" },
            key_decision_points: { type: "array", items: { type: "string" } }
          }
        },
        game_theory_analysis: {
          type: "object",
          properties: {
            game_board: { type: "string" },
            nash_equilibrium: { type: "string" },
            zero_sum_assessment: { type: "string" },
            coalition_dynamics: { type: "array", items: { type: "string" } },
            players: { type: "array", items: { type: "object", properties: { player: { type: "string" }, incentives: { type: "string" }, likely_moves: { type: "string" } } } }
          }
        },
        technical_summary: { type: "string" }, // Technical Writing — lossless compression
        behavioral_factors: {
          type: "object",
          properties: {
            irrational_actors: { type: "array", items: { type: "string" } },
            identity_economics: { type: "string" },
            bias_mitigations: { type: "array", items: { type: "string" } }
          }
        },
        integration_contracts: { type: "array", items: { type: "string" } }, // API Design
        iteration_model: {
          type: "object",
          properties: {
            value_stream: { type: "string" },
            adaptation_triggers: { type: "array", items: { type: "string" } }
          }
        },
        // Final Form — branching strategy and the work that makes the objective reachable.
        strategic_branches: { type: "array", items: { type: "object", properties: { branch: { type: "string" }, trigger: { type: "string" }, response: { type: "string" } } } },
        enabling_work: { type: "array", items: { type: "string" } }
      }
    },

    // ── SYNTHESIS ────────────────────────────────────────────────
    // Section V: The Nexus — 6 Intersection Pairs + 4 Named Emergent Patterns
    synthesis: {
      type: "object",
      properties: {
        // Legacy (v1.5 compat)
        key_takeaways: { type: "array", items: { type: "string" } },
        constraint_collisions: { type: "array", items: { type: "string" } },
        limitation_foreground: { type: "string" },
        // v2.0 — 6-pair Intersection Matrix
        intersection_matrix: {
          type: "object",
          properties: Object.fromEntries(PAIRS.map(p => [p.id, {
            type: "object",
            properties: { insight: { type: "string" }, tension: { type: "string" }, resolution: { type: "string" } }
          }]))
        },
        // 4 formal emergent patterns — derived from registry PATTERNS
        ...Object.fromEntries(PATTERNS.map(p => [p.id, {
          type: "object",
          // The registry's fields are the required contract. The depth fields are what makes a pattern operative: its
          // mechanism, what it changes in the design, how its effect would be evaluated, and its honest status.
          properties: { ...Object.fromEntries(p.fields.map(f => [f,
            f === "probability_wave" ? { type: "array", items: { type: "string" } } : { type: "string" }])),
            mechanism: { type: "string" }, design_consequence: { type: "string" }, evaluation: { type: "string" },
            epistemic_status: { type: "string", enum: ["Established", "Contested", "Speculative"] },
            ...(PATTERN_DEPTH[p.id] || {}) }
        }])),
        // Backward compat: keep alignment_engine as alias
        alignment_engine: {
          type: "object",
          properties: {
            true_goal_vs_literal_prompt: { type: "string" },
            behavioral_model: { type: "string" },
            alignment_strategy: { type: "string" }
          }
        }
      }
    },

    // ── BLUEPRINT ────────────────────────────────────────────────
    // The final Blueprint and every durable stage of the Blueprint pipeline (Phase 9): one schema source, in
    // @/lib/janus/blueprintPipeline, read here by the validator, the normalizer and the compiler's type legend.
    blueprint: BLUEPRINT_SCHEMA,
    ...PIPELINE_SCHEMAS
  }
};

// ── EXECUTION MODES ──────────────────────────────────────────────
// Derived from registry MODE_PROFILES — Quick/Standard are explicitly partial.
const toMode = (p) => ({ id: p.id, label: p.label, description: p.description, partial: p.partial, domains: p.stages });
export const EXECUTION_MODES = {
  QUICK: toMode(MODE_PROFILES.quick),
  STANDARD: toMode(MODE_PROFILES.standard),
  FULL: toMode(MODE_PROFILES.full),
};

// ── NORMALIZATION ─────────────────────────────────────────────────
function normalizeValue(value, schema, path = "") {
  if (schema.type === "number" && typeof value === "string" && !isNaN(value)) {
    return Number(value);
  }
  if (schema.enum && schema.enum.includes("med") && value === "medium") {
    return "med";
  }
  // Normalize LLM drift: "Probable" → "Contested" per CP-002 epistemic taxonomy
  if (schema.enum && schema.enum.includes("Contested") && value === "Probable") {
    return "Contested";
  }
  if (schema.type === "array" && Array.isArray(value) && schema.items) {
    return value.map((item, idx) => normalizeValue(item, schema.items, `${path}[${idx}]`));
  }
  if (schema.type === "object" && typeof value === "object" && value !== null && schema.properties) {
    const normalized = { ...value };
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (key in normalized) {
        normalized[key] = normalizeValue(normalized[key], propSchema, path ? `${path}.${key}` : key);
      }
    }
    return normalized;
  }
  return value;
}

// ── VALIDATION ────────────────────────────────────────────────────
function validateProperty(value, schema, path = "") {
  const errors = [];

  if (schema.type === "object") {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      errors.push(`${path || "root"}: Expected object, got ${typeof value}`);
      return errors;
    }
    if (schema.required) {
      for (const req of schema.required) {
        if (!(req in value)) {
          errors.push(`${path}.${req}: Required property missing`);
        }
      }
    }
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in value) {
          errors.push(...validateProperty(value[key], propSchema, path ? `${path}.${key}` : key));
        }
      }
    }
  } else if (schema.type === "array") {
    if (!Array.isArray(value)) {
      errors.push(`${path}: Expected array, got ${typeof value}`);
      return errors;
    }
    if (schema.items) {
      value.forEach((item, idx) => {
        errors.push(...validateProperty(item, schema.items, `${path}[${idx}]`));
      });
    }
  } else if (schema.type === "string") {
    if (typeof value !== "string") {
      // Names a list as a list: "got object" for an array told the model nothing it could correct.
      errors.push(`${path}: Expected string, got ${Array.isArray(value) ? "a list (array)" : typeof value}`);
    } else if (schema.enum && !schema.enum.includes(value)) {
      errors.push(`${path}: Value "${value}" not in allowed values: ${schema.enum.join(", ")}`);
    }
  } else if (schema.type === "number") {
    if (typeof value !== "number") {
      errors.push(`${path}: Expected number, got ${typeof value}`);
    }
  } else if (schema.type === "boolean") {
    if (typeof value !== "boolean") {
      errors.push(`${path}: Expected boolean, got ${typeof value}`);
    }
  }

  return errors;
}

export function validateJanusOutput(data, requiredDomains) {
  const errors = [];
  const normalized = { ...data };

  for (const domain of requiredDomains) {
    if (!data[domain]) {
      errors.push(`Missing required domain: ${domain}`);
    }
  }

  for (const domain of requiredDomains) {
    if (data[domain] && JANUS_SCHEMA.properties[domain]) {
      normalized[domain] = normalizeValue(data[domain], JANUS_SCHEMA.properties[domain], domain);
      const domainErrors = validateProperty(normalized[domain], JANUS_SCHEMA.properties[domain], domain);
      errors.push(...domainErrors);
    }
  }

  return { valid: errors.length === 0, errors, normalized };
}