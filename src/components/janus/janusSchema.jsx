// CP-002-O-D-JNP v2.0 — Restoration Edition
// Schema, constants, validation, and normalization

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
        // v2.0 — Subdomain Perspectives
        subdomains: {
          type: "object",
          properties: {
            ai_ml: {
              type: "object",
              properties: {
                perspective: { type: "string" },
                key_findings: { type: "array", items: { type: "string" } }
              }
            },
            distributed_systems: {
              type: "object",
              properties: {
                perspective: { type: "string" },
                key_findings: { type: "array", items: { type: "string" } }
              }
            },
            data_engineering: {
              type: "object",
              properties: {
                perspective: { type: "string" },
                key_findings: { type: "array", items: { type: "string" } }
              }
            },
            cybersecurity: {
              type: "object",
              properties: {
                perspective: { type: "string" },
                key_findings: { type: "array", items: { type: "string" } }
              }
            },
            neuroscience: {
              type: "object",
              properties: {
                perspective: { type: "string" },
                key_findings: { type: "array", items: { type: "string" } }
              }
            },
            physics: {
              type: "object",
              properties: {
                perspective: { type: "string" },
                key_findings: { type: "array", items: { type: "string" } }
              }
            },
            systems_engineering: {
              type: "object",
              properties: {
                perspective: { type: "string" },
                key_findings: { type: "array", items: { type: "string" } }
              }
            }
          }
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
              depends_on: { type: "array", items: { type: "string" } },
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
              confidence: { type: "string", enum: ["Established", "Contested", "Speculative"] }
            }
          }
        },
        neuro_symbolic_insights: { type: "array", items: { type: "string" } }
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
        }
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
              next_actions: { type: "array", items: { type: "string" } }
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
            coalition_dynamics: { type: "array", items: { type: "string" } }
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
        }
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
          properties: {
            corpus_x_cogito: {
              type: "object",
              properties: {
                insight: { type: "string" },
                tension: { type: "string" },
                resolution: { type: "string" }
              }
            },
            corpus_x_animus: {
              type: "object",
              properties: {
                insight: { type: "string" },
                tension: { type: "string" },
                resolution: { type: "string" }
              }
            },
            corpus_x_actus: {
              type: "object",
              properties: {
                insight: { type: "string" },
                tension: { type: "string" },
                resolution: { type: "string" }
              }
            },
            cogito_x_animus: {
              type: "object",
              properties: {
                insight: { type: "string" },
                tension: { type: "string" },
                resolution: { type: "string" }
              }
            },
            cogito_x_actus: {
              type: "object",
              properties: {
                insight: { type: "string" },
                tension: { type: "string" },
                resolution: { type: "string" }
              }
            },
            animus_x_actus: {
              type: "object",
              properties: {
                insight: { type: "string" },
                tension: { type: "string" },
                resolution: { type: "string" }
              }
            }
          }
        },
        // v2.0 — 4 Named Synthesis Patterns (from CP-002-O-D-JNP v1.1)
        quantum_foresight: {
          type: "object",
          properties: {
            cross_domain_insight: { type: "string" },
            probability_wave: { type: "array", items: { type: "string" } },
            metaphor: { type: "string" }
          }
        },
        governed_cogito: {
          type: "object",
          properties: {
            ethical_filter_applied: { type: "string" },
            conscience_verdict: { type: "string" },
            truth_method_soundness: { type: "string" }
          }
        },
        narrative_loop: {
          type: "object",
          properties: {
            decoded_user_narrative: { type: "string" },
            resonant_strategy: { type: "string" },
            lossless_compression: { type: "string" }
          }
        },
        // Renamed from alignment_engine to match original v1.1 protocol
        empathy_driven_strategy: {
          type: "object",
          properties: {
            true_goal_vs_literal_prompt: { type: "string" },
            behavioral_model: { type: "string" },
            empathy_strategy: { type: "string" }
          }
        },
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
    blueprint: {
      type: "object",
      properties: {
        goal: { type: "string" },
        assumptions: { type: "array", items: { type: "string" } },
        alternative_approaches: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              pros: { type: "array", items: { type: "string" } },
              cons: { type: "array", items: { type: "string" } },
              why_not_chosen: { type: "string" }
            }
          }
        },
        steps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              step: { type: "number" },
              title: { type: "string" },
              instructions: { type: "string" },
              inputs: { type: "array", items: { type: "string" } },
              outputs: { type: "array", items: { type: "string" } },
              validation: { type: "string" },
              depends_on_steps: { type: "array", items: { type: "number" } },
              time_estimate: { type: "string" },
              effort_level: { type: "string" },
              substeps: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    substep: { type: "string" },
                    details: { type: "string" }
                  }
                }
              },
              checklist: { type: "array", items: { type: "string" } },
              acceptance_tests: { type: "array", items: { type: "string" } }
            },
            required: ["step", "title", "instructions"]
          }
        },
        success_criteria: { type: "array", items: { type: "string" } },
        risk_register: {
          type: "array",
          items: {
            type: "object",
            properties: {
              risk: { type: "string" },
              impact: { type: "string", enum: ["low", "med", "high"] },
              mitigation: { type: "string" }
            },
            required: ["risk", "impact", "mitigation"]
          }
        }
      }
    }
  }
};

// ── EXECUTION MODES ──────────────────────────────────────────────
export const EXECUTION_MODES = {
  QUICK: {
    id: "quick",
    label: "Quick",
    description: "Corpus + Cogito + Blueprint (Core Domain Loading)",
    domains: ["corpus", "cogito", "blueprint"]
  },
  STANDARD: {
    id: "standard",
    label: "Standard",
    description: "Full Four-Domain Execution: Corpus → Cogito → Animus → Actus",
    domains: ["corpus", "cogito", "animus", "actus", "blueprint"]
  },
  FULL: {
    id: "full",
    label: "Full Janus v2.0",
    description: "Complete Boot Sequence — All 24 Subdomains + 4 Synthesis Patterns",
    domains: ["refresh", "corpus", "cogito", "animus", "actus", "synthesis", "blueprint"]
  }
};

// ── NORMALIZATION ─────────────────────────────────────────────────
function normalizeValue(value, schema, path = "") {
  if (schema.type === "number" && typeof value === "string" && !isNaN(value)) {
    return Number(value);
  }
  if (schema.enum && schema.enum.includes("med") && value === "medium") {
    return "med";
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
      errors.push(`${path}: Expected string, got ${typeof value}`);
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