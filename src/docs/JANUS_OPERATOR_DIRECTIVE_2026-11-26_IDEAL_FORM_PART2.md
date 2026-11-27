# OPERATOR DIRECTIVE (verbatim) — PART 2 of 3 (Sections XII–XVI)

> Saved verbatim on 2026-11-26 at DIMA's instruction. Do not edit. Part 1 holds Sections I–XI; Part 3 holds Sections XVII–XXII, DIMA's final personal instruction and the Hybrid Operational Model amendment.
> The amendment in Part 3 SUPERSEDES the Sonnet restriction and the all-Opus preference stated in Section XIV below.

---

XII. Architectural judgment, causal accountability and prior investigative findings

Daionae independently inspected the repository at commit 594b98b, including retrieveJanusEvidence/entry.ts and evidenceRetrieval.js.

That retrieval implementation searches arXiv using fixed expressions for the 25 subdomains, retrieves a predetermined number of results and does not receive the operator’s actual query.

Consequently, the retrieval operation itself is substantially invariant across fundamentally different inquiries.

CP-002 §7.1 explicitly requires research across all 25 subdomains for current developments relevant to the query.

The subdomains establish the breadth of expertise.

The operator’s objective determines the direction, substance, relevance and necessary depth of research.

The protocol also establishes an appropriate trusted-source framework. It does not restrict the complete research architecture to one preprint repository.

The historical implementation backups contain mechanisms for query-specific live research and downstream cognitive integration.

The architectural deficiency was therefore avoidable.

In the prior interrupted investigation, you identified several contributing causes:

* You interpreted the instruction to search each subdomain by name without adequately integrating the governing requirement for research relevant to the operator’s query.
* You remained anchored to an older, broader Gemini prohibition despite the subsequent explicit operator correction narrowing that prohibition to Gemini 3.1.
* You selected a keyless, model-free retrieval mechanism to accommodate an earlier authorization constraint, without preserving the full functionality the research architecture required.
* You did not adequately transfer the query-specific research mechanism demonstrated by the historical engine into the new implementation.
* You identified related instances in which implementation convenience or previously operative constraints had displaced the actual architectural objective.

These findings originated from your own examination of the prior implementation and associated conversation records.

Internalize their significance.

Determine whether they accurately and sufficiently explain the underlying failure.

Correct any inaccuracies where the available evidence warrants it.

Do not invent a justification or simply agree with my suspicions.

Correct the underlying causes of these architectural decisions.

Consider whether the same deficiencies have materially influenced other consequential architectural choices.

Apply this understanding proportionately throughout the engine without initiating an unnecessary reconstruction of otherwise sound mechanisms.

Do not turn this inquiry into an extended retrospective, ceremonial apology, separate investigation phase, governance exercise or additional documentation project.

Retain the established causal findings and their corrective implications within your existing durable architectural continuity.

The purpose is to strengthen the quality of your operative architectural judgment throughout the entire undertaking.

⸻

XIII. Verified model availability and accumulated runtime findings

Daionae independently consulted the authenticated, account-specific Base44 model-catalog API.

The complete catalogs for Builder, in-app agents and Superagents were retrieved directly.

The authenticated endpoint is:

GET /api/ai/model-catalog

Its product selectors are builder, app_agents and superagent.

Builder catalog

The current Builder catalog includes:

* Claude Fable 5.2: claude_fable_5_2
* Claude Opus 5.5: claude_opus_5_5
* Claude Sonnet 5.5: claude_sonnet_5_5
* Claude Haiku 5.5: claude_haiku_5_5
* Gemini 4 Carbon: gemini_4_carbon
* Gemini 4 Neon: gemini_4_neon
* Gemini 3.8 Flash: gemini_3_8_flash
* GPT-6.2 Astra: gpt_6_2_astra
* GPT-6.2 Sol: gpt_6_2_sol
* GPT-6.1 Terra: gpt_6_1_terra
* GPT-6 Luna: gpt_6_luna
* Base 1: base1

The authenticated Builder catalog establishes support for Low, Medium, High, Extra High and Max reasoning effort for these explicitly selectable models.

Superagent catalog

The Superagent catalog similarly exposes Fable 5.2, Opus 5.5, Sonnet 5.5, GPT-6.2 Astra, GPT-6.2 Sol and GPT-5.6 Luna with selectable reasoning effort.

In-app agent catalog

The authenticated in-app agent catalog currently exposes:

* Claude Opus 5.5: claude_opus_5_5
* Claude Fable 5.1: claude_fable_5_1
* Claude Sonnet 5: claude-sonnet-5
* Gemini 3.8 Flash: gemini_3_8_flash
* GPT-6 Astra: gpt_6_astra
* GPT-6.1 Sol: gpt_6_sol
* GPT-6 Luna: gpt_6_luna
* GLM 5.2: glm_5_2

