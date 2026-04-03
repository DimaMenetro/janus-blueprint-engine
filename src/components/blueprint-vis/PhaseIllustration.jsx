/**
 * PhaseIllustration — Generates a technical blueprint illustration
 * for a given build phase using AI image generation.
 * Shows what the physical deliverable of the phase should look like.
 */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { glassSurface } from "@/components/ui/LiquidGlass";

// Style reference images — glass-etched schematic aesthetic
const STYLE_REFS = [
  "https://media.base44.com/images/public/6978a10dbc9d7c7a927c09b8/b6aadc43a_IMG_0889.jpg",
  "https://media.base44.com/images/public/6978a10dbc9d7c7a927c09b8/95e4e3147_IMG_0888.jpg",
  "https://media.base44.com/images/public/6978a10dbc9d7c7a927c09b8/c04b4b21e_IMG_1739.png",
];

function buildPrompt(step, goalContext, isDark) {
  const title = step.title || "Component";
  const instructions = step.instructions || "";
  const outputs = (step.outputs || []).join(", ");
  const inputs = (step.inputs || []).join(", ");
  const substepDetails = (step.substeps || [])
    .map(s => s.details || s.substep || "")
    .filter(Boolean)
    .join("; ");

  const details = [instructions, substepDetails].filter(Boolean).join(". ");
  const ioContext = [inputs && `Inputs: ${inputs}`, outputs && `Outputs: ${outputs}`].filter(Boolean).join(". ");

  // Theme-adaptive background
  const bgStyle = isDark
    ? "Deep indigo-navy translucent glass background, like a schematic etched into dark crystal. Luminous white and pale blue-gold wireframe lines that glow softly against the deep background."
    : "Frosted translucent glass background, like a schematic etched onto clear crystal. Fine dark navy and copper-bronze wireframe lines with subtle depth and refraction.";

  return [
    `Technical schematic illustration of "${title}" — etched onto translucent glass.`,
    goalContext ? `This is one component/phase of: ${goalContext}.` : "",
    `Show the subject as a detailed engineering schematic with: geometric wireframe construction lines,`,
    `labeled callout annotations with specifications and measurements,`,
    `exploded or cross-section views showing internal structure where relevant,`,
    `dimensional proportions and assembly relationships between sub-components.`,
    details.length > 0 ? `Technical details to visualize: ${details.slice(0, 500)}.` : "",
    ioContext.length > 0 ? `Key elements: ${ioContext.slice(0, 200)}.` : "",
    bgStyle,
    `Style: Glass-etched engineering art. Luminous geometric wireframes, thin precise linework,`,
    `mathematical formulas and spec annotations scattered around the diagram.`,
    `Think: Quantum lattice schematic, sacred geometry precision, translucent depth layers.`,
    `NOT flat paper. NOT photorealistic. The schematic should look like it's floating inside glass.`,
    `Professional technical illustration with artistic beauty. Monochrome wireframes with subtle accent color highlights.`,
  ].filter(Boolean).join(" ");
}

// Simple in-memory cache so we don't re-generate on every expand
const imageCache = {};

export default function PhaseIllustration({ step, goalContext, isDark, t }) {
  // isDark is used in prompt generation for theme-adaptive output
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const themeTag = isDark ? "dark" : "light";
  const cacheKey = `phase-${step.step}-${step.title}-${themeTag}`;
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Check cache on mount
  useEffect(() => {
    if (imageCache[cacheKey]) {
      setImageUrl(imageCache[cacheKey]);
    }
  }, [cacheKey]);

  const generate = async () => {
    setLoading(true);
    setError(null);
    const prompt = buildPrompt(step, goalContext, isDark);
    const result = await base44.integrations.Core.GenerateImage({
      prompt,
      existing_image_urls: STYLE_REFS,
    });
    if (!mountedRef.current) return;
    if (result?.url) {
      imageCache[cacheKey] = result.url;
      setImageUrl(result.url);
    } else {
      setError("Generation returned no image");
    }
    setLoading(false);
  };

  // No image yet — show generate button
  if (!imageUrl && !loading) {
    return (
      <div style={{
        ...glassSurface(t),
        padding: "20px 16px",
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 10, marginTop: 12,
      }}>
        {error && (
          <div style={{
            fontSize: 11, color: isDark ? "#f87171" : "#dc2626",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <AlertCircle style={{ width: 13, height: 13 }} />
            {error}
          </div>
        )}
        <p style={{ fontSize: 12, color: t.muted, margin: 0, textAlign: "center" }}>
          Generate a glass-etched schematic of this phase's deliverable
        </p>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={generate}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 14,
            background: isDark
              ? "linear-gradient(135deg, rgba(148,163,184,0.15), rgba(100,116,139,0.2))"
              : "linear-gradient(135deg, rgba(71,85,105,0.08), rgba(51,65,85,0.12))",
            border: `1px solid ${isDark ? "rgba(148,163,184,0.2)" : "rgba(71,85,105,0.15)"}`,
            color: t.title, fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          <Image style={{ width: 16, height: 16 }} />
          Generate Glass Schematic
        </motion.button>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div style={{
        ...glassSurface(t),
        padding: "40px 16px",
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 10, marginTop: 12,
      }}>
        <Loader2 style={{
          width: 24, height: 24, color: t.subtitle,
          animation: "spin 1s linear infinite",
        }} />
        <p style={{ fontSize: 12, color: t.muted, margin: 0 }}>
          Etching schematic onto glass…
        </p>
        <p style={{ fontSize: 10, color: t.muted, margin: 0, opacity: 0.6 }}>
          This takes about 10 seconds
        </p>
      </div>
    );
  }

  // Image rendered
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        ...glassSurface(t),
        padding: 12, marginTop: 12,
        overflow: "hidden",
      }}
    >
      {/* Header strip */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 8, paddingBottom: 8,
        borderBottom: `1px dashed ${isDark ? "rgba(148,163,184,0.15)" : "rgba(71,85,105,0.1)"}`,
      }}>
        <span style={{
          fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase",
          color: t.subtitle, fontWeight: 600,
        }}>
          Phase {step.step} — Technical Illustration
        </span>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={generate}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "4px 10px", borderRadius: 8,
            background: "transparent",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
            color: t.muted, fontSize: 10, cursor: "pointer",
          }}
        >
          <RefreshCw style={{ width: 11, height: 11 }} />
          Regenerate
        </motion.button>
      </div>

      {/* The illustration */}
      <img
        src={imageUrl}
        alt={`Technical illustration: ${step.title}`}
        style={{
          width: "100%",
          borderRadius: 12,
          display: "block",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
        }}
      />

      {/* Caption */}
      <p style={{
        fontSize: 10, color: t.muted, margin: "8px 0 0",
        textAlign: "center", fontStyle: "italic",
      }}>
        AI-generated reference — {step.title}
      </p>
    </motion.div>
  );
}