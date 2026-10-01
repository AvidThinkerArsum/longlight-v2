// The hero's scenes, laid out along its scroll: when each shot comes in, how the camera
// moves into it and out of it, and when it is done. Everything is a pure function of
// scroll progress, so scrolling back plays the day in reverse.

import { STEP, STOPS } from "./day";
import { cameraTransform } from "./camera";
import type { Back, Cam, Move, Shot, Still } from "./site";

/** A camera offset: where the focal point sits (shift, as fractions of the viewport), and a zoom factor. */
export type Offset = { dx: number; dy: number; z: number };
const NONE: Offset = { dx: 0, dy: 0, z: 1 };

/**
 * Each move as an offset: where the incoming scene starts (`in`, settling to none), and
 * where the outgoing scene ends up (`out`) while the incoming one fades in over it.
 * A camera moving down slides the world up, so "drop" brings the next scene up from below.
 */
export const MOVES: Record<Move, { in: Offset; out: Offset }> = {
  // forward, through the glass
  push: { in: { dx: 0, dy: 0, z: 0.86 }, out: { dx: 0, dy: 0, z: 1.6 } },
  // down, out of the loft and into the orchard
  drop: { in: { dx: 0, dy: 0.14, z: 1 }, out: { dx: 0, dy: -0.14, z: 1 } },
  // pulling back over the lawn
  wide: { in: { dx: 0, dy: 0, z: 1.4 }, out: { dx: 0, dy: 0, z: 0.9 } },
  // forward and a little down, along the aisle
  drift: { in: { dx: 0, dy: 0.04, z: 0.9 }, out: { dx: 0, dy: 0, z: 1.35 } },
  // across, into the orchard
  slide: { in: { dx: 0.18, dy: 0, z: 1 }, out: { dx: -0.18, dy: 0, z: 1 } },
  // through the open doors
  glide: { in: { dx: 0, dy: 0, z: 0.86 }, out: { dx: 0, dy: 0, z: 1.5 } },
  // out onto the lawn, low and slow
  low: { in: { dx: 0.06, dy: 0.1, z: 1 }, out: { dx: 0, dy: -0.06, z: 1 } },
  // down onto the terrace (the barn camera eases down under it)
  ease: { in: { dx: 0, dy: 0.1, z: 1 }, out: NONE },
};
/** A scene giving way to the barn: it sinks as the camera rises, or falls away as it pulls back. */
export const BACKS: Record<Back, Offset> = {
  rise: { dx: 0, dy: 0.16, z: 1 },
  pull: { dx: 0, dy: 0, z: 0.8 },
};

// Timing, in stops (STEP) from the stop a shot belongs to.
/** A scene comes in between captions: after the last one is gone, before its own arrives. */
const ENTER: [number, number] = [-0.66, -0.36];
/** Off the landing there is less run-in: the barn push takes the first half. */
const FIRST_ENTER: [number, number] = [-0.32, -0.12];
/** The barn comes back over the same stretch. */
const BACK_OUT: [number, number] = [-0.7, -0.36];
/** A cut within a stop is a quick crossfade. */
const CUT = 0.08;
/** After a scene is in, its entrance move keeps settling for a little longer. */
const SETTLE = 0.3;

export type PlanShot = {
  key: string;
  /** Index of its stop in STOPS. */
  stop: number;
  shot: Shot;
  /** Fades in over this stretch of scroll. */
  in: [number, number];
  /** Its entrance move has settled by here. */
  settle: number;
  /** Entrance offset (none for a cut). */
  from: Offset;
  /** The next shot comes in over this stretch (or, back to the barn, this one fades out). */
  out: [number, number];
  /** Offset at the end of `out`. */
  to: Offset;
  /** True when it fades out to the barn beneath, rather than being covered. */
  fades: boolean;
};

