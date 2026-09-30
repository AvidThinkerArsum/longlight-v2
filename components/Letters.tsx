"use client";

// "You were going to ask." Eight real inquiry subject lines, each on a card that turns
// over to the specific answer. The first one reads the availability data.

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { Sample } from "@/components/ui/Sample";
import { Rise, Words } from "@/components/ui/Reveal";
import { scrollToId, useBooking } from "@/components/Booking";
import { DAY_NAMES, addDays, alternative, formatDate, lookup, money, ordinal } from "@/lib/availability";
import { site } from "@/lib/site";
import { sunset } from "@/lib/sun";
import { FEATURED } from "@/lib/day";

type Letter = { subject: string; meta: string; answer: React.ReactNode; action?: { label: string; date: string } };

// The date people ask about: the Saturday a week before the one the hero is set on.
const ASKED = addDays(site.featuredDate, -7);
const ASKED_LABEL = `${formatDate(ASKED, { month: "long" })} ${ordinal(Number(ASKED.slice(8)))}`;
const ASKED_SHORT = formatDate(ASKED, { month: "long", day: "numeric" });

function letters(): Letter[] {
  // "Is June 12th available??" answered from the same data as the checker.
  const asked = lookup(ASKED);
  const alt = asked && asked.state !== "open" ? alternative(asked) : null;
  const altSunset = alt ? sunset(alt.entry.date, site.lat, site.lon, site.timeZone).label : "";
  const first: Letter = {
    subject: `Is ${ASKED_LABEL} available??`,
    meta: "Sent 11:48 pm, from a phone",
    answer:
      asked?.state === "open" ? (
        <>It is, as of this morning. {FEATURED.weekdayLong} rate, and we can hold it free for a week.</>
      ) : alt ? (
        <>
          {ASKED_SHORT} is {asked?.state}. {DAY_NAMES[alt.entry.day]} the {ordinal(Number(alt.entry.date.slice(8)))} is open, it&apos;s {money(alt.saves)} less, and the sun still sets at {altSunset}.
        </>
      ) : (
        <>
          {ASKED_SHORT} is booked, and so is the rest of that weekend. {FEATURED.month} {FEATURED.day} is still open.
        </>
      ),
    action: alt ? { label: `See ${formatDate(alt.entry.date, { month: "short", day: "numeric" })}`, date: alt.entry.date } : undefined,
  };
  return [first, ...site.faq.map((f) => ({ subject: f.subject, meta: f.meta, answer: <>{f.answer}</> }))];
}

function Card({ l, i, open, onToggle, className = "" }: { l: Letter; i: number; open: boolean; onToggle: () => void; className?: string }) {
  const reduce = useReducedMotion();
  const { setDate } = useBooking();
  return (
    <div className={`[perspective:1400px] ${className}`}>
      <div className="relative h-[232px] sm:h-[264px]">
        <motion.div
          animate={{ rotateY: open ? 180 : 0 }}
          transition={reduce ? { duration: 0 } : { duration: 0.8, ease: [0.3, 0.8, 0.2, 1] }}
          style={{ transformStyle: "preserve-3d" }}
          className="relative h-full w-full"
        >
          {/* front: the email as it arrives */}
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-label={`${l.subject} Show the answer`}
            tabIndex={open ? -1 : 0}
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
            className="group absolute inset-0 flex flex-col rounded-[20px] border border-ink/10 bg-paper p-5 text-left shadow-[0_18px_40px_-28px_rgba(30,35,64,0.45)] transition hover:-translate-y-1 hover:shadow-[0_26px_50px_-28px_rgba(30,35,64,0.55)]"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-[11px] font-semibold text-ink/45">To: {site.email}</span>
              {/* a postmark */}
              <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-dashed border-rose/60 text-[8px] font-bold uppercase leading-tight tracking-wider text-rose/80">
                re:
                <br />
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <p className="display mt-auto text-[1.72rem] leading-[1.08] text-ink">{l.subject}</p>
            <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-3 text-[11.5px] font-semibold text-ink/50">
              <span>{l.meta}</span>
              <span className="text-ink/70 transition group-hover:text-ink">Turn over ↻</span>
            </div>
          </button>
          {/* back: the answer */}
          <div
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            className="absolute inset-0 flex flex-col rounded-[20px] bg-ink p-5 text-linen"
            aria-hidden={!open}
          >
            <p className="eyebrow text-amber">
              Answered <Sample />
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-linen/90 sm:text-[15px]">{l.answer}</p>
            <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-[12px] font-semibold">
              <span className="display text-[1.05rem] italic text-linen/70">{site.ownersShort}</span>
              <span className="flex items-center gap-3">
                {l.action ? (
                  <button
                    type="button"
                    tabIndex={open ? 0 : -1}
                    onClick={() => {
                      setDate(l.action!.date);
                      scrollToId("dates");
                    }}
                    className="rounded-full bg-amber px-3 py-1.5 text-ink"
                  >
                    {l.action.label} ↑
                  </button>
                ) : null}
                <button type="button" tabIndex={open ? 0 : -1} onClick={onToggle} className="text-linen/60 hover:text-linen">
                  Back ↺
                </button>
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function Letters() {
  const all = letters();
  const [open, setOpen] = useState<boolean[]>(() => all.map(() => false));
  const turned = open.filter(Boolean).length;
  return (
    <section id="letters" data-tone="light" aria-labelledby="letters-title" className="paper relative overflow-hidden py-20 sm:py-28">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-10">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <p className="eyebrow text-rose">The inbox</p>
            <h2 id="letters-title" className="display mt-4 text-[3rem] leading-[0.95] sm:text-[4.6rem]">
              <Words text="You were going to" /> <Words italic="ask." delay={0.25} />
            </h2>
          </div>
          <Rise>
            <p className="max-w-[500px] text-[16px] leading-relaxed text-ink/75">
              These are the subject lines every venue gets, word for word. Turn one over for the answer we&apos;d have sent back.
            </p>
            <p className="mt-4 flex items-center gap-3 text-[13px] font-semibold text-ink/60" aria-live="polite">
              <span className="display text-[1.6rem] italic text-ink">
                {all.length} of {all.length}
              </span>
              answered before you wrote.
              {turned ? <span className="text-ink/40 tabular-nums">({turned} turned over)</span> : null}
            </p>
          </Rise>
        </div>
        {/* phones: a row of letters you thumb through; wider screens: a grid */}
        <Rise className="mt-10 sm:mt-12">
          <div
            role="list"
            className="no-scrollbar -mx-5 flex snap-x snap-mandatory scroll-pl-5 gap-3 overflow-x-auto px-5 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4"
          >
            {all.map((l, i) => (
              <div key={l.subject} role="listitem" className="w-[82%] shrink-0 snap-start sm:w-auto">
                <Card l={l} i={i} open={open[i]} onToggle={() => setOpen((o) => o.map((v, k) => (k === i ? !v : v)))} />
              </div>
            ))}
          </div>
          <p className="mt-2 text-[12px] font-semibold text-ink/45 sm:hidden">Swipe for all {all.length} →</p>
        </Rise>
      </div>
    </section>
  );
}
