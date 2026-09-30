// Writes lib/availability.json: 18 months of weekend dates, each booked, held or open.
// Deterministic (seeded), so the page and its screenshots never drift. SAMPLE DATA.
// Run: node scripts/make-availability.mjs
import { writeFileSync } from "node:fs";

const FROM = "2026-10-01";
const MONTHS = 18;
const TODAY = "2026-09-30";

// mulberry32
let seed = 0x10e1167;
const rand = () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Keep in step with site.pricing.seasons in lib/site.ts.
const season = (m) => (m >= 6 && m <= 9 ? "peak" : m === 4 || m === 5 || m === 10 ? "shoulder" : "winter");
const P = {
  peak: { fri: 0.42, sat: 0.8, sun: 0.28 },
  shoulder: { fri: 0.25, sat: 0.55, sun: 0.14 },
  winter: { fri: 0.1, sat: 0.24, sun: 0.05 },
};
const DOW = { 5: "fri", 6: "sat", 0: "sun" };

// Fixed states the page's copy refers to (the letters, the hero's Saturday, the scarcity line).
const FIXED = {
  "2026-11-14": "booked",
  "2026-12-12": "booked",
  "2026-12-19": "held",
  "2026-12-05": "booked",
  "2027-06-04": "open",
  "2027-06-05": "booked",
  "2027-06-06": "open",
  "2027-06-11": "open",
  "2027-06-12": "booked",
  "2027-06-13": "booked",
  "2027-06-18": "held",
  "2027-06-19": "open",
  "2027-06-20": "open",
  "2027-06-25": "booked",
  "2027-06-26": "open",
  "2027-06-27": "open",
  "2027-07-10": "booked",
  "2027-07-09": "open",
  "2027-08-14": "booked",
  "2027-08-13": "open",
  // the winter date "The other six days" quotes (site.winterDate)
  "2027-12-18": "open",
};

const start = new Date(`${FROM}T12:00:00Z`);
const end = new Date(start);
end.setUTCMonth(end.getUTCMonth() + MONTHS);
const today = new Date(`${TODAY}T12:00:00Z`);

const dates = [];
for (let d = new Date(start); d < end; d.setUTCDate(d.getUTCDate() + 1)) {
  const dow = DOW[d.getUTCDay()];
  if (!dow) continue;
  const iso = d.toISOString().slice(0, 10);
  const m = d.getUTCMonth() + 1;
  const s = season(m);
  const monthsOut = (d - today) / (30.4 * 864e5);
  // Near dates are more spoken for; far-out Saturdays in summer go first too.
  let pBook = P[s][dow] * (monthsOut < 5 ? 1.12 : monthsOut > 14 ? 0.9 : 1);
  const r = rand();
  let state = r < pBook ? "booked" : r < pBook + 0.07 ? "held" : "open";
  if (FIXED[iso]) state = FIXED[iso];
  const entry = { date: iso, day: dow, state };
  if (state === "held") {
    const until = new Date(today);
    until.setUTCDate(until.getUTCDate() + 1 + Math.floor(rand() * 7));
    entry.heldUntil = until.toISOString().slice(0, 10);
  }
  dates.push(entry);
}

writeFileSync(
  new URL("../lib/availability.json", import.meta.url),
  JSON.stringify({ sample: true, generated: TODAY, from: FROM, months: MONTHS, dates }, null, 1) + "\n",
);
console.log(`${dates.length} weekend dates, ${dates.filter((d) => d.state === "open").length} open`);
