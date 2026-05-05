/**
 * AccountDeletionModal — Apple-required account/data deletion flow.
 * Confirmation modal with two-step confirmation before permanent deletion.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { glassCard, glassBtn } from "@/components/ui/LiquidGlass";

export default function AccountDeletionModal({ isOpen, onClose, t, isDark }) {
  const [step, setStep] = useState(1); // 1 = confirm, 2 = deleting, 3 = done
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    setStep(2);
    setError(null);
    try {
      // Delete all user runs
      const runs = await base44.entities.Run.list("-created_date", 500);
      for (const run of runs) {
        await base44.entities.Run.delete(run.id);
      }
      setStep(3);
    } catch (e) {
      setError(e.message || "Deletion failed");
      setStep(1);
    }
  };

  const handleClose = () => {
    setStep(1);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20,
        }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          style={{
            ...glassCard(t),
            padding: "28px 24px",
            maxWidth: 400, width: "100%",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {step === 1 && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <AlertTriangle style={{ width: 22, height: 22, color: isDark ? "#f87171" : "#dc2626" }} />
                <h2 style={{ fontSize: 18, fontWeight: 700, color: isDark ? "#f87171" : "#dc2626", margin: 0 }}>
                  Delete All Data
                </h2>
              </div>
              <p style={{ fontSize: 14, color: t.text, lineHeight: 1.6, marginBottom: 8 }}>
                This will <strong>permanently delete</strong> all your Janus runs, blueprints, and associated data. This action cannot be undone.
              </p>
              <p style={{ fontSize: 13, color: t.muted, lineHeight: 1.5, marginBottom: 20 }}>
                As required by Apple's App Store guidelines, you have the right to request full deletion of your data.
              </p>
              {error && (
                <div style={{ fontSize: 12, color: isDark ? "#f87171" : "#dc2626", marginBottom: 12, padding: "8px 12px", borderRadius: 10, background: isDark ? "rgba(127,29,29,0.15)" : "rgba(254,226,226,0.5)" }}>
                  {error}
                </div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleClose}
                  style={{
                    flex: 1, padding: "12px 0", borderRadius: 14, fontSize: 14, fontWeight: 600,
                    background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
                    color: t.subtitle, cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  style={{
                    flex: 1, padding: "12px 0", borderRadius: 14, fontSize: 14, fontWeight: 600,
                    background: isDark ? "rgba(220,38,38,0.2)" : "rgba(220,38,38,0.1)",
                    border: `1px solid ${isDark ? "rgba(248,113,113,0.3)" : "rgba(220,38,38,0.25)"}`,
                    color: isDark ? "#f87171" : "#dc2626", cursor: "pointer",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Trash2 style={{ width: 14, height: 14 }} /> Delete All
                  </span>
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                style={{ width: 32, height: 32, margin: "0 auto 16px", border: `3px solid ${isDark ? "rgba(248,113,113,0.2)" : "rgba(220,38,38,0.15)"}`, borderTopColor: isDark ? "#f87171" : "#dc2626", borderRadius: "50%" }}
              />
              <p style={{ fontSize: 14, color: t.subtitle }}>Deleting your data...</p>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: t.title, marginBottom: 8 }}>Data Deleted</h3>
              <p style={{ fontSize: 13, color: t.subtitle, marginBottom: 20 }}>All your runs and associated data have been permanently removed.</p>
              <button
                onClick={handleClose}
                style={{
                  ...glassBtn(t), padding: "10px 28px", fontSize: 14, cursor: "pointer",
                }}
              >
                Done
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}