# §1B — External Current-Practice Benchmark (Durable Multi-Stage LLM/Task Pipelines)

* **Document Type:** External Benchmark / Evidence Matrix
* **Document ID:** BMK-JBE-001
* **Rev:** 1.0 (first delivery — partial by design, see Coverage)
* **Date:** 2026-08-03
* **Author:** Kytheion (Scribe-Particle-4)
* **Parent:** `WHOLE_APP_ASSESSMENT.md` (ASM-JBE-001) §1B
* **Companion:** `JANUS_ENGINE_CONTINUITY.md` (CR-JBE-001)
* **Purpose:** Replace ASM §1A's unsourced internal opinion with named, cited,
  evidence-backed comparison across 13 required dimensions.

---

## 0. Method and evidence discipline

**Layer separation is mandatory and is enforced in this document.**

| Layer | Definition | Where it may appear |
|---|---|---|
| **Layer 1** | Official primary documentation and source repositories | §2 matrix, §3 findings |
| **Layer 2** | Vendor issue trackers, GitHub discussions, changelogs | §4 only, labelled |
| **Layer 3** | Practitioner writing, blogs, Reddit, conference talks | §5 only, clearly quarantined |

**Cell rules.**
- Every populated cell carries a **Layer-1 citation**. Cells that could not be
  sourced in this pass are left **empty** — never inferred, never filled from
  reputation or from what a system "obviously" must do.
- An empty cell means *"not yet sourced"*, **not** *"absent from the product"*.
  Do not read absence of evidence as evidence of absence.
- Janus's own column is **[CODE]** — read from this repository, not aspirational.

**Comparator selection rationale.** Janus is a *deterministic multi-stage LLM
pipeline with typed intermediate artifacts* (ASM §1.1). The comparator set is drawn
from the two families that actually solve this problem in production:
**general durable-execution engines** (Temporal, AWS Step Functions, Inngest,
Prefect) and **LLM-native graph orchestration** (LangGraph). Base44 Workflows is
included because it is the incumbent platform option.

### Coverage of this revision — honest statement

| Comparator | Layer-1 source consulted | Depth |
|---|---|---|
| **Temporal** | `docs.temporal.io/workflows` | Core execution model, replay, event history |
| **LangGraph** | `docs.langchain.com/oss/python/langgraph/persistence` | Persistence, checkpointers, stores |
| **AWS Step Functions** | `docs.aws.amazon.com/step-functions/latest/dg/welcome.html` | Workflow types, guarantees, limits, observability |
| **Inngest** | `inngest.com/docs/learn/inngest-functions` | Steps, retries, checkpointing model |
| **Prefect** | `docs.prefect.io/v3/concepts/caching` | Caching, idempotency, result persistence |
| **Base44 Workflows** | Platform authoring guide + our own probe | Partial — **H-1 unresolved** |
| **Janus** | This repository | Full |

**Not yet covered (named, so the gap is explicit):** Dagster, Apache Airflow,
Restate, Trigger.dev, Cloudflare Workflows, Azure Durable Functions, Celery.
Adding them is Rev 2 work. Dimensions **versioning**, **cost telemetry**, and
**long-running AI-task UX** are the thinnest in this revision — several cells are
deliberately empty.

---

## 1. The 13 dimensions

1. **Checkpoint persistence** — is intermediate state durably written?
2. **Resumability** — can a failed run continue from the last good point?
3. **Step-level retries** — retry granularity at the step, not the run.
4. **Idempotency** — are re-executed steps prevented from duplicating effects?
5. **Terminal-state enforcement** — can a run be marked successful while incomplete?
6. **Schema validation** — typed/validated inter-stage artifacts.
7. **Partial-result handling** — what happens to work completed before a failure.
8. **Observability** — per-step visibility into what ran and what failed.
9. **Human intervention** — pause/approve/edit mid-run.
10. **Branching / DAG execution** — can non-linear dependency graphs be expressed?
11. **Versioning** — behaviour of in-flight runs when the definition changes.
12. **Cost telemetry** — per-run/per-step cost visibility.
13. **Long-running AI-task UX** — surfacing multi-minute AI work to a user.

