"use client";

// One photograph, relit. The stage is a box the photo's own size (2400 × 1600 CSS px, so
// every overlay is written in photo pixels) that the parent scales and pans as a camera.
// Grades are copies of the same <img> under different CSS filters, cross-faded; the sky,
// clouds and sun live inside a mask computed from the photo; windows glow from their own
// glass. Only opacity (and the sun's transform) ever changes.

import { motion, useMotionValueEvent, useTransform, type MotionValue } from "framer-motion";
import { memo, useEffect, useMemo, useState } from "react";
import { site, type Rect } from "@/lib/site";
import { WINDOW_COUNT, type LightKey } from "@/lib/light";
import type { Masks, PaneSprite } from "@/lib/masks";

export type LightMV = Record<LightKey, MotionValue<number>>;

const H = site.hero;
export const W0 = H.size.w;
export const H0 = H.size.h;

const GRADES: { key: LightKey; filter: string }[] = [
  { key: "morning", filter: "brightness(1.05) saturate(0.9) contrast(0.86) sepia(0.16) hue-rotate(-5deg)" },
  { key: "golden", filter: "sepia(0.3) saturate(1.3) brightness(0.98) contrast(1.04) hue-rotate(-8deg)" },
  // the sun behind the barn: the facade in its own shade
  { key: "backlit", filter: "brightness(0.62) saturate(0.8) contrast(1.04) sepia(0.08)" },
  { key: "dusk", filter: "brightness(0.5) saturate(0.7) sepia(0.16) hue-rotate(-22deg) contrast(1.12)" },
  { key: "blue", filter: "brightness(0.56) saturate(0.5) contrast(1.16)" },
  { key: "winter", filter: "brightness(0.7) saturate(0.1) contrast(1.02)" },
];

const px = (n: number) => `${n}px`;
const box = ([x, y, w, h]: Rect) => ({ left: px(x), top: px(y), width: px(w), height: px(h) });

function maskStyle(url: string | null | undefined): React.CSSProperties {
  if (!url) return {};
  const m = `url("${url}")`;
  return {
    maskImage: m,
    WebkitMaskImage: m,
    maskSize: "100% 100%",
    WebkitMaskSize: "100% 100%",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
  };
}

/** The sky between the clouds (the sky mask, less the cloud mask). */
function clearSkyStyle(sky: string, cloud: string | null): React.CSSProperties {
  if (!cloud) return maskStyle(sky);
  const m = `url("${sky}"), url("${cloud}")`;
  return {
    maskImage: m,
    WebkitMaskImage: m,
    maskSize: "100% 100%",
    WebkitMaskSize: "100% 100%",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskComposite: "subtract",
    WebkitMaskComposite: "source-out",
  };
}

/** Everything but the sky: the building, the trees and the lawn. */
function groundMaskStyle(url: string | null | undefined): React.CSSProperties {
  if (!url) return {};
  const m = `linear-gradient(#000, #000), url("${url}")`;
  return {
    maskImage: m,
    WebkitMaskImage: m,
    maskSize: "100% 100%",
    WebkitMaskSize: "100% 100%",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskComposite: "exclude",
  };
}

const layer = "pointer-events-none absolute inset-0";

// Static film grain: keeps big night gradients from banding and reads as a photograph.
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

