"use client";

// The couple's day, in scenes, over the barn. Each shot is a layer: a stock still with a
// scroll-driven camera (a slow drift, plus a move into and out of it), and, on desktop, a
// short muted clip over its poster. A shot mounts a stop before it is needed, so it has
// loaded by the time it fades in, and unmounts once it is well behind. Phones and slow
// connections get stills and crossfades only.

import { motion, useMotionValueEvent, useTransform, type MotionValue } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { STEP } from "@/lib/day";
import { PLAN, lifeOf, opacityAt, shotCamera, type PlanShot } from "@/lib/scenes";

/** Mount a shot this far ahead of its fade in, and keep it this long after it's gone. */
const AHEAD = 1.1 * STEP;
const BEHIND = 0.35 * STEP;
/** Start fetching a clip this far ahead (it's 1.4 to 2 MB). */
const CLIP_AHEAD = 0.6 * STEP;

function nearKeys(p: number) {
  return PLAN.filter((s) => {
    const [a, b] = lifeOf(s);
    return p >= a - AHEAD && p <= b + BEHIND;
  })
    .map((s) => s.key)
    .join(" ");
}

/** True when a loaded shot above the j-th is fully in at `p` (so the j-th needn't be drawn). */
function covered(j: number, p: number, loaded: Set<string>) {
  for (let k = j + 1; k < PLAN.length; k++) if (loaded.has(PLAN[k].key) && opacityAt(PLAN[k], p) > 0.999) return true;
  return false;
}

/**
 * Desktop on a decent connection: clips and camera moves. Phones, Save-Data and 2g/3g
 * connections get stills and crossfades.
 */
export function useRich(mobile: boolean) {
  const [fast, setFast] = useState(false);
  useEffect(() => {
    const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the connection once, after hydration
    setFast(!(c && (c.saveData || /(^|-)2g$|^3g$/.test(c.effectiveType ?? ""))));
  }, []);
  return fast && !mobile;
}

export function Scenes({
  p,
  w,
  h,
  mobile,
  rich,
  target,
  cover,
}: {
  p: MotionValue<number>;
  w: MotionValue<number>;
  h: MotionValue<number>;
  mobile: boolean;
  rich: boolean;
  target: [number, number];
  /** Set to how much of the frame the loaded scenes cover (1: the barn is hidden). */
  cover: MotionValue<number>;
}) {
  const [near, setNear] = useState(() => nearKeys(p.get()));
  const loaded = useRef(new Set<string>());
  const measure = useCallback(
    (v: number) => {
      let c = 0;
      for (const s of PLAN) if (loaded.current.has(s.key)) c = Math.max(c, opacityAt(s, v));
      cover.set(Math.round(c * 1000) / 1000);
    },
    [cover],
  );
  useMotionValueEvent(p, "change", (v) => {
    const k = nearKeys(v);
    if (k !== near) setNear(k);
    measure(v);
  });
  const onLoaded = useCallback(
    (key: string) => {
      loaded.current.add(key);
      measure(p.get());
    },
    [measure, p],
  );
  const mounted = new Set(near.split(" "));
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {PLAN.map((s, j) =>
        mounted.has(s.key) ? <ShotLayer key={s.key} s={s} j={j} p={p} w={w} h={h} mobile={mobile} rich={rich} target={target} loaded={loaded} onLoaded={onLoaded} /> : null,
      )}
    </div>
  );
}

function ShotLayer({
  s,
  j,
  p,
  w,
  h,
  mobile,
  rich,
  target,
  loaded,
  onLoaded,
}: {
  s: PlanShot;
  j: number;
  p: MotionValue<number>;
  w: MotionValue<number>;
  h: MotionValue<number>;
  mobile: boolean;
  rich: boolean;
  target: [number, number];
  loaded: React.RefObject<Set<string>>;
  onLoaded: (key: string) => void;
}) {
  const still = mobile && s.shot.phone ? s.shot.phone : s.shot.still;
  const cams = mobile ? s.shot.m : s.shot.d;
  const opacity = useTransform(p, (v) => opacityAt(s, v));
  const visibility = useTransform(p, (v) => (opacityAt(s, v) < 0.002 || covered(j, v, loaded.current) ? "hidden" : "visible"));
  const cam = useTransform([p, w, h], ([v, vw, vh]: number[]) => shotCamera(s, v, vw, vh, still, cams, rich, target));
  const x = useTransform(cam, (c) => c.x);
  const y = useTransform(cam, (c) => c.y);
  const scale = useTransform(cam, (c) => c.scale);
  // phones: 1600 wide (a portrait frame, 1200); desktop: 1920
  const src = still.src(mobile ? (still.h > still.w ? 1200 : 1600) : 1920);
  const img = useRef<HTMLImageElement>(null);
  const done = useCallback(() => {
    const el = img.current;
    if (!el) return;
    // decoded before it counts as loaded, so the first frame of its fade isn't a stall
    (el.decode ? el.decode() : Promise.resolve()).catch(() => {}).then(() => onLoaded(s.key));
  }, [onLoaded, s.key]);
  useEffect(() => {
    if (img.current?.complete && img.current.naturalWidth) done();
  }, [done]);
  const clip = rich && s.shot.clip && !mobile ? s.shot.clip : null;
  return (
    <motion.div style={{ opacity, visibility }} className="absolute inset-0 overflow-hidden">
      <motion.div style={{ x, y, scale, originX: 0, originY: 0, width: still.w, height: still.h }} className="absolute left-0 top-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={img} src={src} alt="" width={still.w} height={still.h} decoding="async" draggable={false} onLoad={done} className="absolute inset-0 h-full w-full select-none" />
        {clip ? <Clip src={clip} s={s} p={p} opacity={opacity} /> : null}
      </motion.div>
    </motion.div>
  );
}

/**
 * A muted, looping clip over its poster still: fetched only as its stop comes near, played
 * only while it shows, and faded in once it is actually playing (never a black frame).
 */
function Clip({ src, s, p, opacity }: { src: string; s: PlanShot; p: MotionValue<number>; opacity: MotionValue<number> }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [load, setLoad] = useState(() => p.get() >= s.in[0] - CLIP_AHEAD);
  const [playing, setPlaying] = useState(false);
  useMotionValueEvent(p, "change", (v) => {
    if (!load && v >= s.in[0] - CLIP_AHEAD) setLoad(true);
  });
  const sync = useCallback((v: number) => {
    const el = ref.current;
    if (!el || !el.currentSrc) return;
    if (v > 0.02) {
      if (el.paused) el.play().catch(() => {});
    } else if (!el.paused) el.pause();
  }, []);
  useMotionValueEvent(opacity, "change", sync);
  useEffect(() => {
    if (load) sync(opacity.get());
  }, [load, opacity, sync]);
  return (
    <video
      ref={ref}
      src={load ? src : undefined}
      muted
      playsInline
      loop
      preload={load ? "auto" : "none"}
      onLoadedData={() => sync(opacity.get())}
      onPlaying={() => setPlaying(true)}
      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${playing ? "opacity-100" : "opacity-0"}`}
    />
  );
}
