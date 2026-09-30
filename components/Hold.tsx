"use client";

// "Come see it in the evening light." A hold-your-date form over the lit barn, pre-filled
// from the checker. Submitting sends nothing: it shows the qualified request the venue
// would receive, beside (in concept mode) the vague email it replaces.

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { CoverStage } from "@/components/stage/CoverStage";
import { Sample } from "@/components/ui/Sample";
import { Words } from "@/components/ui/Reveal";
import { useBooking } from "@/components/Booking";
import { useReferrer } from "@/components/People";
import { useLightPreset } from "@/lib/useLight";
import { DAY_NAMES, estimate, formatDate, lookup, money } from "@/lib/availability";
import { FEATURED } from "@/lib/day";
import { site, type Focus } from "@/lib/site";
import { clockLabel } from "@/lib/sun";

/** Framing for the lit barn above the form: the whole front, cupola to lawn. */
const HOLD_FOCUS = { d: [1200, 1000, 1] as Focus, m: [1196, 1060, 1.12] as Focus };

const TOUR_AT = (() => {
  const [h, m] = site.tour.at.split(":").map(Number);
  return clockLabel(h * 60 + m);
})();

/** An obviously fake number in the venue's own area code. */
const PHONE_PLACEHOLDER = `(${site.phone.match(/\d{3}/)?.[0] ?? "555"}) 555-0100`;

type Sent = { names: string; email: string; phone: string; date: string; guests: number; tour: boolean; tourDay: string; note: string; referrer: string };

const field = "w-full rounded-xl border border-ink/15 bg-paper px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink/35 focus:border-ink/60 focus:outline-none";
const label = "mb-1.5 block text-[12px] font-bold uppercase tracking-[0.12em] text-ink/55";