---

## 2. Matrix — Layer 1 only

### 2.1 Dimensions 1–5 (durability core)

| Dim | Temporal | LangGraph | AWS Step Functions | Inngest | Prefect | Base44 Workflows | **Janus (today)** |
|---|---|---|---|---|---|---|---|
| **1. Checkpoint persistence** | **Yes — Event History.** "a complete, ordered log of everything that has already happened"; it is "the source of truth" | **Yes — checkpointers** persist "a thread's graph state as checkpoints"; `PostgresSaver`/`SqliteSaver` for production (`MemorySaver` is RAM-only and lost on restart) | **Yes** — Standard workflows "show execution history"; execution history retained in Step Functions | **Yes** — "records each step" | **Yes, but OFF BY DEFAULT** — "Caching requires result persistence, which is off by default" | Per-step run log [DOCUMENTED] | **Yes** — every domain + intersection written to the Run on completion [CODE] |
| **2. Resumability** | **Yes — replay.** Recreates "pre-failure state so it can continue right where it left off"; Activity results "reused, not recomputed" | **Yes** — persistence exists to "resume after an interruption, recover from a failure"; includes time travel | **Yes** — Standard runs up to **one year**; Express up to **five minutes** | **Yes** — "retry from the last successful checkpoint instead of restarting from scratch" | **Yes via cache** — cached task "enters a `Completed` state… without actually running the code" | Durable `wait` survives restarts [DOCUMENTED] | **NO.** Data to resume exists; resume logic absent (RISK-2/CONSTRAINT-1) [CODE] |
| **3. Step-level retries** | Activities are the retry unit; results recorded once | | | **Yes** — "step is retried if it throws an error" | Task-level retry + cache | Per-step [DOCUMENTED] | **Yes — and notably strong.** Per-label `TIMEOUT_MATRIX` (90–240 s), 3 attempts, 3 s/9 s backoff, persisted `retry_log` [CODE] |
| **4. Idempotency** | **Enforced by determinism.** Workflow "has to make the same decisions given the same history"; non-deterministic calls (`Date.now()`, RNG, un-wrapped network I/O) are unsafe and have replay-safe substitutes | | **Standard = exactly-once** ("each step… will execute exactly once"); **Express = at-least-once** ("one or more steps… can potentially run more than once") | Step checkpointing prevents re-running completed steps | **Explicit first-class feature** — caching "ensure[s] your pipelines are idempotent when retrying them"; cache key = inputs + code definition + run ID; `SERIALIZABLE` isolation with lock managers | | **Partial.** Server lane has an idempotent *claim* (queued→running) [CODE]; **no step-level idempotency** — a re-run recomputes completed domains |
| **5. Terminal-state enforcement** | | | Standard's exactly-once semantics + execution history | | Explicit task states (`Completed`, `Cached`) | | **NO — DEFECT-1.** Finalization returns `completed` unless **zero** domains exist; both ternary arms return the same string. 10 of 34 completed runs violate the invariant [CODE + MEASURED] |

### 2.2 Dimensions 6–10 (correctness, visibility, structure)

| Dim | Temporal | LangGraph | AWS Step Functions | Inngest | Prefect | Base44 Workflows | **Janus (today)** |
|---|---|---|---|---|---|---|---|
| **6. Schema validation** | | | JSONata data transformation; variables for passing data between states | | | jq conditions on step output [DOCUMENTED] | **Yes — a genuine strength.** `janusSchema.jsx` types all 7 domains; normalize + validate with enum/type/structural checks [CODE] |
| **7. Partial-result handling** | Completed Activity results survive in history and are reused | Checkpoints survive the interruption | | Completed steps survive; only the failing step retries | Cached results survive across runs sharing storage | | **Persisted but unusable.** Domains survive the crash, then **no path consumes them** — every restart re-pays every LLM call [CODE] |
| **8. Observability** | Event History as ordered log of Commands/Events | | **Yes — strong.** "visualize, edit, and debug your application's workflow"; "examine the state of each step"; Express sends history to CloudWatch by log level | "observability without adding a queue or workflow engine" | | **Per-step run log** — which step succeeded/failed [DOCUMENTED] | **Mixed.** Rich forensics *inside* a run (heartbeat, `current_step`, `retry_log`); **death is silent** — the sole external symptom is a `last_heartbeat` that stops advancing [MEASURED] |
| **9. Human intervention** | Signals (Received Signal is a first-class history event) | **Yes — explicit.** Checkpointers listed for "human-in-the-loop workflows" and time travel | **Yes** — "long-running, automated workflows for applications that require human interaction"; Wait-for-Callback pattern | | | | **None.** No pause, approve, edit, or mid-run correction [CODE] |
| **10. Branching / DAG** | Arbitrary — workflows are ordinary code (Go/Java/TS/Python) | Graph-native (its central abstraction) | State machine: choice/parallel states | Conditional steps, waits | DAG-native | **Sequential only** + `switch` on jq [DOCUMENTED] | **Janus IS a DAG** — 7 domains + 6 intersections firing in trigger cohorts (cogito→1, animus→2, actus→3). Currently executed by a hand-rolled in-process loop [CODE] |

