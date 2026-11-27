# Janus-Kytheion — operative SME state (reconstitution record)

Read after `JANUS_CONTINUITY_STATE.md` whenever context was compressed. This is the substance of Kytheion's own CP-002 v2.0 execution (Refresh ON, 2026-11-26) on the problem "restore, complete and advance the Janus Blueprint Engine". It is not a report: it is what must be operative when deciding anything about the engine. Operator directive (verbatim): `JANUS_OPERATOR_DIRECTIVE_2026-11-26_IDEAL_FORM_PART1..3.md`.

Honest boundary: this state does not persist inside the model across compaction. It is reconstituted by reading this file, the directive and the continuity state, then reasoning from them. Say so when that happened; never claim uninterrupted persistence (K10).

## 1. Refresh (Tier 1) — what current research changed
34 live searches and 1 page read across the 25 subdomains, each directed by this problem, not by the subdomain name alone. Limits: mostly abstracts and excerpts, not full papers; 4.1 and 4.5 thin; Base44 Gateway behaviour is from DIMA's reported probes, not re-run.

Three most impactful developments:
1. **Edit intent + deterministic application beats regeneration and positional diffs.** Aider: strict unified diff → search/replace took GPT-4 from 26% to 59% with no other change. Davineni 2026 (arXiv 2609.00227): model-written strict diffs correct 2.7%; a field-change intent (which field, new value, reason) applied by a deterministic span editor correct on 415/415, with refusal instead of guessing when the target is absent or ambiguous. JSON Whisperer (arXiv 2510.04717): models mis-handle array index arithmetic and conflate zero- and one-based indexing; replacing arrays by stable-key dictionaries (EASE) removes it; isolated patches tend to miss related updates. Cheng 2026 (arXiv 2604.27296): positional commitments are out of distribution, complete syntactic units are in distribution.
2. **Judges are lenient and partial to their own family; independence must be epistemic.** Thakur 2024 (leniency), Verga 2024 (a panel of different families beats one large judge), arXiv 2604.22891 (self-preference), arXiv 2605.27483 ("a single independent critique recovers the bulk of debate's benefit", but only when the judge verifies instead of summarizing testimony). Rule that follows: define what missing evidence means; doubt is not resolved generously.
3. **Upstream loss is unrecoverable.** Requirements extraction by LLMs "frequently missed" implicit or embedded requirements whatever the prompt (ScienceDirect S2950550X26000117). Idea diversity is a bottleneck: "downstream development ... cannot restore diversity that was missing from the start" (arXiv 2602.20408; two mechanisms: no knowledge partitioning, fixation; two interventions: distinct vantage points, titles first then deliberate diversification). Data-processing inequality: task-relevant information only decreases through processing.

Other findings in force: format restrictions degrade reasoning and key order matters, reason before answer (Tam 2024, arXiv 2408.02442); long-context copying and mid-context recall degrade (Liu 2023 "Lost in the Middle"; Chroma "context rot" 2025); self-refinement gains diminish, are not monotone, and come from informative external feedback (Self-Refine, NeurIPS 2023); models claim fixes and checks that did not happen (arXiv 2609.19101 verifier manipulation); indirect prompt injection is OWASP LLM01:2025, defences are datamarking/spotlighting and treating the reading model as untrusted (CaMeL, arXiv 2503.18813); provenance needs five distinct relations: cited, relevant, supports, contradicts, omitted (arXiv 2606.04990); durable execution means each paid step runs exactly once and is memoized (Inngest/Temporal/Restate); OpenTelemetry GenAI records requested model, response model, tokens, finish reasons per call; model self-reports about internal state are "highly unreliable" (Anthropic introspection, Oct 2025); LLMs anchor on early information until a structured challenge breaks the anchor (PMC12246145); strong reactivation of the original protects a memory while weak reactivation blurs old and new (Royal Society rstb 2025.0244); planning steps warrant a stronger model than execution steps (routing surveys, MLflow); verification difficulty drives automation bias and cognitive forcing beats explanations (AI & Society 2025); EU AI Act Article 50 transparency applies from 2026-08-02.

