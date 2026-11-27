# Janus — page call path (branch `janus-pipeline-expansion`, 2026-11-27)

Janus-Kytheion for DIMA. Read after `JANUS_CONTINUITY_STATE.md` (its section "PAGE CALL PATH BRANCH" points here).

## 0. Source availability (honest boundary)
The branch directive names `src/docs/JANUS_EXECUTION_SUBSTRATE_EVALUATION_2026-11-27.md` and a section "EXECUTION SUBSTRATE (2026-11-27)" in the continuity state. **Neither exists in this branch**: they were written on main in the same turn that started this branch, after the branch was cut from main's code. This branch therefore works from the directive below, which restates every decision the evaluation fixed for it (workflows not the path; InvokeLLM not the path; the exact requirements 1–9). The evaluation's own text, sources and DIMA's reserved decisions D1/D2 live on main and are not reproduced here from memory.

## 1. The branch directive (verbatim, saved before execution)

> Janus-Kytheion, this is DIMA. This branch exists so I can run the whole expanded Janus pipeline with the stage model calls made from my page instead of the invokeJanusStage backend function, so that one call can last longer than the platform's 5-minute backend-function limit (Cogito on Sonnet 5 at high effort needs more than that). Do not try to solve the 5-minute limit itself, and do not shrink, split or cut any stage.
>
> Before anything else, read these in order and internalize them deeply: src/docs/JANUS_CONTINUITY_STATE.md (all of it, starting with the section "EXECUTION SUBSTRATE (2026-11-27)"), src/docs/JANUS_EXECUTION_SUBSTRATE_EVALUATION_2026-11-27.md (the evaluation, and the exact requirements for this branch in its section 6), src/docs/JANUS_KYTHEION_SME_STATE.md, then the operator directive parts 1-3 in src/docs. Operate as Janus-Kytheion, my scribe and builder, in the Janus SME state, and reason from inside the architecture.
>
> Already decided, do not reopen: Workflows are not the path (the 5-minute limit applies identically to workflow steps, a workflow has no model-call step, and workflows are shared with main, so none may be created from this branch). InvokeLLM from the page is not the path (it reports no answering model, finish reason or usage, and takes no effort or output limit).
>
> Build, in this branch:
> 1. A second call path inside the stage runner's one call seam: the page calls the AI Gateway's chat completions with base44.aiGateway.connection() (user mode: my own signed-in token; the Gateway accepts it because the app is shared only with the workspace).
> 2. Exactly the request invokeJanusStage sends (model and effort read from the stage revision's provenance.model, the compiled prompt as the single user message, the same 32,000-token output limit), streamed, and exactly the record it writes on the attempt (requested and answering model, request id, finish reason, usage, response text, transport state). Whatever the Gateway does not report is recorded as not reported, never filled in.
> 3. The same ownership before any call, done from the page as conditional writes: operator only; stage still running; run not cancelling; model recorded and authorized; the run's execution slot taken; the attempt claimed exactly once; outcome recorded; slot freed only after the record. The same refusal reasons, with evidence not_started, before any call. One test holds the page path and the function to the same refusal table.
> 4. One engine: no second runner, compiler or engine; the browser adapter still only schedules; the server path stays unchanged and remains the default.
> 5. I choose the call path on the Prompt page when a run starts; it is recorded in the run's model policy snapshot, fixed for every revision of that run like its model, and recorded on every attempt. A run without it reads as the server path.
> 6. The evidence rule is unchanged, with one rule for the page: only a Gateway-authored response settles a call. A page network error or a broken stream is unknown (the call may still be running upstream): the attempt stays unresolved and is never retried. Record what the page observed (when the connection broke, how much had arrived, the browser's error) as telemetry on the attempt without settling it, so a ceiling, if there is one, is measured.
> 7. While a page-path call is in flight, hold a screen wake lock where the device supports it, and tell me on the run screen to keep the app in front.
> 8. No timer, deadline, abort, truncation or input cutting anywhere.
> 9. First, at no cost: from the page, read the Gateway's model list with my token (no model runs), show the result on the Diagnostics page, and report to me before any paid run.
>
> Rules: you make no paid model call; I run the measurement from this branch's preview. Do not touch the 69 historical runs or any existing run. Do not change the unresolved-call rule, or add an operator close for calls that can never be recorded, without asking me first; present the options. Inherited tests are the behavioural oracle: never weaken, skip or delete one; replace an assertion only where this directive supersedes it, narrowly, marked in place with the reason, and report it. Before a structural change, state the invariant and why existing behaviour cannot satisfy it. Run focused tests, then the full suite, lint and the production build; never continue from red. Keep the continuity record current as work lands. Do not merge; I decide after the measurement.
>
> Exit criteria: (E1) a Full L3 run through the page path settles Cogito with the answering model, finish reason and usage recorded, or the telemetry shows exactly where the page path ends; (E2) two tabs never produce two calls for one attempt; (E3) full suite, lint and production build green.

## 2. Status
IN PROGRESS — sections 3+ are written as the work lands.
