/**
 * RiskTopology — Radial risk diagram with sketched ink lines on glass
 * Nodes orbit a center point; lines are dashed like hand-drawn ink.
 */
import { glassSurface } from "@/components/ui/LiquidGlass";

export default function RiskTopology({ risks, isDark, t, contentDensity }) {
  if (!risks?.length) return null;

  const inkLine = isDark ? "rgba(148,163,184,0.4)" : "rgba(71,85,105,0.3)";
  const inkDash = isDark ? "rgba(148,163,184,0.3)" : "rgba(71,85,105,0.22)";

  const severityConfig = {
    high:   { color: isDark ? "#f87171" : "#dc2626", ring: 0 },
    med:    { color: isDark ? "#fbbf24" : "#d97706", ring: 1 },
    medium: { color: isDark ? "#fbbf24" : "#d97706", ring: 1 },
    low:    { color: isDark ? "#4ade80" : "#16a34a", ring: 2 },
  };

  const grouped = { high: [], med: [], low: [] };
  risks.forEach(r => {
    const key = (r.impact || "med").toLowerCase();
    const bucket = key === "medium" ? "med" : key;
    if (grouped[bucket]) grouped[bucket].push(r);
    else grouped.med.push(r);
  });

  const cx = 200, cy = 200;
  const rings = [80, 140, 190];

  function getNodePositions(items, ringRadius) {
    if (!items.length) return [];
    const angleStep = (2 * Math.PI) / Math.max(items.length, 1);
    const startAngle = -Math.PI / 2;
    return items.map((item, i) => ({
      ...item,
      x: cx + ringRadius * Math.cos(startAngle + angleStep * i),
      y: cy + ringRadius * Math.sin(startAngle + angleStep * i),
    }));
  }

  const allNodes = [
    ...getNodePositions(grouped.high, rings[0]),
    ...getNodePositions(grouped.med, rings[1]),
    ...getNodePositions(grouped.low, rings[2]),
  ];

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
        color: t.subtitle, fontWeight: 600,
        marginBottom: 16, paddingBottom: 6,
        borderBottom: `1px dashed ${isDark ? "rgba(148,163,184,0.2)" : "rgba(71,85,105,0.15)"}`,
      }}>
        Risk Topology — {risks.length} Identified
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* Radial diagram */}
        <svg viewBox="0 0 400 400" style={{ width: 400, maxWidth: "100%", flexShrink: 0 }}>
          {/* Concentric rings — dashed ink */}
          {rings.map((r, i) => (
            <circle key={i} cx={cx} cy={cy} r={r}
              fill="none" stroke={inkDash} strokeWidth={1.5} strokeDasharray="4 3" />
          ))}

          {/* Ring labels */}
          <text x={cx + rings[0] + 4} y={cy - 4} fontSize={9} fill={t.subtitle} fontWeight="600" opacity={0.8}>HIGH</text>
          <text x={cx + rings[1] + 4} y={cy - 4} fontSize={9} fill={t.subtitle} fontWeight="600" opacity={0.8}>MED</text>
          <text x={cx + rings[2] + 4} y={cy - 4} fontSize={9} fill={t.subtitle} fontWeight="600" opacity={0.8}>LOW</text>

          {/* Center mark */}
          <circle cx={cx} cy={cy} r={4} fill={t.subtitle} opacity={0.6} />
          <text x={cx} y={cy - 12} textAnchor="middle" fontSize={9} fontWeight="600" fill={t.subtitle}>GOAL</text>

          {/* Risk nodes */}
          {allNodes.map((node, i) => {
            const sev = (node.impact || "med").toLowerCase();
            const cfg = severityConfig[sev] || severityConfig.med;
            return (
              <g key={i}>
                <line x1={cx} y1={cy} x2={node.x} y2={node.y}
                  stroke={inkLine} strokeWidth={1} strokeDasharray="3 3" />
                <circle cx={node.x} cy={node.y} r={10}
                  fill={isDark ? "rgba(15,18,30,0.7)" : "rgba(255,255,255,0.7)"}
                  stroke={cfg.color} strokeWidth={2} />
                <text x={node.x} y={node.y + 4} textAnchor="middle"
                  fontSize={9} fontWeight="700" fill={cfg.color}>
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Risk legend */}
        <div style={{ flex: 1, minWidth: 240 }}>
          {allNodes.map((node, i) => {
            const sev = (node.impact || "med").toLowerCase();
            const cfg = severityConfig[sev] || severityConfig.med;
            return (
              <div key={i} style={{
                padding: "8px 0",
                borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}`,
                display: "flex", gap: 8, alignItems: "flex-start",
              }}>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: cfg.color, minWidth: 20,
                }}>
                  {i + 1}.
                </span>
                <div>
                  <div style={{
                    fontSize: 12, color: t.text,
                    lineHeight: 1.35, marginBottom: 3,
                  }}>
                    {node.risk}
                  </div>
                  <div style={{ fontSize: 10, color: t.muted }}>
                    ↳ {node.mitigation}
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