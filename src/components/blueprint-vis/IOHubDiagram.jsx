/**
 * IOHubDiagram — Hub-and-spoke I/O diagram with ink lines on glass
 * Central node for the step, spokes for inputs (left) and outputs (right).
 */
export default function IOHubDiagram({ step, isDark, t }) {
  if (!step) return null;
  const inputs = step.inputs || [];
  const outputs = step.outputs || [];
  if (inputs.length === 0 && outputs.length === 0) return null;

  const inColor = isDark ? "#60a5fa" : "#2563eb";
  const outColor = isDark ? "#4ade80" : "#16a34a";
  const inkLine = isDark ? "rgba(148,163,184,0.4)" : "rgba(71,85,105,0.3)";

  const cx = 300, cy = 120;
  const spokeLen = 120;
  const maxItems = Math.max(inputs.length, outputs.length, 1);
  const height = Math.max(maxItems * 28 + 40, 160);

  function spokeY(i, total) {
    if (total <= 1) return cy;
    const spacing = Math.min(28, (height - 60) / (total - 1));
    return cy - ((total - 1) * spacing) / 2 + i * spacing;
  }

  return (
    <svg viewBox={`0 0 600 ${height}`} style={{ width: "100%", maxWidth: 600, display: "block", margin: "0 auto" }}>
      {/* Input spokes */}
      {inputs.map((inp, i) => {
        const y = spokeY(i, inputs.length);
        return (
          <g key={`in-${i}`}>
            <line x1={cx - 30} y1={cy} x2={cx - spokeLen} y2={y}
              stroke={inkLine} strokeWidth={1.5} strokeDasharray="4 3" />
            <circle cx={cx - spokeLen} cy={y} r={4.5}
              fill={isDark ? "rgba(96,165,250,0.1)" : "rgba(37,99,235,0.08)"}
              stroke={inColor} strokeWidth={1.5} />
            <text x={cx - spokeLen - 10} y={y + 3} textAnchor="end"
              fontSize={9} fill={inColor} opacity={0.85}>
              {inp.length > 32 ? inp.slice(0, 32) + "…" : inp}
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
              stroke={inkLine} strokeWidth={1.5} strokeDasharray="4 3" />
            <circle cx={cx + spokeLen} cy={y} r={4.5}
              fill={isDark ? "rgba(74,222,128,0.1)" : "rgba(22,163,106,0.08)"}
              stroke={outColor} strokeWidth={1.5} />
            <polygon
              points={`${cx + spokeLen + 5},${y} ${cx + spokeLen},${y - 3} ${cx + spokeLen},${y + 3}`}
              fill={outColor} opacity={0.6} />
            <text x={cx + spokeLen + 14} y={y + 3} textAnchor="start"
              fontSize={9} fill={outColor} opacity={0.85}>
              {out.length > 32 ? out.slice(0, 32) + "…" : out}
            </text>
          </g>
        );
      })}

      {/* Center hub — glass-like with subtle fill */}
      <rect x={cx - 36} y={cy - 22} width={72} height={44} rx={12}
        fill={isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.6)"}
        stroke={isDark ? "rgba(148,163,184,0.35)" : "rgba(71,85,105,0.25)"}
        strokeWidth={1.5} />
      <text x={cx} y={cy - 4} textAnchor="middle"
        fontSize={10} fontWeight="600" fill={t?.title || (isDark ? "#f1f5f9" : "#1e293b")}>
        Step {step.step}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle"
        fontSize={8} fill={t?.muted || (isDark ? "#475569" : "#94a3b8")}>
        {step.title?.slice(0, 16)}
      </text>

      {/* Labels */}
      {inputs.length > 0 && (
        <text x={cx - spokeLen} y={spokeY(0, inputs.length) - 14} textAnchor="end"
          fontSize={8} fill={t?.muted || (isDark ? "#475569" : "#94a3b8")}
          letterSpacing="0.06em" opacity={0.7}>
          INPUTS
        </text>
      )}
      {outputs.length > 0 && (
        <text x={cx + spokeLen} y={spokeY(0, outputs.length) - 14} textAnchor="start"
          fontSize={8} fill={t?.muted || (isDark ? "#475569" : "#94a3b8")}
          letterSpacing="0.06em" opacity={0.7}>
          OUTPUTS
        </text>
      )}
    </svg>
  );
}