// Resolves the configured run of show against the real sunset for the featured date,
// and lays the stops out along the hero's scroll.

import { site, type ClockTime, type Focus } from "./site";
import { clockLabel, sunset } from "./sun";

export const SUNSET = sunset(site.featuredDate, site.lat, site.lon, site.timeZone);
export const WINTER_SUNSET = sunset(site.winterDate, site.lat, site.lon, site.timeZone);

/**
 * A configured time in minutes after midnight. Sunset itself is exact; times keyed to it
 * ("sunset + 30") round to the nearest five minutes, the way a run of show is written.
 */
export function resolveTime(t: ClockTime, sunsetMinutes = SUNSET.minutes) {
  if (typeof t === "string") {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }
  if (t.sunset === 0) return sunsetMinutes;
  return Math.round((sunsetMinutes + t.sunset) / 5) * 5;
}

const d = new Date(`${site.featuredDate}T12:00:00Z`);
export const FEATURED = {
  weekday: d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
  weekdayLong: d.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" }),
  month: d.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" }),
  day: d.getUTCDate(),
  year: d.getUTCFullYear(),
};
const w = new Date(`${site.winterDate}T12:00:00Z`);
export const WINTER = {
  short: w.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
};

// Scroll layout: a short hold on the landing frame, the seven stops, then the close.
export const LANDING_END = 0.035;
const FIRST = 0.085;
const LAST = 0.875;
export const CLOSE_AT = 0.965;

export type Stop = {
  p: number;
  minutes: number;
  time: string;
  label: string;
  line: string;
  focus: { d: Focus; m: Focus };
};

export const STOPS: Stop[] = site.runOfShow.map((s, i, all) => {
  const minutes = resolveTime(s.at);
  return {
    p: FIRST + (i * (LAST - FIRST)) / (all.length - 1),
    minutes,
    time: clockLabel(minutes),
    label: s.label,
    line: s.line,
    focus: s.focus,
  };
});

/** Camera and clock keys along the scroll, including the landing and the close. */
export const KEYS = [
  { p: 0, minutes: STOPS[0].minutes, focus: site.hero.focus.landing },
  { p: LANDING_END, minutes: STOPS[0].minutes, focus: site.hero.focus.landing },
  ...STOPS.map((s) => ({ p: s.p, minutes: s.minutes, focus: s.focus })),
  { p: CLOSE_AT, minutes: STOPS[STOPS.length - 1].minutes, focus: site.hero.focus.close },
  { p: 1, minutes: STOPS[STOPS.length - 1].minutes, focus: site.hero.focus.close },
];

const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

/** Where between two keys a scroll position falls, eased so the camera dwells at stops. */
export function segment(p: number) {
  if (p <= 0) return { i: 0, t: 0 };
  for (let i = 1; i < KEYS.length; i++) {
    if (p <= KEYS[i].p) {
      const t = (p - KEYS[i - 1].p) / (KEYS[i].p - KEYS[i - 1].p || 1);
      return { i: i - 1, t: smoother(Math.min(1, Math.max(0, t))) };
    }
  }
  return { i: KEYS.length - 2, t: 1 };
}

export function clockAt(p: number) {
  const { i, t } = segment(p);
  return KEYS[i].minutes + (KEYS[i + 1].minutes - KEYS[i].minutes) * t;
}

export function focusAt(p: number, mobile: boolean): Focus {
  const { i, t } = segment(p);
  const a = mobile ? KEYS[i].focus.m : KEYS[i].focus.d;
  const b = mobile ? KEYS[i + 1].focus.m : KEYS[i + 1].focus.d;
  // Glide in log-zoom so a push-in and a pull-back feel the same speed.
  const z = Math.exp(Math.log(a[2]) + (Math.log(b[2]) - Math.log(a[2])) * t);
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, z];
}