export const PLAN: PlanShot[] = (() => {
  const plan: PlanShot[] = [];
  STOPS.forEach((stop, i) => {
    const scene = stop.scene;
    if (!scene) return;
    const [a, b] = i === 0 ? FIRST_ENTER : ENTER;
    scene.shots.forEach((shot, k) => {
      const c = shot.cut ?? 0;
      const i0 = k === 0 ? stop.p + a * STEP : stop.p + (c - CUT / 2) * STEP;
      const i1 = k === 0 ? stop.p + b * STEP : stop.p + (c + CUT / 2) * STEP;
      plan.push({
        key: `${stop.id}-${k}`,
        stop: i,
        shot,
        in: [i0, i1],
        settle: k === 0 ? i1 + SETTLE * STEP : i1,
        from: k === 0 ? MOVES[scene.move].in : NONE,
        out: [2, 2],
        to: NONE,
        fades: false,
      });
    });
  });
  plan.forEach((s, j) => {
    const next = plan[j + 1];
    const nextStop = STOPS[s.stop + 1];
    if ((!next || next.stop !== s.stop) && nextStop && !nextStop.scene) {
      s.out = [nextStop.p + BACK_OUT[0] * STEP, nextStop.p + BACK_OUT[1] * STEP];
      s.to = BACKS[nextStop.back ?? "rise"];
      s.fades = true;
    } else if (next) {
      s.out = next.in;
      s.to = next.stop !== s.stop ? MOVES[STOPS[next.stop].scene!.move].out : NONE;
    }
  });
  return plan;
})();

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const easeIn = (t: number) => t * t;
const span = (p: number, [a, b]: [number, number]) => clamp01((p - a) / (b - a || 1));

/** A covered shot stays a little past the moment the next is fully in (in case it's still loading). */
const LINGER = 0.25 * STEP;

/**
 * How much of a shot shows at `p`: in over `in`; out over `out` if it fades to the barn,
 * otherwise held under the next shot until shortly after that one is fully in.
 */
export function opacityAt(s: PlanShot, p: number) {
  const fin = smooth(span(p, s.in));
  if (s.fades) return fin * (1 - smooth(span(p, s.out)));
  return p > s.out[1] + LINGER ? 0 : fin;
}

/** The shot's whole life, from the start of its fade in to the end of its way out. */
export const lifeOf = (s: PlanShot): [number, number] => [s.in[0], Math.min(1, s.out[1])];

function offsetAt(s: PlanShot, p: number): Offset {
  const e = 1 - easeOut(span(p, [s.in[0], s.settle]));
  const o = easeIn(span(p, s.out));
  return {
    dx: s.from.dx * e + s.to.dx * o,
    dy: s.from.dy * e + s.to.dy * o,
    z: s.from.z ** e * s.to.z ** o,
  };
}

/**
 * Where the camera is on a shot at `p`: a slow drift from its first framing to its second
 * over its life, plus its entrance and exit moves (`moves` false: crossfades only).
 */
export function shotCamera(s: PlanShot, p: number, vw: number, vh: number, still: Still, cams: readonly [Cam, Cam], moves: boolean, target: [number, number]) {
  const [l0, l1] = lifeOf(s);
  const u = clamp01((p - l0) / (l1 - l0 || 1));
  const [a, b] = cams;
  const fx = a[0] + (b[0] - a[0]) * u;
  const fy = a[1] + (b[1] - a[1]) * u;
  const z = Math.exp(Math.log(a[2]) + (Math.log(b[2]) - Math.log(a[2])) * u);
  const off = moves ? offsetAt(s, p) : NONE;
  // a shifted frame zooms in just enough that the shift never shows an edge
  const over = 1 + 2 * Math.max(Math.abs(off.dx), Math.abs(off.dy));
  return cameraTransform(vw, vh, [fx * still.w, fy * still.h, z * off.z * over], [target[0] + off.dx, target[1] + off.dy], still);
}

/** Every still and clip the scenes use, for the credits. */
export const SCENE_CREDITS = (() => {
  const seen = new Map<string, { by: string; page: string; video: boolean }>();
  for (const s of PLAN) {
    for (const still of [s.shot.still, s.shot.phone]) {
      if (still && !seen.has(still.page)) seen.set(still.page, { by: still.by, page: still.page, video: still.page.includes("/video/") });
    }
  }
  return [...seen.values()];
})();
