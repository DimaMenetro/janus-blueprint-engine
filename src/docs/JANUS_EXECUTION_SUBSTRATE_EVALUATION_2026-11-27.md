# Janus execution substrate — evaluation and decision (2026-11-27)

Janus-Kytheion for DIMA. Read after `JANUS_CONTINUITY_STATE.md`. This record answers one question and fixes the design of one branch. It does not treat the 5-minute ceiling itself: DIMA set that aside explicitly ("we're not solving the timeout problem").

**DIMA's question (operative meaning):** the expanded pipeline cannot be tested end to end because Cogito drops at what looks like the server's 5-minute limit. Should the model calls be made by Workflows, or go back to the browser as before the move server-side? Create a separate branch for it.

## 0. Determination

1. **Workflows are not a path for the model calls.** The platform documents the 5-minute backend-function limit as enforced identically when a function is called directly, by an automation, or as a workflow step. A workflow has no step that calls a model: the Gateway call would still run inside a function. A workflow would let a run continue with the phone locked, but Cogito would end at 5 minutes exactly as now. Workflows are also shared with main and cannot be tried on a branch.
2. **The browser is a path, as the page calling the AI Gateway directly, not as the original InvokeLLM call.** The SDK has a user mode, `base44.aiGateway.connection()`, that returns the signed-in operator's own token; the Gateway accepts it on apps shared privately or with the workspace, which this app is. The page can send exactly the request the function sends and receive exactly what the function records (answering model, finish reason, usage, request id). No function is in the call path, so the function limit does not apply to it. The original InvokeLLM call also leaves the function out, but it reports no answering model, no finish reason and no usage, and takes no effort or output limit: it would undo model-identity verification and truncation handling.
3. **The one unknown that decides it:** whether a single Gateway request made from a page can outlive 5 minutes. No document states a limit for it. The first approved run on the branch measures it.
4. **Correction to the working hypothesis.** The pipeline did not work before because its calls were made from the browser. The last run that went start to finish (`6b0868e3…`, 26 Nov, Full L3) was already server-side and already used the expanded contracts (template `2026-11-26.5`); all 35 of its calls settled in at most 27 s because the platform's default fast model answered (domain answers of 7–9k characters in 8–11 s). The calls became long when the allocated substrate answered: Sonnet 5 at high effort writes Corpus answers of 19–23k tokens (40–44k characters) in 4–5 minutes. The depth DIMA asked for made the calls long; where the call was made never did.

## 1. Corpus — facts and sources

### 1.1 Platform (documentation and SDK, read 2026-11-27)
- **P1** "Backend functions have a maximum execution time of 5 minutes, enforced the same way whether the function is called directly, triggered by an automation, or invoked as a workflow step. Requests that exceed this limit are terminated." On exceeding it, "Base44 stops waiting and returns a 504 error with the body `Timeout`." (Backend Functions Overview.)
- **P2** Workflow activities are `invoke_backend_function`, `calculate_field`, `compute_seconds_until`, `send_email`. Execution is strictly sequential; waits are durable; a run lives at most 90 days; a workflow step always calls a function's latest saved version. (Workflow authoring guide.)
- **P3** Branches: a branch gets its own copy of each function it changes; "Integrations, secrets and workflows — Shared with main"; records are shared with main; a branch may create entities and add optional fields. (Working with branches.)
- **P4** AI Gateway (`@base44/sdk`, `ai-gateway.types.d.ts`): service-role mode for server code; user mode `base44.aiGateway.connection()` "returns the signed-in app user's token. The gateway accepts it only on apps shared privately or with your workspace." OpenAI-compatible chat completions; streaming supported; asynchronous jobs documented for video only; billed to the app's credit quota. The SDK builds the user-mode connection as `{serverUrl}/api/apps/{appId}/ai/openai/v1` with the session's access token.
- **P5** This app: visibility `workspace_with_login`; `core_integrations: client_allowed`; open scan finding "Core integration protection" (high). Pages may call InvokeLLM only while that holds; enabling the protection is immediate and cannot be turned off. No document states how long a page-made InvokeLLM request may run.
- **P6** InvokeLLM returns the result only (no answering model, finish reason, usage or request id) and takes no reasoning effort and no output limit.
- **P7** Actors were considered: Durable Objects that hibernate after ~10 s of quiet, documented as "not for async flows", whose clients expose entities, functions and integrations, not the Gateway. Not a candidate.

