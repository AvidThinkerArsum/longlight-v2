"use client";

// The hero: one daytime photograph plays a whole wedding day as you scroll. The camera
// tours between focal points, the clock rolls, the light goes gold, rose, then blue, and
// the barn lights itself up. It opens on the featured couple, then follows their day stop by
// stop; the pin grows with the run of show (.hero-pin in globals.css).

import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Stage } from "@/components/stage/Stage";
import { BokehStrand, RUNS } from "@/components/Bulbs";
import { Odometer } from "@/components/Odometer";
import { Sample } from "@/components/ui/Sample";
import { Words } from "@/components/ui/Reveal";
import { scrollToId } from "@/components/Booking";
import { site } from "@/lib/site";
import { CLOSE_AT, FEATURED, LANDING_END, STEP, STOPS, SUNSET, clockAt, focusAt, type Stop } from "@/lib/day";
import { cameraTransform } from "@/lib/camera";
import { useMasks } from "@/lib/masks";
import { useLightFromClock, useLightPreset } from "@/lib/useLight";
import { useReduce } from "@/lib/useReduce";
import { DAY_NAMES, dayOf, openCount } from "@/lib/availability";
import { useAvailability } from "@/lib/useAvailability";
import { clockLabel } from "@/lib/sun";

// On phones the clock sits on the sky, so it follows the sky: ink by day, linen at dusk.
const TONE_TEXT =
  "text-ink group-data-[tone=dark]:text-linen group-data-[tone=dark]:[text-shadow:0_1px_14px_rgba(30,24,60,0.5)] transition-colors duration-500";


const clamp = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const band = (p: number, a: number, b: number, c: number, d: number) =>
  p <= a || p >= d ? 0 : p < b ? (p - a) / (b - a) : p <= c ? 1 : 1 - (p - c) / (d - c);

// Scroll beats of the landing: the headline fades over LANDING_FADE, and only then does the
// clock (phones) and the first caption come in, so the two never share pixels.
const LANDING_FADE: [number, number] = [LANDING_END * 0.5, 0.062];
const TOP_UI_IN: [number, number] = [0.063, 0.08];
// The couple's intro holds through the landing and is gone just before the first caption,
// handing over to the date display above the clock.
const INTRO_OUT: [number, number] = [0.048, 0.062];

const FEATURED_DAY = dayOf(site.featuredDate) ?? "sat";
const SUNSET_LINE = `Sunset, ${FEATURED.weekday} ${FEATURED.month} ${FEATURED.day}: ${SUNSET.label}`;
const FIRST_TIME = STOPS[0].time;
/** When the rooms open: the one start time the page uses ("10 am"). */
const DOORS = (() => {
  const [h, m] = site.hours.start.split(":").map(Number);
  return clockLabel(h * 60 + m).replace(":00", "");
})();
/** The featured couple's day, from the same config the estimate opens on. */
const FACTS = `${FEATURED.weekdayLong}, ${FEATURED.month} ${FEATURED.day}, ${FEATURED.year} · ${site.featuredGuests} guests · ${site.name}, ${site.town}`;
const FACTS_SHORT = `${FEATURED.weekday}, ${FEATURED.month} ${FEATURED.day} · ${site.featuredGuests} guests`;
const INTRO_LINE = `Scroll through their day, from ${STOPS[0].label.toLowerCase()} at ${FIRST_TIME} to sparklers under a ${SUNSET.label.replace(/ [ap]m$/, "")} sunset.`;
/** Where a stop's focal point lands in the frame (fractions of the viewport). */
const CAMERA_TARGET = { d: [0.5, 0.46] as [number, number], m: [0.5, 0.42] as [number, number] };
const LAST_TIME = STOPS[STOPS.length - 1].time;
export const TONE_EVENT = "longlight:tone";

function useFrameSize(ref: React.RefObject<HTMLElement | null>) {
  const w = useMotionValue(1440);
  const h = useMotionValue(900);
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const on = () => {
      const r = el.getBoundingClientRect();
      w.set(r.width);
      h.set(r.height);
      setMobile(r.width < 768);
    };
    on();
    const ro = new ResizeObserver(on);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, w, h]);
  return { w, h, mobile };
}