### 2.3 Dimensions 11–13 (thin in this revision — most cells intentionally empty)

| Dim | Temporal | LangGraph | AWS Step Functions | Inngest | Prefect | Base44 Workflows | **Janus (today)** |
|---|---|---|---|---|---|---|---|
| **11. Versioning** | **Implied-critical by the replay model** — replayed code "could take a different path and fail to match the recorded history". *(Temporal's explicit versioning API not yet sourced — Rev 2)* | | | | Cache key includes **the code definition of the task**, so changing task code invalidates the cache | | **None.** No definition version on a Run; a prompt change silently alters comparability. Partly why V-7 exists [CODE] |
| **12. Cost telemetry** | | | **Pricing model is the telemetry unit** — Standard "priced by state transition"; Express "priced by number and duration of executions" | | | Per-step = fraction of an integration credit, accumulating; **exact fraction unpublished**; **run cancelled if credits exhausted mid-run** [DOCUMENTED] | **None.** Zero per-run cost visibility despite 7–13 LLM calls/run [CODE] |
| **13. Long-running AI-task UX** | | Agent Server handles persistence for agent apps | | Designed for "background jobs… out of the critical path of a request" | | | **Weak.** `/NewQuery` awaits `executeJanus` **in the browser tab**; no warning before starting a multi-minute run; two unexplained lanes (D-UI-5, D-UI-6) [CODE] |

---

## 3. Findings — what the evidence actually supports

**B-1 — Janus's per-stage artifact typing is genuinely strong, and this is now
evidence-backed rather than asserted.** Across the five comparators, typed,
validated *inter-stage domain artifacts* were not found as a first-class feature;
Step Functions offers data transformation (JSONata) and Base44 offers jq
conditions, which are transformation and predicate tools, not artifact schemas.
`janusSchema.jsx` normalizing and validating seven typed domains is a real
differentiator. **Protect it in any refactor.**

**B-2 — Janus's retry sophistication exceeds the default posture of several
comparators.** A per-call-type timeout matrix (90–240 s, tuned per label) with
bounded backoff and a *persisted* retry log is more granular than a single global
timeout. Also protect this.

**B-3 — The resumability gap is the sharpest, most universal deficit.** Every one
of the five comparators treats resume-from-checkpoint as *the* core value
proposition, in near-identical language: Temporal "continue right where it left
off"; Inngest "retry from the last successful checkpoint instead of restarting from
scratch"; LangGraph "resume after an interruption"; Prefect skips completed work
via cache. **Janus persists everything needed to resume and then discards it.**
This is the one dimension where Janus is behind *the entire sampled field*, and
ASM §1.3's ranking of it as the defining gap is now sourced.

**B-4 — Terminal-state enforcement is where Janus is most anomalous.**
Step Functions defines *exactly-once* as a contractual guarantee; Prefect models
explicit task states. Janus stamps `completed` whenever any domain exists. Note
the asymmetry: the comparators enforce correct *step* semantics, but **none of the
Layer-1 sources surveyed defines an application-level artifact-completeness
invariant either.** So DEFECT-1's remedy is not something Janus can adopt
off-the-shelf from any of them — it is genuinely Janus-specific work, which
*raises* rather than lowers its priority. This directly supports the corrected ASM
§1.4 position that a completion invariant is required under all three candidate
architectures.

**B-5 — Idempotency is a first-class named concern everywhere, and absent in Janus
at step level.** Prefect makes it the explicit purpose of caching; Temporal
enforces it through determinism constraints; Step Functions sells it as a
guarantee tier. Janus has only a claim-level lock. **Any resume design must decide
its idempotency model up front** — retrofitting it is the expensive path, as
Temporal's determinism constraints illustrate.

**B-6 — Temporal's determinism constraint is directly transferable to CP-002
fidelity.** Temporal forbids `Date.now()`, RNG, and un-wrapped network calls inside
workflow code because replay must reproduce identical decisions. This is
*structurally the same requirement* as CP-002 prompt-byte fidelity: identical
inputs must produce identical prompt construction. **This is the strongest
argument yet for V-7 closure path 2** (deterministic offline prompt-construction
test against fixtures) — the industry treats deterministic replay as testable
infrastructure, not as an argument from construction.

**B-7 — Human intervention is standard and entirely absent in Janus.** LangGraph
and Step Functions both name it explicitly. For a system whose output is a
*reviewable architectural blueprint*, mid-run approval is a plausible product
feature, not merely an engineering nicety. **Recorded as an observation, not a
recommendation** — no scope is proposed here.

**B-8 — The DAG correction is vindicated by comparison.** Four of five comparators
express non-linear graphs natively. Base44 Workflows is sequential-only. Since
Janus is genuinely a DAG (6 intersections in trigger cohorts), candidate (A)
requires **flattening a graph into a topological order** — a real design cost that
the withdrawn "matches exactly" claim concealed. This does not eliminate (A); it
prices it.

**B-9 — Cost telemetry is the field's weak spot too, and Base44's is unusually
risky.** Step Functions exposes cost through its pricing unit. Base44's per-step
credit fraction is **unpublished**, and **credit exhaustion cancels a run mid-flight**
— a failure mode not observed in the other Layer-1 sources surveyed. Combined with
Janus's retry amplification (up to 3 attempts × 13 calls), this is a genuine and
currently unmonitored exposure.

**B-10 — Nothing in this benchmark selects an architecture.** The evidence prices
the options; it does not choose. H-1 remains unmeasured and is unaffected by
anything here.

---

## 4. Layer 2 — vendor trackers and changelogs

**Not gathered in Rev 1.** Recorded as an open sub-task so its absence is explicit
rather than silent. Highest-value Layer-2 targets: LangGraph checkpointer
scaling issues at high checkpoint volume; Inngest step-size/payload limits;
Base44 Workflows changelog for per-step budget statements bearing on **H-1**.

## 5. Layer 3 — practitioner evidence

**Not gathered in Rev 1.** Quarantined by design. When gathered it will live only
in this section and may not be promoted into §2 or §3.

---

## 6. What this changes in the parent documents

- **ASM §1A is now superseded as an evidentiary basis** and remains only as the
  hypothesis set this benchmark tested. Of its claims: "typed schema per stage is
  above the norm" is **supported** (B-1); "checkpoint-resume is standard practice"
  is **supported and strengthened** (B-3); "cross-domain intersection synthesis is
  essentially unique" remains **unsourced** — no comparator was examined for
  comparable semantic-synthesis features, so it stays an internal opinion.
- **ASM may still not be called a completed whole-product assessment**: the
  rendered viewport audit is partial, and this benchmark is Rev 1 with named gaps.
- **No roadmap item is promoted or authorized by this document.**

## 7. Rev 2 scope (not started)

1. Add Dagster, Airflow, Restate, Trigger.dev, Cloudflare Workflows, Azure Durable
   Functions.
2. Fill dimensions 11–13, which are the thinnest here.
3. Source Temporal's explicit versioning API and LangGraph's durability modes.
4. Gather Layer 2, then Layer 3, in that order, keeping them separated.
5. Re-test the "intersection synthesis is unique" claim against comparators, or
   formally withdraw it.