"use client";

// A stage that covers its container from a fixed camera position (used where the
// hero is relit below the fold).

import { useEffect, useRef, useState } from "react";
import { Stage, type LightMV } from "./Stage";
import { cameraTransform } from "@/lib/camera";
import { useMasks } from "@/lib/masks";
import type { Focus } from "@/lib/site";

/** `focus.d` for landscape frames, `focus.m` for portrait ones. */
export function CoverStage({ light, focus, target, className = "" }: { light: LightMV; focus: { d: Focus; m: Focus }; target?: [number, number]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1440, h: 900 });
  const masks = useMasks();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const t = cameraTransform(size.w, size.h, size.w < size.h ? focus.m : focus.d, target);
  return (
    <div ref={ref} className={`absolute inset-0 overflow-hidden bg-[#1f3a2e] ${className}`}>
      <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `translate(${t.x}px, ${t.y}px) scale(${t.scale})` }}>
        <Stage light={light} masks={masks} />
      </div>
    </div>
  );
}
