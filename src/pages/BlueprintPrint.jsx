/**
 * Blueprint Print — Sandbox page for technical schematic visualization
 * Prototype v2: Real visual diagrams, not text re-rendering.
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Loader2, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useTheme } from "@/components/theme/ThemeProvider";
import { light, dark, glassCard, glassSurface } from "@/components/ui/LiquidGlass";

import EngineeringGrid from "@/components/blueprint-vis/EngineeringGrid";
import SchematicHeader from "@/components/blueprint-vis/SchematicHeader";
import DependencyFlowGraph from "@/components/blueprint-vis/DependencyFlowGraph";
import RiskTopology from "@/components/blueprint-vis/RiskTopology";
import IOHubDiagram from "@/components/blueprint-vis/IOHubDiagram";
import PhaseIllustration from "@/components/blueprint-vis/PhaseIllustration";

export default function BlueprintPrint() {
  const { isDark } = useTheme();
  const t = isDark ? dark : light;

  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [expandedStep, setExpandedStep] = useState(null);

  useEffect(() => {
    async function fetchRuns() {
      const allRuns = await base44.entities.Run.list("-created_date", 50);
      const withBlueprint = allRuns.filter(r => r.blueprint && r.status === "completed");
      setRuns(withBlueprint);
      setLoading(false);
    }
    fetchRuns();
  }, []);

  const queryLabel = (run) => {
    const q = run.query_text || "Untitled";
    const short = q.length > 50 ? q.slice(0, 50) + "…" : q;
    const date = new Date(run.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${short} (${date})`;
  };

  // Use theme ink colors for sketched elements
  const ink = isDark ? "rgba(148,163,184,0.7)" : "rgba(71,85,105,0.6)";

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 20px 100px" }}>
      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: t.title, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 10 }}>
          <FileText style={{ width: 20, height: 20, color: isDark ? "#d4956a" : "#b45309" }} />
          Blueprint Schematic
        </h1>
        <p style={{ fontSize: 13, color: t.subtitle, margin: 0 }}>
          Technical visualization sandbox — dependency flows, risk topology, I/O diagrams
        </p>
      </motion.div>

      {/* Run selector */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ ...glassCard(t), padding: "14px 18px", marginBottom: 24, overflow: "visible", position: "relative", zIndex: 50 }}
      >
        <div style={{ position: "relative", zIndex: 60 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: t.label, marginBottom: 4, display: "block" }}>
            Select a completed run
          </label>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            disabled={loading}
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 14, fontSize: 12,
              color: selectedRun ? t.title : t.muted,
              background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.5)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
              cursor: loading ? "not-allowed" : "pointer",
              textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between",
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {loading ? "Loading runs…" : selectedRun ? queryLabel(selectedRun) : "Choose a run…"}
            </span>
            <ChevronDown style={{ width: 14, height: 14, color: t.muted, flexShrink: 0 }} />
          </button>

          {dropdownOpen && (
            <div style={{
              position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4,
              maxHeight: 260, overflowY: "auto",
              background: isDark ? "rgba(15,18,30,0.95)" : "rgba(255,255,255,0.95)",
              backdropFilter: "blur(20px)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
              borderRadius: 12, zIndex: 70, boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            }}>
              {runs.length === 0 ? (
                <div style={{ padding: "12px 14px", fontSize: 12, color: t.muted }}>No runs with blueprints found</div>
              ) : runs.map((run) => (
                <button
                  key={run.id}
                  onClick={() => { setSelectedRun(run); setDropdownOpen(false); setExpandedStep(null); }}
                  style={{
                    width: "100%", padding: "10px 14px", fontSize: 12, color: t.text,
                    background: "none", border: "none",
                    borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}`,
                    cursor: "pointer", textAlign: "left", display: "block",
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"}
                  onMouseOut={(e) => e.currentTarget.style.background = "none"}
                >
                  {queryLabel(run)}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* ─── SCHEMATIC RENDER AREA ─── */}
      {selectedRun && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            ...glassCard(t),
            position: "relative",
            padding: "32px 28px",
            overflow: "hidden",
          }}
        >
          <EngineeringGrid isDark={isDark} ink={ink} />

          <div style={{ position: "relative", zIndex: 1 }}>
            {/* ─── HEADER PLATE ─── */}
            <SchematicHeader run={selectedRun} isDark={isDark} t={t} />

            {/* ─── GOAL STATEMENT ─── */}
            {selectedRun.blueprint?.goal && (
              <div style={{
                ...glassSurface(t),
                fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
                fontSize: 14, lineHeight: 1.6,
                color: t.text,
                padding: "14px 18px", marginBottom: 24,
                borderLeft: `2px solid ${isDark ? "rgba(148,163,184,0.4)" : "rgba(71,85,105,0.3)"}`,
              }}>
                {selectedRun.blueprint.goal}
              </div>
            )}

            {/* ─── DEPENDENCY FLOW GRAPH ─── */}
            <DependencyFlowGraph steps={selectedRun.blueprint?.steps} isDark={isDark} t={t} />

            {/* ─── STEP I/O DETAIL (click to expand) ─── */}
            {selectedRun.blueprint?.steps?.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{
                  fontSize: 11, letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: t.subtitle, fontWeight: 600,
                  marginBottom: 12, paddingBottom: 6,
                  borderBottom: `1px dashed ${isDark ? "rgba(148,163,184,0.2)" : "rgba(71,85,105,0.15)"}`,
                }}>
                  I/O Hub Diagrams — Select a phase
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                  {selectedRun.blueprint.steps.map(step => (
                    <button
                      key={step.step}
                      onClick={() => setExpandedStep(expandedStep === step.step ? null : step.step)}
                      style={{
                        fontSize: 11, fontWeight: 500,
                        padding: "6px 14px", cursor: "pointer", borderRadius: 12,
                        background: expandedStep === step.step ? t.surface : "transparent",
                        border: `1px solid ${expandedStep === step.step ? t.surfaceBorder : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)")}`,
                        color: expandedStep === step.step ? t.title : t.muted,
                        transition: "all 0.2s ease",
                      }}
                    >
                      Phase {step.step}
                    </button>
                  ))}
                </div>
                {expandedStep && (() => {
                  const activeStep = selectedRun.blueprint.steps.find(s => s.step === expandedStep);
                  return (
                    <motion.div
                      key={expandedStep}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ ...glassSurface(t), padding: 16 }}
                    >
                      <IOHubDiagram step={activeStep} isDark={isDark} t={t} />
                      <PhaseIllustration
                        step={activeStep}
                        goalContext={selectedRun.blueprint?.goal}
                        isDark={isDark}
                        t={t}
                      />
                    </motion.div>
                  );
                })()}
              </div>
            )}

            {/* ─── RISK TOPOLOGY ─── */}
            <RiskTopology risks={selectedRun.blueprint?.risk_register} isDark={isDark} t={t} />

            {/* ─── FOOTER STAMP ─── */}
            <div style={{
              textAlign: "center", padding: "16px 0 0",
              borderTop: `1px dashed ${isDark ? "rgba(148,163,184,0.15)" : "rgba(71,85,105,0.1)"}`,
            }}>
              <span style={{
                fontSize: 9, letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: t.muted, opacity: 0.6,
              }}>
                Janus Blueprint Protocol — Cephalon Continuity Framework — CP-002 v1.5
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {!selectedRun && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ ...glassSurface(t), padding: "60px 20px", textAlign: "center" }}>
          <FileText style={{ width: 32, height: 32, color: t.muted, margin: "0 auto 12px" }} />
          <p style={{ fontSize: 14, color: t.subtitle, margin: "0 0 4px" }}>Select a completed run to visualize</p>
          <p style={{ fontSize: 12, color: t.muted, margin: 0 }}>Dependency flows, risk topology, and I/O hub diagrams</p>
        </motion.div>
      )}
    </div>
  );
}