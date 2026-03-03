import React, { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, BookOpen, Brain, Shield, Rocket, Layers, Map, Download } from "lucide-react";
import { glassCard, glassSurface, glassTabActive } from "@/components/ui/LiquidGlass";

import RefreshTab from "@/components/janus/tabs/RefreshTab";
import CorpusTab from "@/components/janus/tabs/CorpusTab";
import CogitoTab from "@/components/janus/tabs/CogitoTab";
import AnimusTab from "@/components/janus/tabs/AnimusTab";
import ActusTab from "@/components/janus/tabs/ActusTab";
import SynthesisTab from "@/components/janus/tabs/SynthesisTab";
import BlueprintTab from "@/components/janus/tabs/BlueprintTab";
import ExportTab from "@/components/janus/tabs/ExportTab";

const tabDefs = {
  refresh:   { label: "Refresh",   icon: RefreshCw },
  corpus:    { label: "Corpus",    icon: BookOpen },
  cogito:    { label: "Cogito",    icon: Brain },
  animus:    { label: "Animus",    icon: Shield },
  actus:     { label: "Actus",     icon: Rocket },
  synthesis: { label: "Synthesis", icon: Layers },
  blueprint: { label: "Blueprint", icon: Map },
};

export default function GlassResultTabs({ run, mode, t, isDark, isAdmin }) {
  const availableTabs = [...mode.domains, "export"];
  const [active, setActive] = useState(availableTabs[0]);

  const renderContent = () => {
    switch (active) {
      case "refresh":   return <RefreshTab data={run.refresh} />;
      case "corpus":    return <CorpusTab data={run.corpus} />;
      case "cogito":    return <CogitoTab data={run.cogito} />;
      case "animus":    return <AnimusTab data={run.animus} />;
      case "actus":     return <ActusTab data={run.actus} />;
      case "synthesis": return <SynthesisTab data={run.synthesis} />;
      case "blueprint": return <BlueprintTab data={run.blueprint} blueprintLevel={run.blueprint_level} />;
      case "export":    return <ExportTab rawJson={run.raw_json} renderMd={run.render_md} fullPrompt={run.full_prompt} isAdmin={isAdmin} />;
      default:          return null;
    }
  };

  return (
    <div>
      {/* Tab strip — glass pill bar */}
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: "5px 6px",
          marginBottom: 16,
          overflowX: "auto",
          ...glassSurface(t),
          borderRadius: 999,
        }}
      >
        {availableTabs.map(tabKey => {
          const def = tabDefs[tabKey] || { label: "Export", icon: Download };
          const Icon = def.icon;
          const isActive = active === tabKey;
          return (
            <button
              key={tabKey}
              onClick={() => setActive(tabKey)}
              style={{
                flex: "1 0 auto",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                padding: "8px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? t.tabTextActive : t.tabText,
                background: isActive ? (isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.65)") : "transparent",
                border: isActive ? `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.85)"}` : "1px solid transparent",
                boxShadow: isActive ? (isDark ? "inset 0 1px 0 0 rgba(255,255,255,0.08), 0 1px 4px rgba(0,0,0,0.15)" : "inset 0 1px 0 0 rgba(255,255,255,0.9), 0 1px 4px rgba(0,0,0,0.04)") : "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
              }}
            >
              <Icon style={{ width: 13, height: 13 }} />
              <span className="hidden sm:inline">{def.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content area */}
      <motion.div
        key={active}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        style={{ ...glassCard(t), overflow: "hidden" }}
      >
        {renderContent()}
      </motion.div>
    </div>
  );
}