export const Stage = memo(function Stage({ light, masks, eager = false }: { light: LightMV; masks: Masks | null; eager?: boolean }) {
  const src = site.photos.hero.src;
  const sky = H.hasSky && masks?.ok ? masks.sky : null;
  const cloud = H.hasSky && masks?.ok ? masks.cloud : null;
  const grain = useTransform(light.grain, (v) => v * 0.16);
  // "color" blends flatten the photo's clouds: keep them low so the sky keeps its shape
  // (the clouds get their own colour from the cloud mask).
  const peachColor = useTransform(light.skyPeach, (v) => v * 0.3);
  const roseColor = useTransform(light.skyRose, (v) => v * 0.42);
  const cool = useTransform(light.cool, (v) => v * 0.8);

  return (
    <div className="relative overflow-hidden" style={{ width: W0, height: H0 }}>
    {/* Everything that blends lives in one isolated group that never animates inside, so the
        browser can keep it as a finished picture; the sparklers fizz on top, outside it. */}
    <div className="absolute inset-0 isolate overflow-hidden bg-[#1f3a2e]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={site.photos.hero.alt}
        crossOrigin="anonymous"
        width={W0}
        height={H0}
        fetchPriority={eager ? "high" : "auto"}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        style={"grade" in H ? { filter: H.grade } : undefined}
        className="absolute inset-0 h-full w-full select-none"
      />
      {GRADES.map((g) => (
        <motion.img
          key={g.key}
          src={src}
          alt=""
          aria-hidden
          crossOrigin="anonymous"
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          draggable={false}
          style={{ opacity: light[g.key], filter: g.filter }}
          className="absolute inset-0 h-full w-full select-none"
        />
      ))}

      {/* shade is cooler than sun: a lavender cast while the barn is backlit */}
      <motion.div style={{ opacity: cool, mixBlendMode: "multiply", background: "#c4c9e6" }} className={layer} />
      {/* ...and it takes the sky's colour: rose while the clouds are peach, lavender after */}
      <motion.div style={{ opacity: light.facadeWarm, mixBlendMode: "multiply", background: "linear-gradient(180deg,#d59a9a 0%,#d9a3a0 50%,#c9a0a8 100%)", ...groundMaskStyle(sky) }} className={layer} />
      <motion.div style={{ opacity: light.facadeCool, mixBlendMode: "multiply", background: "linear-gradient(180deg,#a293c0 0%,#9d8fb8 50%,#8f86b0 100%)", ...groundMaskStyle(sky) }} className={layer} />

      {/* the sky plate: the photo's own sky, un-graded, so a shaded barn sits under a bright sky */}
      {sky && (
        <motion.img
          src={src}
          alt=""
          aria-hidden
          crossOrigin="anonymous"
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          draggable={false}
          style={{ opacity: light.skyPlate, ...maskStyle(sky) }}
          className="absolute inset-0 h-full w-full select-none"
        />
      )}

      {/* night: the whole scene through blue glass, heavier toward the ground */}
      <motion.div
        style={{ opacity: light.night, mixBlendMode: "multiply", background: "linear-gradient(180deg,#6d7bc2 0%,#5d6bb1 55%,#4c5896 78%,#363f78 100%)" }}
        className={layer}
      />

      {/* morning: low sun from behind the camera's left */}
      <motion.div
        style={{ opacity: light.morningSun, mixBlendMode: "screen", background: "linear-gradient(104deg, rgba(255,184,110,0.58) 0%, rgba(255,200,140,0.3) 30%, rgba(255,214,160,0.08) 55%, rgba(255,214,160,0) 70%)" }}
        className={layer}
      />

      {sky && (
        <>
          {/* an overcast photo: blue between its clouds, deeper overhead (it clears in: the
              layer blends, its paint fades in on first showing) */}
          {"overcast" in H ? (
            <motion.div style={{ opacity: light.skyClear, mixBlendMode: "multiply", ...clearSkyStyle(sky, cloud) }} className={layer}>
              <div className="sky-in absolute inset-0 bg-[linear-gradient(180deg,#6f97d8_0%,#87aae2_22%,#a9c3ec_46%,#cddcf3_68%,#e9eff8_86%)]" />
            </motion.div>
          ) : null}
          <motion.div style={{ opacity: light.skyMorning, mixBlendMode: "multiply", background: "linear-gradient(180deg,#e4ebf6 0%,#f2f0ea 48%,#fde6c6 76%)", ...maskStyle(sky) }} className={layer} />
          {/* afternoon: the blue deepens overhead */}
          <motion.div style={{ opacity: light.skyDay, mixBlendMode: "multiply", background: "linear-gradient(180deg,#a9bfe9 0%,#c4d3f0 30%,#e6ecf7 58%,#ffffff 82%)", ...maskStyle(sky) }} className={layer} />
          {/* golden hour: clear blue overhead, gold toward the horizon, peach clouds */}
          <motion.div
            style={{ opacity: light.skyPeach, mixBlendMode: "multiply", background: "linear-gradient(180deg,#86a3de 0%,#a9bde8 20%,#dcd8e0 40%,#fbd9b8 58%,#ffcb92 76%,#ffba76 100%)", ...maskStyle(sky) }}
            className={layer}
          />
          <motion.div style={{ opacity: peachColor, mixBlendMode: "color", background: "linear-gradient(180deg,#4f7fd6 0%,#6f8fd2 26%,#d8a585 56%,#f5a45e 82%)", ...maskStyle(sky) }} className={layer} />
          <motion.div style={{ opacity: light.cloudPeach, mixBlendMode: "color", background: "linear-gradient(180deg,#f2ad94 0%,#ffbb90 45%,#ffae70 100%)", ...maskStyle(cloud) }} className={layer} />
          {/* then rose and violet */}
          <motion.div
            style={{ opacity: light.skyRose, mixBlendMode: "multiply", background: "linear-gradient(180deg,#7c83c4 0%,#a293cc 22%,#d69cbc 44%,#f2a2aa 62%,#fcb28e 80%,#ffc078 100%)", ...maskStyle(sky) }}
            className={layer}
          />
          <motion.div style={{ opacity: roseColor, mixBlendMode: "color", background: "linear-gradient(180deg,#6a6fb8 0%,#8f78b0 24%,#c9789a 50%,#e8876f 78%)", ...maskStyle(sky) }} className={layer} />
          <motion.div style={{ opacity: light.cloudRose, mixBlendMode: "color", background: "linear-gradient(180deg,#d98aa8 0%,#f09aa6 42%,#ffa58a 100%)", ...maskStyle(cloud) }} className={layer} />
          <motion.div
            style={{ opacity: light.skyGlow, background: "linear-gradient(180deg,#2c3a78 0%,#4d4f8c 22%,#8a6d99 42%,#c98394 56%,#eb9a80 68%,#f6b877 78%)", ...maskStyle(sky) }}
            className={layer}
          />
          <motion.div style={{ opacity: light.cloudLit, background: "linear-gradient(180deg,#e9a0b1 0%,#f7a88f 45%,#ffc38d 72%)", ...maskStyle(cloud) }} className={layer} />
          <motion.div
            style={{ opacity: light.skyBlue, background: "linear-gradient(180deg,#141b44 0%,#1f2b63 26%,#304284 48%,#4a5f9f 62%,#6f7fb0 72%,#9a8fa6 79%)", ...maskStyle(sky) }}
            className={layer}
          />
          <motion.div style={{ opacity: light.skyDeep, background: "linear-gradient(180deg,#0b1030 0%,#141d4a 30%,#22306a 52%,#3a4a84 66%,#58649a 76%)", ...maskStyle(sky) }} className={layer} />
          {/* a December twilight: slate overhead, a cold lemon band on the horizon */}
          <motion.div
            style={{ opacity: light.skyWinter, background: "linear-gradient(180deg,#3d4868 0%,#55617f 18%,#7c879f 32%,#a8aeb6 44%,#d0cdb6 54%,#e8dfae 62%,#f1e3a6 72%)", ...maskStyle(sky) }}
            className={layer}
          />
          <motion.div style={{ opacity: light.cloudNight, background: "linear-gradient(180deg,#27306a 0%,#2a3065 30%,#312f5f 52%,#3b3560 66%,#4a3f63 78%)", ...maskStyle(cloud) }} className={layer} />
          <Sun light={light} sky={sky} />
        </>
      )}

      {/* the land gives up its light before the sky does */}
      <motion.div
        style={{ opacity: light.ground, mixBlendMode: "multiply", background: "linear-gradient(180deg,rgba(255,255,255,0) 64%,#3b4478 80%,#1d2244 100%)" }}
        className={layer}
      />
      <motion.div
        style={{ opacity: light.ground, mixBlendMode: "multiply", background: "radial-gradient(ellipse 70% 80% at 50% 62%, rgba(255,255,255,0) 55%, #3c4574 100%)" }}
        className={layer}
      />

      {/* afterglow spilling over the ridge */}
      <motion.div
        style={{
          opacity: light.rim,
          mixBlendMode: "screen",
          ...maskStyle(sky),
          background: `radial-gradient(ellipse 620px 360px at ${H.sun.to[0] + 20}px ${H.sun.to[1] - 90}px, rgba(255,184,112,0.6), rgba(255,150,110,0.2) 42%, rgba(0,0,0,0) 74%)`,
        }}
        className={layer}
      />
      {H.hasSky ? <RimLight on={light.rimLight} /> : null}
      {H.hasSky && masks?.ok ? <SunBloom light={light} /> : null}

      <Weather light={light} />
      <Spill light={light} />
      {H.windows.map((w, i) => (
        <WindowGlow key={w.id} i={i} level={light.windows} panes={w.panes} glow={masks?.ok ? masks.panes[w.id] : undefined} />
      ))}
      {H.lamps.map((l, i) => (
        <Sconce key={i} at={l.at} reach={l.reach} on={light.sconces} />
      ))}
      <motion.div style={{ opacity: grain, backgroundImage: GRAIN, backgroundSize: "220px 220px", mixBlendMode: "overlay" }} className={layer} />
    </div>
    <Sparklers on={light.sparklers} />
    </div>
  );
});

