/**
 * useScrollDensity — Returns a density string based on scroll position.
 * Elements near the top of the viewport get heavier glass (more blur/opacity)
 * simulating "closer to camera" depth. As user scrolls down, glass thins out.
 *
 * Returns: "dense" | "normal" | "sparse"
 * Also returns raw scrollY for fine-grained use.
 */
import { useState, useEffect, useRef } from "react";

const DENSE_THRESHOLD = 20;    // px from top — heavy glass
const NORMAL_THRESHOLD = 200;  // px — standard glass
// Beyond NORMAL_THRESHOLD → sparse

export default function useScrollDensity() {
  const [scrollY, setScrollY] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current) return; // throttle to 1 per frame
      rafRef.current = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
        rafRef.current = null;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const density = scrollY <= DENSE_THRESHOLD
    ? "dense"
    : scrollY <= NORMAL_THRESHOLD
      ? "normal"
      : "sparse";

  return { density, scrollY };
}