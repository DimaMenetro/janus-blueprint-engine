/**
 * PageTransition — Framer Motion wrapper for horizontal slide transitions
 * between pages during navigation. Lightweight, preserves glass aesthetics.
 */
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

const variants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -24 },
};

export default function PageTransition({ children }) {
  const location = useLocation();

  return (
    <motion.div
      key={location.pathname}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.8 }}
      style={{ minHeight: "100%" }}
    >
      {children}
    </motion.div>
  );
}