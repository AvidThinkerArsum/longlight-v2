"use client";

// "Walk the grounds." A pinned horizontal walk through the five spaces, in the order the
// day uses them, while the site plan fills in the route. Ends on "Book a tour".

import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { useReduce } from "@/lib/useReduce";
import { useEffect, useRef, useState } from "react";
import { SitePlan, STOP_AT } from "@/components/SitePlan";
import { CrispStrand } from "@/components/Bulbs";
import { Sample } from "@/components/ui/Sample";
import { Words } from "@/components/ui/Reveal";
import { scrollToId, useBooking } from "@/components/Booking";
import { formatDate, lookup } from "@/lib/availability";
import { site } from "@/lib/site";
import { clockLabel } from "@/lib/sun";

const SPACES = site.spaces;
const ITEMS = SPACES.length + 1; // + the tour card

const smooth = (t: number) => t * t * (3 - 2 * t);
/** Ease over the first 45% of each step, then hold on the space for the rest. */
const EASE_SHARE = 0.45;

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const TOUR_AT = clockLabel(minutes(site.tour.at));
const short = (d: string) => d.slice(0, 3);
const TOUR_DAYS = `${short(site.tour.nights[0])}–${short(site.tour.nights[site.tour.nights.length - 1])}`;
const TOUR_DAYS_LONG = `${site.tour.nights[0]} to ${site.tour.nights[site.tour.nights.length - 1]}`;

/** A panel's words only show once it is the one in front, so a peeking panel never reads half-cut. */
const words = (shown: boolean) => `transition-opacity duration-300 ${shown ? "opacity-100" : "opacity-0"}`;

function Panel({ i, width, shown = true }: { i: number; width?: number; shown?: boolean }) {
  const s = SPACES[i];
  const photo = site.photos[s.photo];
  return (
    <article style={{ width }} className={`flex h-full shrink-0 flex-col overflow-hidden rounded-[24px] bg-paper ring-1 ring-ink/10 ${width ? "" : "w-full"}`}>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.src} alt={photo.alt} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
        <div className={`absolute left-4 top-4 flex items-center gap-2 rounded-full bg-linen/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-ink backdrop-blur ${words(shown)}`}>
          <span className="tabular-nums">0{i + 1}</span> {s.when}
        </div>
      </div>
      <div aria-hidden={!shown || undefined} className={`grid gap-x-8 gap-y-3 p-4 sm:p-6 lg:grid-cols-[1.1fr_1fr] ${words(shown)}`}>
        <div>
          <h3 className="display text-[1.8rem] leading-none sm:text-[2.3rem]">{s.name}</h3>
          <p className="mt-2 hidden text-[14px] leading-relaxed text-ink/70 sm:block">{s.line}</p>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px] lg:grid-cols-1">
          <div>
            <dt className="eyebrow text-[0.58rem] text-ink/45">Capacity</dt>
            <dd className="font-semibold tabular-nums">
              {s.capacity}
              <Sample />
            </dd>
          </div>
          <div className="hidden lg:block">
            <dt className="eyebrow text-[0.58rem] text-ink/45">The space</dt>
            <dd className="font-semibold">{s.size}</dd>
          </div>
          <div>
            <dt className="eyebrow text-[0.58rem] text-rose">If it rains</dt>
            <dd className="font-semibold">{s.rain}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

function TourCard({ width, shown = true }: { width?: number; shown?: boolean }) {
  const { date, setTour } = useBooking();
  const entry = lookup(date);
  const nice = formatDate(date, { weekday: "short", month: "short", day: "numeric" });
  return (
    <article style={{ width }} className={`relative flex h-full shrink-0 flex-col overflow-hidden rounded-[24px] bg-ink text-linen ${width ? "" : "w-full"}`}>
      <CrispStrand count={14} className="-mt-3 hidden shrink-0 sm:block" />
      <div className={`grid min-h-0 flex-1 content-between gap-4 p-5 sm:gap-6 sm:px-10 sm:pb-10 sm:pt-0 lg:grid-cols-[1.1fr_1fr] lg:content-normal lg:items-end ${words(shown)}`}>
        <div className="self-start lg:self-center">
          <p className="eyebrow text-amber">The end of the walk</p>
          <h3 className="display mt-3 text-[2rem] leading-[0.98] sm:mt-4 sm:text-[3.4rem]">
            Now come walk it <em>for real.</em>
          </h3>
          <p className="mt-4 hidden max-w-[440px] text-[15px] leading-relaxed text-linen/75 sm:block">
            Tours run {TOUR_DAYS_LONG} at {TOUR_AT}, when the light is doing what it does at the top of this page.
            <Sample /> {site.ownersShort} walk it with you.
          </p>
        </div>
        {/* the tour, as a ticket */}
        <div className="rounded-[18px] bg-paper p-4 text-ink shadow-[0_24px_60px_-30px_rgba(0,0,0,0.8)] sm:p-5">
          <div className="flex items-baseline justify-between border-b border-dashed border-ink/20 pb-3">
            <span className="eyebrow text-[0.6rem] text-ink/50">Evening tour</span>
            <span className="display text-[1.4rem] leading-none">{site.name}</span>
          </div>
          <dl className="grid grid-cols-2 gap-2 py-3 text-[12.5px] sm:gap-3 sm:py-4 sm:text-[13px]">
            <div>
              <dt className="text-ink/45">When</dt>
              <dd className="font-bold">
                {TOUR_DAYS}, {TOUR_AT}
              </dd>
            </div>
            <div>
              <dt className="text-ink/45">How long</dt>
              <dd className="font-bold">{site.tour.minutes} minutes</dd>
            </div>
            <div>
              <dt className="text-ink/45">With</dt>
              <dd className="font-bold">{site.ownersShort}</dd>
            </div>
            <div>
              <dt className="text-ink/45">Holding</dt>
              <dd className="font-bold tabular-nums">
                {nice}
                {entry?.state === "open" ? null : <span className="ml-1 font-semibold text-rose">({entry ? entry.state : "weekday"})</span>}
              </dd>
            </div>
          </dl>
          <p className="-mt-1 mb-3 text-right">
            <Sample label="sample times" />
          </p>
          <a
            href="#hold"
            onClick={(e) => {
              e.preventDefault();
              setTour(true);
              scrollToId("hold");
            }}
            className="flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-[14px] font-bold text-linen transition hover:bg-ink-2"
          >
            Book a tour <span aria-hidden>→</span>
          </a>
          <p className="mt-2 hidden text-center text-[11.5px] text-ink/50 sm:block">Date carried over from the checker; change it on the form.</p>
        </div>
      </div>
    </article>
  );
}

