import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Circle, ExternalLink, Copy, Play, FileJson, FileText } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { light, dark, glassCard, glassSurface, glassBtn } from "@/components/ui/LiquidGlass";
import { navigationLogger } from "@/components/diagnostics/NavigationLogger";
import { EXECUTION_MODES, validateJanusOutput } from "@/components/janus/janusSchema";
import { reconstructFullJson, reconstructFullMarkdown } from "@/components/janus/exportUtils";
import { PAGES } from "@/pages.config";
import { base44 } from "@/api/base44Client";
import GoldenRunCapture from "@/components/diagnostics/GoldenRunCapture";

const STATUS_CONFIG = {
  PASS: { icon: CheckCircle2, label: "PASS", color: (d) => d ? "#4ade80" : "#16a34a", bg: (d) => d ? "rgba(74,222,128,0.1)" : "rgba(240,253,244,0.6)" },
  FAIL: { icon: XCircle, label: "FAIL", color: (d) => d ? "#f87171" : "#dc2626", bg: (d) => d ? "rgba(248,113,113,0.1)" : "rgba(254,226,226,0.6)" },
  WARN: { icon: AlertTriangle, label: "WARN", color: (d) => d ? "#fbbf24" : "#d97706", bg: (d) => d ? "rgba(251,191,36,0.1)" : "rgba(254,243,199,0.6)" },
  NOT_RUN: { icon: Circle, label: "NOT RUN", color: (d) => d ? "#64748b" : "#94a3b8", bg: (d) => d ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.3)" },
};

const ROUTES = [
  { path: "/", name: "Root (main page)" },
  { path: "/NewQuery", name: "New Query" },
  { path: "/History", name: "History" },
  { path: "/Results", name: "Results" },
  { path: "/Diagnostics", name: "Diagnostics" },
  { path: "/ABTest", name: "AB Test" },
  { path: "/BlueprintPrint", name: "Blueprint Print" },
  { path: "/BackendRun", name: "Backend Run" },
  { path: "/BackendRuns", name: "Backend Runs" },
];

// Routes wired explicitly in App.jsx outside the pagesConfig loop
const EXPLICIT_ROUTES = ["/BackendRun", "/BackendRuns"];

function StatusBadge({ status, isDark }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.NOT_RUN;
  const Icon = cfg.icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600,
      color: cfg.color(isDark), background: cfg.bg(isDark),
      border: `1px solid ${cfg.color(isDark)}22`,
    }}>
      <Icon style={{ width: 12, height: 12 }} />
      {cfg.label}
    </span>
  );
}