function Sun({ light, sky }: { light: LightMV; sky: string }) {
  const { from, to, r } = H.sun;
  // sunT runs 0 → 1 from `from` to `to` (the minute of sunset) and a little past it.
  const x = useTransform(light.sunT, (t) => Math.round((from[0] - to[0]) * (1 - t) * 100) / 100);
  const y = useTransform(light.sunT, (t) => Math.round((from[1] - to[1]) * (1 - t) * 100) / 100);
  return (
    <>
      {/* the disc and its ring live in the sky, so the roofline cuts them off */}
      <motion.div style={{ opacity: light.sun, mixBlendMode: "screen", ...maskStyle(sky) }} className={layer}>
        <motion.div style={{ x, y }} className="absolute inset-0">
          <div
            className="absolute"
            style={{
              left: to[0] - r * 8,
              top: to[1] - r * 8,
              width: r * 16,
              height: r * 16,
              background: `radial-gradient(circle, #fffdf6 0, #fff1c8 ${r * 0.7}px, #ffe2a4 ${r * 0.92}px, #ffc56b ${r * 1.04}px, rgba(255,176,96,0.8) ${r * 1.3}px, rgba(255,154,85,0.5) ${r * 1.8}px, rgba(255,154,85,0.26) ${r * 2.5}px, rgba(255,140,80,0.09) ${r * 4.5}px, rgba(255,140,80,0) ${r * 8}px)`,
            }}
          />
        </motion.div>
      </motion.div>
    </>
  );
}

