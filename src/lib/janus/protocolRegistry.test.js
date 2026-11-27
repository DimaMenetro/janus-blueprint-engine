import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  PROTOCOL, DOMAINS, DOMAIN_ORDER, PAIRS, PATTERNS, MODE_PROFILES, MODEL_POLICY, MODELS, ALLOCATION_PROFILES, isAuthorizedModel,
  allSubdomains, lowestConfidence, readSubdomain, LEGACY_SUBDOMAIN_ALIASES,
} from "./protocolRegistry";

const CANONICAL = {
  corpus: ["Artificial Intelligence Systems & Machine Learning Mechanics", "Distributed Systems & Cloud Architecture", "Data Engineering & Provenance", "Cybersecurity & Threat Models", "Neuroscience (Structural & Computational)", "Physics (Quantum Mechanics, Relativity, Thermodynamics)", "Systems Engineering"],
  cogito: ["Unified AI & Cognitive Architectures", "Epistemology & Algorithm Auditing", "Knowledge Representation", "Semantic Networks", "Systems Modeling", "Computational Linguistics & Narratology"],
  animus: ["Consciousness Theory (Boundary Conditions)", "Philosophy of Mind", "Ethics & Governance", "AI Safety & Alignment", "Risk Analysis"],
  actus: ["Strategic Planning", "Game Theory", "MLOps & Productization", "Feedback & Iteration Models", "Technical Writing & Information Design", "Behavioral Economics", "API Design & Integration"],
};

describe("CP-002 v2.0 registry", () => {
  it("identity", () => {
    expect(PROTOCOL.id).toBe("CP-002-O-D-JNP");
    expect(PROTOCOL.version).toBe("2.0");
  });

  it("25/25 exact roster, 7/6/5/7", () => {
    expect(allSubdomains()).toHaveLength(25);
    for (const d of DOMAIN_ORDER) expect(DOMAINS[d].subdomains.map(s => s.name)).toEqual(CANONICAL[d]);
    expect(DOMAIN_ORDER.map(d => DOMAINS[d].subdomains.length)).toEqual([7, 6, 5, 7]);
  });

  it("every subdomain is complete and uniquely keyed", () => {
    const ids = allSubdomains().map(s => s.id);
    expect(new Set(ids).size).toBe(25);
    for (const s of allSubdomains()) {
      expect(s.objective && s.functional_model && s.refresh_key).toBeTruthy();
      expect(s.core_principles.length).toBeGreaterThan(0);
    }
    for (const d of DOMAIN_ORDER) {
      expect(DOMAINS[d].core_insight).toBeTruthy();
      expect(DOMAINS[d].guardrails.length).toBe(3);
    }
  });

  it("6/6 pairs cover all C(4,2)", () => {
    expect(PAIRS).toHaveLength(6);
    const keys = PAIRS.map(p => [...p.domains].sort().join("|"));
    expect(new Set(keys).size).toBe(6);
    expect(PAIRS.map(p => p.resolution_label)).toEqual(["Knowledge-Reality Validation", "Conscience Boundary", "Quantum Foresight", "Governed Cogito", "Narrative Loop", "Empathy-Driven Strategy"]);
  });

  it("4/4 formal patterns, each bound to a pair", () => {
    expect(PATTERNS.map(p => p.name)).toEqual(["Quantum Foresight Model", "Governed Cogito", "Narrative Loop", "Empathy-Driven Strategy"]);
    for (const p of PATTERNS) expect(PAIRS.some(x => x.id === p.pair)).toBe(true);
  });

  it("confidence propagation takes the lowest", () => {
    expect(lowestConfidence(["Established", "Speculative"])).toBe("Speculative");
    expect(lowestConfidence(["Established", "Probable"])).toBe("Contested");
  });

  it("Quick/Standard are partial, Full is not", () => {
    expect(MODE_PROFILES.quick.partial && MODE_PROFILES.standard.partial).toBe(true);
    expect(MODE_PROFILES.full.partial).toBe(false);
  });

  // REPLACED 2026-11-27 under DIMA's Ideal Form directive (§XV: "Gemini 3.1 is prohibited. Do not expand that
  // prohibition to the entire Gemini model family by inference") and the Hybrid Operational Model amendment. The old
  // assertion required the whole Gemini family to be prohibited. The guarantee is kept and made checkable: the
  // prohibited model can never be authorized, there is no hidden fallback, and every model any profile allocates is
  // an authorized one.
  it("model policy: Gemini 3.1 can never be authorized, no hidden fallback, every allocated model is authorized", () => {
    expect(MODEL_POLICY.prohibited_model_prefixes).toContain("gemini_3_1");
    expect(MODEL_POLICY.hidden_fallback_allowed).toBe(false);
    expect(isAuthorizedModel("gemini_3_1_pro")).toBe(false);
    Object.keys(MODELS).forEach(id => expect(MODEL_POLICY.prohibited_model_prefixes.some(p => id.startsWith(p))).toBe(false));
    Object.values(ALLOCATION_PROFILES).forEach(p => Object.values(p.models).forEach(m => expect(isAuthorizedModel(m)).toBe(true)));
  });

  it("legacy keys read through to canonical ids", () => {
    expect(readSubdomain({ theoretical_physics: { perspective: "x" } }, "physics").perspective).toBe("x");
    for (const v of Object.values(LEGACY_SUBDOMAIN_ALIASES)) expect(allSubdomains().some(s => s.id === v)).toBe(true);
  });
});

