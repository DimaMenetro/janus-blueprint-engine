/**
 * Blueprint Print Page — Isolated testing module
 * 
 * Loads existing completed runs with blueprints, lets user select one,
 * renders the BlueprintPrintView, and offers PDF download + browser print.
 */

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Download, Printer, Loader2, FileText, ChevronDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useTheme } from "@/components/theme/ThemeProvider";
import { light, dark, glassCard, glassSurface, glassBtn } from "@/components/ui/LiquidGlass";
import BlueprintPrintView from "@/components/blueprint-print/BlueprintPrintView";

export default function BlueprintPrint() {
  const { isDark } = useTheme();
  const t = isDark ? dark : light;
  const printRef = useRef(null);

  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState(null);
  const [loadingRun, setLoadingRun] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fetch runs that have blueprints
  useEffect(() => {
    async function fetchRuns() {
      const allRuns = await base44.entities.Run.list("-created_date", 50);
      const withBlueprint = allRuns.filter(r => r.blueprint && r.status === "completed");
      setRuns(withBlueprint);
      setLoading(false);
    }
    fetchRuns();
  }, []);

  const selectRun = async (run) => {
    setLoadingRun(true);
    setDropdownOpen(false);
    // Full run data is already in list — use it directly
    setSelectedRun(run);
    setLoadingRun(false);
  };

  // PDF export via html2canvas + jsPDF
  const exportPDF = async () => {
    if (!printRef.current) return;
    setExporting(true);

    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: isDark ? "#0a0e1a" : "#f5f0e8",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const imgWidth = 210; // A4 mm
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF("p", "mm", "a4");
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const title = selectedRun?.query_text?.slice(0, 40) || "blueprint";
    pdf.save(`janus-blueprint-${title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
    setExporting(false);
  };

  // Browser print
  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open("", "_blank");
    const htmlContent = printRef.current.outerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Janus Blueprint</title>
        <style>
          body { margin: 0; padding: 0; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>${htmlContent}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const queryLabel = (run) => {
    const q = run.query_text || "Untitled";
    const short = q.length > 50 ? q.slice(0, 50) + "…" : q;
    const date = new Date(run.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${short} (${date})`;
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 20px 100px" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 20 }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 700, color: t.title, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 10 }}>
          <FileText style={{ width: 20, height: 20, color: isDark ? "#d4956a" : "#b45309" }} />
          Blueprint Print
        </h1>
        <p style={{ fontSize: 13, color: t.subtitle, margin: 0 }}>
          Render completed blueprints as sacred technical documents
        </p>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ ...glassCard(t), padding: "18px 22px", marginBottom: 24, overflow: "visible" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {/* Run selector dropdown */}
          <div style={{ flex: 1, minWidth: 200, position: "relative", zIndex: 60 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: t.label, marginBottom: 4, display: "block" }}>
              Select a completed run
            </label>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 14,
                fontSize: 12,
                color: selectedRun ? t.title : t.muted,
                background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.5)",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                cursor: loading ? "not-allowed" : "pointer",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {loading ? "Loading runs…" : selectedRun ? queryLabel(selectedRun) : "Choose a run…"}
              </span>
              <ChevronDown style={{ width: 14, height: 14, color: t.muted, flexShrink: 0 }} />
            </button>

            {dropdownOpen && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                marginTop: 4,
                maxHeight: 260,
                overflowY: "auto",
                background: isDark ? "rgba(15,18,30,0.95)" : "rgba(255,255,255,0.95)",
                backdropFilter: "blur(20px)",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                borderRadius: 12,
                zIndex: 50,
                boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
              }}>
                {runs.length === 0 ? (
                  <div style={{ padding: "12px 14px", fontSize: 12, color: t.muted }}>No runs with blueprints found</div>
                ) : (
                  runs.map((run) => (
                    <button
                      key={run.id}
                      onClick={() => selectRun(run)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        fontSize: 12,
                        color: t.text,
                        background: "none",
                        border: "none",
                        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}`,
                        cursor: "pointer",
                        textAlign: "left",
                        display: "block",
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"}
                      onMouseOut={(e) => e.currentTarget.style.background = "none"}
                    >
                      {queryLabel(run)}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Export buttons */}
          <div style={{ display: "flex", gap: 8, alignSelf: "flex-end" }}>
            <motion.button
              whileHover={selectedRun ? { scale: 1.02 } : {}}
              whileTap={selectedRun ? { scale: 0.98 } : {}}
              onClick={exportPDF}
              disabled={!selectedRun || exporting}
              style={{
                ...glassBtn(t),
                padding: "0 18px",
                height: 38,
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: !selectedRun || exporting ? "not-allowed" : "pointer",
                opacity: !selectedRun || exporting ? 0.4 : 1,
              }}
            >
              {exporting ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} /> : <Download style={{ width: 13, height: 13 }} />}
              {exporting ? "Exporting…" : "PDF"}
            </motion.button>

            <motion.button
              whileHover={selectedRun ? { scale: 1.02 } : {}}
              whileTap={selectedRun ? { scale: 0.98 } : {}}
              onClick={handlePrint}
              disabled={!selectedRun}
              style={{
                ...glassSurface(t),
                padding: "0 18px",
                height: 38,
                fontSize: 12,
                fontWeight: 600,
                color: t.subtitle,
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: !selectedRun ? "not-allowed" : "pointer",
                opacity: !selectedRun ? 0.4 : 1,
              }}
            >
              <Printer style={{ width: 13, height: 13 }} />
              Print
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Blueprint render area */}
      {loadingRun && (
        <div style={{ textAlign: "center", padding: 60 }}>
          <Loader2 style={{ width: 24, height: 24, color: t.muted, animation: "spin 1s linear infinite", margin: "0 auto" }} />
          <p style={{ fontSize: 12, color: t.muted, marginTop: 10 }}>Loading blueprint…</p>
        </div>
      )}

      {selectedRun && !loadingRun && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            borderRadius: 4,
            overflow: "hidden",
            boxShadow: isDark
              ? "0 12px 48px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)"
              : "0 12px 48px rgba(100,80,60,0.12), 0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <BlueprintPrintView ref={printRef} run={selectedRun} isDark={isDark} />
        </motion.div>
      )}

      {/* Empty state */}
      {!selectedRun && !loadingRun && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            ...glassSurface(t),
            padding: "60px 20px",
            textAlign: "center",
          }}
        >
          <FileText style={{ width: 32, height: 32, color: t.muted, margin: "0 auto 12px" }} />
          <p style={{ fontSize: 14, color: t.subtitle, margin: "0 0 4px" }}>Select a completed run to preview its blueprint</p>
          <p style={{ fontSize: 12, color: t.muted, margin: 0 }}>The blueprint will render in the sacred document format</p>
        </motion.div>
      )}
    </div>
  );
}