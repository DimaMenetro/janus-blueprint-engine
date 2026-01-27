export const JANUS_SCHEMA = {
  type: "object",
  properties: {
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
    corpus: {
      type: "object",
      properties: {
        constraints: { type: "array", items: { type: "string" } },
        feasibility_notes: { type: "array", items: { type: "string" } }
      }
    },
    cogito: {
      type: "object",
      properties: {
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
        reasoning_map: { type: "array", items: { type: "string" } }
      }
    },
    animus: {
      type: "object",
      properties: {
        boundary_checks: { type: "array", items: { type: "string" } },
        disallowed_moves: { type: "array", items: { type: "string" } },
        safety_notes: { type: "array", items: { type: "string" } }
      }
    },
    actus: {
      type: "object",
      properties: {
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
        }
      }
    },
    synthesis: {
      type: "object",
      properties: {
        key_takeaways: { type: "array", items: { type: "string" } },
        constraint_collisions: { type: "array", items: { type: "string" } },
        limitation_foreground: { type: "string" }
      }
    },
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

export const EXECUTION_MODES = {
  QUICK: {
    id: "quick",
    label: "Quick",
    description: "Corpus + Cogito + Blueprint",
    domains: ["corpus", "cogito", "blueprint"]
  },
  STANDARD: {
    id: "standard",
    label: "Standard",
    description: "Corpus + Cogito + Animus + Actus + Blueprint",
    domains: ["corpus", "cogito", "animus", "actus", "blueprint"]
  },
  FULL: {
    id: "full",
    label: "Full Janus",
    description: "All domains including Refresh & Synthesis",
    domains: ["refresh", "corpus", "cogito", "animus", "actus", "synthesis", "blueprint"]
  }
};

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

  // Check required domains are present
  for (const domain of requiredDomains) {
    if (!data[domain]) {
      errors.push(`Missing required domain: ${domain}`);
    }
  }

  // Validate each domain present
  for (const domain of requiredDomains) {
    if (data[domain] && JANUS_SCHEMA.properties[domain]) {
      const domainErrors = validateProperty(data[domain], JANUS_SCHEMA.properties[domain], domain);
      errors.push(...domainErrors);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}