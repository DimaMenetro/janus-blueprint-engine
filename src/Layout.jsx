import React from "react";
import { useLocation } from "react-router-dom";
import { ThemeProvider, useTheme } from "@/components/theme/ThemeProvider";
import { light, dark } from "@/components/ui/LiquidGlass";
import AmbientOrbs from "@/components/ui/AmbientOrbs";
import GlassTabBar from "@/components/ui/GlassTabBar";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { Zap } from "lucide-react";

function LayoutInner({ children }) {
  const { isDark } = useTheme();
  const t = isDark ? dark : light;
  const location = useLocation();

  // Determine if page wants accessory content (could be extended per-page)
  const showAccessory = location.pathname === "/results";

  return (
    <div
      style={{
        minHeight: "100svh",
        width: "100%",
        background: t.page,
        position: "relative",
        transition: "background 0.5s ease",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Ambient orbs — bleed through glass */}
      <AmbientOrbs t={t} />

      {/* ─── TOP BAR (minimal glass strip) ─── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 20px",
          background: isDark ? "rgba(10,12,18,0.6)" : "rgba(255,255,255,0.35)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.6)"}`,
          boxShadow: isDark
            ? "inset 0 -1px 0 0 rgba(255,255,255,0.04)"
            : "inset 0 -1px 0 0 rgba(0,0,0,0.02), 0 1px 8px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Zap style={{ width: 18, height: 18, color: isDark ? "#a78bfa" : "#3b82f6" }} />
          <span style={{ fontWeight: 600, fontSize: 15, color: t.title, letterSpacing: "-0.3px" }}>
            Janus Blueprint
          </span>
          <span style={{ fontSize: 11, color: t.muted, marginLeft: 4 }}>
            CP-002 v1.5
          </span>
        </div>
        <ThemeToggle />
      </header>

      {/* ─── PAGE CONTENT ─── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          paddingBottom: 100, // space for floating tab bar
        }}
      >
        {children}
      </div>

      {/* ─── FLOATING TAB BAR ─── */}
      <GlassTabBar />
    </div>
  );
}

export default function Layout({ children }) {
  return (
    <ThemeProvider>
      <LayoutInner>{children}</LayoutInner>
    </ThemeProvider>
  );
}