# Janus — workflow suitability and execution substrate adjudication (2026-11-27)

Janus-Kytheion for DIMA. Branch `janus-pipeline-expansion`. Directive: `JANUS_OPERATOR_DIRECTIVE_2026-11-27_WORKFLOW_SUITABILITY.md` (verbatim; it overturns, for now, the evaluation's "Workflows are not a path" call).
Records that live on main (this branch was cut before they were written; read them with `git show origin/main:src/docs/<file>`): `JANUS_EXECUTION_SUBSTRATE_EVALUATION_2026-11-27.md`, `JANUS_KYTHEION_SME_STATE.md` section 11, `JANUS_CONTINUITY_STATE.md` section "EXECUTION SUBSTRATE".

Evidence classes: **[O]** observed this session · **[D]** documented · **[H]** historical record · **[I]** inference · **[U]** unresolved.

## 1. Status
- Nothing paid ran. No Run, RunStage or RunAttempt was written (record writes are refused on a branch); the three benchmark runs were only read, the 69 historical runs were not touched.
- Probe A (one backend request): runs #1 to #3, section 2. Probe B (a Workflow): cannot run from a branch (workflows cannot be created here and are shared with main); the package for a main-branch session is section 6.
- The page-path branch work (`JANUS_PAGE_CALL_PATH_BRANCH_2026-11-27.md`) is paused. Built: only the optional RunAttempt fields `call_path` and `page_observation`.

## 2. Probe A — one backend request (function `probeExecutionBudget`, this branch only, temporary)
Isolation, checked before the first call: admin-only; no model call; no entity record read or written (only `auth.me()`); no secret; no schedule or trigger; every observation is a log line and the platform adds its own status line per request. The app never calls it. The inherited server-tree guard in `protocolRegistry.test.js` was amended narrowly, marked in place, for the time the function exists (section 2.6).

### 2.1 Run #1 (18:27:38Z to 18:31:00Z) [O]
| arm | caller | max | what the log shows |
|---|---|---|---|
| ping | test tool; sandbox SDK | - | both reach the branch deployment: 200 |
| `attached` | test tool, waits for the answer | 420 s | start 18:27:54.708Z; 37 heartbeats (every 5 s); last at 185.069 s (18:30:59.708Z); the platform's own line `POST → no response (canceled)` has the same timestamp; nothing after; no `client_disconnected` line |
| `detached` | sandbox SDK | 150 s | start 18:27:55.440Z; 30 heartbeats; `survived` and `POST → 200` at 150.061 s |

- [O] A cancelled request ended with status "no response (canceled)" and the function's log stopped at that instant, at 185 s, far under 300 s. After a response the log channel stays open (section 2.2), so silence after the cancel means the function was not running (strong inference [I]: it stopped).
- [I] The cancel was the previous turn ending (DIMA's connection dropped and the open tool call went with it). The log shows when, not why.
- [O] The function's `req.signal` abort listener wrote nothing: a function is not told its caller left.
- [O] The sandbox arm ran to its end with status 200 and no cancel. That arm says nothing about disconnection.

### 2.2 Run #2 — work after the response, `waitUntil()` [O]
| label | second witness | what the log shows |
|---|---|---|
| `detach480` | a separate request every 30 s | answered in 113 ms; heartbeats 1 to 6 (5 to 30 s) after the response; the platform line `{"b44_telemetry":"post_response_work","event":"fetch_started_post_response",...,"ms_after_response":30000}` at 19:35:32.594Z; `POST → 200` at 19:35:32.643Z; nothing after (the loop was set for 480 s) |
| `detach60` (control, no second witness) | none | answered in 79 ms; heartbeats 1 to 6, the last at 30.079 s; `POST → 200` 35 ms later; nothing after (the loop was set for 60 s) |
- [O] Work started after the response runs for 30 s and is then ended by the platform, whether or not it does any I/O. The first run's side request started at the instant the window closed; the control shows the window closes without it.
- [I] `waitUntil` cannot carry a model call past its request. The documented 5-minute maximum does not matter for it: the post-response window is 30 s.

### 2.3 Run #3 — attached, to beyond the ceiling (`attached330`, 330 s, a second witness every 15 s)
PENDING.

### 2.4 Redeploying a function hides its earlier log lines [O]
The window 18:20Z to 18:40Z held 76 lines (run #1 and its pings) when read before the probe was redeployed; the same window read after it was `[]`. The reader serves the latest deployment. `invokeJanusStage` was redeployed 2026-11-27 02:45:51Z, after both Cogito claims, which is why its logs for those calls are gone. Rule that follows: read a function's logs for a failed call before redeploying that function.

### 2.5 Cost [O]
Integration credits used: 1,709.43 (start of the previous turn), 1,712.07 (start of this turn), 1,712.47 (after run #2 with its pings and two rejected raw requests); run #3: PENDING. Function time is not a visible line item; a few hundred seconds of function time cost fractions of a credit. Message credits 53.84 of 500, unchanged by the probes.

### 2.6 Removal
PENDING (the function, the test amendment and its marked comments are removed together; the final source is kept in section 8 so the probe can be recreated in one write).

## 3. Platform facts gathered at no cost
- [O] `agent-profile`: runtime "current", automation pipeline "workflows"; entitlements backend_functions, workflows, actors all true. Plan Pro.
- [O] Workflows on this app: none (platform list `[]`). Workflow runs: none (`[]`). No prior proof exists to reuse.
- [D] Workflow activities: invoke_backend_function, calculate_field, compute_seconds_until, send_email. No model-call activity. Strictly sequential, no parallel. Waits are durable. A run lives at most 90 days. A step always calls the function's latest saved version (no publish needed). Whether a `then` may point back to an earlier task is not documented.
- [D] Cost: about 1 integration credit per 10 steps plus the called function's credits; a run is cancelled if credits run out. Run history 3 months. Management API (personal or workspace token): list and get runs with their step log, cancel (`cancelling`), run now with replay of a prior run's trigger payload, analyze a failed run, versions. No app-side SDK for workflow runs is documented. Retry behavior on failure is not specified.
- [D] Branches: workflows are shared with main and cannot be created or edited on a branch.
- [D] SDK Gateway types: video is the only asynchronous surface (`POST /videos` returns a job to poll).
- [O] Gateway `GET /models` with the signed-in token: 200, 12 chat models. GET on `/responses`, `/chat/completions`, `/batches`, `/files`, `/models/{id}`: 404 "App not found"; a GET 404 on `/chat/completions` (a route that exists for POST) shows that this is the router's generic answer. POST with an empty body (no prompt, so no inference possible): PENDING.
- [D] In-app agents: model selectable per agent (Claude models included); effort, per-turn limit and disconnect behavior undocumented. [I] The documented surface cannot meet the model-evidence invariants.
- [D] Actors (Durable Objects): a room hibernates after about 10 s of quiet even with clients connected, and is evicted after 1 to 2 minutes idle with `hibernate: false`; the actor's service-role client lists entities, functions and integrations, not the Gateway; "not for async flows"; a new actor cannot connect on a branch. [I] An actor could only be another durable caller of functions, which a Workflow already is. Not a long-call host. Untested.
- [H] Corpus on Sonnet 5, effort high: 19,106 / 22,044 / 23,072 tokens in 234.6 / 263.1 / 281.7 s (about 82 tokens/s), 80 credits per call (Opus 5.5: 160). The three calls ended inside the documented limit. A Cogito call never completed and never produced evidence: whether it exceeds 300 s is unmeasured.

## 4. Interrupted Cogito (directive section IX)
Records (read-only): runs `6b08e39e…` and `6b08ec20…`: attempts `6b08e589…` (claimed 02:06:03Z) and `6b08ed25…` (claimed 02:38:30Z) are `claimed`, `in_flight`, with no transport, no model call, no response. Run `6b08eb20…`: its Corpus attempt `6b08eb40…` holds a recorded success (22,044 tokens, 263.1 s, 37,689 characters, finish `stop`) that no session settled; "Check recorded outcome" settles it without a call. Nothing was mutated.

| condition | what the evidence allows |
|---|---|
| browser or caller connection lost | [O] a cancelled request stops the function and leaves no record; [O] the function cannot be told. Leaves exactly the record seen. Not excluded for either attempt. For `6b08e39e…` the page was asleep during the previous call (answer recorded 02:03:24Z, settled by the page 02:05:58Z). |
| backend termination at the 5-minute limit | [D] documented; [H] longest completed call 281.7 s. Consistent with both attempts. Not observed on these requests: their status lines are gone (section 2.4). |
| AI Gateway interruption | [U] a Gateway limit near 300 s would leave the same record; every completed call is under 282 s. Only a call that outlives 300 s on a path without a function can tell. |
| provider failure | [I] would normally have been recorded as a failed outcome by the function unless the function was already gone. Not supported. |
| context or output capacity | [I] a capacity refusal returns at once and is recorded; the output cap ends with finish `length`, also recorded. Neither fits "nothing recorded". |
| response-persistence failure | [U] leaves the same record; the function's error lines would say, and they are gone (section 2.4). Unlikely: three 38 to 44 thousand character Corpus records wrote fine. |

Conclusion [I]: both Cogito attempts are explained by caller-connection loss or by the 5-minute end; the records cannot choose, and neither can be excluded. Native Workflow telemetry would separate them (no browser to lose; a platform-authored step result for the function call, kept 3 months and independent of redeploys) [I; Probe B verifies]. A cheaper partial fix on the present path: record what the caller observed (status, error text, time since send, visibility and wake-lock state) as telemetry on the attempt, never as settlement.

## 5. Adjudication
The substrate has independent limits, and a Workflow moves only one of them:
- (a) the caller's connection: a cancelled request stops the function [O]; any server-side caller removes this wall;
- (b) the request ceiling, 5 minutes [D]; a Workflow step is a function call [D], so it does not move;
- (c) the post-response window, 30 s [O]; it closes the cheapest way to detach a call from its request;
- (d) the Gateway's own request limit: unknown [U]; only a paid call on a path without a function can measure it.

1. **Suitable under Pro?** Yes as the orchestrator: entitled [O], about 1 credit per 10 steps against 80 to 160 credits per model call [D, H]. No as a way to lift the call ceiling.
2. **Can assume:** execution that does not depend on any device; sequencing and branching of stage calls from the canonical engine's "next operation" (conditional on loops or event chaining, Probe B); durable waits; run history with step log, cancellation and credit metering; a platform-authored end for every function call it makes.
3. **Cannot, or unproven:** calls over 300 s; exactly-once attempt ownership (stays in the RunAttempt claim and slot, which also makes any platform retry harmless); semantic completion, qualification and release; dependency-aware reruns; Janus's persisted cancel (a platform cancel stops the run, not an in-flight call); app-side access to run state (management API only; the UI keeps reading Janus records); retry policy (undocumented, so Janus's bounded policy stays authoritative); event-driven waits (timed waits only); loops (unverified).
4. **Better interruption evidence and recovery?** Yes, materially: it removes the caller from the path and keeps a record that function logs do not (section 2.4).
5. **Pathway for the Master Vision benchmark?** For stages under 300 s, yes. For a stage over 300 s, no server mechanism measured so far works (limit documented, post-response window 30 s, agents and actors unsuitable as documented). Whether any stage exceeds 300 s is unmeasured: three Corpus calls of the same model and effort took 235 to 282 s.
6. **Browser-to-Gateway branch:** contingent, not the next tranche. It becomes necessary only if a measured stage exceeds 300 s on the server path, and it is then the only candidate; it is redundant if every stage fits. It also stays attached to a device, so it needs the wake lock and the keep-in-front notice. Keep the two schema fields; build no more until the evidence asks.
7. **Retain / reuse / simplify:** retain the canonical engine, durable records, claim and slot, the evidence rule, recovery, qualification. Reuse `page_observation` for caller observation on the server path. Simplify only after verified equivalence: the browser adapter's drive loop becomes a dispatcher; the keep-in-front need disappears for calls that leave the browser.
8. **Evidence still needed:** Probe B on main (a sequence beyond 300 s; the platform's end-of-step evidence and what the run keeps after it; whether a back-edge is accepted and runs; native retry; credits per step); whether any real stage call exceeds 300 s (one approved run with caller observation); only if one does: the Gateway's own limit on a non-function path.
9. **Next tranche:** (i) caller observation on the existing server path, (ii) a screen wake lock with a keep-in-front notice while a call is in flight, (iii) one DIMA-approved Full L3 benchmark run that measures Cogito with evidence. In parallel on main: Probe B, to choose the Phase 11 orchestrator. If Cogito ends at or after 300 s with a caller-observed failure, the page path resumes; if it completes, the run continues through Animus, Actus and the Blueprint pipeline with Workflows as the Phase 11 target.

## 6. Probe B package for a main-branch session
Isolation: one admin-only function and one one-time scheduled workflow on main (live at once; the workflow archives itself after it fires). No model call, no record, no secret, no recurring trigger. Expected cost: about 9 workflow steps (under 1 credit) plus the function's fractions of a credit; measure with the workspace credit figure before and after. The inherited server-tree guard in `protocolRegistry.test.js` also exists on main: apply the same marked temporary amendment for `janusProbeStep` and remove it with the function.

`base44/functions/janusProbeStep/entry.ts`
```ts
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Probe B step (diagnostic, 2026-11-27). Holds for hold_seconds with a log line every 5 s. No model, no records.
export default async function(req) {
  const t0 = Date.now();
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const label = String(body.label || 'step').slice(0, 40);
    const hold = Math.min(Math.max(Number(body.hold_seconds) || 1, 1), 600);
    const line = (event, extra = {}) => console.log(JSON.stringify({ probe: 'workflow_step', label, event, elapsed_ms: Date.now() - t0, at: new Date().toISOString(), ...extra }));
    line('start', { hold });
    while (Date.now() - t0 < hold * 1000) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      line('heartbeat');
    }
    line('end');
    return Response.json({ ok: true, label, held_ms: Date.now() - t0 });
  } catch (error) {
    console.error('[janusProbeStep] failed', error?.stack || error);
    return Response.json({ error: 'Probe failed' }, { status: 500 });
  }
}
```

`base44/workflows/Janus Diagnostic Probe B.jsonc` (set `one_time_date` to the UTC instant 4 minutes after the file is saved; if the save rejects the loop, remove `loop_start` to `loop_check`, point `step_b` at `step_over`, and report the rejection text)
```jsonc
{
  "name": "Janus Diagnostic Probe B",
  "description": "One-time transport probe: two steps under the 5-minute function limit whose total exceeds it, a bounded loop, then one deliberately over-limit step. No model call, no records.",
  "trigger": { "config": { "trigger_type": "scheduled", "schedule_mode": "one_time", "one_time_date": "<UTC instant 4 minutes ahead>" } },
  "definition": {
    "document": { "dsl": "1.0.0", "name": "janus_diagnostic_probe_b", "version": "1.0", "namespace": "base44" },
    "do": [
      { "step_a": { "call": "invoke_backend_function", "with": { "function_name": "janusProbeStep", "args": { "label": "A", "hold_seconds": 200 } }, "then": "step_b", "x-base44": { "title": "Step A, 200 s" } } },
      { "step_b": { "call": "invoke_backend_function", "with": { "function_name": "janusProbeStep", "args": { "label": "B", "hold_seconds": 200 } }, "then": "loop_start", "x-base44": { "title": "Step B, 200 s (total over 300 s)" } } },
      { "loop_start": { "call": "calculate_field", "with": { "field": "n", "value": 0 }, "then": "loop_body", "x-base44": { "title": "Counter = 0" } } },
      { "loop_body": { "call": "invoke_backend_function", "with": { "function_name": "janusProbeStep", "args": { "label": "L${ .n }", "hold_seconds": 5 } }, "then": "loop_bump", "x-base44": { "title": "Loop body, 5 s" } } },
      { "loop_bump": { "call": "calculate_field", "with": { "field": "n", "value": "${ .n + 1 }" }, "then": "loop_check", "x-base44": { "title": "Counter + 1" } } },
      { "loop_check": { "switch": [
        { "when": "${ .n < 3 }", "then": "loop_body", "x-base44": { "title": "Fewer than 3 passes" } },
        { "when": "${ true }", "then": "step_over" }
      ] } },
      { "step_over": { "call": "invoke_backend_function", "with": { "function_name": "janusProbeStep", "args": { "label": "OVER", "hold_seconds": 330 } }, "then": "end", "x-base44": { "title": "Step over the limit, 330 s" } } }
    ]
  }
}
```
Read back from this branch afterwards (read-only): workflow list and runs, the run with its step log, the function's logs (no `branch_id`, it lives on main), the credit figure. Questions it answers: does the run outlive 300 s with no client; what does the platform record when `OVER` is ended; do A, B and the loop outputs survive that; is the failure readable through the API; was `OVER` retried; was a back-edge accepted and did it run 3 times. Afterwards: delete the function and the guard amendment, confirm no active workflow remains.

## 7. Reserved for DIMA
1. Start a main-branch session to create Probe B from section 6 (workflows cannot be created from a branch). It is the only way to measure the step-level evidence the decision needs.
2. Approve the next tranche in section 5.9, then one paid Full L3 benchmark run.
3. An Actor probe is not recommended now (section 3); say if you want it (it also needs main).
4. Unchanged and untouched: the unresolved-call rule and the earlier decision D1 (operator close of a call that can never be recorded).

## 8. Probe A source (for a rerun; the function is removed)
PENDING (written at removal).