### 1.2 Records (read-only, 2026-11-27; nothing written)

| Run | Stage | claimed → recorded | output tokens | rate |
|---|---|---|---|---|
| `6b08ec20…` | Corpus | 234.6 s | 19,106 | 81 tokens/s |
| `6b08eb20…` | Corpus | 263.1 s | 22,044 | 84 tokens/s |
| `6b08e39e…` | Corpus | 281.7 s | 23,072 | 82 tokens/s |

All three: `claude-sonnet-5` requested and reported as answering, effort high, 75.6k prompt tokens, finish `stop`, 80 credits each.

- Both Cogito attempts (`6b08e39e…` claimed 02:06:03Z, `6b08ec20…` claimed 02:38:30Z) were claimed and nothing was ever recorded: the function ended before the Gateway answered, as P1 describes. The records cannot show the 4:33 DIMA saw (nothing was recorded for those calls); they show a Corpus call of 4:42 completing inside the same function, so the end came after that, consistent with 5:00.
- At ~82 tokens per second, 5 minutes is about 24,000 output tokens. The call's output limit is 32,000 tokens, reached after about 6.5 minutes.
- `6b08e39e…` Corpus was recorded at 02:03:24Z and settled by its own page at 02:05:58Z, 2½ minutes later: consistent with a page that was asleep when the answer arrived (inference).
- Benchmark `6b0868e304d59da526c4ffc8` (26 Nov, Full L3, completed): templates `2026-11-26.5` and `2026-11-25.3`; 35 calls, the longest 27.4 s; domain answers 6,860–8,732 characters in 8–11 s; answering model not reported (function → InvokeLLM, platform default).
- Open runs, left untouched: `6b08e39e…` (cancel requested; slot held by its unresolved Cogito attempt); `6b08ec20…` (running; the same); `6b08eb20…` (running; its Corpus attempt holds a recorded success that no session settled: "Check recorded outcome" settles it without a call, after which Resume would reach Cogito and end the same way on the server path).

## 2. Cogito — claims
- **K1 Established** (P1, P2): moving orchestration to Workflows does not change how long one call may run. Who schedules a stage and where its call executes are separate axes; the failure is on the second.
- **K2 Established** (P3): Workflows cannot be tried in isolation on a branch; any workflow saved is live on main.
- **K3 Established** (benchmark vs table): the old pipeline worked because its calls were short.
- **K4 Established** (P4): the page can reach the Gateway with the operator's own token, with the same request and the same evidence as the function.
- **K5 Contested** (P1 for; absence of documentation against): a page-made Gateway request can outlive 5 minutes. P1 places the limit on the function runtime (it applies to workflow steps, where no browser is involved), and the page path contains no function. Nothing documents the Gateway's own limit, and one entry point may end every long request. One measured call decides.
- **K6 Established** (P5, P6): a page-made InvokeLLM call shares K5's unknown, loses the evidence, and depends on a security setting that can only be switched one way.
- **K7 Established** (engine evidence rule): on the page path the page is the only recorder. A call whose page goes away can never be recorded, so it stays unresolved permanently and the run stops at that stage: the state `6b08e39e…` and `6b08ec20…` are in now, for another reason.
- **K8 Contested** (table, output limit): an expanded Cogito answer may be longer than 32,000 tokens; then the page path ends it at about 6.5 minutes as `output_truncated` (one call, settled, not repeated). The next wall would be visible, not silent.

## 3. Animus — boundaries
- No hidden fallback, no unverifiable substrate: InvokeLLM is excluded for that reason alone.
- DIMA's request supersedes, for the branch only, the 25 Nov move of the call server-side and the rule that browser adapters only schedule until durable server execution is proven. The browser adapter still only schedules; the call moves into the stage runner's one call seam.
- Credit reach: the Gateway accepts any signed-in member's token on a workspace-shared app whether or not Janus uses it, so the page path adds no reach. The platform recommends server-side calls; on the page path the operator check before a call is made by the page, while every record write stays protected by row-level security.
- The ceiling may shape decomposition, never content. Nothing here shrinks a stage.
- No paid call without DIMA; DIMA makes the measurement from the branch preview.

