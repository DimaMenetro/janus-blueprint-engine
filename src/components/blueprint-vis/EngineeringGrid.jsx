/**
 * EngineeringGrid — Subtle graph paper rendered as ink on glass
 * Light dashed lines that look hand-ruled, not mechanical.
 */
export default function EngineeringGrid({ isDark, ink }) {
  const fine = isDark ? "rgba(148,163,184,0.04)" : "rgba(71,85,105,0.05)";
  const coarse = isDark ? "rgba(148,163,184,0.07)" : "rgba(71,85,105,0.09)";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        backgroundImage: `
          linear-gradient(${fine} 1px, transparent 1px),
          linear-gradient(90deg, ${fine} 1px, transparent 1px),
          linear-gradient(${coarse} 1px, transparent 1px),
          linear-gradient(90deg, ${coarse} 1px, transparent 1px)
        `,
        backgroundSize: "20px 20px, 20px 20px, 100px 100px, 100px 100px",
        opacity: 0.7,
      }}
    />
  );
}