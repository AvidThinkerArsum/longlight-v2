"use client";

// The rolling calendar, as of today where the venue is. It's computed in the browser (the
// page is a static export, so a build-time calendar would go stale): on the server, and
// during hydration, it is null, so the static HTML and the first client render agree, and
// the calendar fills in straight after. Everything that reads availability (the checker,
// the hero's "Saturdays left", the letters, the tour card, the hold form) shares one copy.

import { useSyncExternalStore } from "react";
import { buildAvailability, todayIn, type Availability } from "./availability";
import { site } from "./site";

let cache: Availability | null = null;

function getSnapshot() {
  const today = todayIn(site.timeZone);
  if (!cache || cache.today !== today) cache = buildAvailability(today);
  return cache;
}

const getServerSnapshot = () => null;

// A page left open past midnight rolls over: check when the tab comes back, and once a minute.
function subscribe(onChange: () => void) {
  const check = () => {
    if (cache && cache.today !== todayIn(site.timeZone)) onChange();
  };
  document.addEventListener("visibilitychange", check);
  const id = window.setInterval(check, 60_000);
  return () => {
    document.removeEventListener("visibilitychange", check);
    window.clearInterval(id);
  };
}

/** Availability as of today, or null before the page has hydrated. */
export function useAvailability(): Availability | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
