"use client";

// "Book with the people, not the listing." Who answers, three promises, three sample
// reviews (always labelled), the paperwork placeholders, and where this visit came from.

import { useEffect, useState } from "react";
import { Sample } from "@/components/ui/Sample";
import { Rise, Words } from "@/components/ui/Reveal";
import { site } from "@/lib/site";

// A real venue's page must never put stock strangers under the owners' names.
const PLACEHOLDER_PORTRAIT = site.showConceptBanner && !site.fictional;

export function useReferrer() {
  const [ref, setRef] = useState<string>("");
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const utm = q.get("utm_source") || q.get("ref");
    let r = utm ?? "";
    if (!r && document.referrer) {
      try {
        const host = new URL(document.referrer).hostname.replace(/^www\./, "");
        if (host !== window.location.hostname) r = host;
      } catch {}
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from the browser
    setRef(r || "direct (typed or bookmarked)");
  }, []);
  return ref;
}

export function People() {
  const referrer = useReferrer();
  const license = site.state === "WA" ? "WA UBI no." : `${site.state} business license`;
  return (
    <section id="people" data-tone="light" aria-labelledby="people-title" className="paper relative py-20 sm:py-28">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-10">
        <p className="eyebrow text-rose">Who you&apos;d be emailing</p>
        <h2 id="people-title" className="display mt-4 max-w-[900px] text-[3rem] leading-[0.95] sm:text-[4.6rem]">
          <Words text="Book with the people," /> <Words italic="not the listing." delay={0.25} />
        </h2>

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <Rise>
            <figure className="relative">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[26px] bg-linen-2">
                {PLACEHOLDER_PORTRAIT ? (
                  <div className="paper absolute inset-0 grid place-items-center border border-dashed border-ink/25 rounded-[26px] text-center">
                    <div>
                      <p className="display text-[2rem] leading-none text-ink/70">Your photo here</p>
                      <p className="mt-3 text-[13px] font-semibold text-ink/50">{site.ownersShort}, by the big doors</p>
                    </div>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={site.photos.owners.src} alt={site.photos.owners.alt} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover object-[46%_40%]" />
                )}
              </div>
              <figcaption className="mt-4 flex items-baseline justify-between gap-4">
                <span className="display text-[1.6rem] leading-none">
                  {site.owners}
                  {PLACEHOLDER_PORTRAIT ? null : <Sample label="sample portrait" />}
                </span>
                <span className="text-right text-[12.5px] font-semibold text-ink/55">Owners, and the ones who pick up</span>
              </figcaption>
            </figure>
          </Rise>

          <div>
            <Rise>
              <p className="display text-[1.7rem] leading-[1.25] text-ink/90 sm:text-[2.1rem]">&ldquo;{site.ownerQuote}&rdquo;</p>
              <p className="mt-4 text-[14px] font-semibold text-ink/55">
                {site.ownersShort}, {site.town}
                <Sample />
              </p>
            </Rise>

            <ol className="mt-10 grid gap-3">
              {site.promises.map((p, i) => (
                <Rise key={p.title} delay={i * 0.08}>
                  <li className="grid grid-cols-[48px_1fr] gap-3 rounded-[20px] bg-paper p-5 ring-1 ring-ink/10">
                    <span className="display text-[1.6rem] leading-none text-rose tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <p className="text-[16px] font-bold">
                        {p.title}
                        <Sample />
                      </p>
                      <p className="mt-1 text-[14px] leading-relaxed text-ink/70">{p.body}</p>
                    </div>
                  </li>
                </Rise>
              ))}
            </ol>
          </div>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {site.reviews.map((r, i) => (
            <Rise key={i} delay={i * 0.08}>
              <blockquote className="flex h-full flex-col rounded-[22px] border border-ink/12 p-6">
                <p className="eyebrow inline-flex items-center gap-2 text-[0.6rem] text-ink/50">
                  <span className="rounded-full border border-dashed border-ink/40 px-2 py-0.5">Sample review</span>
                </p>
                <p className="display mt-4 text-[1.45rem] leading-snug">&ldquo;{r.quote}&rdquo;</p>
                <footer className="mt-auto pt-5 text-[12.5px] font-semibold text-ink/55">{r.who} (illustrative)</footer>
              </blockquote>
            </Rise>
          ))}
        </div>

        <Rise className="mt-10">
          <div className="grid gap-4 rounded-[22px] bg-ink/[0.04] p-5 text-[13px] sm:grid-cols-4 sm:p-6">
            <div>
              <p className="eyebrow text-[0.58rem] text-ink/45">{license}</p>
              <p className="mt-1 font-semibold tabular-nums text-ink/70">000 000 000 · placeholder</p>
            </div>
            <div>
              <p className="eyebrow text-[0.58rem] text-ink/45">Liability insurance</p>
              <p className="mt-1 font-semibold text-ink/70">Carrier and limit · placeholder</p>
            </div>
            <div>
              <p className="eyebrow text-[0.58rem] text-ink/45">Occupancy</p>
              <p className="mt-1 font-semibold text-ink/70">
                Fire marshal certificate · placeholder
                <Sample />
              </p>
            </div>
            <div>
              <p className="eyebrow text-[0.58rem] text-ink/45">You found us via</p>
              <p className="mt-1 font-semibold text-ink/70" aria-live="polite">
                {referrer || "…"}
              </p>
              <p className="mt-1 text-[11.5px] text-ink/45">Every inquiry records this, so we stop paying for listings that send no one.</p>
            </div>
          </div>
        </Rise>
      </div>
    </section>
  );
}
