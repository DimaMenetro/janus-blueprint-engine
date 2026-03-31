/**
 * IOHubDiagram — Hub-and-spoke diagram for a single step's inputs/outputs
 * Central node = step title, left spokes = inputs, right spokes = outputs
 */
export default function IOHubDiagram({ step, isDark }) {
  if (!step) return null;
  const inputs = step.inputs || [];
  const outputs = step.outputs || [];
  if (inputs.length === 0 && outputs.length === 0) return null;

  const text = isDark ? "#d4a574" : "#5c4a2a";
  const muted = isDark ? "#7a8a9a" : "#8a7a6a";
  const inColor = isDark ? "#60a5fa" : "#2563eb";
  const outColor = isDark ? "#4ade80" : "#16a34a";
  const lineColor = isDark ? "rgba(180,140,80,0.2)" : "rgba(120,100,60,0.15)";

  const cx = 300;
  const cy = 120;
  const spokeLen = 120;
  const maxItems = Math.max(inputs.length, outputs.length, 1);
  const height = Math.max(maxItems * 28 + 40, 160);

  function spokeY(i, total) {
    if (total <= 1) return cy;
    const spacing = Math.min(28, (height - 60) / (total - 1));
    const startY = cy - ((total - 1) * spacing) / 2;
    return startY + i * spacing;
  }

  return (
    <svg viewBox={`0 0 600 ${height}`} style={{ width: "100%", maxWidth: 600, display: "block", margin: "0 auto" }}>
      {/* Input spokes */}
      {inputs.map((inp, i) => {
        const y = spokeY(i, inputs.length);
        return (
          <g key={`in-${i}`}>
            <line x1={cx - 30} y1={cy} x2={cx - spokeLen} y2={y}
              stroke={lineColor} strokeWidth={1} />
            <circle cx={cx - spokeLen} cy={y} r={4}
              fill={isDark ? "rgba(20,25,40,0.9)" : "rgba(255,252,245,0.95)"}
              stroke={inColor} strokeWidth={1} />
            <text x={cx - spokeLen - 10} y={y + 3} textAnchor="end"
              fontSize={9} fontFamily="'Courier New', monospace" fill={inColor}>
              {inp.length > 30 ? inp.slice(0, 30) + "…" : inp}
            </text>
          </g>
        );
      })}

      {/* Output spokes */}
      {outputs.map((out, i) => {
        const y = spokeY(i, outputs.length);
        return (
          <g key={`out-${i}`}>
            <line x1={cx + 30} y1={cy} x2={cx + spokeLen} y2={y}
              stroke={lineColor} strokeWidth={1} />
            <circle cx={cx + spokeLen} cy={y} r={4}
              fill={isDark ? "rgba(20,25,40,0.9)" : "rgba(255,252,245,0.95)"}
              stroke={outColor} strokeWidth={1} />
            {/* Arrow tip */}
            <polygon
              points={`${cx + spokeLen + 4},${y} ${cx + spokeLen - 2},${y - 3} ${cx + spokeLen - 2},${y + 3}`}
              fill={outColor} />
            <text x={cx + spokeLen + 14} y={y + 3} textAnchor="start"
              fontSize={9} fontFamily="'Courier New', monospace" fill={outColor}>
              {out.length > 30 ? out.slice(0, 30) + "…" : out}
            </text>
          </g>
        );
      })}

      {/* Center hub */}
      <rect x={cx - 30} y={cy - 18} width={60} height={36} rx={2}
        fill={isDark ? "rgba(20,25,40,0.9)" : "rgba(255,252,245,0.95)"}
        stroke={isDark ? "rgba(180,140,80,0.5)" : "rgba(120,100,60,0.35)"}
        strokeWidth={1.5} />
      <text x={cx} y={cy - 4} textAnchor="middle"
        fontSize={10} fontWeight="700" fontFamily="'Courier New', monospace" fill={text}>
        STEP {step.step}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle"
        fontSize={8} fontFamily="'Courier New', monospace" fill={muted}>
        {step.title?.slice(0, 14)}
      </text>

      {/* Labels */}
      {inputs.length > 0 && (
        <text x={cx - spokeLen} y={spokeY(0, inputs.length) - 14} textAnchor="end"
          fontSize={8} fontFamily="'Courier New', monospace" fill={muted}
          letterSpacing="0.1em">
          INPUTS
        </text>
      )}
      {outputs.length > 0 && (
        <text x={cx + spokeLen} y={spokeY(0, outputs.length) - 14} textAnchor="start"
          fontSize={8} fontFamily="'Courier New', monospace" fill={muted}
          letterSpacing="0.1em">
          OUTPUTS
        </text>
      )}
    </svg>
  );
}