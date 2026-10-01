"use client";

// "The other six days." The hero photo relit as a Friday blue hour, a Sunday brunch, or a
// winter evening, each with its own price and perk, each filtering the date checker.

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { CoverStage } from "@/components/stage/CoverStage";
import { Sample } from "@/components/ui/Sample";
import { Rise, Words } from "@/components/ui/Reveal";
import { scrollToId, useBooking } from "@/components/Booking";
import { useLightPreset } from "@/lib/useLight";
import { FEATURED, SUNSET, WINTER, WINTER_SUNSET, resolveTime } from "@/lib/day";
import { clockLabel } from "@/lib/sun";
import { addDays, money } from "@/lib/availability";
import { useAvailability } from "@/lib/useAvailability";
import { site } from "@/lib/site";

const P = site.pricing;

function fromPrice(pkg: (typeof site.packages)[number]) {
  const { day, season } = pkg.filter;
  const seasons = season === "all" ? (["peak", "shoulder"] as const) : ([season] as const);
  const days = day === "all" ? (["fri", "sat", "sun"] as const) : ([day] as const);
  return Math.min(...seasons.flatMap((s) => days.map((d) => P[s][d])));
}

function when(pkg: (typeof site.packages)[number]) {
  const sun = pkg.sunsetOn === "winter" ? WINTER_SUNSET : SUNSET;
  const t = clockLabel(resolveTime(pkg.when, sun.minutes));
  const after = typeof pkg.when === "object" ? pkg.when.sunset : 0;
  const note = pkg.caption
    .replace("{month}", FEATURED.month)
    .replace("{after}", String(after))
    .replace("{date}", pkg.sunsetOn === "winter" ? WINTER.short : `${FEATURED.month.slice(0, 3)} ${FEATURED.day}`)
    .replace("{sunset}", sun.label);
  return { time: t, note };
}

export function SixDays() {
  const [k, setK] = useState(0);
  const reduce = useReducedMotion();
  const pkg = site.packages[k];
  const light = useLightPreset(pkg.light, !!reduce);
  const { setFilter, setDate } = useBooking();
  const avail = useAvailability();
  const w = when(pkg);

  return (
    <section id="six-days" data-tone="dark" aria-labelledby="six-title" className="relative overflow-hidden bg-night py-20 text-linen sm:py-28">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-10">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <p className="eyebrow text-amber">Friday to Thursday</p>
            <h2 id="six-title" className="display mt-4 text-[3rem] leading-[0.95] sm:text-[4.6rem]">
              <Words text="The other" /> <Words italic="six days." delay={0.2} />
            </h2>
          </div>
          <Rise>
            <p className="max-w-[500px] text-[16px] leading-relaxed text-linen/75">
              A {FEATURED.month} Saturday is one day a week, four months a year. The rest of the calendar is quieter, cheaper, and lit just as well. Same barn, same photograph, different hour.
            </p>
          </Rise>
        </div>

        <div className="mt-10 grid gap-5 lg:mt-14 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[26px] ring-1 ring-linen/10 sm:aspect-[16/11] lg:aspect-auto lg:min-h-[560px]">
            <CoverStage light={light} focus={site.hero.focus.relit} />
            {/* under lg the tabs sit below the photo: switch the light right on it, too */}
            <div role="group" aria-label="Relight the barn" className="absolute inset-x-3 top-3 z-10 flex gap-1 rounded-full bg-[#11261d]/55 p-1 backdrop-blur-md sm:inset-x-auto sm:left-4 sm:top-4 lg:hidden">
              {site.packages.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={i === k}
                  onClick={() => setK(i)}
                  className={`flex-1 rounded-full px-3.5 py-2 text-[13px] font-bold transition-colors sm:flex-none ${i === k ? "bg-linen text-ink" : "text-linen/80 hover:text-linen"}`}
                >
                  {p.short}
                </button>
              ))}
            </div>
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(180deg,rgba(17,36,28,0),rgba(17,36,28,0.78))]" />
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pkg.id}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.45 }}
                className="absolute bottom-5 left-5 right-5 sm:bottom-8 sm:left-8"
              >
                <p className="eyebrow text-linen/70">{w.note}</p>
                <p className="display mt-1 text-[3rem] leading-none tabular-nums sm:text-[4.2rem]">{w.time}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div role="tablist" aria-label="Other days" className="flex flex-col gap-3">
            {site.packages.map((p, i) => {
              const on = i === k;
              return (
                <div key={p.id} className={`rounded-[22px] transition ${on ? "bg-linen text-ink" : "bg-linen/[0.06] text-linen hover:bg-linen/10"}`}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={on}
                    aria-controls={`pkg-${p.id}`}
                    onClick={() => setK(i)}
                    className="flex w-full items-baseline justify-between gap-3 px-5 pb-2 pt-4 text-left"
                  >
                    <span className="display text-[1.7rem] leading-tight">{p.name}</span>
                    <span className={`shrink-0 text-[13px] font-semibold tabular-nums ${on ? "text-ink/60" : "text-linen/60"}`}>
                      from {money(fromPrice(p))}
                      <Sample />
                    </span>
                  </button>
                  <div id={`pkg-${p.id}`} role="tabpanel" className="px-5 pb-5">
                    <p className={`text-[14px] leading-relaxed ${on ? "text-ink/80" : "text-linen/60"}`}>
                      {p.perk}
                      <Sample />
                    </p>
                    {on ? (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-[12px] text-ink/55">
                          {p.note}
                          <Sample />
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setFilter(p.filter);
                            // Land on a date that fits: the winter date quoted above, or the
                            // Friday/Sunday beside the featured Saturday, or the next open one.
                            const prefer =
                              p.filter.season === "winter" ? site.winterDate : p.filter.day === "fri" ? addDays(site.featuredDate, -1) : p.filter.day === "sun" ? addDays(site.featuredDate, 1) : site.featuredDate;
                            // A winter weekend reads best as a Saturday, if one is open.
                            const hit = (p.filter.season === "winter" ? avail?.firstOpen({ day: "sat", season: "winter" }, prefer) : undefined) ?? avail?.firstOpen(p.filter, prefer);
                            if (hit) setDate(hit.date);
                            scrollToId("dates");
                          }}
                          className="rounded-full bg-ink px-4 py-2 text-[13px] font-bold text-linen"
                        >
                          {p.cta} ↑
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Rise className="mt-5">
          <div className="grid gap-4 rounded-[22px] border border-linen/15 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-8 sm:p-7">
            <p className="display text-[1.9rem] leading-none">
              Weekday offsites <span className="italic text-amber">from {money(site.pricing.weekday)}</span>
              <Sample />
            </p>
            <p className="text-[14px] leading-relaxed text-linen/70">
              {site.offsite.line}
              <Sample />
            </p>
            <a href={`mailto:${site.email}?subject=${encodeURIComponent("A weekday offsite")}`} className="justify-self-start rounded-full border border-linen/40 px-4 py-2 text-[13px] font-bold hover:bg-linen hover:text-ink">
              Ask about a weekday →
            </a>
          </div>
        </Rise>
      </div>
    </section>
  );
}
