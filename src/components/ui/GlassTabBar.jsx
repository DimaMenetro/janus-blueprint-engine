/**
 * Liquid Glass Tab Bar — iOS 26 style floating pill nav
 * 
 * Architecture:
 * ┌─────────────────────────────────────┐
 * │  Context Accessory Bar (optional)   │  ← glassAccessory
 * ├─────────────────────────────────────┤
 * │  ● Tab  ● Tab  ● Tab  ● Tab        │  ← glassTabBar  
 * └─────────────────────────────────────┘
 * 
 * The active tab gets a glass capsule indicator that slides
 * behind it via spring animation. Background color bleeds
 * through the glass — this is the key visual effect.
 */

import React, { useRef, useLayoutEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, History, FileText, Zap } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { 
  light, dark,
  glassTabBar, glassTabActive
} from "@/components/ui/LiquidGlass";
import BottomAccessory from "@/components/ui/BottomAccessory";

const tabs = [
  { path: "/NewQuery",       label: "New",       icon: Plus },
  { path: "/history",        label: "History",   icon: History },
  { path: "/BlueprintPrint", label: "Blueprint", icon: FileText },
  { path: "/diagnostics",    label: "Diag",      icon: Zap },
];

export default function GlassTabBar() {
  const location = useLocation();
  const { isDark } = useTheme();
  const t = isDark ? dark : light;
  const tabRefs = useRef([]);
  const containerRef = useRef(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const activeIndex = tabs.findIndex(tab => location.pathname === tab.path);

  // Measure active tab position for sliding indicator
  useLayoutEffect(() => {
    if (activeIndex >= 0 && tabRefs.current[activeIndex] && containerRef.current) {
      const tabEl = tabRefs.current[activeIndex];
      const containerEl = containerRef.current;
      const tabRect = tabEl.getBoundingClientRect();
      const containerRect = containerEl.getBoundingClientRect();
      setIndicator({
        left: tabRect.left - containerRect.left,
        width: tabRect.width,
      });
    }
  }, [activeIndex, location.pathname]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
        paddingLeft: "calc(16px + env(safe-area-inset-left, 0px))",
        paddingRight: "calc(16px + env(safe-area-inset-right, 0px))",
        pointerEvents: "none",
      }}
    >
      {/* ─── CONTEXT-AWARE BOTTOM ACCESSORY ─── */}
      <div style={{ pointerEvents: "auto", marginBottom: 8, display: "flex", justifyContent: "center", width: "100%" }}>
        <BottomAccessory />
      </div>

      {/* ─── TAB BAR PILL ─── */}
      <nav
        ref={containerRef}
        style={{
          ...glassTabBar(t),
          isolation: "isolate",
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "6px 8px",
          position: "relative",
          maxWidth: 440,
          width: "100%",
          pointerEvents: "auto",
        }}
      >
        {/* Sliding active indicator — the glass capsule */}
        {activeIndex >= 0 && indicator.width > 0 && (
          <motion.div
            layoutId="tab-indicator"
            style={{
              position: "absolute",
              top: 5,
              bottom: 5,
              ...glassTabActive(t, { density: "focused" }),
            }}
            animate={{
              left: indicator.left,
              width: indicator.width,
            }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          />
        )}

        {tabs.map((tab, idx) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              ref={el => tabRefs.current[idx] = el}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                padding: "8px 4px",
                textDecoration: "none",
                position: "relative",
                zIndex: 2,
                transition: "color 0.2s ease",
              }}
            >
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <Icon
                  style={{
                    width: 20,
                    height: 20,
                    color: isActive ? t.tabTextActive : t.tabText,
                    transition: "color 0.25s ease",
                    strokeWidth: isActive ? 2.2 : 1.8,
                  }}
                />
              </motion.div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? t.tabTextActive : t.tabText,
                  letterSpacing: "0.01em",
                  transition: "color 0.25s ease, font-weight 0.25s ease",
                }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}