export function Grounds() {
  const reduce = useReduce();
  const ref = useRef<HTMLElement>(null);
  const port = useRef<HTMLDivElement>(null);
  const [pw, setPw] = useState(900);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const el = port.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setPw(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const narrow = pw < 700;
  // The next space peeks in by a sliver, never enough to be read half-cut.
  const panelW = Math.round(pw * (narrow ? 0.9 : 0.88));
  const gap = narrow ? 12 : 20;

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  // Dwell on each space: ease between whole positions.
  const pos = useTransform(scrollYProgress, (v) => {
    const t = Math.min(ITEMS - 1, Math.max(0, (v - 0.04) / 0.92) * (ITEMS - 1));
    const k = Math.floor(t);
    return Math.min(ITEMS - 1, k + smooth(Math.min(1, (t - k) / EASE_SHARE)));
  });
  const x = useTransform(pos, (p) => Math.round(-p * (panelW + gap) * 100) / 100);
  const route = useTransform(pos, (p) => {
    if (p >= SPACES.length - 1) return 1;
    const k = Math.floor(p);
    return STOP_AT[k] + (STOP_AT[k + 1] - STOP_AT[k]) * (p - k);
  });
  // `front` counts the tour card too; `active` is the space the site plan shows.
  const [front, setFront] = useState(0);
  useMotionValueEvent(pos, "change", (p) => {
    setActive(Math.min(SPACES.length - 1, Math.round(p)));
    setFront(Math.round(p));
  });

  const header = (
    <div>
      <p className="eyebrow text-rose">
        Five acres, five spaces <Sample />
      </p>
      <h2 id="grounds-title" className="display mt-3 text-[2.5rem] leading-[0.95] sm:text-[4rem]">
        <Words text="Walk the" /> <Words italic="grounds." delay={0.2} />
      </h2>
    </div>
  );

  if (reduce) {
    return (
      <section id="grounds" data-tone="light" aria-labelledby="grounds-title" className="paper py-20">
        <div className="mx-auto max-w-[1320px] px-5 sm:px-10">
          {header}
          <div className="mt-8 grid gap-6 lg:grid-cols-[420px_1fr]">
            <SitePlan route={route} active={0} className="aspect-[4/3] w-full rounded-2xl bg-paper ring-1 ring-ink/10" />
            <div className="grid gap-5">
              {SPACES.map((s, i) => (
                <div key={s.id} className="h-[520px]">
                  <Panel i={i} />
                </div>
              ))}
              <div className="h-[420px]">
                <TourCard />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="grounds" ref={ref} data-tone="light" aria-labelledby="grounds-title" className="paper relative h-[440vh] md:h-[480vh]">
      <div className="sticky top-0 h-svh overflow-hidden">
        <div className="mx-auto grid h-full max-w-[1560px] grid-rows-[auto_minmax(0,1fr)] gap-4 px-5 pb-[92px] pt-[84px] sm:px-10 md:pb-10 md:pt-[104px] lg:grid-cols-[minmax(340px,420px)_minmax(0,1fr)] lg:grid-rows-1 lg:gap-10">
          <div className="flex min-h-0 flex-col">
            {header}
            <div className="mt-3 flex min-h-0 items-start gap-4 lg:mt-6 lg:block">
              <SitePlan route={route} active={active} compact={narrow} className="aspect-[4/3] h-[150px] shrink-0 rounded-2xl bg-paper ring-1 ring-ink/10 sm:h-[200px] lg:h-auto lg:w-full" />
              <div className="min-w-0 lg:mt-5">
                <p className="eyebrow text-[0.6rem] text-ink/45 tabular-nums">
                  Stop {active + 1} of {SPACES.length}
                </p>
                <p className="display mt-1 text-[1.4rem] leading-tight lg:text-[1.8rem]">{SPACES[active].name}</p>
                <p className="mt-1 text-[12.5px] font-semibold text-ink/55">{SPACES[active].when}</p>
              </div>
            </div>
          </div>
          <div ref={port} className="relative min-h-0 overflow-hidden rounded-[24px]">
            <motion.div style={{ x }} className="flex h-full" role="list">
              {SPACES.map((s, i) => (
                <div key={s.id} role="listitem" className="h-full shrink-0" style={{ marginRight: gap }}>
                  <Panel i={i} width={panelW} shown={front === i} />
                </div>
              ))}
              <div role="listitem" className="h-full shrink-0">
                <TourCard width={panelW} shown={front === SPACES.length} />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
