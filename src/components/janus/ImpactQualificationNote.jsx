import { ShieldAlert } from "lucide-react";

const NEXT = {
  unchanged: "The Blueprint is not affected: its evaluation and release status stand.",
  re_evaluated: "A new Blueprint version is produced; once the run completes it gets one independent evaluation, and it is released only if it qualifies.",
  blocked: "The Blueprint becomes stale. It is neither evaluated nor released until it is re-run.",
};

// What a re-run does to quality qualification and release, from the impact preview.
export default function ImpactQualificationNote({ qualification, t }) {
  const { next, evaluationInvalidated, releaseWithdrawn } = qualification;
  return (
    <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, color: t.text }}>
      <ShieldAlert style={{ width: 14, height: 14, marginTop: 1, flexShrink: 0, color: t.subtitle }} />
      <span>
        {NEXT[next]}
        {evaluationInvalidated && " The current evaluation no longer applies."}
        {releaseWithdrawn && <strong> The released Blueprint is withdrawn from release.</strong>}
      </span>
    </div>
  );
}