## 4. Nexus — six intersections (insight / tension / resolution)
1. **Corpus × Cogito:** the platform limit belongs to a runtime, not to a schedule. / The hypothesis tied it to "server-side". / Separate the two axes and change the one that fails.
2. **Corpus × Animus:** the easy way to buy duration is to give up the evidence (InvokeLLM). / Duration against verifiability. / The page → Gateway path keeps both.
3. **Corpus × Actus:** the only open fact is one number, how long a page-made Gateway request may live. / A probe outside a run would be a paid call outside durable attempt ownership. / Measure with the real stage inside a real run.
4. **Cogito × Animus:** the depth DIMA wants is what made the calls long. / Agreeing with the hypothesis would be easier. / Saying so serves the intent.
5. **Cogito × Actus:** one engine, two call paths. / A second path invites a second engine. / Where a call is made is a recorded property of a run, fixed like its model, and every attempt says where it ran.
6. **Animus × Actus:** on the page path the operator's device is part of the substrate. / The engine cannot hold the device. / It says so, and holds the screen awake while a call is in flight.

## 5. Formal patterns
- **Quantum Foresight**, after the first measured run: (a) Cogito settles with finish `stop`: the whole pipeline is testable from the page now. (b) It settles as `output_truncated` near 6.5 minutes: the output limit is the next wall (raise it within the model's maximum, or decompose: DIMA's decision). (c) The page path also ends near 5 minutes: one ceiling governs every single request, decomposition is the only route, and Workflows then become the right orchestrator for the decomposed calls.
- **Governed Cogito:** every claim above names its source; what is inferred says so.
- **Narrative Loop:** "go back to the browser" is honored in its intent (long calls, testable now) without the unstated cost of the original form.
- **Empathy-Driven Strategy:** a phone that sleeps is the most likely page-path failure; the branch keeps the screen awake and tells the operator what the run needs.

## 6. The branch (started 2026-11-27 from main at 317/317, lint 0, build passing)
Requirements:
1. A second call path in the stage runner's one call seam: the page calls the Gateway's chat completions with `base44.aiGateway.connection()` (user mode). Not InvokeLLM.
2. The same request as `invokeJanusStage`: model and effort from the stage revision (`provenance.model`), the compiled prompt as the one user message, the same output limit (32,000), streamed. The same record on the attempt: requested and answering model, request id, finish reason, usage, response text, transport state. Nothing defaulted when not reported.
3. The same ownership before any call, as conditional writes from the page: operator only; stage running; run not cancelling; model recorded and authorized; run slot taken; attempt claimed once; outcome recorded; slot freed only after the record. The same refusal reasons with evidence `not_started`. One test holds the page path and the function to one refusal table.
4. One engine. No second runner, compiler or engine; the browser adapter still only schedules. The server path is unchanged and stays the default.
5. The call path is chosen by the operator when a run starts, recorded in the run's model policy snapshot, fixed for every revision of the run, and recorded on every attempt. A run without it reads as the server path.
6. The evidence rule is unchanged, with one rule for the page: only a Gateway-authored response settles a call. A page network error or a broken stream is unknown (the call may still run upstream): the attempt stays unresolved and is never retried. The page records what it observed (when the connection broke, how much had arrived, the browser's error) as telemetry on the attempt, without settling it.
7. A screen wake lock is held while a page-path call is in flight, where the device supports it, and the run screen tells the operator to keep the app in front.
8. No timer, deadline, abort, truncation or input cutting.
9. First, at no cost: from the page, read the Gateway's model list with the operator's token (no model runs) to confirm the Gateway accepts it from the page; report before any paid run.

Exit criteria:
- **E1** A Full L3 run through the page path settles Cogito with the answering model, finish reason and usage recorded; or the telemetry shows exactly where the page path ends.
- **E2** Two tabs never produce two calls for one attempt.
- **E3** Full suite, lint and production build green; inherited tests unweakened (any replacement authorized and marked in place).

Reserved for DIMA:
- **D1** A page-path call that can never be recorded: keep "unresolved" (default), or authorize an explicit operator close (not retried; the stage then needs a re-run; the call may have been billed).
- **D2** Merge only after E1; the server path stays the default either way.

## 7. Deferred (outside this question)
- The platform's documented 5-minute end (504, body `Timeout`) is not captured by the engine, so such an attempt stays unresolved forever. Recording it as platform evidence (documented, not inferred) is a separate decision for DIMA.
- Main's remaining T1 items: the Diagnostics model panel (hold it until the branch is merged or discarded: both touch the Diagnostics page) and the governing-plan amendment.