export function Hold() {
  const reduce = useReducedMotion();
  const light = useLightPreset("firstDance", true);
  const { date, setDate, guests, setGuests, tour, setTour } = useBooking();
  const referrer = useReferrer();
  const [sent, setSent] = useState<Sent | null>(null);
  const [tourDay, setTourDay] = useState<string>(site.tour.nights[Math.floor(site.tour.nights.length / 2)]);
  const entry = lookup(date);
  const est = entry ? estimate(entry, guests) : null;
  const vagueDate = `${FEATURED.month.toLowerCase()} ${FEATURED.day}`;

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setSent({
      names: String(f.get("names") || "").trim(),
      email: String(f.get("email") || "").trim(),
      phone: String(f.get("phone") || "").trim(),
      date,
      guests,
      tour,
      tourDay,
      note: String(f.get("note") || "").trim(),
      referrer,
    });
  }

  const request = sent ? (
    <motion.div
      key="sent"
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-[24px] bg-paper p-6 text-ink shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)] sm:p-8"
      role="status"
    >
      <p className="eyebrow text-rose">The request {site.ownersShort} would get</p>
      <p className="display mt-3 text-[2rem] leading-tight">
        Hold {entry ? DAY_NAMES[entry.day] : formatDate(sent.date, { weekday: "long" })}, {formatDate(sent.date, { month: "long", day: "numeric", year: "numeric" })}
      </p>
      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-[14px]">
        <div>
          <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink/45">From</dt>
          <dd className="font-semibold">{sent.names || "(no names given)"}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink/45">Reply to</dt>
          <dd className="truncate font-semibold">{sent.email || "(no email given)"}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink/45">Date status</dt>
          <dd className="font-semibold">{entry ? (entry.state === "open" ? "Open: hold for 7 days" : entry.state === "held" ? "Held: add to the waitlist" : "Booked: offer alternatives") : "Weekday: offsite pricing"}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink/45">Guests</dt>
          <dd className="font-semibold tabular-nums">{sent.guests}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink/45">Their estimate</dt>
          <dd className="font-semibold tabular-nums">
            {est ? money(est.total) : "n/a"}
            <Sample />
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink/45">Tour</dt>
          <dd className="font-semibold">{sent.tour ? `${sent.tourDay}, ${TOUR_AT}` : "Not yet"}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink/45">Found us via</dt>
          <dd className="font-semibold">{sent.referrer}</dd>
        </div>
        {sent.note ? (
          <div className="col-span-2">
            <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink/45">Note</dt>
            <dd className="font-medium">{sent.note}</dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-6 rounded-xl bg-ink/[0.05] px-4 py-3 text-[12.5px] leading-relaxed text-ink/65">
        Nothing was sent: this page is a demo. On the real site this lands in {site.ownersShort}&apos;s inbox, already answered as far as it can be.
      </p>
      <button type="button" onClick={() => setSent(null)} className="mt-4 text-[13px] font-bold text-ink/60 underline decoration-ink/30 underline-offset-4 hover:text-ink">
        Edit the request
      </button>
    </motion.div>
  ) : null;

  return (
    <section id="hold" data-tone="dark" aria-labelledby="hold-title" className="relative isolate overflow-hidden bg-ink text-linen">
      {/* the barn, lit, at the hour you'd come and see it; the form sits over its lawn */}
      <div aria-hidden className="relative h-[52vh] min-h-[340px] sm:h-[58vh] sm:min-h-[420px]">
        <CoverStage light={light} focus={HOLD_FOCUS} />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(30,35,64,0.6)_0%,rgba(30,35,64,0)_20%,rgba(30,35,64,0)_52%,rgba(30,35,64,0.85)_82%,#1e2340_100%)]" />
      </div>
      <div className="relative mx-auto -mt-[14vh] grid max-w-[1320px] gap-10 px-5 pb-20 sm:-mt-[18vh] sm:px-10 sm:pb-28 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
        <div>
          <p className="eyebrow text-amber">Hold your date</p>
          <h2 id="hold-title" className="display mt-4 text-[3rem] leading-[0.95] sm:text-[4.6rem]">
            <Words text="Come see it" /> <Words italic="in the evening light." delay={0.2} />
          </h2>
          <p className="mt-6 max-w-[440px] text-[16px] leading-relaxed text-linen/80">
            Pick the date, say how many, and we&apos;ll hold it free for seven days while you come for a {TOUR_AT} tour.
            <Sample /> The form already knows what you checked above.
          </p>

          {site.showConceptBanner ? (
            <div className="mt-10 max-w-[460px]">
              <p className="eyebrow text-[0.6rem] text-linen/50">What it replaces</p>
              <div className="mt-3 rounded-[18px] border border-linen/15 bg-[#171b36]/90 p-5 font-mono text-[13px] leading-relaxed text-linen/70 backdrop-blur-sm">
                <p className="text-linen/45">Subject:</p>
                <p className="text-linen/90">is {vagueDate} free? how much?</p>
                <p className="mt-3">hi!! is {vagueDate} free for a wedding? how much is it? thanks</p>
                <p className="mt-3 text-[11.5px] text-linen/40">Sent to ten venues. No year, no guest count, no budget, no phone. Two days of back-and-forth before anyone knows anything.</p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            {sent ? (
              request
            ) : (
              <motion.form
                key="form"
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                onSubmit={submit}
                className="rounded-[24px] bg-paper p-5 text-ink shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)] sm:p-8"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="names" className={label}>
                      Your names
                    </label>
                    <input id="names" name="names" autoComplete="name" placeholder="Alex & Sam" className={field} />
                  </div>
                  <div>
                    <label htmlFor="email" className={label}>
                      Email
                    </label>
                    <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" className={field} />
                  </div>
                  <div>
                    <label htmlFor="phone" className={label}>
                      Phone <span className="normal-case tracking-normal text-ink/35">(optional)</span>
                    </label>
                    <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder={PHONE_PLACEHOLDER} className={field} />
                  </div>
                  <div>
                    <label htmlFor="hold-date" className={label}>
                      Date
                    </label>
                    <input id="hold-date" type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className={`${field} tabular-nums`} />
                    <p className="mt-1.5 text-[12px] font-semibold text-ink/55">
                      {entry ? (
                        <>
                          {DAY_NAMES[entry.day]}: {entry.state === "open" ? <span className="text-sage">open</span> : entry.state === "held" ? "held (join the list)" : <span className="text-rose">booked</span>}
                        </>
                      ) : (
                        "A weekday: offsite pricing"
                      )}
                    </p>
                  </div>
                  <div>
                    <label htmlFor="hold-guests" className={label}>
                      Guests
                    </label>
                    <input
                      id="hold-guests"
                      type="number"
                      min={site.pricing.minGuests}
                      max={site.pricing.maxGuests}
                      value={guests}
                      onChange={(e) => setGuests(Math.max(site.pricing.minGuests, Math.min(site.pricing.maxGuests, Number(e.target.value) || site.pricing.minGuests)))}
                      className={`${field} tabular-nums`}
                    />
                    <p className="mt-1.5 text-[12px] font-semibold text-ink/55 tabular-nums">
                      Estimate {est ? money(est.total) : "n/a"}
                      <Sample />
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink/12 p-3.5">
                      <input type="checkbox" checked={tour} onChange={(e) => setTour(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#1e2340]" />
                      <span className="text-[14px] leading-snug">
                        <strong className="font-bold">Book a tour, too.</strong> <span className="text-ink/65">Weeknights at {TOUR_AT}, when the bulbs come on.</span>
                      </span>
                    </label>
                    {tour ? (
                      <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Tour evening">
                        {site.tour.nights.map((d) => (
                          <button
                            key={d}
                            type="button"
                            aria-pressed={tourDay === d}
                            onClick={() => setTourDay(d)}
                            className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${tourDay === d ? "bg-ink text-linen" : "bg-ink/[0.06] text-ink/70"}`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="note" className={label}>
                      Anything we should know <span className="normal-case tracking-normal text-ink/35">(optional)</span>
                    </label>
                    <textarea id="note" name="note" rows={2} placeholder="Our dog is in the wedding party." className={field} />
                  </div>
                </div>
                <button type="submit" className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-4 text-[15px] font-bold text-linen transition hover:bg-ink-2">
                  Hold my date for 7 days <span aria-hidden>→</span>
                </button>
                <p className="mt-3 text-center text-[12px] text-ink/50">
                  Free, no card. {site.ownersShort} reply the same day, from {site.email}.
                  <Sample />
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
