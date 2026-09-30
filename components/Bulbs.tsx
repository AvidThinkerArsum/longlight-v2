"use client";

// A strand of café bulbs. In the hero they hang "above the camera": out of focus, big,
// lighting left to right and swaying with the pointer. Below the hero the same strand
// comes into focus across the top of the next section.

import { motion, useTransform, type MotionValue } from "framer-motion";
import { BULB_COUNT } from "@/lib/light";

type P = { x: number; y: number; d: number };

function strand(count: number, sag: number, top: number, sizes: [number, number]): P[] {
  return Array.from({ length: count }, (_, i) => {
    const t = (i + 0.5) / count;
    const x = -3 + t * 106;
    const u = 2 * t - 1;
    const y = top + sag * (1 - u * u);
    const d = sizes[0] + (sizes[1] - sizes[0]) * (((i * 5) % 7) / 6);
    return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100, d: Math.round(d) };
  });
}

/** A strand's run across the frame: from (x0%, y0vh) to (x1%, y1vh), sagging by `sag` vh. */
export type Run = { x0: number; y0: number; x1: number; y1: number; sag: number; count: number; sizes: [number, number] };

export const RUNS: Record<"desktop" | "mobile" | "still" | "stillMobile", Run> = {
  // in from the top-left, down across the sky: below the nav, clear of the gable windows
  desktop: { x0: -6, y0: 9, x1: 106, y1: 21, sag: 5, count: 10, sizes: [54, 100] },
  // on phones the strand crosses the sky between the clock and the cupola, never the gable
  mobile: { x0: -10, y0: 24, x1: 110, y1: 31, sag: 2, count: 4, sizes: [40, 62] },
  // the still frame keeps the left for the headline
  still: { x0: 108, y0: 5, x1: 52, y1: 21, sag: 5, count: 6, sizes: [52, 96] },
  stillMobile: { x0: -10, y0: 44, x1: 110, y1: 49, sag: 2, count: 4, sizes: [38, 58] },
};

type B = { x: number; y: number; d: number; blur: number; tint: [number, number, number]; rim: number };

function bulbsFor(run: Run): B[] {
  const { x0, y0, x1, y1, sag, count, sizes } = run;
  return Array.from({ length: count }, (_, i) => {
    const t = (i + 0.5) / count;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t + sag * 4 * t * (1 - t);
    // depth: a few bulbs sit nearer the lens (bigger, softer, dimmer rim); the ones either
    // side of the middle stay small, so the gable windows between them are never covered
    const k = Math.abs(x - 50) < 9 ? 0.1 : ((i * 5 + 2) % 7) / 6;
    const d = sizes[0] + (sizes[1] - sizes[0]) * k;
    const warm = (i * 3) % 4;
    const tint: [number, number, number] = warm === 0 ? [255, 178, 92] : warm === 1 ? [255, 206, 128] : warm === 2 ? [255, 192, 108] : [255, 220, 150];
    return {
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      d: Math.round(d),
      blur: Math.round((1.6 + 1.6 * k) * 10) / 10,
      tint,
      rim: Math.round((0.98 - 0.12 * k) * 100) / 100,
    };
  });
}