/** The glare around a low sun: not cut by the roofline, it spills over the ridge. */
function SunBloom({ light }: { light: LightMV }) {
  const { from, to } = H.sun;
  const x = useTransform(light.sunT, (t) => Math.round((from[0] - to[0]) * (1 - t) * 100) / 100);
  const y = useTransform(light.sunT, (t) => Math.round((from[1] - to[1]) * (1 - t) * 100) / 100);
  const B = 900;
  return (
    <motion.div style={{ opacity: light.sunBloom, mixBlendMode: "screen" }} className={layer}>
      <motion.div style={{ x, y }} className="absolute inset-0">
        <div
          className="absolute"
          style={{
            left: to[0] - B,
            top: to[1] - B,
            width: B * 2,
            height: B * 2,
            background:
              "radial-gradient(circle, rgba(255,222,160,0.62) 0, rgba(255,196,128,0.36) 70px, rgba(255,176,110,0.2) 200px, rgba(255,160,100,0.09) 440px, rgba(255,150,96,0.03) 680px, rgba(255,150,96,0) 900px)",
          }}
        />
      </motion.div>
    </motion.div>
  );
}

function WindowGlow({ i, level, panes, glow }: { i: number; level: MotionValue<number>; panes: readonly Rect[]; glow?: PaneSprite[] }) {
  const opacity = useTransform(level, (v) => Math.min(1, Math.max(0, v - i)));
  const halo = useTransform(level, (v) => Math.min(1, Math.max(0, v - i)) * 0.9);
  const bb = useMemo(() => {
    const x0 = Math.min(...panes.map((p) => p[0])), y0 = Math.min(...panes.map((p) => p[1]));
    const x1 = Math.max(...panes.map((p) => p[0] + p[2])), y1 = Math.max(...panes.map((p) => p[1] + p[3]));
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }, [panes]);
  const big = bb.h > 60;
  return (
    <>
      <motion.div
        style={{
          opacity: halo,
          mixBlendMode: "screen",
          left: bb.x - bb.w * 1.4,
          top: bb.y - bb.h * 0.9,
          width: bb.w * 3.8,
          height: bb.h * 2.9,
          background: `radial-gradient(ellipse 50% 50% at 50% 50%, rgba(255,184,104,${big ? 0.5 : 0.42}) 0%, rgba(255,160,86,0.16) 42%, rgba(255,150,80,0) 72%)`,
        }}
        className="pointer-events-none absolute"
      />
      <motion.div style={{ opacity }} className="pointer-events-none absolute inset-0">
        {panes.map((p, k) =>
          glow?.[k] ? (
            <div
              key={k}
              className="absolute"
              style={{
                ...box(p),
                backgroundImage: `url("${glow[k].url}")`,
                backgroundSize: `${(glow[k].aw * p[2]) / glow[k].w}px ${(glow[k].ah * p[3]) / glow[k].h}px`,
                backgroundPosition: `${(-glow[k].x * p[2]) / glow[k].w}px ${(-glow[k].y * p[3]) / glow[k].h}px`,
              }}
            />
          ) : (
            <div key={k} className="absolute" style={{ ...box(p), background: "linear-gradient(180deg,#ffe2ad,#f6b567 70%,#e9a153)" }} />
          ),
        )}
      </motion.div>
    </>
  );
}