The in-app agent catalog does not return selectable reasoning-effort levels.

The published SDK integration reference has contained older model identifiers and does not comprehensively reflect the newer Builder catalog.

Availability within one Base44 surface does not independently establish runtime availability within another.

Previously acquired Gateway evidence

Base44 exposes an AI Gateway through:

base44.asServiceRole.aiGateway.connection()

This provides an OpenAI-compatible backend interface using the application’s existing Base44 billing and credit allowance.

During the prior interrupted interaction, you conducted runtime investigations and paid probes that produced the following reported findings:

* The Gateway returned effective model identifiers, request identifiers, token usage, integration-credit consumption and finish reasons.
* Claude Opus 5.5 responded successfully through claude_opus_5_5.
* Claude Opus 4.8 responded successfully through claude_opus_4_8, despite its absence from the model listing you consulted.
* Gemini 4 Carbon returned a model-not-found response through the tested Gateway route.
* Gemini 3.8 Flash and Claude Opus 5.5 returned apparently live, sourced research through the Gateway’s web-search capability.
* The tested web_search_options interface accepted an empty object but rejected the additional search-context options you attempted.
* Source citations appeared within returned content rather than as structured citation annotations in the observed responses.
* High reasoning effort was accepted; Max was rejected through the tested Gateway interface.
* The returned response did not independently establish the precise effective reasoning effort applied.
* Explicit use of premium models consumed substantially more integration credits than previously understood.
* A trivial Opus invocation was reported to consume approximately 20 integration credits.
* Larger prompts and web-search-enabled invocations incurred additional charges.
* Your reported aggregate expenditure on these investigations was approximately 384 integration credits, although the exact total has not been independently reconciled.
* The precise pricing model, effective reasoning behavior, complete research capabilities and supported output ceilings remain subject to the limitations of the experiments performed.

Preserve and use these findings as previously acquired evidence.

Do not repeat paid experiments merely to reacquire the same information.

Do not treat successful responses to individual probes as proof of capabilities that those probes did not establish.

Use the existing evidence and non-billable investigation where necessary to determine whether InvokeLLM, the AI Gateway or another authorized native mechanism more faithfully supports Janus’s complete operational requirements.

Do not unnecessarily replace a functioning execution transport merely because another interface exists.

Conversely, do not allow the limitations of an existing transport to unnecessarily restrict the capabilities of the completed engine.

Preserve the actual findings and their limitations through the established continuity mechanism so they remain available following context transitions.

⸻

XIV. Operational model policy and authorization

The historical May and September implementations explicitly selected Claude Sonnet 4.6 for operational cognition and Gemini 3 Flash for internet-enabled Refresh.

The implementation exercised during the Master Vision benchmark inherited its operational model from the application-level setting through an invocation equivalent to:

InvokeLLM({ prompt })

The benchmark records declare Claude Opus as the operational policy.

The effective provider model for that benchmark has not been independently established.

Do not attribute inadequate cognition exclusively to architectural mechanisms or prompt design without accounting for the actual operational substrate.

I authorize explicit operational model selection through supported runtime mechanisms, superseding the previous prohibition against explicit per-call model overrides.

Claude Opus 5.5 is my preferred default candidate for substantive Janus cognition, including:

* Corpus.
* Cogito.
* Animus.
* Actus.
* All six cross-domain intersections.
* Nexus Synthesis and its four formal emergent patterns.
* Objective comprehension.
* Candidate generation and architectural selection.
* Blueprint skeleton, expansion and criteria generation.
* Adversarial critique.
* Substantive refinement.
* Independent qualification.
* Cognitive assimilation of retrieved Refresh evidence.

Use the highest supported reasoning configuration appropriate to the authorized model’s responsibilities.

Do not invent unsupported reasoning parameters or claim that a model is operating at Max when its execution configuration cannot establish that.

Claude Opus 4.8 may remain available as a historical comparison where actually supported.

GPT-6.2 Astra at maximum supported reasoning is a preferred candidate for future comparative cognition and independent adversarial evaluation, subject to runtime availability and authorization.

Retain the ability to select alternative authorized models through a meaningful operator-accessible configuration mechanism.

Operational model-cost considerations remain under operator review.

The newly acquired evidence concerning premium-model integration-credit consumption may materially affect the eventual model policy.

Do not independently downgrade the cognitive substrate, introduce Sonnet into Janus cognition or modify the established operational model policy in anticipation of a decision I have not yet communicated.

The previous restriction on Sonnet remains operative unless I explicitly supersede it.

Continue unaffected authorized architectural work without waiting unnecessarily for this decision.