describe("no second active roster in executable code", () => {
  const root = path.resolve(process.cwd(), "src");
  const files = [];
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!["docs", "ui"].includes(e.name)) walk(p); }
    else if (/\.(jsx?|tsx?)$/.test(e.name) && !p.includes("protocolRegistry")) files.push(p);
  });
  walk(root);
  const STALE = ["Jungian Psychology", "Agile & Scrum", "UI/UX & Human-Computer Interaction", "GraphRAG & Causal Reasoning", "Neuro-Symbolic AI\"", "Theoretical & Quantum Physics", "Game Theory & Strategic Foresight", "Knowledge Graph & Semantic Networks", "24 Subdomains", "24 subdomains", "CP-002 v1.", "Restoration Edition", "Wisdom Machine Edition"];

  it("no stale v1.x identities or hard-coded protocol versions", () => {
    const hits = [];
    for (const f of files) {
      const src = fs.readFileSync(f, "utf8");
      for (const s of STALE) if (src.includes(s)) hits.push(`${path.relative(root, f)}: ${s}`);
      if (/CP-002-O-D-JNP v\d/.test(src)) hits.push(`${path.relative(root, f)}: hard-coded protocol version`);
    }
    expect(hits).toEqual([]);
  });

  it("no independent subdomain list literals", () => {
    const hits = files.filter(f => /\[\s*"distributed_systems"\s*,/.test(fs.readFileSync(f, "utf8")));
    expect(hits).toEqual([]);
  });

  // REPLACED 2026-11-27 under DIMA's Ideal Form directive (§XIV: explicit operational model selection is authorized;
  // amendment: Sonnet is the substrate). The old assertion forbade any model name anywhere in src. The guarantee is
  // kept: there is ONE place that names models (the registry, excluded from this scan like before). No other file
  // can name or select one, and nothing uses the built-in integration's web-context path.
  it("model policy: models are named in the registry and nowhere else in src", () => {
    const hits = files.filter(f => /\bmodel:\s*["']|gemini_|sonnet|claude[_-]|gpt_\d|add_context_from_internet/i.test(fs.readFileSync(f, "utf8")));
    expect(hits.map(f => path.relative(root, f))).toEqual([]);
  });

  // REPLACED 2026-11-27 under the same directive (§XVI: "A declared operational policy must be realized through the
  // actual execution mechanisms"). The old assertion allowed two server files and no model name in either, which is
  // what left the model to the platform's default. The guarantee is kept and strengthened: the retired diagnostics
  // stay retired; ONE server file names models, it is identical to the registry's list and holds the prohibition;
  // the function itself names no model and has no path to the built-in integration, files, tools or web options.
  it("model policy holds in backend functions too: one authorized list identical to the registry's, and a function that names no model", () => {
    const serverRoot = path.resolve(process.cwd(), "base44");
    const server = [];
    const walkServer = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walkServer(p);
      else if (/\.(jsx?|tsx?)$/.test(e.name)) server.push(p);
    });
    walkServer(serverRoot);
    const rel = (f) => path.relative(serverRoot, f);
    // AMENDED 2026-11-27 (DIMA's workflow-suitability directive, section VIII Probe A): ONE temporary diagnostic function is allowed on
// branch janus-pipeline-expansion: probeExecutionBudget (admin-only, no model call, no record, log lines only). It is deleted together
// with this entry and the matching assertion below when Probe A is closed. Nothing else changes: the retired diagnostics stay retired.
expect(server.map(rel).sort()).toEqual(["functions/invokeJanusStage/entry.ts", "functions/probeExecutionBudget/entry.ts", "shared/errorResponse.ts", "shared/janusModels.ts"]);
    const text = (f) => fs.readFileSync(path.join(serverRoot, f), "utf8");
    const listed = [...text("shared/janusModels.ts").match(/AUTHORIZED_MODELS = \[([^\]]*)\]/)[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
    expect([...listed].sort()).toEqual(Object.keys(MODELS).sort());
    const prohibited = [...text("shared/janusModels.ts").match(/PROHIBITED_MODEL_PREFIXES = \[([^\]]*)\]/)[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
    expect(prohibited).toEqual(MODEL_POLICY.prohibited_model_prefixes);
    expect(text("functions/invokeJanusStage/entry.ts")).not.toMatch(/gemini|sonnet|opus|claude|gpt_|automatic|InvokeLLM|integrations\.Core|add_context_from_internet|file_urls|web_search|tools\s*:/i);
    expect(text("shared/errorResponse.ts")).not.toMatch(/\bmodel\s*:|gemini|sonnet|claude|add_context_from_internet|file_urls/i);
    // AMENDED 2026-11-27 with the entry above: the diagnostic names no model and has no path to inference, the built-in integration, the Gateway, files or tools.
    expect(text("functions/probeExecutionBudget/entry.ts")).not.toMatch(/\bmodel\s*:|gemini|sonnet|opus|claude|gpt_|automatic|InvokeLLM|integrations\.|aiGateway|chat\/completions|add_context_from_internet|file_urls|web_search|tools\s*:/i);
  });
});