function Sconce({ at: [x, y], reach, on }: { at: readonly [number, number]; reach: number; on: MotionValue<number> }) {
  const w = reach * 1.3, h = reach * 1.7;
  // The wash starts at the shade and feathers in, so the light has no top edge.
  const feather = "linear-gradient(180deg, transparent 0%, #000 16%, #000 100%)";
  return (
    <motion.div style={{ opacity: on, mixBlendMode: "screen" }} className={layer}>
      <div
        className="absolute"
        style={{
          left: x - w / 2,
          top: y - h * 0.1,
          width: w,
          height: h,
          background: "radial-gradient(ellipse 46% 70% at 50% 10%, rgba(255,204,138,0.85) 0%, rgba(255,178,100,0.4) 26%, rgba(255,160,90,0.12) 52%, rgba(255,150,80,0) 76%)",
          maskImage: feather,
          WebkitMaskImage: feather,
        }}
      />
      <div
        className="absolute"
        style={{ left: x - 60, top: y - 60, width: 120, height: 120, background: "radial-gradient(circle, rgba(255,226,170,0.55) 0%, rgba(255,190,120,0.16) 36%, rgba(255,180,110,0) 70%)" }}
      />
      <div
        className="absolute"
        style={{ left: x - 22, top: y - 14, width: 44, height: 26, background: "radial-gradient(ellipse 50% 50% at 50% 55%, #fff7e2 0%, rgba(255,220,160,0.85) 34%, rgba(255,196,128,0) 72%)" }}
      />
    </motion.div>
  );
}

function Spill({ light }: { light: LightMV }) {
  const [x, y] = H.path.door;
  return (
    <motion.div style={{ opacity: light.spill, mixBlendMode: "screen" }} className={layer}>
      <div
        className="absolute"
        style={{
          left: x - 420,
          top: y - 12,
          width: 840,
          height: 340,
          background: "radial-gradient(ellipse 42% 62% at 50% 0%, rgba(255,186,110,0.62) 0%, rgba(255,160,90,0.22) 40%, rgba(255,150,80,0) 72%)",
        }}
      />
    </motion.div>
  );
}

