import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { light, dark, glassCard, glassSurface } from "@/components/ui/LiquidGlass";
import ABTestRunner from "@/components/abtest/ABTestRunner";
import QualityComparison from "@/components/abtest/QualityComparison";
import BlueprintOutput from "@/components/abtest/BlueprintOutput";

export default function ABTest() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const t = isDark ? dark : light;
  const [results, setResults] = useState(null);
  const [activeOutput, setActiveOutput] = useState("side-by-side"); // "side-by-side" | "a" | "b"

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px 60px" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/diagnostics")}
            style={{ ...glassSurface(t), padding: "8px 14px", fontSize: 12, fontWeight: 500, color: t.subtitle, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            <ArrowLeft style={{ width: 14, height: 14 }} /> Diagnostics
          </motion.button>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: t.title, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <FlaskConical style={{ width: 20, height: 20, color: isDark ? "#a78bfa" : "#7c3aed" }} />
              Blueprint AB Test
            </h1>
            <p style={{ fontSize: 12, color: t.subtitle, margin: "2px 0 0" }}>
              Variant A (Monolithic) vs Variant B (Split 3-Call + Compression)
            </p>
          </div>
        </div>
      </motion.div>

      {/* Runner panel */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ ...glassCard(t), padding: "20px 24px", marginBottom: 20 }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 600, color: t.title, marginBottom: 14 }}>Configure & Execute</h2>
        <ABTestRunner t={t} isDark={isDark} onResults={setResults} />
      </motion.div>

      {/* Results */}
      {results && (
        <>
          {/* Run metadata */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ ...glassSurface(t), padding: "12px 18px", marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 16, fontSize: 12 }}
          >
            <span style={{ color: t.subtitle }}>Query: <strong style={{ color: t.title }}>{results.query_text}</strong></span>
            <span style={{ color: t.subtitle }}>Level: <strong style={{ color: t.title }}>{results.blueprint_level || "L2"}</strong></span>
            <span style={{ color: t.subtitle }}>Novelty: <strong style={{ color: t.title }}>{results.novelty_dial || "medium"}</strong></span>
            {results.has_synthesis && <span style={{ color: isDark ? "#60a5fa" : "#2563eb", fontWeight: 600 }}>Has Synthesis</span>}
            {results.has_intersection_matrix && <span style={{ color: isDark ? "#a78bfa" : "#7c3aed", fontWeight: 600 }}>Has Matrix</span>}
          </motion.div>

          {/* Quality comparison */}
          {results.variant_a && results.variant_b && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ ...glassCard(t), padding: "20px 24px", marginBottom: 20 }}
            >
              <h2 style={{ fontSize: 15, fontWeight: 600, color: t.title, marginBottom: 14 }}>Quality Comparison</h2>
              <QualityComparison results={results} t={t} isDark={isDark} />
            </motion.div>
          )}

          {/* Output toggle */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {["side-by-side", "a", "b"].map((view) => {
              const labels = { "side-by-side": "Side by Side", a: "Variant A Only", b: "Variant B Only" };
              return (
                <motion.button
                  key={view}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveOutput(view)}
                  style={{
                    ...glassSurface(t),
                    padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    color: activeOutput === view ? (isDark ? "#a78bfa" : "#3b82f6") : t.subtitle,
                    border: `1px solid ${activeOutput === view ? (isDark ? "rgba(167,139,250,0.3)" : "rgba(59,130,246,0.3)") : "transparent"}`,
                  }}
                >
                  {labels[view]}
                </motion.button>
              );
            })}
          </div>

          {/* Blueprint outputs */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: "grid",
              gridTemplateColumns: activeOutput === "side-by-side" ? "1fr 1fr" : "1fr",
              gap: 20,
            }}
          >
            {(activeOutput === "side-by-side" || activeOutput === "a") && results.variant_a && (
              <div style={{ ...glassCard(t), padding: "20px 22px", overflow: "hidden" }}>
                <BlueprintOutput
                  variantData={results.variant_a}
                  variantLabel="Variant A — Monolithic"
                  color={isDark ? "#f97316" : "#ea580c"}
                  t={t}
                  isDark={isDark}
                />
              </div>
            )}
            {(activeOutput === "side-by-side" || activeOutput === "b") && results.variant_b && (
              <div style={{ ...glassCard(t), padding: "20px 22px", overflow: "hidden" }}>
                <BlueprintOutput
                  variantData={results.variant_b}
                  variantLabel="Variant B — Split 3-Call"
                  color={isDark ? "#a78bfa" : "#7c3aed"}
                  t={t}
                  isDark={isDark}
                />
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}