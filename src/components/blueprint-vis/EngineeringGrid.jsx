/**
 * EngineeringGrid — Full-page engineering graph paper background
 * Renders minor (20px) and major (100px) grid lines as a CSS background.
 * No SVG needed — pure CSS gradient trick for performance.
 */
export default function EngineeringGrid({ isDark }) {
  const minor = isDark ? "rgba(100,140,200,0.06)" : "rgba(120,140,180,0.12)";
  const major = isDark ? "rgba(100,140,200,0.12)" : "rgba(120,140,180,0.22)";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        backgroundImage: `
          linear-gradient(${minor} 1px, transparent 1px),
          linear-gradient(90deg, ${minor} 1px, transparent 1px),
          linear-gradient(${major} 1px, transparent 1px),
          linear-gradient(90deg, ${major} 1px, transparent 1px)
        `,
        backgroundSize: "20px 20px, 20px 20px, 100px 100px, 100px 100px",
      }}
    />
  );
}