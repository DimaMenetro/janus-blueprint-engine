import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { glassSurface } from "@/components/ui/LiquidGlass";

export default function GlassSelect({ label, value, onChange, options, t, isDark }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: t.title, display: "block", marginBottom: 8 }}>
        {label}
      </label>
      <button
        onClick={() => setOpen(!open)}
        style={{
          ...glassSurface(t),
          width: "100%",
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 500,
          color: t.title,
          textAlign: "left",
        }}
      >
        <span>{selected?.label || value}</span>
        <ChevronDown style={{
          width: 14, height: 14, color: t.muted,
          transition: "transform 0.2s ease",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
        }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0, right: 0,
              zIndex: 100,
              background: isDark ? "rgba(18,22,30,0.95)" : "rgba(248,250,252,0.95)",
              backdropFilter: "blur(40px) saturate(180%)",
              WebkitBackdropFilter: "blur(40px) saturate(180%)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.7)"}`,
              boxShadow: isDark ? "0 16px 48px rgba(0,0,0,0.5)" : "0 16px 48px rgba(100,110,160,0.12)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: 13,
                  fontWeight: opt.value === value ? 600 : 400,
                  color: opt.value === value ? (isDark ? "#a78bfa" : "#3b82f6") : t.text,
                  background: opt.value === value ? (isDark ? "rgba(139,92,246,0.08)" : "rgba(59,130,246,0.06)") : "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s ease",
                  display: "block",
                }}
                onMouseEnter={e => e.target.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"}
                onMouseLeave={e => e.target.style.background = opt.value === value ? (isDark ? "rgba(139,92,246,0.08)" : "rgba(59,130,246,0.06)") : "transparent"}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}