import { useState } from "react";
import { revisionLabel } from "@/lib/janus/stageModel";
import { stageLabel } from "@/lib/janus/executionState";
import StageVersionList from "@/components/janus/StageVersionList";
import RerunImpactPreview from "@/components/janus/RerunImpactPreview";

function Chip({ children, bg, border, color }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 8, background: bg, border: `1px solid ${border}`, color, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

const linkBtn = (t) => ({ background: "none", border: "none", padding: "0 4px", minHeight: 32, fontSize: 12, fontWeight: 600, color: t.text, cursor: "pointer" });

export default function StageLineageRow({ info, view, t, canRerun, onChanged }) {
  const [open, setOpen] = useState(null); // "versions" | "rerun" | null
  const { active, latest, stale } = info;
  const newer = latest && latest.id !== active?.id ? latest : null; // a newer revision that did not succeed
  const total = view.lineage.filter(s => s.stage_key === info.key).length;
  const toggle = (what) => setOpen(o => (o === what ? null : what));

  return (
    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, padding: "7px 0", borderTop: "1px solid rgba(148,163,184,0.18)" }}>
      <span style={{ flex: "1 1 140px", fontSize: 13, color: t.text }}>{stageLabel(info.key)}</span>
      {active
        ? <Chip bg={t.successBg} border={t.successBorder} color={t.text}>{revisionLabel(active)}</Chip>
        : <Chip bg={t.errorBg} border={t.errorBorder} color={t.text}>no valid revision</Chip>}
      {newer && (
        <Chip bg={newer.status === "failed" ? t.errorBg : "transparent"} border={newer.status === "failed" ? t.errorBorder : t.successBorder} color={t.text}>
          {revisionLabel(newer)} {newer.status}
        </Chip>
      )}
      {stale && <Chip bg="transparent" border={t.errorBorder} color={t.text}>stale</Chip>}
      <button onClick={() => toggle("versions")} aria-expanded={open === "versions"} style={linkBtn(t)}>Versions ({total})</button>
      {canRerun && <button onClick={() => toggle("rerun")} aria-expanded={open === "rerun"} style={linkBtn(t)}>Re-run…</button>}
      {stale && <span style={{ flexBasis: "100%", fontSize: 11, color: t.subtitle }}>{stale}</span>}
      {open === "versions" && <StageVersionList view={view} stageKey={info.key} t={t} />}
      {open === "rerun" && (
        <div style={{ flexBasis: "100%" }}>
          <RerunImpactPreview runId={view.run.id} targets={[info.key]} title={stageLabel(info.key)} t={t} onDone={onChanged} onClose={() => setOpen(null)} />
        </div>
      )}
    </div>
  );
}