"use client";

// What the visitor has picked so far (a date, a head count, which days they're looking at),
// shared so the checker, the "six days" tabs, the grounds tour and the hold form agree.

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { site } from "@/lib/site";
import { dayOf, type Day, type Season } from "@/lib/availability";

export type DayFilter = Day | "all";
export type SeasonFilter = Season | "all";

type Booking = {
  date: string;
  setDate: (d: string) => void;
  guests: number;
  setGuests: (n: number) => void;
  day: DayFilter;
  season: SeasonFilter;
  setFilter: (f: { day: DayFilter; season: SeasonFilter }) => void;
  tour: boolean;
  setTour: (t: boolean) => void;
};

const Ctx = createContext<Booking | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [date, setDate] = useState<string>(site.featuredDate);
  const [guests, setGuests] = useState(120);
  // The checker opens on the weekend day the hero is set on.
  const [day, setDay] = useState<DayFilter>(() => dayOf(site.featuredDate) ?? "sat");
  const [season, setSeason] = useState<SeasonFilter>("all");
  const [tour, setTour] = useState(false);
  const value = useMemo(
    () => ({
      date,
      setDate,
      guests,
      setGuests,
      day,
      season,
      setFilter: (f: { day: DayFilter; season: SeasonFilter }) => {
        setDay(f.day);
        setSeason(f.season);
      },
      tour,
      setTour,
    }),
    [date, guests, day, season, tour],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBooking() {
  const b = useContext(Ctx);
  if (!b) throw new Error("useBooking outside BookingProvider");
  return b;
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}
