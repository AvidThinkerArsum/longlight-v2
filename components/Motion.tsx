"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

// Reduced motion: framer skips transform animations (opacity still fades).
export function Motion({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