export function Hero() {
  const reduce = useReduce();
  return reduce ? <StillHero /> : <ScrollHero />;
}

function SunsetPill({ onDark = false }: { onDark?: boolean }) {
  return (
    <p
      className={`inline-flex items-center gap-2.5 rounded-full py-1.5 pl-2 pr-4 text-[13px] font-medium tabular-nums ${
        onDark ? "bg-linen/90 text-ink" : "bg-ink/90 text-linen"
      }`}
    >
      <span aria-hidden className="relative block h-4 w-4 overflow-hidden rounded-full">
        <span className="absolute inset-x-0 top-[7px] mx-auto block h-3.5 w-3.5 rounded-full bg-[#f6b867]" />
        <span className={`absolute inset-x-0 top-[9px] block h-px ${onDark ? "bg-ink/50" : "bg-linen/70"}`} />
      </span>
      {SUNSET_LINE}
    </p>
  );
}

function Headline() {
  return (
    <div className="relative max-w-[640px]">
      <div aria-hidden className="absolute -inset-x-16 -inset-y-14 -z-10 rounded-[50%] bg-[radial-gradient(ellipse_at_40%_50%,rgba(243,236,225,0.62),rgba(243,236,225,0)_68%)] blur-2xl" />
      <p className="eyebrow text-ink/75">
        {site.kind} · one wedding a day
        <Sample />
      </p>
      <h1 className="display hero-h1 mt-3 leading-[0.92] text-ink sm:mt-4">
        <Words text="The light stays" />
        <br />
        <Words italic="late" delay={0.22} /> <Words text="here." delay={0.3} />
      </h1>
      <p className="mt-4 max-w-[400px] text-[15px] font-medium leading-relaxed text-ink/85 sm:mt-5 sm:text-base">
        {site.town}, {site.state}. From {DOORS} until the last sparkler, the place is yours.
        <Sample />
      </p>
      <div className="mt-5 sm:mt-6">
        <SunsetPill />
      </div>
    </div>
  );
}

