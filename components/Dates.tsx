"use client";

// "Is your date still free?" — the email couples send to ten venues, answered in place:
// 18 months of weekends from the current month (rolled in the browser, see useAvailability),
// what each costs, what's left, and an itemized estimate.

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CrispStrand } from "@/components/Bulbs";
import { Sample } from "@/components/ui/Sample";
import { Rise, Words } from "@/components/ui/Reveal";
import { scrollToId, useBooking, type DayFilter } from "@/components/Booking";
import {
  DAY_NAMES,
  DAY_SHORT,
  HOURS,
  WINDOW_MONTHS,
  estimate,
  formatDate,
  money,
  openCount,
  ordinal,
  priceOf,
  seasonOf,
  type DateEntry,
  type Day,
  type Month,
} from "@/lib/availability";
import { useAvailability } from "@/lib/useAvailability";
import { site } from "@/lib/site";

const DAY_FILTERS: { id: DayFilter; label: string }[] = [
  { id: "sat", label: "Saturdays" },
  { id: "fri", label: "Fridays" },
  { id: "sun", label: "Sundays" },
  { id: "all", label: "All weekends" },
];

function plural(day: Day | "all", n: number) {
  const name = day === "all" ? "weekend day" : DAY_NAMES[day];
  return `${n} ${name}${n === 1 ? "" : "s"}`;
}

function Chip({ d, selected, onPick, compact }: { d: DateEntry; selected: boolean; onPick: (d: DateEntry) => void; compact: boolean }) {
  const day = Number(d.date.slice(8));
  const label = `${DAY_NAMES[d.day]}, ${formatDate(d.date, { month: "long", day: "numeric", year: "numeric" })}: ${d.state === "open" ? `open, from ${money(priceOf(d))}` : d.state === "held" ? `held until ${formatDate(d.heldUntil!, { month: "short", day: "numeric" })}` : "booked"}`;
  const base = "relative w-full rounded-xl border text-left transition focus-visible:outline-2";
  const tone = selected
    ? "border-ink bg-ink text-linen shadow-[0_6px_20px_-8px_rgba(31,58,46,0.6)]"
    : d.state === "open"
      ? "border-ink/15 bg-paper text-ink hover:border-ink/50"
      : d.state === "held"
        ? "border-dashed border-ink/35 bg-transparent text-ink/70 hover:border-ink/60"
        : "border-transparent bg-ink/[0.04] text-ink/35 hover:text-ink/60";
  if (compact) {
    return (
      <button type="button" aria-label={label} aria-pressed={selected} onClick={() => onPick(d)} className={`${base} ${tone} px-0 py-1.5 text-center`}>
        <span className="block text-[10px] font-bold uppercase tracking-wider opacity-60">{DAY_SHORT[d.day][0]}</span>
        <span className={`block text-[15px] font-semibold tabular-nums ${d.state === "booked" ? "line-through decoration-1" : ""}`}>{day}</span>
      </button>
    );
  }
  return (
    <button type="button" aria-label={label} aria-pressed={selected} onClick={() => onPick(d)} className={`${base} ${tone} px-3 py-2.5`}>
      <span className={`flex items-baseline justify-between gap-2 text-[14px] font-semibold tabular-nums ${d.state === "booked" ? "line-through decoration-1" : ""}`}>
        <span>
          {DAY_SHORT[d.day]} {day}
        </span>
        {d.state === "held" ? <span className="text-[10px] font-bold uppercase tracking-wider">held</span> : null}
      </span>
      <span className={`mt-0.5 block text-[11.5px] tabular-nums ${selected ? "text-linen/75" : "opacity-70"}`}>
        {d.state === "open" ? `from ${money(priceOf(d))}` : d.state === "held" ? `until ${formatDate(d.heldUntil!, { month: "short", day: "numeric" })}` : "booked"}
      </span>
    </button>
  );
}

