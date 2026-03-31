/**
 * DependencyFlowGraph — Renders blueprint steps as a directed node graph
 * Uses HTML Canvas for drawing edges (arrows) between step nodes.
 * Nodes are positioned in a layered layout based on dependency depth.
 */
import { useRef, useEffect, useState, useCallback } from "react";

// Compute layout layers: steps with no deps go in layer 0, etc.
function computeLayers(steps) {
  if (!steps?.length) return { layers: [], nodeMap: {} };

  const nodeMap = {};
  steps.forEach((s, i) => {
    nodeMap[s.step] = { ...s, index: i, layer: 0 };
  });

  // Iterative layer assignment
  let changed = true;
  let safety = 0;
  while (changed && safety < 20) {
    changed = false;
    safety++;
    steps.forEach(s => {
      const deps = s.depends_on_steps || [];
      deps.forEach(depStep => {
        if (nodeMap[depStep] && nodeMap[s.step].layer <= nodeMap[depStep].layer) {
          nodeMap[s.step].layer = nodeMap[depStep].layer + 1;
          changed = true;
        }
      });
    });
  }

  // Group by layer
  const layerMap = {};
  Object.values(nodeMap).forEach(n => {
    if (!layerMap[n.layer]) layerMap[n.layer] = [];
    layerMap[n.layer].push(n);
  });

  const layers = Object.keys(layerMap)
    .sort((a, b) => a - b)
    .map(k => layerMap[k]);

  return { layers, nodeMap };
}

// Effort → color
function effortColor(effort, isDark) {
  const map = {
    low: isDark ? "#4ade80" : "#16a34a",
    medium: isDark ? "#fbbf24" : "#d97706",
    high: isDark ? "#f87171" : "#dc2626",
  };
  return map[(effort || "medium").toLowerCase()] || map.medium;
}

export default function DependencyFlowGraph({ steps, isDark }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [nodePositions, setNodePositions] = useState({});
  const [hoveredNode, setHoveredNode] = useState(null);

  const { layers, nodeMap } = computeLayers(steps);

  const border = isDark ? "rgba(180,140,80,0.4)" : "rgba(80,60,30,0.25)";
  const text = isDark ? "#d4a574" : "#5c4a2a";
  const muted = isDark ? "#7a8a9a" : "#8a7a6a";
  const nodeBg = isDark ? "rgba(20,25,40,0.85)" : "rgba(255,252,245,0.9)";
  const nodeBorder = isDark ? "rgba(180,140,80,0.5)" : "rgba(120,100,60,0.35)";
  const edgeColor = isDark ? "rgba(180,140,80,0.35)" : "rgba(120,100,60,0.3)";

  // Measure node positions after render
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
    // Delay measurement to let DOM settle
    const timer = setTimeout(measureNodes, 100);
    return () => clearTimeout(timer);
  }, [measureNodes, steps]);

  // Draw edges on canvas
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
        ctx.strokeStyle = isHovered
          ? (isDark ? "rgba(212,165,116,0.8)" : "rgba(139,105,20,0.7)")
          : edgeColor;
        ctx.lineWidth = isHovered ? 2.5 : 1.5;
        ctx.setLineDash(isHovered ? [] : [6, 4]);

        // Draw from bottom of source to top of target
        const sx = source.x;
        const sy = source.bottom + 2;
        const tx = target.x;
        const ty = target.top - 2;

        // Bezier curve
        const midY = (sy + ty) / 2;
        ctx.moveTo(sx, sy);
        ctx.bezierCurveTo(sx, midY, tx, midY, tx, ty);
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrowhead
        const angle = Math.atan2(ty - midY, tx - tx) || Math.PI / 2;
        const arrowSize = 6;
        ctx.beginPath();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx - arrowSize * Math.cos(angle - 0.4), ty - arrowSize * Math.sin(angle - 0.4));
        ctx.lineTo(tx - arrowSize * Math.cos(angle + 0.4), ty - arrowSize * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fill();
      });
    });
  }, [nodePositions, steps, isDark, hoveredNode]);

  if (!steps?.length) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        fontFamily: "'Courier New', monospace", fontSize: 11, letterSpacing: "0.12em",
        textTransform: "uppercase", color: text, fontWeight: 700,
        marginBottom: 16, paddingBottom: 6,
        borderBottom: `1.5px solid ${border}`,
      }}>
        DEPENDENCY FLOW — {steps.length} Phase{steps.length !== 1 ? "s" : ""}
      </div>

      <div ref={containerRef} style={{ position: "relative", padding: "10px 0" }}>
        {/* Canvas layer for edges */}
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}
        />

        {/* Node layers */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {layers.map((layerNodes, layerIdx) => (
            <div key={layerIdx} style={{
              display: "flex", justifyContent: "center", gap: 16,
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
                      background: nodeBg,
                      border: `1.5px solid ${isHovered ? text : nodeBorder}`,
                      padding: "12px 16px",
                      minWidth: 160,
                      maxWidth: 220,
                      cursor: "default",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                      boxShadow: isHovered
                        ? `0 0 12px ${isDark ? "rgba(180,140,80,0.15)" : "rgba(120,100,60,0.1)"}`
                        : "none",
                    }}>
                    {/* Step number hex badge */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <div style={{
                        width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
                        background: isDark ? "rgba(180,140,80,0.15)" : "rgba(139,105,20,0.1)",
                        border: `1px solid ${isDark ? "rgba(180,140,80,0.3)" : "rgba(139,105,20,0.2)"}`,
                        fontFamily: "'Courier New', monospace", fontSize: 11, fontWeight: 700,
                        color: text,
                      }}>
                        {node.step}
                      </div>
                      <span style={{
                        fontFamily: "Georgia, serif", fontSize: 12, fontWeight: 600,
                        color: isDark ? "#e2d5c0" : "#3a3020", lineHeight: 1.2,
                        flex: 1,
                      }}>
                        {node.title}
                      </span>
                    </div>

                    {/* Metadata line */}
                    <div style={{
                      fontFamily: "'Courier New', monospace", fontSize: 9,
                      color: muted, display: "flex", gap: 8, flexWrap: "wrap",
                    }}>
                      {node.time_estimate && <span>⏱ {node.time_estimate}</span>}
                      {node.effort_level && (
                        <span style={{ color: effortColor(node.effort_level, isDark) }}>
                          ● {node.effort_level}
                        </span>
                      )}
                      {(node.depends_on_steps?.length > 0) && (
                        <span>← dep: {node.depends_on_steps.join(",")}</span>
                      )}
                    </div>

                    {/* I/O counts */}
                    <div style={{
                      fontFamily: "'Courier New', monospace", fontSize: 9,
                      color: muted, marginTop: 4,
                    }}>
                      {node.inputs?.length > 0 && <span>{node.inputs.length} in</span>}
                      {node.inputs?.length > 0 && node.outputs?.length > 0 && " → "}
                      {node.outputs?.length > 0 && <span>{node.outputs.length} out</span>}
                    </div>
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