import { useState } from "react";
import { GitBranch, ChevronDown } from "lucide-react";
import { glassSurface } from "@/components/ui/LiquidGlass";
import { STAGE_KEY_ORDER, STORAGE_MODEL } from "@/lib/janus/stageModel";
import StageLineageRow from "@/components/janus/StageLineageRow";

// Durable stage lineage: active revision, newer failed/running attempts and derived staleness per stage.
export default function StageLineagePanel({ view, t }) {
  const [open, setOpen] = useState(false);
  const rows = STAGE_KEY_ORDER.map(k => view.stageInfo[k]).filter(Boolean);
  if (rows.length === 0) return null;

  const failed = rows.filter(r => r.latest?.status === "failed").length;
  const stale = rows.filter(r => r.stale).length;
  const summary = [
    `${view.lineage.length} revision${view.lineage.length === 1 ? "" : "s"}`,
    failed && `${failed} failed`,
    stale && `${stale} stale`,
    view.storage === STORAGE_MODEL.legacy && "historical record · read-only",
  ].filter(Boolean).join(" · ");

  return (
    <div style={{ ...glassSurface(t), padding: "10px 14px", marginBottom: 16 }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{ width: "100%", minHeight: 36, display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
      >
        <GitBranch style={{ width: 15, height: 15, color: t.subtitle, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: t.title, flexShrink: 0 }}>Stage lineage</span>
        <span style={{ fontSize: 12, color: t.subtitle, flex: 1, minWidth: 0 }}>{summary}</span>
        <ChevronDown style={{ width: 15, height: 15, color: t.muted, flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }} />
      </button>
      {open && (
        <div style={{ marginTop: 8 }}>
          {rows.map(info => <StageLineageRow key={info.key} info={info} t={t} />)}
        </div>
      )}
    </div>
  );
}