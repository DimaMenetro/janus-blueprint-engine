/**
 * SuccessCriteriaPanel — Interactive success criteria with check-off capability.
 * Glass-styled with progress indicator.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Target } from "lucide-react";
import { glassSurface } from "@/components/ui/LiquidGlass";

export default function SuccessCriteriaPanel({ criteria, isDark, t, contentDensity }) {
  const [checked, setChecked] = useState({});

  if (!criteria?.length) return null;

  const toggle = (i) => setChecked(prev => ({ ...prev, [i]: !prev[i] }));
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const progress = checkedCount / criteria.length;

  const barColor = isDark ? "#4ade80" : "#16a34a";

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 14, paddingBottom: 6,
        borderBottom: `1px dashed ${isDark ? "rgba(148,163,184,0.2)" : "rgba(71,85,105,0.15)"}`,
      }}>
        <span style={{
          fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
          color: t.subtitle, fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
        }}>
          <Target style={{ width: 12, height: 12 }} />
          Success Criteria
        </span>
        <span style={{ fontSize: 10, color: t.muted }}>
          {checkedCount}/{criteria.length} met
        </span>
      </div>

      {/* Progress bar */}
      <div style={{
        height: 3, borderRadius: 2, marginBottom: 14,
        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
        overflow: "hidden",
      }}>
        <motion.div
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{
            height: "100%", borderRadius: 2,
            background: barColor,
          }}
        />
      </div>

      <div style={{ ...glassSurface(t, { density: contentDensity }), padding: "10px 14px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {criteria.map((criterion, i) => {
            const isChecked = !!checked[i];
            return (
              <button
                key={i}
                onClick={() => toggle(i)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  background: "none", border: "none", cursor: "pointer",
                  textAlign: "left", padding: "8px 4px", borderRadius: 8,
                  transition: "background 0.15s",
                }}
                onMouseOver={(e) => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"}
                onMouseOut={(e) => e.currentTarget.style.background = "none"}
              >
                {isChecked
                  ? <CheckCircle2 style={{ width: 16, height: 16, color: barColor, flexShrink: 0, marginTop: 1 }} />
                  : <Circle style={{ width: 16, height: 16, color: t.muted, flexShrink: 0, marginTop: 1 }} />
                }
                <span style={{
                  fontSize: 12, lineHeight: 1.5,
                  color: isChecked ? t.muted : t.text,
                  textDecoration: isChecked ? "line-through" : "none",
                  transition: "all 0.2s",
                }}>
                  {criterion}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}