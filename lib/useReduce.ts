"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Reduced-motion preference, but only after hydration: the static HTML is rendered
 * without knowing it, so branching on it during the first render would mismatch.
 */
export function useReduce() {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- flips once, after hydration
  useEffect(() => setMounted(true), []);
  return mounted && !!reduce;
}
