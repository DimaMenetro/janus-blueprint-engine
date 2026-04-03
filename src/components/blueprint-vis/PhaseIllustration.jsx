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

function buildPrompt(step, goalContext) {
  const title = step.title || "Component";
  const instructions = step.instructions || "";
  const outputs = (step.outputs || []).join(", ");
  const substepDetails = (step.substeps || [])
    .map(s => s.details || s.substep || "")
    .filter(Boolean)
    .join("; ");

  // Combine all available detail into a rich prompt
  const details = [instructions, substepDetails, outputs].filter(Boolean).join(". ");

  return [
    `Technical blueprint illustration, engineering schematic style, on white/light gray background.`,
    `Subject: "${title}" — a physical component or assembly.`,
    goalContext ? `Part of a larger project: ${goalContext}.` : "",
    `Details to incorporate: ${details.slice(0, 600)}.`,
    `Style: Clean technical drawing with labeled callouts, cross-section views where appropriate,`,
    `dimensioned proportions, exploded view showing internal components if applicable.`,
    `Monochrome linework with subtle blue accent lines. Engineering paper aesthetic.`,
    `Professional CAD/technical illustration quality. No photorealism — clean vector-style linework.`,
  ].filter(Boolean).join(" ");
}

// Simple in-memory cache so we don't re-generate on every expand
const imageCache = {};

export default function PhaseIllustration({ step, goalContext, isDark, t }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cacheKey = `phase-${step.step}-${step.title}`;
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
    const prompt = buildPrompt(step, goalContext);
    const result = await base44.integrations.Core.GenerateImage({ prompt });
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
          Generate a technical illustration of what this phase's deliverable looks like
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
          Generate Blueprint Drawing
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
          Generating technical illustration…
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