// Morning dew on the lawn band; winter frost on the grass and mist in the tree line.
function Weather({ light }: { light: LightMV }) {
  const sides = "linear-gradient(90deg, #000 0%, #000 9%, transparent 24%, transparent 76%, #000 90%, #000 100%)";
  return (
    <>
      <motion.div
        style={{ opacity: light.dew, background: "linear-gradient(180deg, rgba(240,236,226,0) 80%, rgba(240,236,226,0.26) 87%, rgba(244,240,230,0.4) 94%, rgba(240,236,226,0.3) 100%)" }}
        className={layer}
      />
      <motion.div
        style={{ opacity: light.frost, background: "linear-gradient(180deg, rgba(190,204,226,0) 79%, rgba(190,204,226,0.34) 86%, rgba(204,214,232,0.52) 93%, rgba(196,208,228,0.46) 100%)" }}
        className={layer}
      />
      <motion.div
        style={{
          opacity: light.mist,
          background: "linear-gradient(180deg, rgba(196,202,218,0) 52%, rgba(196,202,218,0.5) 66%, rgba(200,206,220,0.42) 76%, rgba(196,202,218,0) 84%)",
          maskImage: sides,
          WebkitMaskImage: sides,
        }}
        className={layer}
      />
    </>
  );
}

// The sun right behind the peak catches the roof's edge: a thin warm line along the skyline,
// only within a short reach of the sun, never a glow around the whole building.
const RIM_PTS = H.skyline.map(([x, y]) => `${x},${Math.round((y + 2) * 100) / 100}`).join(" ");
function RimLight({ on }: { on: MotionValue<number> }) {
  const [sx, sy] = H.sun.to;
  const near = `radial-gradient(ellipse 260px 160px at ${sx}px ${sy}px, #000 0%, rgba(0,0,0,0.5) 50%, transparent 100%)`;
  return (
    <motion.div style={{ opacity: on, mixBlendMode: "screen", maskImage: near, WebkitMaskImage: near }} className={layer}>
      <svg viewBox={`0 0 ${W0} ${H0}`} width={W0} height={H0} className="absolute inset-0">
        <polyline points={RIM_PTS} fill="none" stroke="#ffe2b4" strokeWidth={1.5} strokeLinejoin="round" opacity={0.9} />
      </svg>
    </motion.div>
  );
}

// The send-off: two lines of guests down the front walk, sparklers held up over the aisle,
// in perspective. The camera is at eye level (`path.horizon`), so every head sits near the
// horizon line and a raised sparkler sits above it, higher and bigger the nearer it is.
// Guests are dark silhouettes against the lit doors; nearer ones are softer (out of focus).
const r2 = (n: number) => Math.round(n * 100) / 100;
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Streak = { a: number; len: number; w: number; dur: number; delay: number };
type Spark = { x: number; y: number; s: number; blur: number; streaks: Streak[]; flick: number };
type Guest = { d: string; arm: string; armW: number; depth: number; rim: [number, number] };