export default function Diagnostics() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const t = isDark ? dark : light;

  const [routeTests, setRouteTests] = useState({});
  const [dependencyTest, setDependencyTest] = useState({ status: "NOT_RUN", details: "" });
  const [exportTest, setExportTest] = useState({ status: "NOT_RUN", details: "" });
  const [backendTest, setBackendTest] = useState({ status: "NOT_RUN", details: "" });
  const [navLog, setNavLog] = useState([]);

  useEffect(() => { setNavLog(navigationLogger.getRecent(10)); }, [location.pathname]);

  // ── REAL TESTS — every result below is derived from the live app, never hardcoded ──

  // Route registry check: compares each path against the ACTUAL registered routes
  // (pages.config keys + explicit App.jsx routes). Case-insensitive, matching
  // React Router v6 default behavior.
  const runRouteTests = () => {
    const registered = ["/", ...Object.keys(PAGES).map(k => `/${k}`), ...EXPLICIT_ROUTES]
      .map(p => p.toLowerCase());
    const results = {};
    ROUTES.forEach(route => {
      const found = registered.includes(route.path.toLowerCase());
      results[route.path] = found
        ? { status: "PASS", details: "Registered" }
        : { status: "FAIL", details: "Not registered in router" };
    });
    setRouteTests(results);
  };

  // Dependency check: verifies EXECUTION_MODES structure AND exercises the real
  // schema validator with an invalid payload it must reject.
  const runDependencyTest = () => {
    const problems = [];
    const modes = Object.keys(EXECUTION_MODES);
    ["QUICK", "STANDARD", "FULL"].forEach(m => { if (!modes.includes(m)) problems.push(`missing mode ${m}`); });
    modes.forEach(m => {
      const cfg = EXECUTION_MODES[m];
      if (!cfg?.id || !Array.isArray(cfg?.domains) || cfg.domains.length === 0) problems.push(`${m}: malformed config`);
    });
    try {
      const check = validateJanusOutput({}, ["corpus"]);
      if (check.valid) problems.push("validator failed to flag missing domain");
    } catch (e) {
      problems.push(`validator threw: ${e.message}`);
    }
    setDependencyTest(problems.length === 0
      ? { status: "PASS", details: `${modes.length} modes OK; schema validator operational` }
      : { status: "FAIL", details: problems.join("; ") });
  };

  // Export pipeline check: pulls the latest COMPLETED run from the database and
  // runs the real JSON + Markdown reconstruction on it. No LLM/credit cost.
  const runExportTest = async () => {
    setExportTest({ status: "NOT_RUN", details: "Running…" });
    try {
      const runs = await base44.entities.Run.filter({ status: "completed" }, "-created_date", 1);
      if (!runs.length) {
        setExportTest({ status: "WARN", details: "No completed runs in database — nothing to export" });
        return;
      }
      const run = runs[0];
      const json = reconstructFullJson(run);
      const md = reconstructFullMarkdown(run);
      const parsed = JSON.parse(json);
      const domains = Object.keys(parsed).filter(k => k !== "_meta");
      const ok = parsed._meta?.run_id === run.id && domains.length > 0 && md.length > 200;
      setExportTest(ok
        ? { status: "PASS", details: `Run …${run.id.slice(-6)}: JSON ${(json.length / 1024).toFixed(1)} KB, MD ${(md.length / 1024).toFixed(1)} KB (${domains.length} domains)` }
        : { status: "FAIL", details: `Export incomplete — ${domains.length} domains, MD ${md.length} chars` });
    } catch (e) {
      setExportTest({ status: "FAIL", details: e.message });
    }
  };

  // Backend health check: invokes runJanusPipeline with an empty payload.
  // Reachable + correct 400 rejection = PASS. Zero LLM/credit cost.
  const runBackendTest = async () => {
    setBackendTest({ status: "NOT_RUN", details: "Running…" });
    try {
      await base44.functions.invoke("runJanusPipeline", {});
      setBackendTest({ status: "FAIL", details: "Expected 400 rejection for empty payload, got success" });
    } catch (e) {
      const code = e?.response?.status;
      setBackendTest(code === 400
        ? { status: "PASS", details: "runJanusPipeline reachable; rejected empty payload (400) as designed" }
        : { status: "FAIL", details: `Unexpected response: ${code || e.message}` });
    }
  };

  const runAll = async () => {
    runRouteTests();
    runDependencyTest();
    await Promise.all([runExportTest(), runBackendTest()]);
  };

  const copyReport = () => {
    const lines = [
      "=== JANUS DIAGNOSTICS REPORT ===",
      `Time: ${new Date().toISOString()}`,
      `Current route: ${location.pathname}`,
      "",
      "-- Route Tests --",
      ...ROUTES.map(r => `${r.path}: ${routeTests[r.path]?.status || "NOT_RUN"}${routeTests[r.path]?.details ? " — " + routeTests[r.path].details : ""}`),
      "",
      `Dependencies: ${dependencyTest.status}${dependencyTest.details ? " — " + dependencyTest.details : ""}`,
      `Export Pipeline: ${exportTest.status}${exportTest.details ? " — " + exportTest.details : ""}`,
      `Backend Function: ${backendTest.status}${backendTest.details ? " — " + backendTest.details : ""}`,
      "",
      "-- Recent Navigation --",
      ...(navLog.length ? navLog.map(ev => `${ev.timestamp} ${ev.from || "(start)"} → ${ev.to}`) : ["(no events)"]),
    ];
    navigator.clipboard.writeText(lines.join("\n"));
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 20px 40px" }}>
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: t.title, margin: "0 0 4px" }}>System Diagnostics</h1>
          <p style={{ fontSize: 13, color: t.subtitle, margin: 0 }}>CP-002 v1.5 — Test Suite</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={copyReport}
            style={{ ...glassSurface(t), padding: "8px 14px", fontSize: 12, fontWeight: 600, color: t.subtitle, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Copy style={{ width: 13, height: 13 }} /> Copy Report
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={runAll}
            style={{ ...glassBtn(t), padding: "0 16px", height: 36, fontSize: 12, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <Play style={{ width: 13, height: 13 }} /> Run All
          </motion.button>
        </div>
      </motion.div>

      {/* Navigation quick links */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}
        style={{ ...glassCard(t), padding: "18px 20px", marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: t.title, marginBottom: 12 }}>Navigation</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
          {ROUTES.map(route => (
            <motion.button key={route.path} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate(route.path)}
              style={{ ...glassSurface(t), padding: "10px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}>
              <ExternalLink style={{ width: 14, height: 14, color: t.muted }} />
              <span style={{ fontSize: 11, fontFamily: "monospace", color: t.subtitle }}>{route.path}</span>
            </motion.button>
          ))}
        </div>
        <div style={{ ...glassSurface(t), marginTop: 10, padding: "8px 12px" }}>
          <span style={{ fontSize: 11, color: t.muted }}>Current: <span style={{ fontFamily: "monospace", color: t.title }}>{location.pathname}</span></span>
        </div>
      </motion.div>

      {/* IMP-002 Phase -1.5 — Golden Run Capture (TEMP, removed at -1.8) */}
      <GoldenRunCapture />

      {/* Route tests */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
        style={{ ...glassCard(t), padding: "18px 20px", marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: t.title, marginBottom: 12 }}>Route Tests</h2>
        {ROUTES.map(route => (
          <div key={route.path} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` }}>
            <span style={{ fontSize: 13, fontFamily: "monospace", color: t.text }}>{route.path}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {routeTests[route.path]?.details && (
                <span style={{ fontSize: 11, color: t.muted }}>{routeTests[route.path].details}</span>
              )}
              <StatusBadge status={routeTests[route.path]?.status || "NOT_RUN"} isDark={isDark} />
            </div>
          </div>
        ))}
      </motion.div>

      {/* Dependency & Export */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 16 }}>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}
          style={{ ...glassCard(t), padding: "18px 20px" }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: t.title, marginBottom: 10 }}>Dependencies</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <StatusBadge status={dependencyTest.status} isDark={isDark} />
            <span style={{ fontSize: 12, color: t.subtitle }}>{dependencyTest.details || "Not run"}</span>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          style={{ ...glassCard(t), padding: "18px 20px" }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: t.title, marginBottom: 10 }}>Export Pipeline</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <StatusBadge status={exportTest.status} isDark={isDark} />
            <span style={{ fontSize: 12, color: t.subtitle }}>{exportTest.details || "Not run"}</span>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ ...glassCard(t), padding: "18px 20px" }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: t.title, marginBottom: 10 }}>Backend Function</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <StatusBadge status={backendTest.status} isDark={isDark} />
            <span style={{ fontSize: 12, color: t.subtitle }}>{backendTest.details || "Not run"}</span>
          </div>
        </motion.div>
      </div>

      {/* Nav log */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        style={{ ...glassCard(t), padding: "18px 20px" }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: t.title, marginBottom: 10 }}>Navigation Log</h2>
        <div style={{
          background: isDark ? "rgba(0,0,0,0.4)" : "rgba(15,23,42,0.85)",
          borderRadius: 12, padding: 14, fontFamily: "monospace", fontSize: 11, color: "#e2e8f0",
          maxHeight: 200, overflow: "auto",
        }}>
          {navLog.length === 0 ? (
            <span style={{ color: "#64748b" }}>No events yet</span>
          ) : navLog.map((event, idx) => (
            <div key={idx} style={{ marginBottom: 2 }}>
              <span style={{ color: "#64748b" }}>{event.timestamp}</span>{" → "}
              <span style={{ color: "#4ade80" }}>{event.from || "(start)"}</span>{" → "}
              <span style={{ color: "#60a5fa" }}>{event.to}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}