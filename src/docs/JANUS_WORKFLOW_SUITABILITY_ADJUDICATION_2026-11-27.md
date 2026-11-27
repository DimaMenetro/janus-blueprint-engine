# Janus — workflow suitability and execution substrate adjudication (2026-11-27)

Janus-Kytheion for DIMA. Branch `janus-pipeline-expansion`. Directive: `JANUS_OPERATOR_DIRECTIVE_2026-11-27_WORKFLOW_SUITABILITY.md` (verbatim; it overturns, for now, the evaluation's "Workflows are not a path" call).
Records that live on main (this branch was cut before they were written; read them with `git show origin/main:src/docs/<file>`): `JANUS_EXECUTION_SUBSTRATE_EVALUATION_2026-11-27.md`, `JANUS_KYTHEION_SME_STATE.md` section 11, `JANUS_CONTINUITY_STATE.md` section "EXECUTION SUBSTRATE".

Evidence classes: **[O]** observed this session · **[D]** documented · **[H]** historical record · **[I]** inference · **[U]** unresolved.

## 1. Status (live)
- Nothing paid ran. No Run, RunStage or RunAttempt was written (record writes are refused on a branch); the three benchmark runs were read, the 69 historical runs were not touched.
- Probe A run #1: done, §2. Run #2 (a client abort that is certain, with a second witness; post-response work under `waitUntil`): see §2.4.
- Probe B (Workflow): cannot run from a branch (workflows cannot be created here and are shared with main). Package for a main-branch session: §6.
- The page-path branch work (`JANUS_PAGE_CALL_PATH_BRANCH_2026-11-27.md`) is paused. Built so far: only the two optional RunAttempt fields (`call_path`, `page_observation`). No runner, UI or wake-lock code exists.

## 2. Probe A — one backend request (function `probeExecutionBudget`, this branch only)
Isolation, checked before the first call: admin-only; no model call; no entity record read or written (only `auth.me()`); no secret; no schedule or trigger; every observation is a log line, and the platform adds its own status line per request. It is not called by the app.

### 2.1 Run #1 (2026-11-27 18:27:38Z to 18:31:00Z) [O]
| arm | caller | max | what the log shows |
|---|---|---|---|
| ping | test tool, and the sandbox SDK | - | both reach the branch deployment, 200 |
| `attached` | test tool, waits for the answer | 420 s | start 18:27:54.708Z; 37 heartbeats (5 s); last heartbeat at 185.069 s (18:30:59.708Z); the platform's own line `POST → no response (canceled)` has the same timestamp; nothing after; no `client_disconnected` line |
| `detached` | sandbox SDK, exec tool limit 20 s | 150 s | start 18:27:55.440Z; 30 heartbeats; `survived` and `POST → 200` at 150.061 s; `client_disconnected_ms` null |

### 2.2 What it shows
- [O] A request that its caller cancelled ended with the platform status "no response (canceled)", and the function's log stopped at that instant. The function ran 185 s, far under 300 s.
- [I] The cancel was the previous turn ending (DIMA's connection dropped and the open tool call went with it). The log shows when, not why.
- [O] The function's `req.signal` abort listener wrote nothing. A function cannot rely on being told its caller left.
- [O] The sandbox arm's own 20 s limit left no cancel on the platform: it ran 150 s and ended 200. That arm says nothing about disconnection.
- [O] No request reached 300 s, so the documented ceiling was neither observed nor contradicted.

### 2.3 What it does not show
- [U] Whether the isolate kept running after the cancel with its log context closed, or was stopped. Run #2's second witness (a separate request every N seconds) separates the two.
- [U] How a request ends at 300 s (status, body). Probe B (a workflow step over the ceiling) measures it on the server side without any client.

### 2.4 Run #2 — see the end of this section when written
PENDING.

## 3. Platform facts gathered at no cost
- [O] `agent-profile`: runtime "current", automation pipeline "workflows"; entitlements backend_functions, workflows, actors all true. Plan Pro.
- [O] Workflows on this app: none (platform list `[]`). Workflow runs: none (`[]`). No prior proof exists to reuse.
- [D] Workflow activities: invoke_backend_function, calculate_field, compute_seconds_until, send_email. No model-call activity. Strictly sequential, no parallel. Waits are durable. A run lives at most 90 days. A step always calls the function's latest saved version (no publish needed). Cases and waits need explicit `then`; whether a `then` may point back to an earlier task is not documented.
- [D] Cost: about 1 integration credit per 10 steps plus the called function's credits; a run is cancelled if credits run out. Run history 3 months. Management API (needs a personal or workspace token): list and get runs with their step log, cancel (`cancelling`), run now (with replay of a prior run's trigger payload), analyze a failed run, versions. No app-side SDK for workflow runs is documented. Retry behavior on failure is not specified.
- [D] Branches: workflows are shared with main and cannot be created or edited on a branch.
- [D] SDK Gateway types: video is the only asynchronous surface (`POST /videos` returns a job to poll). Nothing documented for background chat inference.
- [O] Gateway `GET /models` with the signed-in token: 200, 12 chat models. GET on `/responses`, `/chat/completions`, `/batches`, `/files`, `/models/{id}`: 404 "App not found". A GET 404 on `/chat/completions` (a route that exists for POST) shows that this is the router's generic answer, so it does not prove a background route is absent. [U] A POST with an invalid model id would test route existence without inference; not done.
- [D] `waitUntil()` keeps a function alive after its response until the promise settles. The docs give no separate limit and do not say it lifts the 5-minute maximum. [U] Run #2.
- [D] In-app agents: the model is selectable per agent (Claude models included). Reasoning effort, per-turn limit and behavior on disconnect are undocumented. [I] The documented surface cannot meet the model-evidence invariants (effective model, finish reason, usage, output limit).
- [O] Function-log reader (`functions-mgmt/{name}/logs`; `branch_id` for a branch-deployed function): works for the probe. For `invokeJanusStage` it returns `[]` for both Cogito windows and for everything since 2026-11-20. That function was redeployed 2026-11-27 02:45:51Z, after both Cogito claims. [I] Logs belong to the latest deployment; run #2 redeploys the probe and rereads to test it.
- [O] Integration credits used: 1,709.43 at the start of the previous turn, 1,712.07 after it (+2.64 for everything that turn did, probes included). Message credits 53.84 of 500, reset 2026-11-30.

## 4. Interrupted Cogito (directive section IX) — PENDING (written after run #2)
## 5. Adjudication — PENDING
## 6. Probe B package for a main-branch session — PENDING
## 7. Reserved for DIMA — PENDING