const SEND_OFF = (() => {
  const [dx, dy] = H.path.door;
  const [nx, ny] = H.path.near;
  const horizon = H.path.horizon;
  const rand = rng(1906);
  const sparks: Spark[] = [];
  const guests: Guest[] = [];
  const steps = [0.3, 0.48, 0.68, 0.9, 1.14, 1.4];
  steps.forEach((t, k) => {
    const gy = dy + (ny - dy) * t;
    const cx = dx + (nx - dx) * t;
    // pixels per metre at this depth, for a camera 1.6 m up
    const m = Math.max(30, gy - horizon) / 1.6;
    for (const side of [-1, 1]) {
      const h = 1.62 + rand() * 0.24; // metres tall
      const lateral = 1.2 + rand() * 0.3;
      const bx = cx + side * lateral * m; // where they stand
      const inward = -side; // they face the walk
      const w = 0.2 + rand() * 0.035; // half the shoulders
      const Y = (z: number) => r2(gy - z * m);
      const X = (u: number) => r2(bx + u * m);
      // head, shoulders, a body that narrows to the hips and stands on two legs
      const [rx, ry] = [r2(0.1 * m), r2(0.122 * m)];
      const head = `M${X(-0.1)} ${Y(h - 0.122)} a${rx} ${ry} 0 1 0 ${r2(2 * rx)} 0 a${rx} ${ry} 0 1 0 ${r2(-2 * rx)} 0Z`;
      const body = [
        `M${X(-0.06)} ${Y(h - 0.22)}`,
        `L${X(-0.07)} ${Y(h - 0.28)}`,
        `Q${X(-w)} ${Y(h - 0.3)} ${X(-w)} ${Y(h - 0.4)}`,
        `L${X(-w + 0.02)} ${Y(0.98)}`,
        `L${X(-0.15)} ${Y(0.9)}`,
        `L${X(-0.12)} ${Y(0)}`,
        `L${X(-0.02)} ${Y(0)}`,
        `L${X(0)} ${Y(0.78)}`,
        `L${X(0.02)} ${Y(0)}`,
        `L${X(0.12)} ${Y(0)}`,
        `L${X(0.15)} ${Y(0.9)}`,
        `L${X(w - 0.02)} ${Y(0.98)}`,
        `L${X(w)} ${Y(h - 0.4)}`,
        `Q${X(w)} ${Y(h - 0.3)} ${X(0.07)} ${Y(h - 0.28)}`,
        `L${X(0.06)} ${Y(h - 0.22)}Z`,
      ].join(" ");
      // the sparkler arm: up and in over the aisle, most held high, a few at shoulder height
      const high = rand() < 0.78;
      const handZ = high ? 2.02 + rand() * 0.28 : 1.42 + rand() * 0.12;
      const hx = bx + inward * (high ? 0.16 + rand() * 0.14 : 0.36 + rand() * 0.1) * m;
      const hy = gy - handZ * m;
      const sx = bx + inward * (w - 0.04) * m;
      const sy = gy - (h - 0.34) * m;
      const arm = `M${r2(sx)} ${r2(sy)} Q${r2(sx + inward * 0.06 * m)} ${r2((sy + hy) / 2)} ${r2(hx)} ${r2(hy)}`;
      guests.push({ d: `${head} ${body}`, arm, armW: r2(0.1 * m), depth: k, rim: [r2(inward * 0.025 * m), r2(-0.012 * m)] });
      const s = (m / 94) * 1.8;
      const streaks: Streak[] = Array.from({ length: 9 }, () => ({
        a: r2(rand() * 360),
        len: r2((6 + rand() * 9) * s * 1.25),
        w: r2(Math.max(1, 0.95 * s)),
        dur: r2(0.32 + rand() * 0.38),
        delay: r2(-rand() * 0.7),
      }));
      // the tip of the sparkler, a hand's length above the fist
      sparks.push({ x: r2(hx + inward * 0.04 * m), y: r2(hy - 0.2 * m), s: r2(s), blur: r2(Math.max(0, (s - 2.2) * 1.3)), streaks, flick: r2(-rand()) });
    }
  });
  return { sparks, guests };
})();

function Sparkler({ p }: { p: Spark }) {
  const core = 4 * p.s;
  const halo = 64 * p.s;
  return (
    <div className="absolute" style={{ left: p.x, top: p.y, width: 0, height: 0, opacity: p.blur ? 0.9 : 1 }}>
      <div
        className="sparkle-flicker absolute rounded-full"
        style={{
          left: -halo / 2,
          top: -halo / 2,
          width: halo,
          height: halo,
          background: "radial-gradient(circle, rgba(255,226,170,0.85) 0%, rgba(255,190,110,0.46) 16%, rgba(255,160,80,0.16) 42%, rgba(255,140,60,0) 70%)",
          animationDelay: `${p.flick}s`,
        }}
      />
      {p.streaks.map((k, i) => (
        <div key={i} className="absolute" style={{ left: -k.w / 2, top: 0, width: k.w, height: k.len, transformOrigin: "50% 0", transform: `rotate(${k.a}deg)` }}>
          <div
            className="sparkle-fizz h-full w-full rounded-full"
            style={{
              background: "linear-gradient(180deg, rgba(255,230,180,0) 0%, #fff0c8 18%, #ffc25a 66%, rgba(255,179,71,0) 100%)",
              animationDuration: `${k.dur}s`,
              animationDelay: `${k.delay}s`,
            }}
          />
        </div>
      ))}
      <div
        className="absolute rounded-full"
        style={{ left: -core / 2, top: -core / 2, width: core, height: core, background: "radial-gradient(circle, #fffaf0 0%, #fff0c8 50%, rgba(255,220,150,0) 100%)" }}
      />
    </div>
  );
}

