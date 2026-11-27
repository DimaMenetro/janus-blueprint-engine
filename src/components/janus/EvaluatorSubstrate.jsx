import { substrateLine, NOT_CONFIRMED } from "@/lib/janus/substrateText";

const line = (t, strong) => ({ margin: "8px 0 0", fontSize: 12, color: strong ? t.text : t.subtitle });

// Who judged: the model the independent evaluation was fixed to and what the provider reported for it. An
// evaluation answered by another model is not accepted, and says so here.
export default function EvaluatorSubstrate({ q, t }) {
  if (!q.evaluator) return null;
  if (q.evaluationRejected) return <p style={line(t, true)}>{q.evaluationRejected}. Nothing is qualified, released or refined on them.</p>;
  const gap = NOT_CONFIRMED.includes(q.evaluator.standing);
  return <p style={line(t, gap)}>{gap ? "Evaluator not confirmed: " : "Evaluated by: "}{substrateLine(q.evaluator)}.</p>;
}