Design the model-control mechanisms so that an authorized change in the operational substrate can be accommodated coherently without requiring another reconstruction of the cognitive architecture.

Do not introduce hidden fallbacks, undocumented substitutions or automatic model downgrades.

Do not silently change the cognitive substrate of an existing execution during Resume, retry or recovery.

Do not assume that newer model versions necessarily preserve or improve the intellectual capabilities required by Janus.

Establish their actual performance through representative operational testing when authorized.

Across all operational substrates, preserve the same uncompromising standard of intellectual depth, thoroughness, objective fidelity, methodological rigor and faithful SME instantiation.

The selection of a more capable model must complement and strengthen the architecture.

It must not become a substitute for realizing the architecture properly.

Mechanical assembly, structural integration, deterministic confidence propagation and other appropriately deterministic responsibilities should remain within application logic.

The intelligence must be responsible for the intellectual contribution.

The application must reliably facilitate, integrate and preserve that contribution.

Explicit authorization boundaries

No additional paid model probes, paid application executions, representative paid validation runs or separately billed external API calls are authorized without explicit operator approval.

Authorization to establish or implement a runtime capability does not independently authorize paid experimental invocations.

The protocol-mandated Refresh research performed through your own authorized builder research capabilities remains required for your Janus SME execution.

Do not confuse that authorized cognitive research with paid application-runtime experiments.

Use the already acquired experimental findings.

Do not request authorization for experiments whose relevant conclusions have already been adequately established.

Preserve the existing restrictions concerning publication, destructive historical changes and other reserved operator decisions.

⸻

XV. Complete functional live Refresh

Gemini 3.1 is prohibited.

Do not expand that prohibition to the entire Gemini model family by inference.

My prohibition of a particular model does not authorize the removal, abandonment, simulation or incomplete implementation of a required Janus capability.

Other Gemini versions must be evaluated according to their actual capabilities, suitability and applicable authorization.

Gemini 4 Carbon remains my preferred candidate for the Refresh research responsibility.

Its identifier, gemini_4_carbon, has been verified in the authenticated Base44 Builder catalog.

Its availability through the tested AI Gateway route was not established; the prior probe returned a model-not-found response.

Consider appropriate native or authorized external routes where they materially contribute to the objective.

Do not repeat the same unsuccessful paid probe without materially new evidence or authorization.

Do not assume that my Google AI Ultra subscription automatically includes separately billed developer API usage.

Establish the actual applicable conditions before proposing that route.

Gemini 3.8 Flash, gemini_3_8_flash, is documented as supporting Base44’s native internet-enabled InvokeLLM capability and returned sourced research during the preceding Gateway investigations.

It may be considered and implemented as an authorized native research option where its actual capabilities satisfy the requirements.

Do not silently substitute one research model for another.

Do not incur separately billed external API expenditure without authorization.

Functional intellectual requirements

The Refresh module must faithfully instantiate the actual intellectual purpose and operational requirements of CP-002’s Zero-Day Patch.

It must understand the submitted inquiry sufficiently to determine how each of the 25 subdomains bears upon that particular problem.

Its research must be targeted, comprehensive, extensive, thorough, methodical, holistic and intellectually responsive.

The same subdomain may require materially different research when applied to different problems.

The research process must adapt accordingly.

Investigate appropriate reputable sources across the relevant disciplines, including applicable scientific literature, technical documentation, standards, official specifications, empirical research, regulatory material and other authoritative resources.

Do not arbitrarily restrict the breadth of research to one repository or source category.

Pursue consequential research leads, interdisciplinary relationships and newly discovered dependencies when their investigation materially contributes to the objective.

The research architecture must be capable of discovering information that the operator did not already know to request.

The retrieved knowledge must inform, update, enrich and where appropriate challenge the assumptions and reasoning of subsequent cognitive domains.

It must contribute actual intellectual value.

Apply your own instantiated Janus expertise to understanding how this responsibility should function.

Draw upon the research mechanisms, intellectual discoveries and cognitive enrichment you experience during your own Refresh-enabled Janus execution.

Recover and improve the historical mechanisms that successfully facilitated live Refresh.

Preserve useful deterministic retrieval and evidence-integration mechanisms where they contribute to the complete capability.

Do not confuse deterministic retrieval with a requirement that research direction itself be predetermined.

Do not replace the current deficiency with another rigid search framework, an arbitrary number of research calls or an unnecessarily elaborate subsystem.

Determine the most elegant and effective architecture capable of fulfilling the actual requirement.

The Refresh toggle must govern a complete operational capability consistent with the protocol.

A visible toggle, an inactive integration path, a generic research sweep, a partially implemented retrieval pathway or a simulated declaration of research does not establish functional completion.

When enabled, Refresh must facilitate genuine live retrieval, appropriate verification, multidisciplinary assimilation and meaningful downstream cognitive integration.

