// Sample availability, rolled forward from today, and the pricing rules that turn a date
// and a guest count into an itemized estimate.
//
// The page is a static export, so availability baked in at build time would go stale.
// Instead the calendar is computed in the visitor's browser (see useAvailability): every
// weekend from the current month through the next 18, each date's fate seeded by the date
// itself. Everyone sees the same calendar on a given day, and it only moves the way a real
// one does: past weekends drop off, holds expire on the day they say, near dates fill up.
// SAMPLE DATA.

import { site } from "./site";
import { clockLabel } from "./sun";

const hm = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const shortClock = (minutes: number) => clockLabel(minutes).replace(":00", "");
/** "10 am to 11 pm", from the venue's hours in site.ts. */
export const HOURS = `${shortClock(hm(site.hours.start))} to ${shortClock(hm(site.hours.end))}`;

export type Day = "fri" | "sat" | "sun";
export type State = "open" | "held" | "booked";
export type DateEntry = { date: string; day: Day; state: State; heldUntil?: string };
export type Season = "peak" | "shoulder" | "winter";

export const DAY_NAMES: Record<Day, string> = { fri: "Friday", sat: "Saturday", sun: "Sunday" };
export const DAY_SHORT: Record<Day, string> = { fri: "Fri", sat: "Sat", sun: "Sun" };

export function seasonOf(date: string): Season {
  const m = Number(date.slice(5, 7));
  const S = site.pricing.seasons;
  return (S.peak as readonly number[]).includes(m) ? "peak" : (S.shoulder as readonly number[]).includes(m) ? "shoulder" : "winter";
}

/** The weekend day a date falls on, if it is one. */
export function dayOf(date: string): Day | undefined {
  const d = new Date(`${date}T12:00:00Z`).getUTCDay();
  return d === 5 ? "fri" : d === 6 ? "sat" : d === 0 ? "sun" : undefined;
}

export function priceOf(entry: { date: string; day: Day }) {
  return site.pricing[seasonOf(entry.date)][entry.day];
}

