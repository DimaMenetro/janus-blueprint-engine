/**
 * AssumptionsPanel — Collapsible glass panel showing assumptions and alternative approaches.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, ChevronDown, Zap, ThumbsUp, ThumbsDown, XCircle } from "lucide-react";
import { glassSurface } from "@/components/ui/LiquidGlass";

export default function AssumptionsPanel({ assumptions, alternatives, isDark, t }) {
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);

  const hasAssumptions = assumptions?.length > 0;
  const hasAlternatives = alternatives?.length > 0;
  if (!hasAssumptions && !hasAlternatives) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
        color: t.subtitle, fontWeight: 600,
        marginBottom: 14, paddingBottom: 6,
        borderBottom: `1px dashed ${isDark ? "rgba(148,163,184,0.2)" : "rgba(71,85,105,0.15)"}`,
      }}>
        Context & Decisions
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Assumptions */}
        {hasAssumptions && (
          <div style={{ ...glassSurface(t), overflow: "hidden" }}>
            <button
              onClick={() => setShowAssumptions(!showAssumptions)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", padding: "12px 16px",
                background: "none", border: "none", cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Lightbulb style={{ width: 14, height: 14, color: isDark ? "#fbbf24" : "#d97706" }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: t.title }}>
                  Assumptions ({assumptions.length})
                </span>
              </div>
              <motion.div animate={{ rotate: showAssumptions ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown style={{ width: 14, height: 14, color: t.muted }} />
              </motion.div>
            </button>
            <AnimatePresence>
              {showAssumptions && (
                <motion.div
                  initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                  transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}
                >
                  <div style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                    {assumptions.map((a, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "flex-start", gap: 8,
                        fontSize: 11, color: t.text, lineHeight: 1.5,
                      }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: "50%", flexShrink: 0, marginTop: 5,
                          background: isDark ? "#fbbf24" : "#d97706",
                        }} />
                        {a}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Alternative Approaches */}
        {hasAlternatives && (
          <div style={{ ...glassSurface(t), overflow: "hidden" }}>
            <button
              onClick={() => setShowAlternatives(!showAlternatives)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", padding: "12px 16px",
                background: "none", border: "none", cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Zap style={{ width: 14, height: 14, color: isDark ? "#a78bfa" : "#7c3aed" }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: t.title }}>
                  Alternative Approaches ({alternatives.length})
                </span>
              </div>
              <motion.div animate={{ rotate: showAlternatives ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown style={{ width: 14, height: 14, color: t.muted }} />
              </motion.div>
            </button>
            <AnimatePresence>
              {showAlternatives && (
                <motion.div
                  initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                  transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}
                >
                  <div style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
                    {alternatives.map((alt, i) => (
                      <div key={i} style={{
                        padding: "10px 12px", borderRadius: 12,
                        background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                        border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}`,
                      }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: t.title, marginBottom: 6 }}>
                          {alt.name}
                        </div>
                        {alt.pros?.length > 0 && (
                          <div style={{ marginBottom: 4 }}>
                            {alt.pros.map((p, j) => (
                              <div key={j} style={{ fontSize: 10, color: isDark ? "#4ade80" : "#16a34a", display: "flex", alignItems: "center", gap: 4, lineHeight: 1.6 }}>
                                <ThumbsUp style={{ width: 9, height: 9, flexShrink: 0 }} /> {p}
                              </div>
                            ))}
                          </div>
                        )}
                        {alt.cons?.length > 0 && (
                          <div style={{ marginBottom: 4 }}>
                            {alt.cons.map((c, j) => (
                              <div key={j} style={{ fontSize: 10, color: isDark ? "#f87171" : "#dc2626", display: "flex", alignItems: "center", gap: 4, lineHeight: 1.6 }}>
                                <ThumbsDown style={{ width: 9, height: 9, flexShrink: 0 }} /> {c}
                              </div>
                            ))}
                          </div>
                        )}
                        {alt.why_not_chosen && (
                          <div style={{ fontSize: 10, color: t.muted, fontStyle: "italic", display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                            <XCircle style={{ width: 9, height: 9, flexShrink: 0 }} />
                            {alt.why_not_chosen}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}