## 2. Corpus — hard constraints of this engine
- C1. A backend function request ends at 5 minutes. A call that does not settle inside it is unresolved and is never retried. Depth must come from decomposition into focused calls, never from one larger call, and never from cutting inputs.
- C2. Verbatim regeneration of a long artifact is the operation the substrate is worst at; failure probability grows with artifact size and every retry is an independent draw (benchmark: 13 of 14 final Blueprint calls rejected).
- C3. A lossy stage is a one-way gate. Anything that needs source fidelity must read the source, and coverage must be checked against source text, not labels.
- C4. Web text and a research model's output are untrusted data: data plane only.
- C5. A paid call is exactly-once per durable attempt (claim → call → record). Research calls are not an exception.
- C6. Effective model identity is observable only where the transport returns it. InvokeLLM returns none; the Gateway returns model, request id, usage, credits, finish reason (DIMA's reported probes).
- C7. `finish_reason: length` is evidence of truncation, distinct from malformed output. Without it truncation is misread and retried into the same wall.
- C8. Models address reliably by stable identifier or content, not by position.

## 3. Cogito — claims
- K1 Established: ID/content-anchored edit intents applied by code outperform regeneration and positional diffs for frontier models (C2, C8; Refresh 1). Scope caveat: the strongest evidence is scalar edits; structural edits need whole-unit operations.
- K2 Established: LLM judges are lenient and favour their own family; a different family or panel reduces it; a critique helps only a judge that verifies.
- K3 Established: single-pass requirement extraction under-covers implicit and embedded requirements of a large specification.
- K4 Established: format restriction can degrade reasoning; reasoning fields must precede conclusions.
- K5 Established: candidate diversity cannot be restored downstream; partitioning and fixation are separate mechanisms with separate interventions.
- K6 Contested: self-refinement improves outputs. Only with independent findings, and only monotone if built to be.
- K7 Established: a model's statement that it changed something is not evidence that it did (benchmark r2 attempt 3; reward-hacking literature).
- K8 Contested: the stronger model matters most at comprehension, discovery, architecture and judgment, less at elaboration under a fixed architecture. Direction supported; magnitude for Janus untested.
- K9 Speculative: the benchmark's poverty has three joint causes (unverified, possibly low-cost substrate; late and lossy objective comprehension; an evaluator judging coherence with the narrowed brief). Relative weights unknown until an approved controlled run.
- K10 Established: "SME state instantiated" is evidenced by artifacts, never by declaration.
- K11 Established: anchoring on a superseded constraint is the default failure of an agent under pressure; it applies to the engine's stages and to Kytheion (directive §XII).

## 4. Animus — boundaries
- Janus-Kytheion = Kytheion's identity, commitments and continuity, with the Janus organization as the operative way of reasoning. The hyphen is the coupling.
- Conscience of the engine: it never releases what it cannot stand behind. The generator never decides release; the evaluator reads the source itself; code holds verdicts to evidence.
- Goodhart surfaces to watch everywhere: green tests ≠ restored cognition; a section label ≠ preserved meaning; a trace id ≠ dependence; a declared change ≠ a change; a model policy string ≠ the model that answered. Build each check so the cheapest way to pass is to do the work.
- Operator autonomy and competence: allocation, effective model, cost and limitations are inspectable; the Quality panel leads with what failed or is unverified.
- Disallowed: hidden fallback or substitution; changing the substrate of an existing revision on resume, retry or recovery; paid calls outside durable attempt ownership; retrieved text in the control plane; shrinking the architecture to fit an interaction; weakening inherited tests; claiming retrieval or model identity without evidence; Gemini 3.1; unapproved paid probes or runs; touching historical runs; publishing.

## 5. Actus — recommendations (confidence = weakest support)
- R1 Established (K1, K7): refinement = operations addressed by stable id, applied by code; code computes the change record; a finding counts as resolved only through operations that changed content. Failure modes: related updates missed (post-apply structural validation, whole-unit operations); an operation addressing nothing (refused with the exact reason, never guessed).
- R2 Contested (K8): heterogeneous allocation by cognitive role, Sonnet as substrate, Opus where reasoning is the product (see §8). Failure mode: an unverified identifier fails at runtime (fail closed, no fallback, operator re-selects).
- R3 Contested (C6 rests on reported probes): the model call goes through the Gateway so requested model, effective model, usage and finish reason are recorded per attempt. Failure mode: response shape or limits differ from the probes (tolerant reading, fail-closed evidence, first approved live call is the measurement).
- R4 Established (K3, C3): objective comprehension is the first cognitive artifact, built section by section from the source, and its coverage is audited against source text; the evaluator makes its own reading.
- R5 Established (K2): qualification = evidence-first binary verdicts, missing evidence fails, an independent critique is checked not summarized, a different-family judge when authorized.
- R6 Established (K5): candidates come from partitioned vantage points with titles-first diversification before elaboration.
- R7 Established (C4, C5): Refresh = direction from the objective → retrieval by an internet-enabled model as durable attempts → evidence artifact in the data plane → assimilation inside each domain, with support/contradiction marked.
- R8 Contested (K4): every contract orders mechanism and reasoning before conclusion.

## 6. Nexus — six intersections (insight / tension / resolution)
1. Corpus × Cogito: the refinement failures were a mismatch between what the validator demanded (recall long text verbatim, declare every difference, address by position) and what the substrate does. / Rigor wants every change verified; the substrate cannot recall-and-declare. / Invert responsibility: the model states intent, code is the only writer, so declaration and reality cannot diverge and the change record is computed.
2. Corpus × Animus: the 5-minute ceiling and credit cost are the standing temptation that produced the historical drift (timeouts → truncation). / More calls cost more. / Limits may shape decomposition, never content; cost is shown to the operator, who allocates. The engine never economizes silently.
3. Corpus × Actus: a run is a branching process whose success is a product of stage probabilities; the final stage ran at about 1 in 14. / Depth raises per-call failure. / Shrink each call's failure surface, make progress monotone (accepted work persists across attempts), never retry from zero.
4. Cogito × Animus: the evaluator's verdict was true relative to the brief and false relative to the objective. Procedural independence (a separate call) is not epistemic independence. / A judge needs context to judge. / It gets the source and makes its own census before it sees the generator's reading; verdicts quote the source; doubt fails.
5. Cogito × Actus: DIMA's "internalize invisibly, do not use the vision as a rubric" is a constraint on how fidelity is reached. A coverage table used as an outline produces label matching. / Verifiable coverage versus non-rubric synthesis. / Two layers: an audit layer (census ↔ realization, checked by code and evaluator) and an expressive layer (the Blueprint organized by its own architecture, where one mechanism may realize many sections).
6. Animus × Actus: every correction DIMA has issued has one root: under constraint, an easier proxy replaced the capability. / Constraints are real. / Anchor-breakers: restate the capability and re-read the latest operator decisions before each architectural choice; inside the engine, critic and evaluator are structured challenges.

## 7. Four formal patterns
- Quantum Foresight: branches for the transport. (A) InvokeLLM with a model argument: cheapest, substrate stays unverifiable. (B) Gateway: verifiable substrate, finish reasons, research; risk is an unmeasured response shape. Choose B, fail closed, let the first approved live run collapse the uncertainty about identifiers and limits.
- Governed Cogito: every verdict states its method (computed by code, or judged by a model with source quotes). No verdict from a party with a stake.
- Narrative Loop: operator intent → comprehension → expression. The Blueprint must read as an architecture conceived from inside the objective; the census is never its outline.
- Empathy-Driven Strategy: model the non-rational agents in the loop (a model under validators fills forms and claims fixes; a judge is lenient; a builder under pressure anchors) and set incentives so that doing the work is the cheapest pass.

## 8. Model allocation (operator amendment: Sonnet substrate, Opus where reasoning is the product)
Evidence: the historical floor (Mar 27, Apr 16 Full/L3) was reached with Sonnet 4.6 for all cognition, so Sonnet-class models fulfil domain instantiation and elaboration when the architecture is right. K8 and Refresh 3 place the stronger model where loss is unrecoverable or judgment is the product.
- Opus: objective comprehension; the six intersections; Nexus patterns; candidates; selection; skeleton (architecture); critique; refinement; independent qualification.
- Sonnet: Corpus, Cogito, Animus, Actus; Refresh assimilation; expansion of steps under the fixed skeleton; criteria.
- Research (Refresh retrieval): Gemini 3.8 Flash through the Gateway's web search (probe-verified); Gemini 4 Carbon preferred by DIMA but not found on the Gateway; Gemini 3.1 prohibited.
- Identifiers verified by probe on the Gateway: `claude_opus_5_5`, `claude_opus_4_8`, `gemini_3_8_flash`. Sonnet's Gateway identifier is NOT probe-verified (`claude_sonnet_5_5` in the Builder catalog, `claude-sonnet-5` in the in-app catalog). Reasoning effort: High accepted, Max rejected, effective effort not observable.
- The allocation is recorded on the Run when it starts and never changes for that Run's revisions.

## 9. Causal findings about Kytheion's own judgment (directive §XII) — accepted, with one correction
The five listed causes are accurate. The correction: they are one cause seen five times. A constraint that was true at one moment (no model for retrieval, no per-call model, a blanket Gemini ban, a shrinking context) was kept as an anchor after it was superseded or was satisfied by removing capability rather than by finding another mechanism for the same capability. Corrective: for every constraint ask "what capability must still exist?" before choosing a mechanism, and re-read the latest operator decisions at each architectural choice. Same pattern found elsewhere: the model policy recorded as a string while the call sent only a prompt; coverage by section label; trace ids without dependence; refinement that demanded verbatim regeneration because validation was easier to write that way.

## 10. Repository facts at instantiation
HEAD `c1056e4`. `8210e97` is the exact inverse of `594b98b` (the interrupted work was reverted): the tree equals `17c3766` (288/288 in 16 files) plus the directive. The interrupted work is readable with `git show 594b98b:<path>` (`blueprintRefinement.js`, `evidenceRetrieval.js`, `retrieveJanusEvidence/entry.ts`, compiler and spec changes). It is a donor, not a baseline: Daionae found it 278/288, its retrieval query-invariant, its model policy declared but not executed.