function CheckButton({ onDark = true, className = "" }: { onDark?: boolean; className?: string }) {
  return (
    <a
      href="#dates"
      onClick={(e) => {
        e.preventDefault();
        scrollToId("dates");
      }}
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-6 py-3 text-[14px] font-semibold transition ${onDark ? "bg-linen text-ink hover:bg-white" : "bg-ink text-linen"} ${className}`}
    >
      Check your date <span aria-hidden>↓</span>
    </a>
  );
}

function Close() {
  return (
    <div className="text-center text-linen">
      <p className="eyebrow text-linen/75">
        {FEATURED.weekdayLong}, {FEATURED.month} {FEATURED.day}, {FEATURED.year}
      </p>
      <h2 className="display mt-3 text-[2.6rem] leading-[0.95] sm:mt-4 sm:text-[5rem]">
        Your date might still be <em className="text-amber">free.</em>
      </h2>
      <LeftLine className="mt-4 text-[14px] font-medium text-linen/80 tabular-nums sm:mt-5" />
      <CheckButton className="mt-5 sm:mt-7" />
    </div>
  );
}

/** "2 Saturdays left in June 2027": read from the same calendar as the date checker. */
function LeftLine({ className = "" }: { className?: string }) {
  const avail = useAvailability();
  const month = avail?.month(site.featuredDate.slice(0, 7));
  const n = month ? openCount(month, FEATURED_DAY) : 0;
  // Until the calendar is computed (it's rolled from today, in the browser), hold the place.
  return (
    <p className={`${className} ${month ? "" : "invisible"}`} aria-hidden={month ? undefined : true}>
      {n} {DAY_NAMES[FEATURED_DAY]}
      {n === 1 ? "" : "s"} left in {FEATURED.month} {FEATURED.year}
      <Sample className="ml-1.5" />
    </p>
  );
}

/** The featured couple is invented: always tagged, like the sample reviews. */
function SampleTag() {
  return <span className="sample-tag">sample</span>;
}

/** The date display above the clock: whose day it is, when, and how many are coming. */
function DayLine({ className = "" }: { className?: string }) {
  return (
    <div className={`eyebrow mb-1.5 space-y-1 ${className}`}>
      <p>
        {site.couple}
        <SampleTag />
      </p>
      <p className="opacity-80 tabular-nums">{FACTS_SHORT}</p>
    </div>
  );
}

function SkipLink({ className = "" }: { className?: string }) {
  return (
    <a
      href="#dates"
      onClick={(e) => {
        e.preventDefault();
        scrollToId("dates");
      }}
      className={`items-center gap-1.5 whitespace-nowrap rounded-full border border-linen/35 bg-ink/35 px-3.5 py-1.5 text-[12px] font-semibold backdrop-blur-md ${className}`}
    >
      Skip to dates <span aria-hidden>↓</span>
    </a>
  );
}

// Each caption holds around its stop and is gone before the next one comes in, however
// many stops there are (a band is a share of the distance between two stops).
function captionBand(stop: Stop): [number, number, number, number] {
  const a = Math.max(stop.p - 0.456 * STEP, TOP_UI_IN[0]);
  const b = Math.max(stop.p - 0.19 * STEP, a + 0.012);
  return [a, b, stop.p + 0.266 * STEP, stop.p + 0.456 * STEP];
}

function Caption({ p, stop, mobile }: { p: MotionValue<number>; stop: Stop; mobile: boolean }) {
  const [a, b, c, d] = captionBand(stop);
  const opacity = useTransform(p, (v) => band(v, a, b, c, d));
  const y = useTransform(p, (v) => (v < b ? (1 - band(v, a, b, 1, 2)) * 14 : 0));
  return (
    <motion.div style={{ opacity, y }} className="absolute inset-x-0 bottom-0">
      <p className="eyebrow text-amber">
        {stop.label}
        {/* phones: the place on a line of its own, rather than wherever the wrap falls */}
        <span className={mobile ? "block pt-0.5 text-linen/75" : "text-linen/75"}>
          {mobile ? stop.place : ` · ${stop.place}`}
        </span>
      </p>
      <p className={`mt-1.5 max-w-[440px] font-medium leading-snug text-linen/90 md:max-lg:max-w-[330px] ${mobile ? "text-[13.5px]" : "text-[15px]"}`}>
        {stop.line}
        <Sample />
      </p>
    </motion.div>
  );
}

/**
 * The featured couple, in the caption's place before their day starts. As the first stop
 * comes in it hands over to the date display above the clock (the same couple, date and
 * head count, from the config the estimate opens on), so the two are never up together.
 */
function Intro({ p, mobile }: { p: MotionValue<number>; mobile: boolean }) {
  const opacity = useTransform(p, (v) => 1 - smooth(INTRO_OUT[0], INTRO_OUT[1], v));
  const size = mobile ? "text-[13.5px]" : "text-[15px]";
  return (
    <motion.div style={{ opacity }} className="absolute inset-x-0 bottom-0">
      <p className="eyebrow text-amber">
        Meet {site.couple}
        <SampleTag />
      </p>
      <p className={`mt-1.5 max-w-[460px] font-semibold leading-snug text-linen tabular-nums md:max-lg:max-w-[330px] ${size}`}>{FACTS}</p>
      <p className={`mt-1 max-w-[460px] font-medium leading-snug text-linen/90 md:max-lg:max-w-[330px] ${size}`}>{INTRO_LINE}</p>
    </motion.div>
  );
}

type Align = "start" | "center" | "end";

function RailTick({ p, stop, left, align }: { p: MotionValue<number>; stop: Stop; left: number; align: Align }) {
  const on = useTransform(p, (v) => (v >= stop.p - 0.03 ? 1 : 0.55));
  const dot = useTransform(p, (v) => (v >= stop.p - 0.03 ? 1 : 0.6));
  const pos = align === "start" ? "" : align === "end" ? "-translate-x-full" : "-translate-x-1/2";
  const items = align === "start" ? "items-start text-left" : align === "end" ? "items-end text-right" : "items-center text-center";
  const nudge = align === "start" ? "-ml-1" : align === "end" ? "-mr-1" : "";
  return (
    <motion.li style={{ left: `${left}%`, opacity: on }} className={`absolute top-0 flex flex-col ${pos} ${items}`}>
      <motion.span style={{ scale: dot }} className={`block h-2 w-2 -translate-y-[3px] rounded-full bg-linen ${nudge}`} />
      {/* phones fit ten stops by dropping the ":00" ("1", "2:30", ... "10") */}
      <span className="mt-2 block whitespace-nowrap text-[11px] font-semibold tabular-nums text-linen">
        <span className="md:hidden">{stop.time.replace(/(:00)? [ap]m$/, "")}</span>
        <span className="hidden md:inline">{stop.time.replace(/ [ap]m$/, "")}</span>
      </span>
      <span className="hidden whitespace-nowrap text-[11px] font-medium text-linen/90 lg:block">{stop.rail}</span>
    </motion.li>
  );
}

function ScrollHero() {
  const ref = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const { w, h, mobile } = useFrameSize(frame);
  const masks = useMasks();

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  // Near-critical damping: glides, but comes to rest quickly (the clock settles on a minute).
  const p = useSpring(scrollYProgress, { stiffness: 190, damping: 26, mass: 0.6, restDelta: 0.00005 });
  const clock = useTransform(p, clockAt);
  const light = useLightFromClock(clock, SUNSET.minutes);
  // As the pinned hero lets go, the close fades before it can slide under the nav.
  const { scrollYProgress: leaving } = useScroll({ target: ref, offset: ["end end", "end start"] });
  const out = useTransform([leaving, w], ([v, vw]: number[]) => 1 - clamp(v / (vw < 768 ? 0.06 : 0.14)));

  // Cover-plus-camera, re-aimed for portrait screens. Each stop is aimed a little above the
  // middle: on phones at the clear band between the clock and the caption.
  const cam = useTransform([p, w, h], ([v, vw, vh]: number[]) => cameraTransform(vw, vh, focusAt(v, vw < 768), vw < 768 ? CAMERA_TARGET.m : CAMERA_TARGET.d));
  const x = useTransform(cam, (c) => c.x);
  const y = useTransform(cam, (c) => c.y);
  const scale = useTransform(cam, (c) => c.scale);

  // Pointer sway for the bulbs above the camera.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 30, damping: 9 });
  const sy = useSpring(my, { stiffness: 30, damping: 9 });

  // Full 0→1 ranges throughout (a range that stops early fades back in at the end).
  const landing = useTransform(p, (v) => 1 - clamp((v - LANDING_FADE[0]) / (LANDING_FADE[1] - LANDING_FADE[0])));
  const landingY = useTransform(landing, (o) => (1 - o) * -24);
  // On phones the clock sits where the close comes in, so it is gone before the close starts.
  const ui = useTransform([p, w], ([v, vw]: number[]) => 1 - clamp((v - (vw < 768 ? 0.9 : 0.915)) / (vw < 768 ? 0.025 : 0.03)));
  const close = useTransform(p, (v) => clamp((v - (CLOSE_AT - 0.035)) / 0.03));
  // The pool of shade under the caption lifts while the sparklers are out, so the send-off
  // isn't played under a dark band.
  const pool = useTransform([ui, light.sparklers], ([u, s]: number[]) => u * (1 - 0.5 * s));
  // As the hero lets go, its foot turns into the next section's evergreen: no seam.
  const foot = useTransform(leaving, (v) => clamp(v / 0.08));
  const closeO = useTransform([close, out], ([c, o]: number[]) => c * o);
  const closeY = useTransform(close, (o) => (1 - o) * 24);
  // Phones: as the camera tilts up for the close, the strand overhead drops below the words.
  const strandDrop = useTransform([close, h], ([c, vh]: number[]) => Math.round(c * 0.14 * vh * 100) / 100);
  const first = STOPS[0].p, last = STOPS[STOPS.length - 1].p;
  const progress = useTransform(p, (v) => clamp((v - first) / (last - first)));
  // Desktop: the date display above the clock takes over from the couple's intro.
  const dayLine = useTransform(p, (v) => smooth(TOP_UI_IN[0], TOP_UI_IN[1], v));
  // On phones the clock takes the headline's place, so it waits for the headline to go.
  const topUi = useTransform([p, ui], ([v, u]: number[]) => Math.min(smooth(TOP_UI_IN[0], TOP_UI_IN[1], v), u));
  // The scrim under the clock and rail: light by day (a sunny barn shouldn't look like
  // dusk), full after sunset.
  const scrim = useTransform(clock, (m) => 0.46 + 0.54 * smooth(-70, -5, m - SUNSET.minutes));

  const rail = (
    <div className="relative">
      <div className="h-px w-full bg-linen/30" />
      <motion.div style={{ scaleX: progress, originX: 0 }} className="absolute left-0 top-0 h-px w-full bg-amber" />
      <ol className="relative h-[34px] lg:h-[48px]">
        {STOPS.map((s, i) => (
          <RailTick key={s.id} p={p} stop={s} left={(i / (STOPS.length - 1)) * 100} align={i === 0 ? "start" : i === STOPS.length - 1 ? "end" : "center"} />
        ))}
      </ol>
    </div>
  );

  // Tell the nav what's behind it: sky by day, dusk after sunset. Phones flip earlier: the
  // clock sits on a sky that is already mid-mauve by then.
  // While the close is up, the header goes solid, so nothing reads through it as the hero
  // lets go and the close scrolls away beneath it.
  useMotionValueEvent(close, "change", (c) => {
    const el = frame.current;
    if (!el) return;
    const solid = c > 0.5 ? "1" : "0";
    if (el.dataset.solid !== solid) {
      el.dataset.solid = solid;
      window.dispatchEvent(new Event(TONE_EVENT));
    }
  });
  useMotionValueEvent(clock, "change", (m) => {
    const el = frame.current;
    if (!el) return;
    const tone = m - SUNSET.minutes > (mobile ? -35 : -18) ? "dark" : "light";
    if (el.dataset.tone !== tone) {
      el.dataset.tone = tone;
      window.dispatchEvent(new Event(TONE_EVENT));
    }
  });

  return (
    <section
      id="top"
      ref={ref}
      aria-label={`${site.name}: ${site.couple}'s wedding day at the barn, ${FIRST_TIME} to ${LAST_TIME}`}
      className="hero-pin relative"
      style={{ ["--hero-stops" as string]: STOPS.length }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        mx.set(e.clientX / window.innerWidth - 0.5);
        my.set(e.clientY / window.innerHeight - 0.5);
      }}
    >
      <div ref={frame} data-tone="light" className="group sticky top-0 h-svh w-full overflow-hidden bg-ink">
        <motion.div style={{ x, y, scale, originX: 0, originY: 0 }} className="absolute left-0 top-0">
          <Stage light={light} masks={masks} eager />
        </motion.div>

        <BokehStrand level={light.bulbs} sway={{ x: sx, y: sy }} run={mobile ? RUNS.mobile : RUNS.desktop} fade={out} drop={mobile ? strandDrop : undefined} />

        {/* scrims: a light evergreen wash by day (a sunny barn shouldn't read as dusk), full
            after sunset, plus a local pool of shade right behind the clock, captions and rail */}
        <motion.div
          aria-hidden
          style={{ opacity: scrim }}
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-[linear-gradient(180deg,rgba(21,43,33,0)_0%,rgba(21,43,33,0.5)_48%,rgba(17,36,28,0.84)_100%)] md:h-[46%] md:bg-[linear-gradient(180deg,rgba(21,43,33,0)_0%,rgba(21,43,33,0.5)_52%,rgba(17,36,28,0.82)_100%)]"
        />
        <motion.div
          aria-hidden
          style={{ opacity: pool }}
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[300px] bg-[linear-gradient(180deg,rgba(13,29,22,0)_0%,rgba(13,29,22,0.46)_34%,rgba(13,29,22,0.62)_100%)] md:h-[330px] md:bg-[radial-gradient(ellipse_62%_92%_at_24%_100%,rgba(13,29,22,0.62)_0%,rgba(13,29,22,0.42)_46%,rgba(13,29,22,0)_100%)] md:max-lg:bg-[radial-gradient(ellipse_80%_100%_at_32%_100%,rgba(13,29,22,0.74)_0%,rgba(13,29,22,0.52)_50%,rgba(13,29,22,0)_100%)]"
        />
        <motion.div
          aria-hidden
          style={{ opacity: pool }}
          className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[120px] bg-[linear-gradient(180deg,rgba(13,29,22,0),rgba(13,29,22,0.42))] md:block"
        />

        {/* landing */}
        <motion.div style={{ opacity: landing, y: landingY }} className="hero-landing absolute left-5 right-5 sm:left-10 sm:right-10">
          <Headline />
        </motion.div>

        {/* clock, captions, rail */}
        {mobile ? (
          <>
            <motion.div style={{ opacity: topUi }} className={`absolute left-5 ${site.showConceptBanner ? "top-[92px]" : "top-[70px]"}`}>
              <DayLine className={TONE_TEXT} />
              <Odometer minutes={clock} className={`text-[2.9rem] font-extralight leading-none tracking-[-0.02em] ${TONE_TEXT}`} />
            </motion.div>
            <motion.div style={{ opacity: ui }} className="absolute inset-x-0 bottom-0 px-5 pb-[88px]">
              <div className="relative h-[76px] [text-shadow:0_1px_10px_rgba(9,22,16,0.7)]">
                <Intro p={p} mobile />
                {STOPS.map((s) => (
                  <Caption key={s.id} p={p} stop={s} mobile />
                ))}
              </div>
              <div className="mt-4">{rail}</div>
            </motion.div>
          </>
        ) : (
          <motion.div style={{ opacity: ui }} className="hero-bottom absolute inset-x-0 bottom-0 px-10">
            <div className="flex items-end gap-8">
              <div className="shrink-0 text-linen [text-shadow:0_2px_18px_rgba(9,22,16,0.55)]">
                <motion.div style={{ opacity: dayLine }}>
                  <DayLine className="text-linen/90" />
                </motion.div>
                <Odometer minutes={clock} className="hero-clock font-extralight leading-none tracking-[-0.02em]" />
              </div>
              <div className="relative mb-1 h-[96px] min-w-0 flex-1 [text-shadow:0_1px_12px_rgba(9,22,16,0.6)]">
                <Intro p={p} mobile={false} />
                {STOPS.map((s) => (
                  <Caption key={s.id} p={p} stop={s} mobile={false} />
                ))}
              </div>
              <div className="w-[150px] shrink-0 lg:w-[140px]" />
            </div>
            <div className="hero-rail [text-shadow:0_1px_8px_rgba(9,22,16,0.8)]">{rail}</div>
          </motion.div>
        )}

        {/* the close */}
        <motion.div
          style={{ opacity: closeO }}
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[48%] bg-[radial-gradient(ellipse_70%_52%_at_50%_58%,rgba(13,31,23,0.6),rgba(13,31,23,0)_100%)] sm:top-[18%] sm:h-[56%] sm:bg-[radial-gradient(ellipse_50%_46%_at_50%_50%,rgba(13,31,23,0.62),rgba(13,31,23,0)_100%)]"
        />
        <motion.div style={{ opacity: closeO, y: closeY }} className={`absolute inset-x-0 px-6 sm:top-[34%] ${site.showConceptBanner ? "top-[104px]" : "top-[84px]"}`}>
          <Close />
        </motion.div>

        <motion.div aria-hidden style={{ opacity: foot }} className="pointer-events-none absolute inset-x-0 bottom-0 h-[30vh] bg-[linear-gradient(180deg,rgba(31,58,46,0),#1f3a2e_92%)]" />

        {/* always reachable */}
        <SkipLink className="hero-skip absolute right-10 hidden text-linen md:flex" />
        <motion.div style={{ opacity: closeO }} className="pointer-events-none absolute bottom-10 right-10 hidden text-linen md:block">
          <span className="text-[11px] tabular-nums text-linen/60">
            Sunset math: NOAA, for {site.town} on {FEATURED.month} {FEATURED.day}
          </span>
        </motion.div>
      </div>
    </section>
  );
}

