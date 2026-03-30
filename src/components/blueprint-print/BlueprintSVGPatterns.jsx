/**
 * Blueprint SVG Patterns — Grid lines + Sacred geometry watermark
 * 
 * Renders:
 * 1. Engineering grid (minor + major lines)
 * 2. Metatron's Cube / nested hexahedra as a centered watermark
 */

export default function BlueprintSVGPatterns({ palette }) {
  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Minor grid — 20px spacing */}
        <pattern id="bp-grid-minor" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke={palette.gridLine} strokeWidth="0.5" />
        </pattern>
        {/* Major grid — 100px spacing */}
        <pattern id="bp-grid-major" width="100" height="100" patternUnits="userSpaceOnUse">
          <path d="M 100 0 L 0 0 0 100" fill="none" stroke={palette.gridLineMajor} strokeWidth="0.8" />
        </pattern>
      </defs>

      {/* Grid layers */}
      <rect width="100%" height="100%" fill="url(#bp-grid-minor)" />
      <rect width="100%" height="100%" fill="url(#bp-grid-major)" />

      {/* Sacred geometry watermark — centered Metatron's Cube */}
      <g opacity={palette.watermarkOpacity}>
        <SacredGeometryWatermark color={palette.copper} />
      </g>
    </svg>
  );
}

/**
 * Metatron's Cube — 13 circles + connecting lines forming the sacred geometry pattern
 * Rendered at center, viewBox-based so it scales with the SVG
 */
function SacredGeometryWatermark({ color }) {
  const r = 120; // radius of outer circle positions
  const cr = 60; // radius of each small circle
  
  // 13 points: center + 6 inner hex + 6 outer hex
  const center = { x: 450, y: 500 };
  const innerPoints = [];
  const outerPoints = [];
  
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    innerPoints.push({
      x: center.x + r * Math.cos(angle),
      y: center.y + r * Math.sin(angle),
    });
    outerPoints.push({
      x: center.x + r * 2 * Math.cos(angle),
      y: center.y + r * 2 * Math.sin(angle),
    });
  }
  
  const allPoints = [center, ...innerPoints, ...outerPoints];
  
  // Generate all connecting lines between all 13 points
  const lines = [];
  for (let i = 0; i < allPoints.length; i++) {
    for (let j = i + 1; j < allPoints.length; j++) {
      lines.push({ x1: allPoints[i].x, y1: allPoints[i].y, x2: allPoints[j].x, y2: allPoints[j].y });
    }
  }

  return (
    <svg x="0" y="0" width="900" height="1000" viewBox="0 0 900 1000">
      {/* Connecting lines */}
      {lines.map((line, i) => (
        <line
          key={i}
          x1={line.x1} y1={line.y1}
          x2={line.x2} y2={line.y2}
          stroke={color}
          strokeWidth="0.8"
        />
      ))}
      {/* Circles at each node */}
      {allPoints.map((pt, i) => (
        <circle
          key={`c-${i}`}
          cx={pt.x} cy={pt.y}
          r={cr}
          fill="none"
          stroke={color}
          strokeWidth="0.8"
        />
      ))}
      {/* Outer bounding circle */}
      <circle
        cx={center.x} cy={center.y}
        r={r * 2 + cr}
        fill="none"
        stroke={color}
        strokeWidth="1"
      />
    </svg>
  );
}