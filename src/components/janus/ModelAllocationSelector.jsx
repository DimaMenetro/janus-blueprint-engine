import { useState } from "react";
import { ChevronDown } from "lucide-react";
import GlassSelect from "@/components/janus/GlassSelect";
import RoleAllocationRow from "@/components/janus/RoleAllocationRow";
import { ALLOCATION_PROFILES, COGNITIVE_ROLES, DEFAULT_EFFORT, resolveAllocation, modelLabel } from "@/lib/janus/protocolRegistry";

/**
 * The operator's model allocation for a new run: a profile, and changes to single cognitive roles.
 * `value` = { profile, overrides }. What is chosen here is recorded on the run when it starts, and every stage
 * version is fixed to the model of its role.
 */
export default function ModelAllocationSelector({ value, onChange, t, isDark }) {
  const [open, setOpen] = useState(false);
  const { roles, customized } = resolveAllocation(value);
  const profile = ALLOCATION_PROFILES[value.profile];
  const counts = Object.values(roles).reduce((acc, r) => ({ ...acc, [r.model]: (acc[r.model] || 0) + 1 }), {});
  const summary = Object.entries(counts).map(([id, n]) => `${n} on ${modelLabel(id)}`).join(" · ");
  const setRole = (role, next) => {
    const { [role]: _replaced, ...rest } = value.overrides || {};
    const asProfile = next.model === profile.models[role] && next.effort === DEFAULT_EFFORT;
    onChange({ ...value, overrides: asProfile ? rest : { ...rest, [role]: next } });
  };

  return (
    <div>
      <GlassSelect label="Models" value={value.profile} onChange={(id) => onChange({ profile: id, overrides: {} })} t={t} isDark={isDark}
        options={Object.entries(ALLOCATION_PROFILES).map(([id, p]) => ({ value: id, label: `${p.label} — ${p.description}` }))} />
      <button onClick={() => setOpen(!open)} aria-expanded={open}
        style={{ background: "none", border: "none", padding: "8px 2px 0", minHeight: 36, width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontSize: 12, color: t.subtitle, lineHeight: 1.45 }}>
          {customized ? "Changed from the profile: " : `${Object.keys(COGNITIVE_ROLES).length} cognitive roles: `}{summary}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: t.title, whiteSpace: "nowrap" }}>
          {open ? "Hide roles" : "Adjust roles"}
          <ChevronDown style={{ width: 14, height: 14, transition: "transform 0.2s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
        </span>
      </button>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 10 }}>
          {Object.keys(COGNITIVE_ROLES).map(role => (
            <RoleAllocationRow key={role} role={role} entry={roles[role]} onChange={(next) => setRole(role, next)} t={t} isDark={isDark} />
          ))}
          <p style={{ fontSize: 11, color: t.subtitle, margin: 0, lineHeight: 1.5 }}>
            A stage version is fixed to its model when it is created: a retry or a resume cannot change it. The model that actually answered is recorded on every call and shown in Diagnostics and in Stage lineage.
          </p>
        </div>
      )}
    </div>
  );
}