const DEPTHS = [...new Set(SEND_OFF.guests.map((g) => g.depth))];

// The guests are drawn once, soft, into a bitmap (half the photo's resolution) instead of
// as live SVG blurs: a blur filter re-run under fizzing sparklers costs a frame every time.
let guestsImage: Promise<string | null> | null = null;
function drawGuests(): Promise<string | null> {
  if (guestsImage) return guestsImage;
  guestsImage = new Promise((resolve) => {
    const run = () => {
      try {
        const S = 0.5;
        const c = document.createElement("canvas");
        c.width = W0 * S;
        c.height = H0 * S;
        const g = c.getContext("2d");
        if (!g) return resolve(null);
        g.scale(S, S);
        g.lineCap = "round";
        for (const k of DEPTHS) {
          g.filter = `blur(${r2((0.5 + k * 0.85) * S)}px)`;
          for (const guest of SEND_OFF.guests.filter((x) => x.depth === k)) {
            const body = new Path2D(guest.d);
            const arm = new Path2D(guest.arm);
            // sparkler light on the side facing the aisle...
            g.save();
            g.translate(guest.rim[0], guest.rim[1]);
            g.globalAlpha = 0.4;
            g.fillStyle = "#8a5a3c";
            g.fill(body);
            g.restore();
            // ...then the figure itself
            g.globalAlpha = 1;
            g.fillStyle = g.strokeStyle = "#060816";
            g.lineWidth = guest.armW;
            g.fill(body);
            g.stroke(arm);
          }
        }
        c.toBlob((b) => resolve(b ? URL.createObjectURL(b) : null), "image/png");
      } catch {
        resolve(null);
      }
    };
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    if (idle) idle(run);
    else setTimeout(run, 200);
  });
  return guestsImage;
}

function Sparklers({ on }: { on: MotionValue<number> }) {
  // Mounted only while lit, so the fizz doesn't animate unseen.
  const [live, setLive] = useState(() => on.get() > 0.002);
  useMotionValueEvent(on, "change", (v) => setLive(v > 0.002));
  const [guests, setGuests] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    drawGuests().then((u) => alive && setGuests(u));
    return () => {
      alive = false;
    };
  }, []);
  const [dx] = H.path.door;
  const [nx] = H.path.near;
  if (!live) return null;
  return (
    <motion.div style={{ opacity: on }} className={layer}>
      {/* the warm pool the sparklers throw on the walk, the shrubs and the guests' feet */}
      <div
        className="absolute"
        style={{
          left: (dx + nx) / 2 - 820,
          top: H.path.horizon - 140,
          width: 1640,
          height: 560,
          mixBlendMode: "screen",
          background: "radial-gradient(ellipse 50% 50% at 50% 42%, rgba(255,176,96,0.36), rgba(255,160,90,0.14) 55%, rgba(255,150,80,0) 78%)",
        }}
      />
      {/* the guests, in front of the lit doors */}
      {guests ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={guests} alt="" aria-hidden width={W0} height={H0} draggable={false} className="absolute inset-0 h-full w-full select-none" />
      ) : null}
      <div className="absolute inset-0">
        {SEND_OFF.sparks.map((p, i) => (
          <Sparkler key={i} p={p} />
        ))}
      </div>
    </motion.div>
  );
}

export const STAGE_WINDOWS = WINDOW_COUNT;
