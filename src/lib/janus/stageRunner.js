/**
 * JANUS STAGE RUNNER — one durable LLM stage: begin → invoke → parse → validate → settle.
 * The only place Janus requests a model call. The call itself runs server-side, in the `invokeJanusStage`
 * backend function, which accepts a stage this user owns plus its compiled prompt and forwards the prompt only.
 * Completion-oriented: Janus adds no deadline and waits for the call to settle. Elapsed time is telemetry only.
 * `invokeJanusStage` is an INTERIM secure transport: the platform ends a function request at 5 minutes. A cut
 * the platform actually reports is settled failure evidence, but that ceiling is a known limitation, not a
 * Janus inference deadline — the production orchestration path must carry legitimately longer cognition.
 * Model policy: no per-call override — every call inherits the operator's Claude Opus setting.
 */
import { base44 } from "@/api/base44Client";
import { validateJanusOutput } from "@/components/janus/janusSchema";
import { beginStage, settleStage } from "@/lib/janus/stageStore";
import { classifyFailure, classifyParseError } from "@/lib/janus/stageModel";

const STAGE_FUNCTION = "invokeJanusStage";

export async function callLLM(stageId, prompt) {
  try {
    const { data } = await base44.functions.invoke(STAGE_FUNCTION, { stage_id: stageId, prompt });
    return data.result;
  } catch (err) {
    // Keep the server's failure evidence, not the transport wrapper's generic text.
    const detail = err?.response?.data?.error;
    throw new Error(typeof detail === "string" ? detail : err?.message || String(err));
  }
}

export function parseLLMResponse(result, expectedKey) {
  let data;
  if (typeof result === "string") {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { error: `${expectedKey}: No JSON found in string response` };
    data = JSON.parse(jsonMatch[0]);
  } else {
    data = result;
  }
  if (data && data[expectedKey]) return { data: data[expectedKey] };
  if (data && typeof data === "object" && Object.keys(data).length > 0) return { data };
  return { error: `${expectedKey}: Missing key in response` };
}

export function validateStageOutput(stageKey, output) {
  if (stageKey.startsWith("intersection:")) {
    const errors = ["insight", "tension", "resolution"].filter(f => !output?.[f]).map(f => `${stageKey}.${f}: missing`);
    return { validator: "intersection-fields", valid: errors.length === 0, errors };
  }
  const { errors } = validateJanusOutput({ [stageKey]: output }, [stageKey]);
  return { validator: "janusSchema", valid: errors.length === 0, errors };
}

// Calls this session has started and not yet seen settle. A second attempt for the same stage is refused.
const unresolved = new Set();
export const UNRESOLVED_ATTEMPT = "a previous attempt for this stage has not settled — no overlapping attempt is started";

/**
 * Runs one stage durably. Settles as { record } (success) or { failure: { evidence, message } } (settled
 * failure); a failure never touches other stages. `onBegan` fires once the running revision is persisted.
 */
export async function runStage({ prompt, parseKey, onBegan, ...stage }) {
  const slot = `${stage.runId}|${stage.stageKey}`;
  if (unresolved.has(slot)) throw new Error(`${stage.stageKey}: ${UNRESOLVED_ATTEMPT}`);
  unresolved.add(slot);
  try {
    const handle = await beginStage({ ...stage, prompt });
    if (onBegan) await onBegan(handle.stage);
    const fail = async (evidence, detail, rejected = {}) => {
      const message = `${stage.stageKey}: ${detail}`;
      await settleStage(handle, { evidence, message, ...rejected });
      return { failure: { evidence, message } };
    };
    let result, parsed;
    try { result = await callLLM(handle.stage.id, prompt); } catch (err) { return await fail(classifyFailure(err), `LLM call failed — ${err.message || err}`); }
    try { parsed = parseLLMResponse(result, parseKey); } catch (e) { return await fail("parse_failure", `Parse error — ${e.message}`); }
    if (parsed.error) return await fail(classifyParseError(parsed.error), parsed.error.replace(`${parseKey}: `, ""));
    const validation = validateStageOutput(stage.stageKey, parsed.data);
    // Parsed but invalid is settled failure evidence (plan §12.2), never successful cognition.
    if (!validation.valid) {
      const shown = validation.errors.slice(0, 5).join("; ") + (validation.errors.length > 5 ? ` (+${validation.errors.length - 5} more)` : "");
      return await fail("schema_failure", `Output failed mandatory validation — ${shown}`, { output: parsed.data, validation });
    }
    return { record: await settleStage(handle, { output: parsed.data, validation }) };
  } finally {
    unresolved.delete(slot);
  }
}