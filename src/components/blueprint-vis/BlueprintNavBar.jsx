/**
 * BlueprintNavBar — Navigation and utility bar for the blueprint page.
 * Provides link to full results, view mode toggle, and section jump links.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Layers, List, Map } from "lucide-react";
import { glassSurface } from "@/components/ui/LiquidGlass";

const VIEW_MODES = [
  { key: "full", icon: Layers, label: "Full View" },
  { key: "stepper", icon: List, label: "Stepper Only" },
  { key: "visual", icon: Map, label: "Visual Only" },
];

export default function BlueprintNavBar({ runId, viewMode, onViewModeChange, isDark, t }) {
  return (
    <div style={{
      ...glassSurface(t),
      padding: "8px 14px",
      marginBottom: 20,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexWrap: "wrap", gap: 8,
    }}>
      {/* View mode pills */}
      <div style={{ display: "flex", gap: 4 }}>
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

      {/* Link to results */}
      {runId && (
        <Link
          to={`/Results?id=${runId}`}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 11, fontWeight: 500, color: t.subtitle,
            textDecoration: "none",
            padding: "5px 10px", borderRadius: 8,
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
          }}
        >
          Full Results <ArrowUpRight style={{ width: 11, height: 11 }} />
        </Link>
      )}
    </div>
  );
}