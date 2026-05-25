/**
 * BlueprintVisNavBar — View mode toggle for the Results-page blueprint tab.
 * 
 * Separate from BlueprintNavBar (which includes a run selector link for the sandbox).
 * This version is simpler — just view mode pills, no cross-page navigation.
 */
import { Layers, List, Map } from "lucide-react";
import { glassSurface } from "@/components/ui/LiquidGlass";

const VIEW_MODES = [
  { key: "full", icon: Layers, label: "Full View" },
  { key: "stepper", icon: List, label: "Stepper Only" },
  { key: "visual", icon: Map, label: "Visual Only" },
];

export default function BlueprintVisNavBar({ viewMode, onViewModeChange, isDark, t, contentDensity }) {
  return (
    <div style={{
      ...glassSurface(t, { density: contentDensity }),
      padding: "8px 14px",
      marginBottom: 20,
      display: "flex", alignItems: "center", gap: 4,
    }}>
      {VIEW_MODES.map(({ key, icon: Icon, label }) => {
        const active = viewMode === key;
        return (
          <button
            key={key}
            onClick={() => onViewModeChange(key)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 12px", borderRadius: 10,
              fontSize: 11, fontWeight: active ? 600 : 500,
              color: active ? t.title : t.muted,
              background: active
                ? (isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.6)")
                : "transparent",
              border: `1px solid ${active
                ? (isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)")
                : "transparent"}`,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <Icon style={{ width: 12, height: 12 }} />
            {label}
          </button>
        );
      })}
    </div>
  );
}