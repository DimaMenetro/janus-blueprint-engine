/**
 * PullToRefresh — Custom touch-based pull-to-refresh for iOS native feel.
 * Pure touch handler, no external deps. Shows a spinner when pulled past threshold.
 */
import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const THRESHOLD = 80;

export default function PullToRefresh({ onRefresh, children, color = "#94a3b8" }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const onTouchStart = useCallback((e) => {
    // Only activate when scrolled to top
    if (window.scrollY > 5) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!pulling.current || refreshing) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) {
      // Dampen the pull — feels more native
      setPullDistance(Math.min(dy * 0.45, 120));
    }
  }, [refreshing]);

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(THRESHOLD * 0.6);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, refreshing, onRefresh]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ position: "relative" }}
    >
      {/* Pull indicator */}
      <AnimatePresence>
        {(pullDistance > 10 || refreshing) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              display: "flex", justifyContent: "center", alignItems: "center",
              height: pullDistance,
              overflow: "hidden",
              transition: pulling.current ? "none" : "height 0.25s ease",
            }}
          >
            <motion.div
              animate={refreshing ? { rotate: 360 } : { rotate: progress * 270 }}
              transition={refreshing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : { duration: 0 }}
              style={{
                width: 24, height: 24,
                border: `2.5px solid ${color}33`,
                borderTopColor: color,
                borderRadius: "50%",
                opacity: Math.max(0.3, progress),
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </div>
  );
}