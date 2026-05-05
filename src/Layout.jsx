import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ThemeProvider, useTheme } from "@/components/theme/ThemeProvider";
import { ExecutionProvider } from "@/components/janus/ExecutionContext";
import { light, dark } from "@/components/ui/LiquidGlass";
import AmbientOrbs from "@/components/ui/AmbientOrbs";
import GlassTabBar from "@/components/ui/GlassTabBar";
import ThemeToggle from "@/components/theme/ThemeToggle";
import PageTransition from "@/components/ui/PageTransition";
import { Zap, ChevronLeft } from "lucide-react";
import useScrollDensity from "@/hooks/useScrollDensity";

// Routes that show a back button instead of just the logo
const CHILD_ROUTES = ["/Results", "/ABTest"];
const BACK_TARGETS = { "/Results": "/history", "/ABTest": "/diagnostics" };

function LayoutInner({ children }) {
  const { isDark } = useTheme();
  const t = isDark ? dark : light;
  const location = useLocation();
  const navigate = useNavigate();
  const { density, scrollY } = useScrollDensity();

  // Determine if page wants accessory content (could be extended per-page)
  const showAccessory = location.pathname === "/results";

  // Back button logic for child routes
  const isChildRoute = CHILD_ROUTES.some(r => location.pathname.toLowerCase() === r.toLowerCase());
  const backTarget = Object.entries(BACK_TARGETS).find(([k]) => location.pathname.toLowerCase() === k.toLowerCase())?.[1];

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

      {/* ─── TOP BAR (scroll-reactive glass strip) ─── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          isolation: "isolate",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 20px",
          paddingTop: "calc(10px + env(safe-area-inset-top, 0px))",
          paddingLeft: "calc(20px + env(safe-area-inset-left, 0px))",
          paddingRight: "calc(20px + env(safe-area-inset-right, 0px))",
          background: isDark
            ? `rgba(10,12,18,${density === "dense" ? 0.82 : density === "sparse" ? 0.6 : 0.72})`
            : `rgba(255,255,255,${density === "dense" ? 0.72 : density === "sparse" ? 0.5 : 0.62})`,
          backdropFilter: `blur(${density === "dense" ? 60 : density === "sparse" ? 36 : 48}px) saturate(${density === "dense" ? 200 : density === "sparse" ? 150 : 180}%)`,
          WebkitBackdropFilter: `blur(${density === "dense" ? 60 : density === "sparse" ? 36 : 48}px) saturate(${density === "dense" ? 200 : density === "sparse" ? 150 : 180}%)`,
          borderBottom: `1px solid ${isDark
            ? `rgba(255,255,255,${density === "dense" ? 0.08 : 0.05})`
            : `rgba(255,255,255,${density === "dense" ? 0.7 : 0.45})`}`,
          boxShadow: isDark
            ? "inset 0 -1px 0 0 rgba(255,255,255,0.04)"
            : `inset 0 -1px 0 0 rgba(0,0,0,0.02), 0 1px ${density === "dense" ? 12 : 6}px rgba(0,0,0,${density === "dense" ? 0.05 : 0.02})`,
          transition: "background 0.3s ease, backdrop-filter 0.3s ease, border-bottom 0.3s ease, box-shadow 0.3s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isChildRoute ? (
            <button
              onClick={() => navigate(backTarget || -1)}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                background: "none", border: "none", cursor: "pointer",
                padding: "4px 8px 4px 2px", borderRadius: 10,
                color: isDark ? "#a78bfa" : "#3b82f6",
                fontSize: 14, fontWeight: 500,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <ChevronLeft style={{ width: 20, height: 20 }} />
              Back
            </button>
          ) : (
            <>
              <Zap style={{ width: 18, height: 18, color: isDark ? "#a78bfa" : "#3b82f6" }} />
              <span style={{ fontWeight: 600, fontSize: 15, color: t.title, letterSpacing: "-0.3px" }}>
                Janus Blueprint
              </span>
              <span style={{ fontSize: 11, color: t.muted, marginLeft: 4 }}>
                CP-002 v1.5
              </span>
            </>
          )}
        </div>
        <ThemeToggle />
      </header>

      {/* ─── PAGE CONTENT ─── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          paddingBottom: "calc(100px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <AnimatePresence mode="wait">
          <PageTransition>
            {children}
          </PageTransition>
        </AnimatePresence>
      </div>

      {/* ─── FLOATING TAB BAR ─── */}
      <GlassTabBar />
    </div>
  );
}

export default function Layout({ children }) {
  return (
    <ThemeProvider>
      <ExecutionProvider>
        <LayoutInner>{children}</LayoutInner>
      </ExecutionProvider>
    </ThemeProvider>
  );
}