export function addDays(date: string, n: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export type Month = { key: string; label: string; short: string; year: number; dates: DateEntry[] };

export function openCount(month: Month, day: Day) {
  return month.dates.filter((d) => d.day === day && d.state === "open").length;
}

export function formatDate(date: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" }) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });
}

export const money = (n: number) => `$${n.toLocaleString("en-US")}`;

export type Line = { label: string; amount: number; note?: string };

/** The itemized estimate for a date and a head count (before tax and catering). */
export function estimate(entry: { date: string; day: Day }, guests: number) {
  const P = site.pricing;
  const season = seasonOf(entry.date);
  const seasonName = season === "peak" ? "summer" : season === "shoulder" ? "spring & fall" : "winter";
  const lines: Line[] = [
    { label: `${DAY_NAMES[entry.day]}, ${seasonName} rate`, amount: priceOf(entry), note: `${HOURS}, up to ${P.includedGuests} guests` },
  ];
  const extra = Math.max(0, guests - P.includedGuests);
  if (extra > 0) lines.push({ label: `${extra} extra guests (${P.includedGuests} included)`, amount: extra * P.perGuest, note: `${money(P.perGuest)} each` });
  lines.push({ label: `Tables, chairs & linens for ${guests}`, amount: 0 });
  lines.push({ label: "Day-of coordinator", amount: 0 });
  const attendants = Math.max(1, Math.ceil(guests / P.guestsPerAttendant));
  lines.push({ label: `Parking attendant${attendants > 1 ? "s" : ""} (${attendants})`, amount: attendants * P.attendant });
  if (guests > P.securityOver) lines.push({ label: "Licensed security", amount: P.security, note: `over ${P.securityOver} guests` });
  lines.push({ label: "Cleaning & haul-away", amount: P.cleaning });
  const total = lines.reduce((s, l) => s + l.amount, 0);
  return { lines, total };
}

export function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

// ---------------------------------------------------------------------------------------
// The rolling calendar

/** How many months of weekends the calendar shows, counting the current one. */
export const WINDOW_MONTHS = 18;

const DAY_MS = 864e5;
const dayNum = (iso: string) => Math.floor(Date.parse(`${iso}T12:00:00Z`) / DAY_MS);
const isoOf = (n: number) => new Date(n * DAY_MS + DAY_MS / 2).toISOString().slice(0, 10);

/** Today's date ("YYYY-MM-DD") where the venue is. */
export function todayIn(timeZone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** A number in [0, 1) that depends only on the text, so a date always rolls the same. */
function seeded(text: string) {
  let h = 0x811c9dc5; // FNV-1a, then one mulberry32 round to spread it
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  let t = (h + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), 1 | t);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** How likely each weekend day is to be booked, by season (before the nearness factor). */
const BOOKED = {
  peak: { fri: 0.42, sat: 0.8, sun: 0.28 },
  shoulder: { fri: 0.25, sat: 0.55, sun: 0.14 },
  winter: { fri: 0.1, sat: 0.24, sun: 0.05 },
};
/** The share of dates, just above the booked ones, that someone has a hold on. */
const HOLD_BAND = 0.08;
/** The share of holds that end in a contract rather than lapsing. */
const SIGNS = 0.35;

// Fixed states the page's copy refers to: the letters ("Is June 12th available??"), the
// hero's Saturday and its "2 Saturdays left in June", and the winter date in "The other
// six days" (site.winterDate).
const FIXED: Record<string, State> = {
  "2026-11-14": "booked",
  "2026-12-05": "booked",
  "2026-12-12": "booked",
  "2026-12-19": "held",
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
  "2027-07-09": "open",
  "2027-07-10": "booked",
  "2027-08-13": "open",
  "2027-08-14": "booked",
  "2027-12-18": "open",
};

/**
 * One weekend date as of `today` (a day number). Holds run in seven-day windows, staggered
 * per date: a held date shows when this window ends, and on that day it is either held
 * again (the couple renewed) or, once they've decided, booked or open for good.
 */
function entryFor(date: string, day: Day, today: number): DateEntry {
  const n = dayNum(date);
  const phase = Math.floor(seeded(`${date}/phase`) * 7);
  const k = Math.floor((today + phase) / 7);
  const heldUntil = isoOf((k + 1) * 7 - phase);
  const fixed = FIXED[date];
  if (fixed) return fixed === "held" ? { date, day, state: "held", heldUntil } : { date, day, state: fixed };

  // Near dates are more spoken for, and far-out summer Saturdays go first too. As a date
  // comes closer its odds only rise, so a booked date never reopens.
  const monthsOut = (n - today) / 30.4;
  const pBook = BOOKED[seasonOf(date)][day] * (monthsOut < 5 ? 1.12 : monthsOut > 14 ? 0.9 : 1);
  const r = seeded(date);
  if (r < pBook) return { date, day, state: "booked" };
  if (r < pBook + HOLD_BAND) {
    // Held, week by week, until the couple decides: between three weeks and about 14
    // months before the date.
    const lead = 21 + Math.floor(seeded(`${date}/lead`) * 400);
    const decides = Math.floor((n - lead + phase) / 7);
    if (k < decides) return { date, day, state: "held", heldUntil };
    return { date, day, state: seeded(`${date}/signs`) < SIGNS ? "booked" : "open" };
  }
  return { date, day, state: "open" };
}

export type Availability = {
  /** The day this was computed for ("YYYY-MM-DD", in the venue's time zone). */
  today: string;
  dates: DateEntry[];
  months: Month[];
  lookup: (date: string) => DateEntry | undefined;
  month: (key: string) => Month | undefined;
  /** For a date that isn't open: the nearest open day of the same weekend, and what it saves. */
  alternative: (entry: DateEntry) => { entry: DateEntry; saves: number } | null;
  /**
   * An open date that fits a filter: `prefer` itself if it is open, otherwise the open one
   * nearest to it (later wins a tie), otherwise the first anywhere.
   */
  firstOpen: (filter: { day: Day | "all"; season: Season | "all" }, prefer?: string) => DateEntry | undefined;
};

/** Every weekend after `today`, from its month through the next WINDOW_MONTHS - 1. */
export function buildAvailability(today: string): Availability {
  const t = dayNum(today);
  const [y, m] = today.split("-").map(Number);
  const from = dayNum(`${y}-${String(m).padStart(2, "0")}-01`);
  const to = Math.floor(Date.UTC(y, m - 1 + WINDOW_MONTHS, 1, 12) / DAY_MS);
  const dates: DateEntry[] = [];
  // Past weekends (and today's) drop off.
  for (let n = Math.max(from, t + 1); n < to; n++) {
    const iso = isoOf(n);
    const day = dayOf(iso);
    if (day) dates.push(entryFor(iso, day, t));
  }

  const months: Month[] = [];
  for (const d of dates) {
    const key = d.date.slice(0, 7);
    let mo = months[months.length - 1];
    if (!mo || mo.key !== key) {
      const dt = new Date(`${key}-15T12:00:00Z`);
      mo = {
        key,
        label: dt.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" }),
        short: dt.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
        year: dt.getUTCFullYear(),
        dates: [],
      };
      months.push(mo);
    }
    mo.dates.push(d);
  }

  const byDate = new Map(dates.map((d) => [d.date, d]));
  const byMonth = new Map(months.map((mo) => [mo.key, mo]));
  const lookup = (date: string) => byDate.get(date);

  return {
    today,
    dates,
    months,
    lookup,
    month: (key) => byMonth.get(key),
    alternative(entry) {
      const tries = entry.day === "sat" ? [-1, 1] : entry.day === "fri" ? [1, 2] : [-1, -2];
      for (const n of tries) {
        const alt = lookup(addDays(entry.date, n));
        if (alt && alt.state === "open") return { entry: alt, saves: priceOf(entry) - priceOf(alt) };
      }
      return null;
    },
    firstOpen(filter, prefer) {
      const fits = (d: DateEntry) => d.state === "open" && (filter.day === "all" || d.day === filter.day) && (filter.season === "all" || seasonOf(d.date) === filter.season);
      const open = dates.filter(fits);
      if (!prefer) return open[0];
      const p = dayNum(prefer);
      let best: DateEntry | undefined;
      for (const d of open) {
        const dist = Math.abs(dayNum(d.date) - p);
        const bestDist = best ? Math.abs(dayNum(best.date) - p) : Infinity;
        if (dist < bestDist || (dist === bestDist && best && d.date > best.date)) best = d;
      }
      return best;
    },
  };
}
