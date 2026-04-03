/**
 * DependencyFlowGraph — Step nodes as glass surfaces, edges as hand-sketched ink lines
 * Glass substrate with inked connectors.
 */
import { useRef, useEffect, useState, useCallback } from "react";
import { glassSurface } from "@/components/ui/LiquidGlass";

function computeLayers(steps) {
  if (!steps?.length) return { layers: [], nodeMap: {} };
  const nodeMap = {};
  steps.forEach((s, i) => { nodeMap[s.step] = { ...s, index: i, layer: 0 }; });

  let changed = true, safety = 0;
  while (changed && safety < 20) {
    changed = false; safety++;
    steps.forEach(s => {
      (s.depends_on_steps || []).forEach(depStep => {
        if (nodeMap[depStep] && nodeMap[s.step].layer <= nodeMap[depStep].layer) {
          nodeMap[s.step].layer = nodeMap[depStep].layer + 1;
          changed = true;
        }
      });
    });
  }

  const layerMap = {};
  Object.values(nodeMap).forEach(n => {
    if (!layerMap[n.layer]) layerMap[n.layer] = [];
    layerMap[n.layer].push(n);
  });

  return {
    layers: Object.keys(layerMap).sort((a, b) => a - b).map(k => layerMap[k]),
    nodeMap,
  };
}

function effortColor(effort, isDark) {
  const map = {
    low: isDark ? "#4ade80" : "#16a34a",
    medium: isDark ? "#fbbf24" : "#d97706",
    high: isDark ? "#f87171" : "#dc2626",
  };
  return map[(effort || "medium").toLowerCase()] || map.medium;
}

export default function DependencyFlowGraph({ steps, isDark, t }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [nodePositions, setNodePositions] = useState({});
  const [hoveredNode, setHoveredNode] = useState(null);

  const { layers } = computeLayers(steps);

  // Ink colors for sketched lines
  const inkColor = isDark ? "rgba(148,163,184,0.4)" : "rgba(71,85,105,0.35)";
  const inkHover = isDark ? "rgba(148,163,184,0.75)" : "rgba(71,85,105,0.65)";

  const measureNodes = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const positions = {};
    container.querySelectorAll("[data-step-id]").forEach(el => {
      const rect = el.getBoundingClientRect();
      positions[el.dataset.stepId] = {
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top + rect.height / 2,
        top: rect.top - containerRect.top,
        bottom: rect.top - containerRect.top + rect.height,
        width: rect.width,
        height: rect.height,
      };
    });
    setNodePositions(positions);
  }, [layers]);

  useEffect(() => {
    const timer = setTimeout(measureNodes, 100);
    return () => clearTimeout(timer);
  }, [measureNodes, steps]);

  // Draw sketched ink edges on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    const container = containerRef.current;
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (Object.keys(nodePositions).length === 0) return;

    steps?.forEach(step => {
      const deps = step.depends_on_steps || [];
      const target = nodePositions[step.step];
      if (!target) return;

      deps.forEach(depStep => {
        const source = nodePositions[depStep];
        if (!source) return;

        const isHovered = hoveredNode === step.step || hoveredNode === depStep;

        ctx.beginPath();
        ctx.strokeStyle = isHovered ? inkHover : inkColor;
        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.setLineDash(isHovered ? [] : [4, 4]);

        const sx = source.x, sy = source.bottom + 2;
        const tx = target.x, ty = target.top - 2;
        const midY = (sy + ty) / 2;

        ctx.moveTo(sx, sy);
        ctx.bezierCurveTo(sx, midY, tx, midY, tx, ty);
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrowhead
        const arrowSize = 5;
        ctx.beginPath();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx - arrowSize, ty - arrowSize);
        ctx.lineTo(tx + arrowSize, ty - arrowSize);
        ctx.closePath();
        ctx.fill();
      });
    });
  }, [nodePositions, steps, isDark, hoveredNode]);

  if (!steps?.length) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
        color: t.subtitle, fontWeight: 600,
        marginBottom: 16, paddingBottom: 6,
        borderBottom: `1px dashed ${isDark ? "rgba(148,163,184,0.2)" : "rgba(71,85,105,0.15)"}`,
      }}>
        Dependency Flow — {steps.length} Phase{steps.length !== 1 ? "s" : ""}
      </div>

      <div ref={containerRef} style={{ position: "relative", padding: "10px 0" }}>
        <canvas ref={canvasRef}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          {layers.map((layerNodes, layerIdx) => (
            <div key={layerIdx} style={{
              display: "flex", justifyContent: "center", gap: 14,
              marginBottom: layerIdx < layers.length - 1 ? 48 : 0,
              flexWrap: "wrap",
            }}>
              {layerNodes.map(node => {
                const isHovered = hoveredNode === node.step;
                return (
                  <div
                    key={node.step}
                    data-step-id={node.step}
                    onMouseEnter={() => setHoveredNode(node.step)}
                    onMouseLeave={() => setHoveredNode(null)}
                    style={{
                      ...glassSurface(t),
                      padding: "12px 16px",
                      minWidth: 160, maxWidth: 220,
                      cursor: "default",
                      transition: "box-shadow 0.2s, border-color 0.2s",
                      borderColor: isHovered ? (isDark ? "rgba(148,163,184,0.25)" : "rgba(71,85,105,0.2)") : undefined,
                      boxShadow: isHovered
                        ? `${glassSurface(t).boxShadow}, 0 0 16px ${isDark ? "rgba(148,163,184,0.08)" : "rgba(71,85,105,0.06)"}`
                        : glassSurface(t).boxShadow,
                    }}>
                    {/* Step badge + title */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <div style={{
                        width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
                        borderRadius: 6,
                        background: isDark ? "rgba(148,163,184,0.1)" : "rgba(71,85,105,0.07)",
                        border: `1px solid ${isDark ? "rgba(148,163,184,0.15)" : "rgba(71,85,105,0.12)"}`,
                        fontSize: 10, fontWeight: 700, color: t.subtitle,
                      }}>
                        {node.step}
                      </div>
                      <span style={{
                        fontSize: 12, fontWeight: 600,
                        color: t.title, lineHeight: 1.2, flex: 1,
                      }}>
                        {node.title}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div style={{
                      fontSize: 9, color: t.muted,
                      display: "flex", gap: 8, flexWrap: "wrap",
                    }}>
                      {node.time_estimate && <span>⏱ {node.time_estimate}</span>}
                      {node.effort_level && (
                        <span style={{ color: effortColor(node.effort_level, isDark) }}>
                          ● {node.effort_level}
                        </span>
                      )}
                      {node.depends_on_steps?.length > 0 && (
                        <span>← {node.depends_on_steps.join(",")}</span>
                      )}
                    </div>

                    {node.inputs?.length > 0 || node.outputs?.length > 0 ? (
                      <div style={{ fontSize: 9, color: t.muted, marginTop: 4 }}>
                        {node.inputs?.length > 0 && <span>{node.inputs.length} in</span>}
                        {node.inputs?.length > 0 && node.outputs?.length > 0 && " → "}
                        {node.outputs?.length > 0 && <span>{node.outputs.length} out</span>}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}