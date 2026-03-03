/**
 * Ambient color orbs — slowly drifting colored gradients that bleed
 * through the glass surfaces, creating the iOS 26 "glass refracts
 * its background" effect.
 */

import { motion } from "framer-motion";

export default function AmbientOrbs({ t }) {
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      <motion.div
        animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute",
          top: -100,
          left: -120,
          width: 520,
          height: 520,
          borderRadius: "50%",
          background: t.orb1,
          filter: "blur(20px)",
        }}
      />
      <motion.div
        animate={{ x: [0, -80, 0], y: [0, 70, 0] }}
        transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute",
          bottom: -80,
          right: -80,
          width: 460,
          height: 460,
          borderRadius: "50%",
          background: t.orb2,
          filter: "blur(20px)",
        }}
      />
      {/* Third orb for richer bleed */}
      <motion.div
        animate={{ x: [0, 60, 0], y: [0, -30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute",
          top: "40%",
          left: "30%",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: t.orb1,
          opacity: 0.4,
          filter: "blur(30px)",
        }}
      />
    </div>
  );
}