"use client";

// A thin header that reads whatever is behind it: ink over sky and linen, linen over dusk
// and indigo. Sections say what they are with data-tone.

import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";
import { scrollToId } from "@/components/Booking";

const TONE_EVENT = "longlight:tone";

const LINKS = [
  ["dates", "Dates"],
  ["grounds", "Grounds"],
  ["six-days", "Six days"],
  ["people", "People"],
] as const;

export function Nav() {
  const [tone, setTone] = useState<"light" | "dark">("light");
  const [solid, setSolid] = useState(false);
  const [inHero, setInHero] = useState(true);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const y = (ref.current?.getBoundingClientRect().bottom ?? 60) - 20;
      const hits = document.elementsFromPoint(window.innerWidth / 2, y);
      for (const el of hits) {
        if (ref.current?.contains(el)) continue;
        const t = (el as HTMLElement).closest<HTMLElement>("[data-tone]");
        if (t) {
          setTone(t.dataset.tone === "dark" ? "dark" : "light");
          // Solid over the page's sections, over the close, and over the reduced-motion still
          // once it starts to scroll away (it isn't pinned, so its type passes underneath).
          setSolid(!t.closest("#top") || t.dataset.solid === "1" || (t.dataset.still === "1" && window.scrollY > 8));
          setInHero(!!t.closest("#top"));
          break;
        }
      }
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    // The hero changes tone as its light does, without the page scrolling (the camera
    // spring settles after the wheel stops), so it says so.
    window.addEventListener(TONE_EVENT, on);
    // The hero swaps to its reduced-motion still after hydration; look again once it has.
    const late = [window.setTimeout(on, 150), window.setTimeout(on, 900)];
    return () => {
      late.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      window.removeEventListener(TONE_EVENT, on);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  const dark = tone === "dark";
  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToId(id);
  };
  return (
    <header
      ref={ref}
      className={`fixed inset-x-0 z-50 transition-colors duration-200 ${site.showConceptBanner ? "top-[26px]" : "top-0"} ${dark ? "text-linen [text-shadow:0_1px_14px_rgba(10,12,30,0.75)]" : "text-ink"} ${
        solid ? (dark ? "bg-ink/95 backdrop-blur-md" : "bg-linen/90 backdrop-blur-md") : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-14 max-w-[1560px] items-center justify-between gap-4 px-5 sm:h-16 sm:px-10">
        <a href="#top" onClick={go("top")} className="flex items-baseline gap-3 whitespace-nowrap">
          <span className="display text-[1.7rem] leading-none sm:text-[1.95rem]">{site.name}</span>
          <span className="eyebrow hidden text-[0.58rem] opacity-70 lg:inline">
            {site.town}, {site.state}
          </span>
        </a>
        <div className="flex items-center gap-6">
          <ul className={`hidden items-center gap-6 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold transition-colors duration-200 lg:flex ${solid ? "" : dark ? "bg-[#10132a]/45 backdrop-blur-md" : "bg-linen/55 backdrop-blur-md"}`}>
            {LINKS.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} onClick={go(id)} className="opacity-80 transition-opacity hover:opacity-100">
                  {label}
                </a>
              </li>
            ))}
          </ul>
          {/* phones, over the hero: always a way past it */}
          <a
            href="#dates"
            onClick={go("dates")}
            aria-hidden={!inHero}
            tabIndex={inHero ? 0 : -1}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[12px] font-semibold backdrop-blur-md transition-opacity duration-200 [text-shadow:none] md:hidden ${
              inHero ? "opacity-100" : "pointer-events-none opacity-0"
            } ${dark ? "border-linen/35 bg-ink/35 text-linen" : "border-ink/20 bg-linen/40 text-ink"}`}
          >
            Skip to dates <span aria-hidden>↓</span>
          </a>
          <a
            href="#dates"
            onClick={go("dates")}
            className={`hidden items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-bold transition md:inline-flex ${dark ? "bg-linen text-ink hover:bg-white" : "bg-ink text-linen hover:bg-ink-2"}`}
          >
            Check a date <span aria-hidden>↗</span>
          </a>
        </div>
      </nav>
    </header>
  );
}

export function ConceptBanner() {
  if (!site.showConceptBanner) return null;
  return (
    <div role="note" className="fixed inset-x-0 top-0 z-[60] flex h-[26px] items-center justify-center bg-[#12152b] px-4 text-center text-[11px] font-semibold tracking-wide text-linen/85">
      <span className="truncate">
        Unofficial concept for {site.name}, not affiliated.
        <span className="hidden sm:inline">
          {" "}Figures marked <span className="sample-tag !ml-0.5 !align-middle text-amber">sample</span> are invented.
        </span>
      </span>
    </div>
  );
}

export function MobileBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-ink/10 bg-linen/95 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-md md:hidden">
      <div className="flex items-center gap-2.5">
        <a href={`tel:${site.phone.replace(/[^\d+]/g, "")}`} className="flex flex-1 items-center justify-center gap-2 rounded-full border border-ink/25 py-3 text-[14px] font-bold text-ink">
          <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" strokeLinejoin="round" />
          </svg>
          Call
        </a>
        <a
          href="#dates"
          onClick={(e) => {
            e.preventDefault();
            scrollToId("dates");
          }}
          className="flex flex-[1.6] items-center justify-center gap-1.5 rounded-full bg-ink py-3 text-[14px] font-bold text-linen"
        >
          Check a date <span aria-hidden>↗</span>
        </a>
      </div>
    </div>
  );
}
