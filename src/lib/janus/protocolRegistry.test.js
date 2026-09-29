import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  PROTOCOL, DOMAINS, DOMAIN_ORDER, PAIRS, PATTERNS, MODE_PROFILES, MODEL_POLICY,
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

  it("model policy prohibits Gemini, no hidden fallback", () => {
    expect(MODEL_POLICY.prohibited_model_prefixes).toContain("gemini");
    expect(MODEL_POLICY.hidden_fallback_allowed).toBe(false);
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

  it("model policy: no per-call model overrides, no Gemini, no web-context path", () => {
    const hits = files.filter(f => /\bmodel:\s*["']|gemini_|add_context_from_internet/.test(fs.readFileSync(f, "utf8")));
    expect(hits.map(f => path.relative(root, f))).toEqual([]);
  });
});