import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronRight, Copy, CheckCircle2, Shield, Target, ListChecks, Clock, Layers } from "lucide-react";
import { glassSurface } from "@/components/ui/LiquidGlass";

function Collapsible({ title, icon: Icon, color, children, defaultOpen, t, isDark }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const Chevron = open ? ChevronDown : ChevronRight;
  return (
    <div style={{ marginBottom: 8 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 6, width: "100%",
          padding: "8px 0", background: "none", border: "none", cursor: "pointer",
          fontSize: 13, fontWeight: 600, color: color || t.title, textAlign: "left",
        }}
      >
        <Chevron style={{ width: 13, height: 13, flexShrink: 0 }} />
        {Icon && <Icon style={{ width: 13, height: 13, flexShrink: 0 }} />}
        {title}
      </button>
      {open && <div style={{ paddingLeft: 24 }}>{children}</div>}
    </div>
  );
}

function StepCard({ step, blueprintLevel, t, isDark }) {
  const effortColors = { low: "#4ade80", medium: "#fbbf24", high: "#f87171" };
  return (
    <div style={{
      ...glassSurface(t), padding: "14px 16px", marginBottom: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 8,
          background: isDark ? "rgba(59,130,246,0.12)" : "rgba(219,234,254,0.6)",
          color: isDark ? "#60a5fa" : "#2563eb",
        }}>
          Step {step.step}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: t.title }}>{step.title}</span>
        {step.effort_level && (
          <span style={{
            fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 8, marginLeft: "auto",
            color: effortColors[step.effort_level] || t.muted,
            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
          }}>
            {step.effort_level}
          </span>
        )}
        {step.time_estimate && (
          <span style={{ fontSize: 10, color: t.muted, display: "flex", alignItems: "center", gap: 3 }}>
            <Clock style={{ width: 10, height: 10 }} />{step.time_estimate}
          </span>
        )}
      </div>
      <p style={{ fontSize: 12, color: t.text, lineHeight: 1.6, margin: "0 0 8px" }}>{step.instructions}</p>

      {step.inputs?.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: t.label }}>INPUTS:</span>
          {step.inputs.map((inp, i) => <div key={i} style={{ fontSize: 11, color: t.subtitle, paddingLeft: 8 }}>• {inp}</div>)}
        </div>
      )}
      {step.outputs?.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: t.label }}>OUTPUTS:</span>
          {step.outputs.map((out, i) => <div key={i} style={{ fontSize: 11, color: t.subtitle, paddingLeft: 8 }}>• {out}</div>)}
        </div>
      )}
      {step.validation && (
        <div style={{ fontSize: 11, color: isDark ? "#4ade80" : "#16a34a", marginBottom: 6 }}>
          ✓ Validation: {step.validation}
        </div>
      )}
      {step.depends_on_steps?.length > 0 && (
        <div style={{ fontSize: 10, color: t.muted }}>
          Depends on: {step.depends_on_steps.map(d => `Step ${d}`).join(", ")}
        </div>
      )}

      {/* L2/L3 expansion */}
      {step.substeps?.length > 0 && (
        <Collapsible title={`Substeps (${step.substeps.length})`} icon={Layers} color={isDark ? "#60a5fa" : "#2563eb"} t={t} isDark={isDark}>
          {step.substeps.map((ss, i) => (
            <div key={i} style={{ fontSize: 11, color: t.text, marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: t.subtitle }}>{ss.substep}:</span> {ss.details}
            </div>
          ))}
        </Collapsible>
      )}
      {step.checklist?.length > 0 && (
        <Collapsible title={`Checklist (${step.checklist.length})`} icon={ListChecks} color={isDark ? "#fbbf24" : "#d97706"} t={t} isDark={isDark}>
          {step.checklist.map((item, i) => <div key={i} style={{ fontSize: 11, color: t.text, marginBottom: 3 }}>☐ {item}</div>)}
        </Collapsible>
      )}
      {step.acceptance_tests?.length > 0 && (
        <Collapsible title={`Acceptance Tests (${step.acceptance_tests.length})`} icon={CheckCircle2} color={isDark ? "#4ade80" : "#16a34a"} t={t} isDark={isDark}>
          {step.acceptance_tests.map((test, i) => <div key={i} style={{ fontSize: 11, color: t.text, marginBottom: 3 }}>✦ {test}</div>)}
        </Collapsible>
      )}
    </div>
  );
}

