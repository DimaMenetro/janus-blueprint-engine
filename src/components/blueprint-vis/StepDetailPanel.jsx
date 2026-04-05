/**
 * StepDetailPanel — Interactive vertical stepper with expandable phase details.
 * Inspired by modern stepper UI patterns: each phase is a node on a vertical rail
 * that expands to show instructions, substeps, checklists, acceptance tests, and I/O.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Clock, CheckCircle2, Circle, ArrowRight, CheckSquare, Square, FlaskConical, FileInput, FileOutput, Info } from "lucide-react";
import { glassSurface } from "@/components/ui/LiquidGlass";

function effortColor(effort, isDark) {
  const map = {
    low: isDark ? "#4ade80" : "#16a34a",
    medium: isDark ? "#fbbf24" : "#d97706",
    high: isDark ? "#f87171" : "#dc2626",
  };
  return map[(effort || "medium").toLowerCase()] || map.medium;
}

function StepNode({ step, isExpanded, isLast, isDark, t, onToggle, checkedItems, onCheck }) {
  const hasContent = step.instructions || step.substeps?.length || step.checklist?.length || step.acceptance_tests?.length;

  return (
    <div style={{ display: "flex", gap: 0 }}>
      {/* ─── VERTICAL RAIL ─── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 36, flexShrink: 0 }}>
        {/* Node circle */}
        <button
          onClick={onToggle}
          style={{
            width: 28, height: 28, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: isExpanded
              ? (isDark ? "rgba(148,163,184,0.2)" : "rgba(71,85,105,0.12)")
              : (isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.5)"),
            border: `2px solid ${isExpanded
              ? (isDark ? "rgba(148,163,184,0.5)" : "rgba(71,85,105,0.35)")
              : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)")}`,
            cursor: hasContent ? "pointer" : "default",
            transition: "all 0.2s ease",
            fontSize: 11, fontWeight: 700, color: isExpanded ? t.title : t.muted,
          }}
        >
          {step.step}
        </button>
        {/* Connector line */}
        {!isLast && (
          <div style={{
            flex: 1, width: 2, minHeight: 20,
            background: isDark
              ? "linear-gradient(180deg, rgba(148,163,184,0.25), rgba(148,163,184,0.08))"
              : "linear-gradient(180deg, rgba(71,85,105,0.18), rgba(71,85,105,0.06))",
          }} />
        )}
      </div>

      {/* ─── CONTENT ─── */}
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 12, minWidth: 0 }}>
        {/* Title row */}
        <button
          onClick={onToggle}
          style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%",
            background: "none", border: "none", cursor: hasContent ? "pointer" : "default",
            padding: "2px 0", textAlign: "left",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: t.title, flex: 1, lineHeight: 1.3 }}>
            {step.title}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {step.time_estimate && (
              <span style={{ fontSize: 10, color: t.muted, display: "flex", alignItems: "center", gap: 3 }}>
                <Clock style={{ width: 10, height: 10 }} />
                {step.time_estimate}
              </span>
            )}
            {step.effort_level && (
              <span style={{
                fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 6,
                color: effortColor(step.effort_level, isDark),
                background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                border: `1px solid ${effortColor(step.effort_level, isDark)}33`,
              }}>
                {step.effort_level}
              </span>
            )}
            {hasContent && (
              <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronRight style={{ width: 14, height: 14, color: t.muted }} />
              </motion.div>
            )}
          </div>
        </button>

        {/* Dependencies badge */}
        {step.depends_on_steps?.length > 0 && (
          <div style={{ fontSize: 10, color: t.muted, marginTop: 2 }}>
            Depends on: {step.depends_on_steps.map(d => `Phase ${d}`).join(", ")}
          </div>
        )}

        {/* ─── EXPANDED CONTENT ─── */}
        <AnimatePresence>
          {isExpanded && hasContent && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              <div style={{
                ...glassSurface(t, { density: "focused" }),
                padding: 14, marginTop: 10,
              }}>
                {/* Instructions */}
                {step.instructions && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: t.subtitle, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                      <Info style={{ width: 11, height: 11 }} /> Instructions
                    </div>
                    <p style={{ fontSize: 12, color: t.text, lineHeight: 1.6, margin: 0 }}>
                      {step.instructions}
                    </p>
                  </div>
                )}

                {/* Substeps */}
                {step.substeps?.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: t.subtitle, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                      Substeps
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {step.substeps.map((sub, i) => (
                        <div key={i} style={{
                          padding: "8px 10px", borderRadius: 10,
                          background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                          border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}`,
                        }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: t.title }}>
                            {sub.substep}
                          </div>
                          {sub.details && (
                            <div style={{ fontSize: 10, color: t.muted, marginTop: 3, lineHeight: 1.5 }}>
                              {sub.details}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Checklist — interactive */}
                {step.checklist?.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: t.subtitle, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                      <CheckSquare style={{ width: 11, height: 11 }} /> Checklist
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {step.checklist.map((item, i) => {
                        const key = `${step.step}-check-${i}`;
                        const checked = checkedItems[key];
                        return (
                          <button
                            key={i}
                            onClick={() => onCheck(key)}
                            style={{
                              display: "flex", alignItems: "flex-start", gap: 8,
                              background: "none", border: "none", cursor: "pointer",
                              textAlign: "left", padding: "4px 0",
                            }}
                          >
                            {checked
                              ? <CheckCircle2 style={{ width: 14, height: 14, color: isDark ? "#4ade80" : "#16a34a", flexShrink: 0, marginTop: 1 }} />
                              : <Circle style={{ width: 14, height: 14, color: t.muted, flexShrink: 0, marginTop: 1 }} />
                            }
                            <span style={{
                              fontSize: 11, color: checked ? t.muted : t.text,
                              textDecoration: checked ? "line-through" : "none",
                              lineHeight: 1.4,
                            }}>
                              {item}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Acceptance Tests */}
                {step.acceptance_tests?.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: t.subtitle, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                      <FlaskConical style={{ width: 11, height: 11 }} /> Acceptance Tests
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {step.acceptance_tests.map((test, i) => (
                        <div key={i} style={{
                          fontSize: 11, color: t.text, lineHeight: 1.4,
                          padding: "6px 10px", borderRadius: 8,
                          background: isDark ? "rgba(96,165,250,0.06)" : "rgba(37,99,235,0.04)",
                          border: `1px solid ${isDark ? "rgba(96,165,250,0.15)" : "rgba(37,99,235,0.1)"}`,
                        }}>
                          {test}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* I/O Summary */}
                {(step.inputs?.length > 0 || step.outputs?.length > 0) && (
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    {step.inputs?.length > 0 && (
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: t.subtitle, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
                          <FileInput style={{ width: 11, height: 11 }} /> Inputs
                        </div>
                        {step.inputs.map((inp, i) => (
                          <div key={i} style={{ fontSize: 10, color: t.muted, padding: "2px 0" }}>→ {inp}</div>
                        ))}
                      </div>
                    )}
                    {step.outputs?.length > 0 && (
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: t.subtitle, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
                          <FileOutput style={{ width: 11, height: 11 }} /> Outputs
                        </div>
                        {step.outputs.map((out, i) => (
                          <div key={i} style={{ fontSize: 10, color: t.muted, padding: "2px 0" }}>← {out}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Validation */}
                {step.validation && (
                  <div style={{ marginTop: 10, fontSize: 10, color: t.subtitle, fontStyle: "italic" }}>
                    Validation: {step.validation}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function StepDetailPanel({ steps, isDark, t }) {
  const [expandedSteps, setExpandedSteps] = useState({});
  const [checkedItems, setCheckedItems] = useState({});

  if (!steps?.length) return null;

  const toggleStep = (stepNum) => {
    setExpandedSteps(prev => ({ ...prev, [stepNum]: !prev[stepNum] }));
  };

  const toggleCheck = (key) => {
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const expandAll = () => {
    const all = {};
    steps.forEach(s => { all[s.step] = true; });
    setExpandedSteps(all);
  };

  const collapseAll = () => setExpandedSteps({});

  const expandedCount = Object.values(expandedSteps).filter(Boolean).length;

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 14, paddingBottom: 6,
        borderBottom: `1px dashed ${isDark ? "rgba(148,163,184,0.2)" : "rgba(71,85,105,0.15)"}`,
      }}>
        <span style={{
          fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
          color: t.subtitle, fontWeight: 600,
        }}>
          Implementation Phases — {steps.length} Steps
        </span>
        <button
          onClick={expandedCount > 0 ? collapseAll : expandAll}
          style={{
            fontSize: 10, color: t.muted, background: "none", border: "none",
            cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3,
          }}
        >
          {expandedCount > 0 ? "Collapse All" : "Expand All"}
        </button>
      </div>

      <div>
        {steps.map((step, i) => (
          <StepNode
            key={step.step}
            step={step}
            isExpanded={!!expandedSteps[step.step]}
            isLast={i === steps.length - 1}
            isDark={isDark}
            t={t}
            onToggle={() => toggleStep(step.step)}
            checkedItems={checkedItems}
            onCheck={toggleCheck}
          />
        ))}
      </div>
    </div>
  );
}