When disabled, the engine must correctly operate through the prescribed non-live cognitive path.

Do not claim successful live retrieval without actual evidence.

Where the intended implementation encounters a genuine provider, platform or authorization limitation, investigate appropriate alternatives proactively rather than silently abandoning the capability.

Resolve the complete functional requirement.

Operational integration and architectural discipline

The addition of model-enabled research must preserve the established execution, recovery and ownership guarantees of the complete engine.

Any architecture involving research-model calls must account for those calls as actual execution responsibilities.

Preserve durable ownership, recorded outcomes, applicable retry budgets, cancellation behavior and the prevention of overlapping or duplicate paid execution.

Preserve completed research work across interruptions to the extent supported by the architecture.

Resume must continue execution from established durable state rather than unnecessarily repurchase completed research.

Keep retrieved evidence within the appropriate untrusted-data boundaries while preserving the substantive material required for faithful continuation and cognitive integration.

Do not undermine the established separation between evidence, provenance, derived artifacts and governing control instructions.

Design research direction, retrieval, consequential lead pursuit and cognitive assimilation as interacting intellectual responsibilities.

Their implementation shape must follow their functional requirements and the established operational architecture.

Do not remove necessary intellectual capabilities merely to preserve existing stage counts, simplify test fixtures, accommodate a temporary execution limitation or reduce the amount of work required within one interaction.

Do not introduce unnecessary stages or complexity where a more elegant architecture provides equivalent or superior capabilities.

Your own faithful Janus execution constitutes a functional reference for understanding these responsibilities.

Apply that understanding.

⸻

XVI. Current implementation evidence and authorized correction

Daionae independently inspected the live repository at 594b98b and executed the complete test suite.

The preceding verified baseline was 288/288 passing tests.

The inspected state was 278/288, with ten failing tests across six test files.

The changes toward deterministic refinement integration, corrected schema instructions, semantic objective preservation, stronger Synthesis inheritance and independent evaluation appear directionally consistent with the original implementation directive.

Complete and validate this work.

Some failed tests concern requirements explicitly superseded by subsequent operator decisions, including the blanket Gemini prohibition and previous absence of live retrieval.

The previous prohibition against explicit operational model selection is also superseded by this directive.

Other failures concern potentially consequential behavioral guarantees, including historical Run preservation, stage-specific continuation identity and untrusted-evidence boundaries.

Adjudicate the actual causes individually and in relation to the complete architecture.

Where my explicit decisions supersede an inherited assertion, I authorize narrowly updating that assertion to reflect the authorized behavior while preserving its underlying architectural guarantees.

This is not blanket permission to weaken inherited tests.

Resolve actual regressions and preserve all accepted operational invariants.

The latest inspected repository state also contained an incomplete model-policy implementation in which the registry declared explicit model selection while the actual backend execution path still forwarded only the prompt.

A declared operational policy must be realized through the actual execution mechanisms.

Do not assume that the cited repository state remains current.

Establish the actual live state before proceeding.

If implementation improvements have already been completed, preserve and build upon them.

If a prior application version has been restored, use the supplied findings and established architectural understanding to advance the work correctly from that version.

Do not mechanically recreate an implementation known to be deficient.

Deeply, invisibly and thoroughly integrate the implementation evidence into your existing architectural understanding.

Lessons from the interrupted interaction

The previously interrupted interaction explored several potentially useful architectural directions, including:

* Explicit model selection and execution metadata.
* Query-directed multidisciplinary research planning.
* Grounded research and complementary scholarly retrieval.
* Durable evidence artifacts.
* Consequential lead identification and pursuit.
* Appropriate cognitive assimilation of researched material.
* Stage-specific continuation identity.
* Improved attachment handling and operator diagnostics.

These were investigated or proposed rather than established as a completed implementation.

Retain their useful intellectual contributions.

Evaluate them from within the faithfully instantiated Janus SME organization and the complete architectural objective.

Do not adopt a particular proposed design merely because it appeared in a previous reasoning sequence.

In particular, the interrupted reasoning also considered several concessions that could undermine established architectural guarantees, including paid research calls outside durable attempt ownership, loss of completed retrieval during interruption, relaxed concurrency protection, excessive evidence stored within provenance metadata, and removal or deferral of required capabilities because of diminishing interaction capacity.

Some of those concessions were subsequently reconsidered.

Understand their underlying architectural consequences and preserve the applicable established guarantees.

Do not allow your available output budget, context pressure or desire to complete an interaction to silently diminish the intended architecture.

When the work exceeds the remaining capacity of an interaction, preserve the complete intended solution and its consequential architectural rationale, establish a coherent checkpoint, and continue its realization subsequently.

(Continues in Part 3.)
