import { site } from "@/lib/site";
import { CrispStrand } from "@/components/Bulbs";

const CREDITS: { key: keyof typeof site.photos; what: string }[] = [
  { key: "hero", what: "The barn" },
  { key: "lawn", what: "The lawn" },
  { key: "hall", what: "The hall" },
  { key: "orchard", what: "The orchard" },
  { key: "terrace", what: "The terrace" },
  { key: "loft", what: "The loft" },
  { key: "owners", what: "The portrait" },
];

// What the page says about itself depends on who it's for: the Longlight demo is an
// invented venue; a concept for a real venue must not call that venue fictional; a live
// page (flag off) says nothing about samples at all.
const ABOUT = site.fictional
  ? `${site.name} is a fictional venue. Availability, prices, capacities, reviews and credentials on this page are sample content, not claims about any real business.`
  : site.showConceptBanner
    ? `Unofficial concept for ${site.name}. Availability, prices, reviews and credentials here are samples, not ${site.name}'s.`
    : null;

export function Footer() {
  return (
    <footer data-tone="dark" className="relative bg-night pb-28 text-linen md:pb-12">
      <CrispStrand count={22} className="opacity-90" />
      <div className="mx-auto max-w-[1320px] px-5 pt-8 sm:px-10">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <p className="display text-[3.2rem] leading-none">{site.name}</p>
            <p className="mt-3 text-[14px] leading-relaxed text-linen/65">
              {site.kind} in {site.town}, {site.state}.
              <br />
              {site.address}, {site.town}, {site.state}
            </p>
            <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[14px] font-semibold">
              <a href={`tel:${site.phone.replace(/[^\d+]/g, "")}`} className="hover:text-amber">
                {site.phone}
              </a>
              <a href={`mailto:${site.email}`} className="hover:text-amber">
                {site.email}
              </a>
            </p>
          </div>
          <div className="text-[13px] leading-relaxed text-linen/60">
            <p className="eyebrow mb-3 text-[0.6rem] text-linen/45">About this page</p>
            {ABOUT ? <p>{ABOUT}</p> : null}
            <p className={ABOUT ? "mt-3" : ""}>Sunset times are computed with NOAA&apos;s solar equations for {site.town}, {site.state}.</p>
          </div>
          <div className="text-[13px] leading-relaxed text-linen/60">
            <p className="eyebrow mb-3 text-[0.6rem] text-linen/45">Photographs, via Pexels</p>
            <ul className="space-y-1">
              {CREDITS.filter((c) => c.key !== "owners" || site.fictional || !site.showConceptBanner).map((c) => {
                const p = site.photos[c.key];
                return (
                  <li key={c.key}>
                    {c.what}:{" "}
                    <a href={`https://www.pexels.com/photo/${p.id}/`} target="_blank" rel="noreferrer" className="underline decoration-linen/25 underline-offset-2 hover:text-linen">
                      {p.by}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        {site.showConceptBanner ? (
          <p className="mt-12 border-t border-linen/10 pt-6 text-[12px] text-linen/40">
            {site.fictional ? "A concept page" : `An unofficial concept for ${site.name}`}. Sample availability, rolled forward from today.
          </p>
        ) : null}
      </div>
    </footer>
  );
}