export default function BlueprintOutput({ variantData, variantLabel, color, t, isDark }) {
  const [showRaw, setShowRaw] = useState(false);
  const bp = variantData?.blueprint;

  if (!bp) {
    return (
      <div style={{ ...glassSurface(t), padding: "20px", textAlign: "center" }}>
        <span style={{ fontSize: 13, color: t.muted }}>
          {variantData?.error ? `Error: ${variantData.error}` : "No blueprint output"}
        </span>
      </div>
    );
  }

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(bp, null, 2));
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color, margin: 0 }}>{variantLabel}</h3>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setShowRaw(!showRaw)} style={{
            fontSize: 11, fontWeight: 600, color: t.subtitle, background: "none", border: "none", cursor: "pointer",
            textDecoration: "underline", textUnderlineOffset: 2,
          }}>
            {showRaw ? "Rendered" : "Raw JSON"}
          </button>
          <button onClick={copyJson} style={{
            fontSize: 11, fontWeight: 600, color: t.subtitle, background: "none", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 3,
          }}>
            <Copy style={{ width: 11, height: 11 }} /> Copy
          </button>
        </div>
      </div>

      {showRaw ? (
        <pre style={{
          fontSize: 10, fontFamily: "monospace", color: isDark ? "#e2e8f0" : "#1e293b",
          background: isDark ? "rgba(0,0,0,0.4)" : "rgba(15,23,42,0.05)",
          padding: 16, borderRadius: 14, overflow: "auto", maxHeight: 500,
          border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
        }}>
          {JSON.stringify(bp, null, 2)}
        </pre>
      ) : (
        <div>
          {/* Goal */}
          <div style={{ ...glassSurface(t), padding: "14px 16px", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <Target style={{ width: 13, height: 13, color }} />
              <span style={{ fontSize: 12, fontWeight: 700, color }}>Goal</span>
            </div>
            <p style={{ fontSize: 12, color: t.text, lineHeight: 1.6, margin: 0 }}>{bp.goal}</p>
          </div>

          {/* Assumptions */}
          {bp.assumptions?.length > 0 && (
            <Collapsible title={`Assumptions (${bp.assumptions.length})`} defaultOpen t={t} isDark={isDark}>
              {bp.assumptions.map((a, i) => <div key={i} style={{ fontSize: 11, color: t.text, marginBottom: 4 }}>• {a}</div>)}
            </Collapsible>
          )}

          {/* Steps */}
          <h4 style={{ fontSize: 13, fontWeight: 700, color: t.title, margin: "16px 0 10px" }}>
            Steps ({bp.steps?.length || 0})
          </h4>
          {bp.steps?.map((step, i) => (
            <StepCard key={i} step={step} blueprintLevel="L3" t={t} isDark={isDark} />
          ))}

          {/* Success Criteria */}
          {bp.success_criteria?.length > 0 && (
            <Collapsible title={`Success Criteria (${bp.success_criteria.length})`} icon={CheckCircle2} color={isDark ? "#4ade80" : "#16a34a"} defaultOpen t={t} isDark={isDark}>
              {bp.success_criteria.map((c, i) => <div key={i} style={{ fontSize: 11, color: t.text, marginBottom: 4 }}>✓ {c}</div>)}
            </Collapsible>
          )}

          {/* Risk Register */}
          {bp.risk_register?.length > 0 && (
            <Collapsible title={`Risk Register (${bp.risk_register.length})`} icon={Shield} color={isDark ? "#f87171" : "#dc2626"} defaultOpen t={t} isDark={isDark}>
              {bp.risk_register.map((r, i) => (
                <div key={i} style={{ fontSize: 11, color: t.text, marginBottom: 8, paddingLeft: 4 }}>
                  <div style={{ fontWeight: 600 }}>⚠ {r.risk} <span style={{ fontWeight: 400, color: t.muted }}>(impact: {r.impact})</span></div>
                  <div style={{ color: t.subtitle, paddingLeft: 14 }}>↳ {r.mitigation}</div>
                </div>
              ))}
            </Collapsible>
          )}

          {/* Alternative Approaches */}
          {bp.alternative_approaches?.length > 0 && (
            <Collapsible title={`Alternative Approaches (${bp.alternative_approaches.length})`} t={t} isDark={isDark}>
              {bp.alternative_approaches.map((alt, i) => (
                <div key={i} style={{ ...glassSurface(t), padding: "10px 14px", marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: t.title, marginBottom: 4 }}>{alt.name}</div>
                  {alt.pros?.map((p, j) => <div key={j} style={{ fontSize: 11, color: isDark ? "#4ade80" : "#16a34a" }}>+ {p}</div>)}
                  {alt.cons?.map((c, j) => <div key={j} style={{ fontSize: 11, color: isDark ? "#f87171" : "#dc2626" }}>− {c}</div>)}
                  {alt.why_not_chosen && <div style={{ fontSize: 10, color: t.muted, marginTop: 4 }}>Why not: {alt.why_not_chosen}</div>}
                </div>
              ))}
            </Collapsible>
          )}
        </div>
      )}
    </div>
  );
}