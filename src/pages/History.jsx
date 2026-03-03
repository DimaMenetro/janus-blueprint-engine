import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Search, History as HistoryIcon, Zap } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { light, dark, glassCard, glassSurface, glassBtn } from "@/components/ui/LiquidGlass";
import GlassRunCard from "@/components/janus/GlassRunCard";

export default function History() {
  const { isDark } = useTheme();
  const t = isDark ? dark : light;
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadRuns = async () => {
      const data = await base44.entities.Run.list("-created_date", 100);
      setRuns(data);
      setLoading(false);
    };
    loadRuns();
  }, []);

  const filteredRuns = runs.filter(run =>
    run.query_text?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px 40px" }}>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <HistoryIcon style={{ width: 24, height: 24, color: isDark ? "#a78bfa" : "#3b82f6" }} />
          <h1 style={{ fontSize: 24, fontWeight: 700, color: t.title, margin: 0 }}>Run History</h1>
        </div>
        <Link to="/NewQuery" style={{ textDecoration: "none" }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ ...glassBtn(t), padding: "0 18px", height: 38, fontSize: 13, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
          >
            <Plus style={{ width: 15, height: 15 }} />
            New Query
          </motion.button>
        </Link>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{ position: "relative", marginBottom: 20 }}
      >
        <Search style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: t.muted }} />
        <input
          placeholder="Search by keyword..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            ...glassSurface(t),
            width: "100%",
            padding: "12px 14px 12px 40px",
            fontSize: 14,
            fontWeight: 500,
            color: t.title,
            outline: "none",
            fontFamily: "inherit",
          }}
        />
      </motion.div>

      {/* Content */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ ...glassCard(t), height: 72, opacity: 0.5 }} />
          ))}
        </div>
      ) : filteredRuns.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ ...glassCard(t), textAlign: "center", padding: "48px 24px" }}
        >
          <Zap style={{ width: 40, height: 40, color: isDark ? "#7c3aed" : "#93c5fd", margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: 17, fontWeight: 600, color: t.title, marginBottom: 8 }}>
            {searchQuery ? "No matching runs" : "No runs yet"}
          </h3>
          <p style={{ fontSize: 14, color: t.subtitle, marginBottom: 20 }}>
            {searchQuery ? "Try a different search term" : "Execute your first Janus query to get started"}
          </p>
          {!searchQuery && (
            <Link to="/NewQuery" style={{ textDecoration: "none" }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ ...glassBtn(t), padding: "0 24px", height: 42, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}
              >
                <Plus style={{ width: 16, height: 16 }} />
                Create First Query
              </motion.button>
            </Link>
          )}
        </motion.div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredRuns.map((run, i) => (
            <motion.div
              key={run.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <GlassRunCard run={run} t={t} isDark={isDark} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}