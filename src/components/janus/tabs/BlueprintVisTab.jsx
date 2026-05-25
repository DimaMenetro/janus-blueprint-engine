/**
 * BlueprintVisTab — Production blueprint visualization for the Results page.
 * 
 * Uses the same advanced blueprint-vis components as BlueprintPrint,
 * but scoped to the current run (no selector). This is a SEPARATE copy
 * from BlueprintPrint so sandbox iteration doesn't destabilize production.
 * 
 * Supports raw_json fallback when entity blueprint field is incomplete/truncated.
 */
import { useState, useMemo } from "react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { light, dark, glassCard, glassSurface } from "@/components/ui/LiquidGlass";
import { computeContentDensity } from "@/lib/contentDensity";

import EngineeringGrid from "@/components/blueprint-vis/EngineeringGrid";
import SchematicHeader from "@/components/blueprint-vis/SchematicHeader";
import DependencyFlowGraph from "@/components/blueprint-vis/DependencyFlowGraph";
import RiskTopology from "@/components/blueprint-vis/RiskTopology";
import IOHubDiagram from "@/components/blueprint-vis/IOHubDiagram";
import StepDetailPanel from "@/components/blueprint-vis/StepDetailPanel";
import AssumptionsPanel from "@/components/blueprint-vis/AssumptionsPanel";
import SuccessCriteriaPanel from "@/components/blueprint-vis/SuccessCriteriaPanel";

import BlueprintVisNavBar from "./BlueprintVisNavBar";

/**
 * Resolve blueprint data with raw_json fallback.
 * If run.blueprint exists and has steps, use it directly.
 * If not, attempt to parse blueprint from run.raw_json.
 */
function resolveBlueprintData(run) {
  const bp = run?.blueprint;
  if (bp && bp.steps?.length > 0) return { blueprint: bp, source: "entity" };

  // Fallback: try raw_json
  if (run?.raw_json) {
    try {
      const jsonStr = typeof run.raw_json === "string" ? run.raw_json : JSON.stringify(run.raw_json);
      // Clean control characters that can appear in truncated raw_json
      const cleaned = jsonStr.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "");
      const raw = JSON.parse(cleaned);
      if (raw?.blueprint?.steps?.length > 0) return { blueprint: raw.blueprint, source: "raw_json" };
    } catch {
      // raw_json parse failed — fall through
    }
  }

  // Partial blueprint (has goal but no steps, etc.)
  if (bp && bp.goal) return { blueprint: bp, source: "entity_partial" };

  return { blueprint: null, source: "none" };
}

export default function BlueprintVisTab({ run }) {
  const { isDark } = useTheme();
  const t = isDark ? dark : light;
  const [viewMode, setViewMode] = useState("full");
  const [expandedStep, setExpandedStep] = useState(null);

  const { blueprint, source } = useMemo(() => resolveBlueprintData(run), [run]);

  if (!blueprint) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center" }}>
        <p style={{ fontSize: 14, color: t.subtitle }}>No blueprint data available.</p>
        <p style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>
          The run may still be processing, or the blueprint domain was not included in this execution mode.
        </p>
      </div>
    );
  }

  const ink = isDark ? "rgba(148,163,184,0.7)" : "rgba(71,85,105,0.6)";
  const contentDensity = computeContentDensity(blueprint);

  return (
    <div style={{ padding: "0" }}>
      {/* Source indicator when using fallback */}
      {source === "raw_json" && (
        <div style={{
          padding: "8px 16px", marginBottom: 12, borderRadius: 12,
          fontSize: 11, color: isDark ? "#fbbf24" : "#d97706",
          background: isDark ? "rgba(251,191,36,0.06)" : "rgba(217,119,6,0.04)",
          border: `1px solid ${isDark ? "rgba(251,191,36,0.12)" : "rgba(217,119,6,0.1)"}`,
        }}>
          Blueprint loaded from raw JSON fallback — entity fields may have been truncated.
        </div>
      )}

      {/* View mode nav */}
      <BlueprintVisNavBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isDark={isDark}
        t={t}
        contentDensity={contentDensity}
      />

      {/* Main schematic area */}
      <div style={{
        ...glassCard(t, { density: contentDensity }),
        position: "relative",
        padding: "32px 28px",
        overflow: "hidden",
      }}>
        <EngineeringGrid isDark={isDark} ink={ink} />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Header plate */}
          <SchematicHeader run={run} isDark={isDark} t={t} contentDensity={contentDensity} />

          {/* Goal statement */}
          {blueprint.goal && (
            <div style={{
              ...glassSurface(t, { density: contentDensity }),
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
              fontSize: 14, lineHeight: 1.6, color: t.text,
              padding: "14px 18px", marginBottom: 24,
              borderLeft: `2px solid ${isDark ? "rgba(148,163,184,0.4)" : "rgba(71,85,105,0.3)"}`,
            }}>
              {blueprint.goal}
            </div>
          )}

          {/* Assumptions & Alternatives */}
          {(viewMode === "full" || viewMode === "stepper") && (
            <AssumptionsPanel
              assumptions={blueprint.assumptions}
              alternatives={blueprint.alternative_approaches}
              isDark={isDark} t={t} contentDensity={contentDensity}
            />
          )}

          {/* Dependency Flow Graph */}
          {(viewMode === "full" || viewMode === "visual") && (
            <DependencyFlowGraph
              steps={blueprint.steps}
              isDark={isDark} t={t} contentDensity={contentDensity}
            />
          )}

          {/* Interactive Step Detail Panel */}
          {(viewMode === "full" || viewMode === "stepper") && (
            <StepDetailPanel
              steps={blueprint.steps}
              isDark={isDark} t={t} contentDensity={contentDensity}
            />
          )}

          {/* I/O Hub Diagrams */}
          {(viewMode === "full" || viewMode === "visual") && blueprint.steps?.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{
                fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
                color: t.subtitle, fontWeight: 600,
                marginBottom: 12, paddingBottom: 6,
                borderBottom: `1px dashed ${isDark ? "rgba(148,163,184,0.2)" : "rgba(71,85,105,0.15)"}`,
              }}>
                I/O Hub Diagrams — Select a phase
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                {blueprint.steps.map(step => (
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
                const activeStep = blueprint.steps.find(s => s.step === expandedStep);
                if (!activeStep) return null;
                return (
                  <div style={{ ...glassSurface(t, { density: contentDensity }), padding: 16 }}>
                    <IOHubDiagram step={activeStep} isDark={isDark} t={t} />
                  </div>
                );
              })()}
            </div>
          )}

          {/* Success Criteria */}
          {(viewMode === "full" || viewMode === "stepper") && (
            <SuccessCriteriaPanel
              criteria={blueprint.success_criteria}
              isDark={isDark} t={t} contentDensity={contentDensity}
            />
          )}

          {/* Risk Topology */}
          <RiskTopology
            risks={blueprint.risk_register}
            isDark={isDark} t={t} contentDensity={contentDensity}
          />

          {/* Footer stamp */}
          <div style={{
            textAlign: "center", padding: "16px 0 0",
            borderTop: `1px dashed ${isDark ? "rgba(148,163,184,0.15)" : "rgba(71,85,105,0.1)"}`,
          }}>
            <span style={{
              fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase",
              color: t.muted, opacity: 0.6,
            }}>
              Janus Blueprint Protocol — Cephalon Continuity Framework — CP-002 v1.5
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}