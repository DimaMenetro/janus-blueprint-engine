import React from "react";
import { motion } from "framer-motion";
import { EXECUTION_MODES } from "./janusSchema";
import { glassSurface } from "@/components/ui/LiquidGlass";

export default function ExecutionModeSelector({ value, onChange, t, isDark }) {
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 600, color: t.title, display: "block", marginBottom: 10 }}>
        Execution Mode
      </label>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {Object.values(EXECUTION_MODES).map(mode => {
          const isActive = value === mode.id;
          return (
            <motion.button
              key={mode.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange(mode.id)}
              style={{
                ...glassSurface(t),
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                transition: "all 0.25s ease",
                ...(isActive ? {
                  background: isDark ? "rgba(139,92,246,0.12)" : "rgba(59,130,246,0.1)",
                  border: `2px solid ${isDark ? "rgba(139,92,246,0.4)" : "rgba(59,130,246,0.35)"}`,
                  boxShadow: `inset 0 1px 0 0 rgba(255,255,255,${isDark ? "0.08" : "0.6"}), 0 0 20px ${isDark ? "rgba(139,92,246,0.08)" : "rgba(59,130,246,0.06)"}`,
                } : {}),
              }}
            >
              {/* Radio dot */}
              <div
                style={{
                  width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                  border: `2px solid ${isActive ? (isDark ? "#a78bfa" : "#3b82f6") : (isDark ? "#475569" : "#94a3b8")}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "border-color 0.2s ease",
                }}
              >
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: isDark ? "#a78bfa" : "#3b82f6",
                    }}
                  />
                )}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.title }}>{mode.label}</div>
                <div style={{ fontSize: 12, color: t.subtitle, marginTop: 2 }}>{mode.description}</div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}