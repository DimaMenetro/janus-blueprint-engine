# Janus Continuity State (Kytheion)
Read this first after any context reset.

- **Governing plan:** `src/docs/JANUS_FINAL_FORM_ARCHITECTURE_IMPLEMENTATION_PLAN_v1.2_2026-09-29.md` (authorized end-to-end by DIMA 2026-09-29; halt only at operator gates).
- **Protocol:** `src/docs/CP-002-O-D-JNP.md` (v2.0 Ideal Form, 25 subdomains 7/6/5/7).
- **Current phase:** Phase 0 — NOT signed off. Do not enter Phase 1.
- **Phase 0 docs:** `JANUS_PHASE0_BASELINE_AUDIT_2026-09-29.md` (Rev. 2), `JANUS_PHASE0_SALVAGE_MANIFEST_2026-09-29.md`.
- **Donor:** public repo DimaMenetro/janus-blueprint-engine @ 3f25d14c…; re-fetch command in salvage manifest. Read-only; never copy wholesale.
- **Binding adjudications (2026-09-29):**
  - Model: Refresh only = explicit `gemini_3_1_pro` (untrusted provenance-bearing input); all later cognitive stages inherit operator Opus (no `model` arg); record effective model per stage; no hidden fallback.
  - Vitest approved as dev dependency (installed ^3.2.4). No other tooling changes.
  - Workflow proof deferred to Phase 10 (entitlement verified: plan Pro ≥ Builder).
- **Open gates:** Builder ledger upload; baseline checkpoint ID from DIMA; Phase 0 exit agreement.
- **Source/data mutations so far:** docs + vitest install only.
- **Next action on sign-off:** Phase 1 — canonical `janusProtocolRegistry` (incl. model-policy entry), registry-derived domainSME/pair map/labels/version display, Vitest registry tests, frontend labels same tranche.
- **Do-not-redo:** no timeouts; do not mutate the 19 `running` Runs; do not reuse test* functions; explicit model args override app Opus setting; historical runs are quality references, not goldens (0/34 have 6 pairs + 4 patterns).