import GlassSelect from "@/components/janus/GlassSelect";
import { COGNITIVE_ROLES, REASONING_EFFORTS, MODELS, cognitionModels } from "@/lib/janus/protocolRegistry";

const EFFORT_LABEL = { high: "High", medium: "Medium", low: "Low" };

// One cognitive role of the allocation: which model reasons for it, and with how much reasoning effort.
export default function RoleAllocationRow({ role, entry, onChange, t, isDark }) {
  const { label, note } = COGNITIVE_ROLES[role];
  return (
    <div style={{ paddingTop: 12, borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(148,163,184,0.25)"}` }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: t.title }}>{label}</div>
      {note && <div style={{ fontSize: 11, color: t.subtitle, margin: "2px 0 8px", lineHeight: 1.45 }}>{note}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)", gap: 10 }}>
        <GlassSelect label="Model" value={entry.model} onChange={(model) => onChange({ ...entry, model })} t={t} isDark={isDark}
          options={cognitionModels().map(id => ({ value: id, label: `${MODELS[id].label} · ${MODELS[id].standing}` }))} />
        <GlassSelect label="Reasoning" value={entry.effort} onChange={(effort) => onChange({ ...entry, effort })} t={t} isDark={isDark}
          options={REASONING_EFFORTS.map(e => ({ value: e, label: EFFORT_LABEL[e] }))} />
      </div>
    </div>
  );
}