// Reduced motion: the lit first-dance frame as a still, the headline over the sky and a
// compact close over the dark lawn.
function StillHero() {
  const light = useLightPreset("firstDance", true);
  const frame = useRef<HTMLDivElement>(null);
  const { w, h, mobile } = useFrameSize(frame);
  const masks = useMasks();
  const cam = useTransform([w, h], ([vw, vh]: number[]) => cameraTransform(vw, vh, vw < 768 ? site.hero.focus.close.m : site.hero.focus.close.d));
  const x = useTransform(cam, (c) => c.x);
  const y = useTransform(cam, (c) => c.y);
  const scale = useTransform(cam, (c) => c.scale);
  const zero = useMotionValue(0);
  const frameTime = STOPS.find((s) => s.id === "first-dance")?.time ?? "blue hour";
  // Tell the nav the hero behind it is now a dark still.
  useEffect(() => {
    window.dispatchEvent(new Event(TONE_EVENT));
  }, []);
  return (
    <section id="top" aria-label={`${site.name} at ${frameTime}`} className="relative">
      <div ref={frame} data-tone="dark" data-still="1" className="relative h-svh min-h-[640px] w-full overflow-hidden bg-ink">
        <motion.div style={{ x, y, scale, originX: 0, originY: 0 }} className="absolute left-0 top-0">
          <Stage light={light} masks={masks} eager />
        </motion.div>
        <BokehStrand level={light.bulbs} sway={{ x: zero, y: zero }} run={mobile ? RUNS.stillMobile : RUNS.still} />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,36,28,0.4),rgba(17,36,28,0.08)_40%,rgba(31,58,46,0.1)_60%,rgba(31,58,46,0.86)_92%,#1f3a2e)]" />
        <div className="hero-landing absolute left-5 right-5 sm:left-10">
          <div className="max-w-[640px]">
            <p className="eyebrow text-linen/80">
              {site.kind} · one wedding a day
              <Sample />
            </p>
            <h1 className="display hero-h1 mt-3 leading-[0.92] text-linen sm:mt-4">
              The light stays
              <br />
              <em className="text-amber">late</em> here.
            </h1>
            <p className="mt-4 max-w-[420px] text-[15px] font-medium leading-relaxed text-linen/85 sm:mt-5 sm:text-base">
              {site.town}, {site.state}. This is {frameTime} on a {FEATURED.month} {FEATURED.weekdayLong}.
            </p>
            <div className="mt-5 sm:mt-6">
              <SunsetPill onDark />
            </div>
          </div>
        </div>
        {/* the close, compact, over the dark lawn (with its own shade on phones, where the
            lit doors sit right behind it) */}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-[46%] bg-[linear-gradient(180deg,rgba(15,33,25,0),rgba(15,33,25,0.72)_38%,#1f3a2e)] md:hidden" />
        <div className="absolute inset-x-0 bottom-0 px-5 pb-[100px] sm:px-10 md:pb-10">
          <div className="flex flex-col gap-4 text-linen md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow text-linen/70">
                {FEATURED.weekdayLong}, {FEATURED.month} {FEATURED.day}, {FEATURED.year}
              </p>
              <h2 className="display mt-2 text-[2.2rem] leading-none sm:text-[3rem]">
                Your date might still be <em className="text-amber">free.</em>
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <LeftLine className="text-[14px] font-medium text-linen/80 tabular-nums" />
              <CheckButton />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
