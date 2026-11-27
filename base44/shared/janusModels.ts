// The models Janus may request, as the server enforces them. This list is the same as MODELS in
// src/lib/janus/protocolRegistry.js (the server cannot import browser code; a test keeps the two identical).
// The function takes a stage revision's model from the revision record and accepts it only if it is here.
export const AUTHORIZED_MODELS = ['claude_opus_5_5', 'claude-sonnet-5', 'claude_opus_4_8', 'gpt_6_2_astra', 'gemini_3_8_flash'];
// Never requested, whatever a record says.
export const PROHIBITED_MODEL_PREFIXES = ['gemini_3_1'];
// Highest effort the Gateway accepted in the recorded probes; "max" was rejected.
export const REASONING_EFFORTS = ['high', 'medium', 'low'];

export const isAuthorizedModel = (id) => typeof id === 'string' && AUTHORIZED_MODELS.includes(id)
  && !PROHIBITED_MODEL_PREFIXES.some((p) => id.startsWith(p));