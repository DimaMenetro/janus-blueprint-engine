/**
 * JANUS STAGE RUNNER — one durable LLM stage: begin → invoke → parse → validate → settle.
 * The only place Janus invokes a model. Completion-oriented: it waits for the call to settle, however long
 * that takes. Elapsed time is telemetry and is never turned into a failure.
 * Model policy: no per-call override — every call inherits the operator's Claude Opus setting.
 */
import { base44 } from "@/api/base44Client";
import { validateJanusOutput } from "@/components/janus/janusSchema";
import { beginStage, settleStage } from "@/lib/janus/stageStore";
import { classifyFailure, classifyParseError } from "@/lib/janus/stageModel";

export async function callLLM(prompt) {
  return await base44.integrations.Core.InvokeLLM({ prompt });
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
    const fail = async (evidence, detail) => {
      const message = `${stage.stageKey}: ${detail}`;
      await settleStage(handle, { evidence, message });
      return { failure: { evidence, message } };
    };
    let result, parsed;
    try { result = await callLLM(prompt); } catch (err) { return await fail(classifyFailure(err), `LLM call failed — ${err.message || err}`); }
    try { parsed = parseLLMResponse(result, parseKey); } catch (e) { return await fail("parse_failure", `Parse error — ${e.message}`); }
    if (parsed.error) return await fail(classifyParseError(parsed.error), parsed.error.replace(`${parseKey}: `, ""));
    const validation = validateStageOutput(stage.stageKey, parsed.data);
    return { record: await settleStage(handle, { output: parsed.data, validation }) };
  } finally {
    unresolved.delete(slot);
  }
}