function BokehBulb({ b, i, level }: { b: B; i: number; level: MotionValue<number> }) {
  const o = useTransform(level, (v) => Math.min(1, Math.max(0, v - i)));
  const [r, g, bl] = b.tint;
  const c = (a: number) => `rgba(${r},${g},${bl},${a})`;
  // Each bulb screens onto the scene as one group: an almost opaque, hot disc (so the wire
  // behind it can't show through) inside a soft glow of its own light.
  return (
    <motion.div
      style={{ opacity: o, left: `${b.x}%`, top: `${b.y}vh`, width: b.d, height: b.d, marginLeft: -b.d / 2, marginTop: -b.d / 2, mixBlendMode: "screen" }}
      className="absolute"
    >
      <div className="absolute inset-[-110%] rounded-full" style={{ background: `radial-gradient(circle, ${c(0.34)} 0%, ${c(0.16)} 22%, ${c(0.05)} 44%, ${c(0)} 68%)` }} />
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle closest-side, rgba(255,246,222,0.96) 0%, rgba(255,238,200,0.94) 40%, ${c(0.92)} 74%, rgba(255,240,208,${b.rim}) 88%, ${c(0.6)} 95%, ${c(0)} 100%)`,
          filter: `blur(${b.blur}px)`,
        }}
      />
    </motion.div>
  );
}

/** Out-of-focus bulbs over the hero. `level` counts how many are lit, left to right. */
export function BokehStrand({
  level,
  sway,
  run,
  fade,
  drop,
}: {
  level: MotionValue<number>;
  sway: { x: MotionValue<number>; y: MotionValue<number> };
  run: Run;
  fade?: MotionValue<number>;
  /** How far (px) the strand drops in the frame, e.g. as the camera tilts up. */
  drop?: MotionValue<number>;
}) {
  const pts = bulbsFor(run);
  // The whole strand's worth of "lit" maps onto however many bulbs this run has, in order
  // of x (so they always light left to right).
  const order = pts.map((p, i) => [p.x, i] as const).sort((a, b) => a[0] - b[0]).map(([, i]) => i);
  const rank = pts.map((_, i) => order.indexOf(i));
  const lvl = useTransform(level, (v) => (v / BULB_COUNT) * pts.length);
  const wire = useTransform(level, (v) => Math.min(0.8, v * 0.8));
  const x = useTransform(sway.x, (v) => v * 42);
  const y = useTransform(sway.y, (v) => v * 14);
  const rotate = useTransform(sway.x, (v) => v * 1.2);
  // The wire runs past both ends of the strand, in viewBox units of 10 per vh / per %.
  const ext = (a: B, b: B, k: number) => [a.x + (a.x - b.x) * k, a.y + (a.y - b.y) * k];
  const [sx, sy] = ext(pts[0], pts[1], 1.4);
  const [ex, ey] = ext(pts[pts.length - 1], pts[pts.length - 2], 1.4);
  const d = [`M${sx * 10} ${(sy - 1.2) * 10}`, ...pts.map((p) => `L${p.x * 10} ${(p.y - 1.2) * 10}`), `L${ex * 10} ${(ey - 1.2) * 10}`]
    .join(" ")
    .replace(/(\d+\.\d{2})\d+/g, "$1");
  // Nothing sits on a bulb: the strand fades out, softly, toward the top of the frame (the nav).
  const mask = "linear-gradient(180deg, transparent 0px, transparent 40px, #000 132px, #000 100%)";
  return (
    <motion.div aria-hidden style={{ opacity: fade, maskImage: mask, WebkitMaskImage: mask }} className="pointer-events-none absolute inset-x-0 top-0 h-[64vh]">
      <motion.div style={{ y: drop }} className="absolute inset-0">
      <motion.div style={{ x, y, rotate }} className="absolute inset-0 origin-top">
        <div className="sway absolute inset-0 origin-top">
          <motion.div style={{ opacity: wire }} className="absolute inset-0">
            <svg viewBox="0 0 1000 640" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
              {/* as far out of focus as the bulbs on it */}
              <path d={d} fill="none" stroke="#05071a" strokeWidth={6} strokeLinecap="round" style={{ filter: "blur(4.5px)" }} vectorEffect="non-scaling-stroke" />
            </svg>
          </motion.div>
          {pts.map((b, i) => (
            <BokehBulb key={i} b={b} i={rank[i]} level={lvl} />
          ))}
        </div>
      </motion.div>
      </motion.div>
    </motion.div>
  );
}

/** The same strand in focus: small glass bulbs with glowing filaments. */
export function CrispStrand({ count = 16, className = "" }: { count?: number; className?: string }) {
  const pts = strand(count, 46, 12, [15, 15]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p.x * 10} ${p.y}`).join(" ");
  return (
    <div aria-hidden className={`pointer-events-none relative h-[96px] overflow-hidden ${className}`}>
      <svg viewBox="0 0 1000 96" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path d={`M-40 0 ${d.slice(1)} L1040 0`} fill="none" stroke="#0b0e22" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      </svg>
      {pts.map((p, i) => (
        <div key={i} className="absolute" style={{ left: `${p.x}%`, top: p.y - 2 }}>
          <div className="absolute left-1/2 top-0 h-[7px] w-[5px] -translate-x-1/2 rounded-[1px] bg-[#0b0e22]" />
          <div
            className="glow absolute left-1/2 top-[6px] h-[15px] w-[13px] -translate-x-1/2 rounded-[50%_50%_46%_46%]"
            style={{ background: "radial-gradient(circle at 50% 42%, #fff6dc 0%, #ffd58f 45%, #f4a950 100%)", boxShadow: "0 0 18px 6px rgba(255,186,100,0.45), 0 0 46px 14px rgba(255,170,90,0.18)", animationDelay: `${(i % 5) * -1.3}s` }}
          />
        </div>
      ))}
    </div>
  );
}
