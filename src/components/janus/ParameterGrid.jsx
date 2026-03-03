import React from "react";
import { Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { glassSurface } from "@/components/ui/LiquidGlass";
import GlassSelect from "@/components/janus/GlassSelect";

export default function ParameterGrid({
  outputMode, setOutputMode,
  blueprintLevel, setBlueprintLevel,
  noveltyDial, setNoveltyDial,
  refreshEnabled, setRefreshEnabled,
  showRefresh, t, isDark
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <GlassSelect
        label="Output Mode" value={outputMode} onChange={setOutputMode} t={t} isDark={isDark}
        options={[
          { value: "Blueprint", label: "Blueprint" },
          { value: "Research Plan", label: "Research Plan" },
          { value: "Product Spec", label: "Product Spec" },
          { value: "Technical Architecture", label: "Technical Architecture" },
        ]}
      />
      <GlassSelect
        label="Blueprint Level" value={blueprintLevel} onChange={setBlueprintLevel} t={t} isDark={isDark}
        options={[
          { value: "L1", label: "L1 - Simple" },
          { value: "L2", label: "L2 - Detailed" },
          { value: "L3", label: "L3 - Complete" },
        ]}
      />
      <GlassSelect
        label="Novelty Level" value={noveltyDial} onChange={setNoveltyDial} t={t} isDark={isDark}
        options={[
          { value: "low", label: "Low - Conservative" },
          { value: "medium", label: "Medium - Balanced" },
          { value: "high", label: "High - Innovative" },
        ]}
      />
      {showRefresh && (
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: t.title, display: "block", marginBottom: 8 }}>
            External Refresh
          </label>
          <div
            style={{
              ...glassSurface(t),
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 13, color: t.subtitle }}>Web search</span>
            <Switch checked={refreshEnabled} onCheckedChange={setRefreshEnabled} />
          </div>
          {refreshEnabled && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
              <Info style={{ width: 12, height: 12, color: isDark ? "#fbbf24" : "#d97706" }} />
              <span style={{ fontSize: 11, color: isDark ? "#fbbf24" : "#d97706" }}>Uses credits</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}