function RailButton({ dir, disabled, onClick }: { dir: 1 | -1; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={dir < 0 ? "Earlier months" : "Later months"}
      disabled={disabled}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-full border border-ink/20 text-ink transition hover:bg-ink hover:text-linen disabled:pointer-events-none disabled:opacity-30"
    >
      <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {dir < 0 ? <path d="M10 3 5 8l5 5" /> : <path d="m6 3 5 5-5 5" />}
      </svg>
    </button>
  );
}

function MonthColumn({ m, day, selected, onPick }: { m: Month; day: DayFilter; selected: string; onPick: (d: DateEntry) => void }) {
  const dates = day === "all" ? m.dates : m.dates.filter((d) => d.day === day);
  const open = dates.filter((d) => d.state === "open").length;
  // group by weekend for the compact view
  const weekends = useMemo(() => {
    const out: DateEntry[][] = [];
    for (const d of m.dates) {
      const last = out[out.length - 1];
      const prev = last?.[last.length - 1];
      if (prev && (new Date(`${d.date}T12:00:00Z`).getTime() - new Date(`${prev.date}T12:00:00Z`).getTime()) / 864e5 <= 2) last.push(d);
      else out.push([d]);
    }
    return out;
  }, [m]);
  return (
    <div data-month={m.key} className="w-[150px] shrink-0 snap-start sm:w-[164px]">
      <div className="border-b border-ink/10 pb-3">
        <p className="display text-[2rem] leading-none">
          {m.short}
          <span className="ml-1.5 align-top font-sans text-[11px] font-bold tracking-wider text-ink/45">{m.year}</span>
        </p>
        <p className={`mt-1.5 text-[11.5px] font-semibold tabular-nums ${open === 0 ? "text-rose" : open <= 2 && day !== "all" ? "text-amber-2" : "text-ink/55"}`}>
          {open === 0 ? "Nothing left" : `${open} of ${dates.length} open`}
        </p>
      </div>
      {day === "all" ? (
        <div className="mt-3 space-y-1.5">
          {weekends.map((w) => (
            <div key={w[0].date} className="grid grid-cols-3 gap-1">
              {(["fri", "sat", "sun"] as Day[]).map((dd) => {
                const d = w.find((x) => x.day === dd);
                return d ? <Chip key={dd} d={d} selected={selected === d.date} onPick={onPick} compact /> : <span key={dd} />;
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 space-y-1.5">
          {dates.map((d) => (
            <Chip key={d.date} d={d} selected={selected === d.date} onPick={onPick} compact={false} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Dates() {
  const { date, setDate, guests, setGuests, day, season, setFilter } = useBooking();
  const reduce = useReducedMotion();
  const rail = useRef<HTMLDivElement>(null);
  // null until hydrated: the calendar is rolled from today, in the browser.
  const avail = useAvailability();
  const entry = avail?.lookup(date);
  const months = useMemo(() => (!avail ? [] : season === "all" ? avail.months : avail.months.filter((m) => seasonOf(`${m.key}-15`) === season)), [avail, season]);
  const month = avail?.month(date.slice(0, 7));
  const scarcityDay: Day = day === "all" ? (entry?.day ?? "sat") : day;
  const left = month ? openCount(month, scarcityDay) : 0;

  // Keep the selected month in view when the date changes from elsewhere on the page. A new
  // set of months (a filter) starts the rail from its beginning first.
  const lastMonths = useRef(months);
  useEffect(() => {
    const r = rail.current;
    if (!r) return;
    if (lastMonths.current !== months) {
      lastMonths.current = months;
      r.scrollTo({ left: 0, behavior: "auto" });
    }
    const el = r.querySelector<HTMLElement>(`[data-month="${date.slice(0, 7)}"]`);
    if (!el) return;
    // Show the month before it too, so "left in June" has May beside it for context.
    const prev = el.previousElementSibling as HTMLElement | null;
    const pad = parseFloat(getComputedStyle(r).paddingLeft) || 0;
    const target = (prev && window.innerWidth >= 1024 ? prev.offsetLeft : el.offsetLeft) - pad;
    r.scrollTo({ left: Math.max(0, target), behavior: reduce ? "auto" : "smooth" });
  }, [date, months, reduce]);

  // The rail's ends: arrows go quiet there, and the fade on that side goes away.
  const [edge, setEdge] = useState({ start: true, end: false, pad: 28 });
  const measure = useCallback(() => {
    const r = rail.current;
    if (!r) return;
    const start = r.scrollLeft < 4;
    const end = r.scrollLeft + r.clientWidth > r.scrollWidth - 4;
    const pad = parseFloat(getComputedStyle(r).paddingLeft) || 0;
    setEdge((e) => (e.start === start && e.end === end && e.pad === pad ? e : { start, end, pad }));
  }, []);
  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, months, day]);
  function step(dir: 1 | -1) {
    const r = rail.current;
    const col = r?.querySelector<HTMLElement>("[data-month]");
    if (!r || !col) return;
    const gap = parseFloat(getComputedStyle(r).columnGap) || 0;
    r.scrollBy({ left: dir * (col.offsetWidth + gap), behavior: reduce ? "auto" : "smooth" });
  }
  // No half-cut columns in the card's padding; a soft edge where there is more to see.
  // (the card's padding stays clear: a column scrolled past it disappears rather than
  // leaving a sliver, and one aligned to it is untouched)
  const railMask = `linear-gradient(90deg, ${edge.start ? "#000 0" : `transparent 0, transparent ${edge.pad - 7}px, #000 ${edge.pad}px`}, ${edge.end ? "#000 100%" : `#000 calc(100% - ${edge.pad + 12}px), transparent 100%`})`;

  const pick = (d: DateEntry) => setDate(d.date);
  const est = entry ? estimate(entry, guests) : null;
  const alt = avail && entry && entry.state !== "open" ? avail.alternative(entry) : null;
  const P = site.pricing;
  const fill = ((guests - P.minGuests) / (P.maxGuests - P.minGuests)) * 100;

  function jump(value: string) {
    if (!value) return;
    const hit = avail?.lookup(value);
    if (hit) {
      if (day !== "all" && day !== hit.day) setFilter({ day: hit.day, season: "all" });
      else if (season !== "all" && seasonOf(value) !== season) setFilter({ day, season: "all" });
      setDate(value);
    } else {
      setDate(value);
    }
  }

  return (
    <section id="dates" data-tone="dark" aria-labelledby="dates-title" className="relative scroll-mt-10 bg-ink text-linen">
      <CrispStrand className="-mt-px" />
      <div className="mx-auto max-w-[1320px] px-5 pb-20 pt-6 sm:px-10 sm:pb-28">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <div>
            <p className="eyebrow text-amber">
              Availability <Sample label="sample data" />
            </p>
            <h2 id="dates-title" className="display mt-4 text-[3rem] leading-[0.95] sm:text-[4.6rem]">
              <Words text="Is your date" /> <Words italic="still free?" delay={0.2} />
            </h2>
          </div>
          <Rise>
            <p className="max-w-[520px] text-[16px] leading-relaxed text-linen/80">
              The email you were about to send to ten venues, answered: every weekend for the next 18 months, what it costs, and what&apos;s already gone. No login, no &ldquo;request pricing.&rdquo;
            </p>
          </Rise>
        </div>

        <div className="mt-10 grid gap-5 lg:mt-14 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-6">
          {/* the calendar card */}
          <div className="paper min-w-0 rounded-[26px] p-4 text-ink shadow-[0_30px_80px_-40px_rgba(0,0,0,0.6)] sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
              {/* phones: one row of chips you can thumb sideways; the date gets its own line */}
              <div role="group" aria-label="Which days" className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
                {DAY_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={day === f.id}
                    onClick={() => setFilter({ day: f.id, season })}
                    className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${day === f.id ? "bg-ink text-linen" : "bg-ink/[0.06] text-ink/70 hover:bg-ink/10"}`}
                  >
                    {f.label}
                  </button>
                ))}
                <span aria-hidden className="mx-0.5 w-px shrink-0 self-stretch bg-ink/15" />
                <button
                  type="button"
                  aria-pressed={season === "winter"}
                  onClick={() => setFilter({ day, season: season === "winter" ? "all" : "winter" })}
                  className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${season === "winter" ? "bg-[#3b4a84] text-linen" : "bg-ink/[0.06] text-ink/70 hover:bg-ink/10"}`}
                >
                  Winter only
                </button>
              </div>
              <label className="flex items-center gap-2 text-[12px] font-semibold text-ink/60 sm:ml-auto">
                <span>Jump to</span>
                <input
                  type="date"
                  value={date}
                  min={avail?.dates[0]?.date}
                  max={avail?.dates.at(-1)?.date}
                  onChange={(e) => jump(e.target.value)}
                  className="rounded-full border border-ink/20 bg-paper px-3 py-1.5 text-[13px] font-semibold text-ink tabular-nums"
                  aria-label="Your date"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap items-baseline justify-between gap-3">
              <p className="display text-[1.55rem] leading-tight sm:text-[1.8rem]" aria-live="polite">
                {!avail ? (
                  <span className="invisible">Checking the calendar</span>
                ) : month ? (
                  <>
                    <em className={left <= 2 ? "text-rose" : ""}>{left === 0 ? "No" : left}</em> {plural(scarcityDay, left).replace(/^\d+ /, "")} left in {month.label} {month.year}
                    <Sample />
                  </>
                ) : (
                  "Pick a weekend"
                )}
              </p>
              <div className="flex items-center gap-5">
              <ul className="flex items-center gap-4 text-[11.5px] font-semibold text-ink/60">
                <li className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-[4px] border border-ink/20 bg-paper" /> open
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-[4px] border border-dashed border-ink/40" /> held
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-[4px] bg-ink/10" /> <span className="line-through">booked</span>
                </li>
              </ul>
              <div className="hidden items-center gap-1.5 sm:flex">
                <RailButton dir={-1} disabled={edge.start} onClick={() => step(-1)} />
                <RailButton dir={1} disabled={edge.end} onClick={() => step(1)} />
              </div>
              </div>
            </div>

            <div
              ref={rail}
              onScroll={measure}
              style={{ maskImage: railMask, WebkitMaskImage: railMask }}
              className={`no-scrollbar relative -mx-4 mt-5 flex snap-x scroll-pl-4 gap-4 overflow-x-auto px-4 pb-2 sm:-mx-7 sm:scroll-pl-7 sm:gap-5 sm:px-7 ${avail ? "" : "min-h-[340px]"}`}
            >
              {months.map((m) => (
                <MonthColumn key={m.key} m={m} day={day} selected={date} onPick={pick} />
              ))}
            </div>
            <p className="mt-4 text-[12px] text-ink/50">
              {avail ? months.length : WINDOW_MONTHS} months of weekends<span className="sm:hidden">, swipe for more</span>. Prices include up to {P.includedGuests} guests, {HOURS}.
              <Sample />
            </p>
          </div>

          {/* the estimate */}
          <aside aria-label="Your estimate" className="min-w-0 rounded-[26px] bg-[#264638] p-5 ring-1 ring-linen/10 sm:p-7 lg:sticky lg:top-24 lg:self-start">
            <p className="eyebrow text-linen/60">Your date</p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={date} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
                <p className="display mt-2 text-[2rem] leading-tight">
                  {entry ? DAY_NAMES[entry.day] : formatDate(date, { weekday: "long" })}, {formatDate(date, { month: "long", day: "numeric" })}
                  <span className="ml-2 font-sans text-[13px] font-semibold text-linen/50 tabular-nums">{date.slice(0, 4)}</span>
                </p>
                {!avail ? null : !entry ? (
                  <p className="mt-3 text-[14px] leading-relaxed text-linen/75">
                    Weddings are Friday to Sunday. Weekdays are for offsites and rehearsal dinners, from {money(site.pricing.weekday)}.
                  </p>
                ) : (
                  <div className="mt-3">
                    <p
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-bold uppercase tracking-wider ${
                        entry.state === "open" ? "bg-amber text-ink" : entry.state === "held" ? "border border-dashed border-linen/50 text-linen/85" : "bg-linen/10 text-linen/60"
                      }`}
                    >
                      {entry.state === "open" ? "Open" : entry.state === "held" ? `Held until ${formatDate(entry.heldUntil!, { month: "short", day: "numeric" })}` : "Booked"}
                    </p>
                    {alt ? (
                      <div className="mt-4 rounded-2xl bg-linen/[0.07] p-4">
                        <p className="text-[14px] leading-relaxed text-linen/85">
                          {entry.state === "held" ? "Someone has a free hold on it. " : ""}
                          <strong className="font-semibold text-linen">
                            {DAY_NAMES[alt.entry.day]} the {ordinal(Number(alt.entry.date.slice(8)))}
                          </strong>{" "}
                          is open{alt.saves > 0 ? (
                            <>
                              , and it&apos;s <strong className="font-semibold text-amber">{money(alt.saves)} less</strong>
                            </>
                          ) : null}
                          .
                        </p>
                        <button type="button" onClick={() => setDate(alt.entry.date)} className="mt-3 rounded-full bg-linen px-4 py-2 text-[13px] font-bold text-ink hover:bg-white">
                          Look at {DAY_NAMES[alt.entry.day]} instead
                        </button>
                      </div>
                    ) : entry.state !== "open" ? (
                      <p className="mt-3 text-[14px] text-linen/70">Nothing else open that weekend. Try the month&apos;s other weekends, or ask to be told if it frees up.</p>
                    ) : null}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 border-t border-linen/10 pt-5">
              <label htmlFor="guests" className="flex items-baseline justify-between text-[13px] font-semibold text-linen/75">
                Guests
                <span className="display text-[1.9rem] leading-none text-linen tabular-nums">{guests}</span>
              </label>
              <input
                id="guests"
                type="range"
                min={P.minGuests}
                max={P.maxGuests}
                step={5}
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="slider mt-2 w-full [--color-ink:#f3ece1]"
                style={{ ["--fill" as string]: `${fill}%` }}
              />
            </div>

            {est && entry ? (
              <div className="mt-4">
                <ul className="space-y-2 text-[13.5px]">
                  {est.lines.map((l) => (
                    <li key={l.label} className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 text-linen/80">
                        {l.label}
                        {l.note ? <span className="block text-[11.5px] text-linen/45">{l.note}</span> : null}
                      </span>
                      <span className={`shrink-0 tabular-nums ${l.amount ? "font-semibold" : "text-[12.5px] font-semibold text-amber/90"}`}>{l.amount ? money(l.amount) : "Included"}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-baseline justify-between border-t border-linen/15 pt-4">
                  <span className="text-[13px] font-semibold text-linen/75">
                    Estimate <Sample />
                  </span>
                  <span className="display text-[2.3rem] leading-none tabular-nums">{money(est.total)}</span>
                </div>
                <p className="mt-2 text-[11.5px] leading-relaxed text-linen/45">Before sales tax. Bring any licensed caterer; food and drink are yours to choose.</p>
              </div>
            ) : null}

            <a
              href="#hold"
              onClick={(e) => {
                e.preventDefault();
                scrollToId("hold");
              }}
              className="mt-6 flex items-center justify-center gap-2 rounded-full bg-amber px-5 py-3.5 text-[14px] font-bold text-ink transition hover:bg-[#f7c47d]"
            >
              {entry?.state === "open" ? "Hold this date free for 7 days" : "Ask about this date"} <span aria-hidden>→</span>
            </a>
          </aside>
        </div>
      </div>
    </section>
  );
}
