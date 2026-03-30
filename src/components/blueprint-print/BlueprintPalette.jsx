/**
 * Blueprint Print — Dual-Theme Color Palette
 * 
 * Light: "The Manuscript" — Cream parchment, copper/burnt sienna linework, navy accent arrows
 * Dark:  "The Schematic"  — Deep blue-black, amber/gold glow, cyan-white text
 * 
 * Inspired by: PTE-3T Dimensional Awakening + traditional architectural blueprints
 */

export const manuscript = {
  // Canvas
  background: "#f5f0e8",
  backgroundGradient: "linear-gradient(145deg, #f5f0e8 0%, #ede6d8 50%, #f0ebe0 100%)",
  
  // Grid & structural lines
  gridLine: "rgba(180, 160, 130, 0.15)",
  gridLineMajor: "rgba(160, 140, 110, 0.25)",
  borderLine: "#b4956a",
  borderLineLight: "rgba(180, 149, 106, 0.4)",
  
  // Primary copper/sienna palette
  copper: "#b45309",
  copperLight: "#d4956a",
  copperMuted: "rgba(180, 83, 9, 0.15)",
  sienna: "#92400e",
  
  // Navy accent
  navy: "#1e3a5f",
  navyLight: "#2d5a8e",
  navyMuted: "rgba(30, 58, 95, 0.12)",
  
  // Amber accent for decorative elements
  amber: "#d97706",
  amberGlow: "rgba(217, 119, 6, 0.08)",
  
  // Typography
  title: "#1c1917",
  subtitle: "#57534e",
  text: "#44403c",
  muted: "#a8a29e",
  label: "#78716c",
  
  // Step node markers
  nodeBackground: "#1e3a5f",
  nodeText: "#f5f0e8",
  nodeBorder: "#b45309",
  
  // Section backgrounds
  sectionBg: "rgba(255, 255, 255, 0.45)",
  sectionBorder: "rgba(180, 149, 106, 0.35)",
  
  // Risk severity
  riskHigh: "#991b1b",
  riskMed: "#92400e",
  riskLow: "#1e3a5f",
  
  // Success/verification
  success: "#166534",
  successBg: "rgba(22, 101, 52, 0.06)",
  
  // Watermark opacity
  watermarkOpacity: 0.04,
};

export const schematic = {
  // Canvas — deep blueprint blue-black
  background: "#0a0e1a",
  backgroundGradient: "linear-gradient(145deg, #0a0e1a 0%, #0e1424 50%, #0c1020 100%)",
  
  // Grid & structural lines
  gridLine: "rgba(100, 140, 200, 0.08)",
  gridLineMajor: "rgba(120, 160, 220, 0.12)",
  borderLine: "#d4956a",
  borderLineLight: "rgba(212, 149, 106, 0.25)",
  
  // Primary amber/gold palette (copper becomes luminous)
  copper: "#d4956a",
  copperLight: "#e8b88a",
  copperMuted: "rgba(212, 149, 106, 0.12)",
  sienna: "#f59e0b",
  
  // Cyan accent (replaces navy — like blueprint white lines)
  navy: "#93c5fd",
  navyLight: "#bfdbfe",
  navyMuted: "rgba(147, 197, 253, 0.08)",
  
  // Amber accent — glowing
  amber: "#fbbf24",
  amberGlow: "rgba(251, 191, 36, 0.06)",
  
  // Typography
  title: "#e8ddd0",
  subtitle: "#a8a29e",
  text: "#d6cfc6",
  muted: "#57534e",
  label: "#78716c",
  
  // Step node markers
  nodeBackground: "#d4956a",
  nodeText: "#0a0e1a",
  nodeBorder: "#93c5fd",
  
  // Section backgrounds
  sectionBg: "rgba(255, 255, 255, 0.03)",
  sectionBorder: "rgba(212, 149, 106, 0.2)",
  
  // Risk severity
  riskHigh: "#fca5a5",
  riskMed: "#fbbf24",
  riskLow: "#93c5fd",
  
  // Success/verification
  success: "#4ade80",
  successBg: "rgba(74, 222, 128, 0.06)",
  
  // Watermark opacity
  watermarkOpacity: 0.03,
};

export function getPalette(isDark) {
  return isDark ? schematic : manuscript;
}