/**
 * RiskTopology — Severity-coded risk nodes in a radial layout
 * Renders risks as annotated nodes arranged in concentric severity rings.
 */
export default function RiskTopology({ risks, isDark }) {
  if (!risks?.length) return null;

  const border = isDark ? "rgba(180,140,80,0.4)" : "rgba(80,60,30,0.25)";
  const text = isDark ? "#d4a574" : "#5c4a2a";
  const muted = isDark ? "#7a8a9a" : "#8a7a6a";

  const severityConfig = {
    high: { color: isDark ? "#f87171" : "#dc2626", ring: 0, label: "HIGH" },
    med: { color: isDark ? "#fbbf24" : "#d97706", ring: 1, label: "MED" },
    medium: { color: isDark ? "#fbbf24" : "#d97706", ring: 1, label: "MED" },
    low: { color: isDark ? "#4ade80" : "#16a34a", ring: 2, label: "LOW" },
  };

  // Group by severity
  const grouped = { high: [], med: [], low: [] };
  risks.forEach(r => {
    const key = (r.impact || "med").toLowerCase();
    const bucket = key === "medium" ? "med" : key;
    if (grouped[bucket]) grouped[bucket].push(r);
    else grouped.med.push(r);
  });

  const cx = 200;
  const cy = 200;
  const rings = [80, 140, 190];

  // Place nodes around rings
  function getNodePositions(items, ringRadius) {
    if (items.length === 0) return [];
    const angleStep = (2 * Math.PI) / Math.max(items.length, 1);
    const startAngle = -Math.PI / 2;
    return items.map((item, i) => {
      const angle = startAngle + angleStep * i;
      return {
        ...item,
        x: cx + ringRadius * Math.cos(angle),
        y: cy + ringRadius * Math.sin(angle),
      };
    });
  }

  const highNodes = getNodePositions(grouped.high, rings[0]);
  const medNodes = getNodePositions(grouped.med, rings[1]);
  const lowNodes = getNodePositions(grouped.low, rings[2]);
  const allNodes = [...highNodes, ...medNodes, ...lowNodes];

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        fontFamily: "'Courier New', monospace", fontSize: 11, letterSpacing: "0.12em",
        textTransform: "uppercase", color: text, fontWeight: 700,
        marginBottom: 16, paddingBottom: 6,
        borderBottom: `1.5px solid ${border}`,
      }}>
        RISK TOPOLOGY — {risks.length} Identified
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* Radial diagram */}
        <svg viewBox="0 0 400 400" style={{ width: 400, maxWidth: "100%", flexShrink: 0 }}>
          {/* Concentric rings */}
          {rings.map((r, i) => (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={isDark ? "rgba(180,140,80,0.12)" : "rgba(120,100,60,0.1)"}
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          ))}

          {/* Ring labels */}
          <text x={cx + rings[0] + 4} y={cy - 4} fontSize={8}
            fontFamily="'Courier New', monospace" fill={muted}>HIGH</text>
          <text x={cx + rings[1] + 4} y={cy - 4} fontSize={8}
            fontFamily="'Courier New', monospace" fill={muted}>MED</text>
          <text x={cx + rings[2] + 4} y={cy - 4} fontSize={8}
            fontFamily="'Courier New', monospace" fill={muted}>LOW</text>

          {/* Center mark */}
          <circle cx={cx} cy={cy} r={3}
            fill={isDark ? "#d4a574" : "#8b6914"} />
          <text x={cx} y={cy - 10} textAnchor="middle" fontSize={8}
            fontFamily="'Courier New', monospace" fill={text}>GOAL</text>

          {/* Risk nodes */}
          {allNodes.map((node, i) => {
            const severity = (node.impact || "med").toLowerCase();
            const cfg = severityConfig[severity] || severityConfig.med;
            return (
              <g key={i}>
                {/* Line from center */}
                <line x1={cx} y1={cy} x2={node.x} y2={node.y}
                  stroke={cfg.color} strokeWidth={0.5} opacity={0.3} />
                {/* Node */}
                <circle cx={node.x} cy={node.y} r={8}
                  fill={isDark ? "rgba(20,25,40,0.9)" : "rgba(255,252,245,0.95)"}
                  stroke={cfg.color} strokeWidth={1.5} />
                <text x={node.x} y={node.y + 3} textAnchor="middle"
                  fontSize={7} fontFamily="'Courier New', monospace"
                  fontWeight="700" fill={cfg.color}>
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Risk legend / annotations */}
        <div style={{ flex: 1, minWidth: 240 }}>
          {allNodes.map((node, i) => {
            const severity = (node.impact || "med").toLowerCase();
            const cfg = severityConfig[severity] || severityConfig.med;
            return (
              <div key={i} style={{
                padding: "8px 0",
                borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}`,
                display: "flex", gap: 8, alignItems: "flex-start",
              }}>
                <span style={{
                  fontFamily: "'Courier New', monospace", fontSize: 10, fontWeight: 700,
                  color: cfg.color, minWidth: 20,
                }}>
                  {i + 1}.
                </span>
                <div>
                  <div style={{
                    fontFamily: "Georgia, serif", fontSize: 11, color: isDark ? "#e2d5c0" : "#3a3020",
                    lineHeight: 1.3, marginBottom: 3,
                  }}>
                    {node.risk}
                  </div>
                  <div style={{
                    fontFamily: "'Courier New', monospace", fontSize: 9, color: muted,
                  }}>
                    MITIGATION: {node.mitigation}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}