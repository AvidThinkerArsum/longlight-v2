"use client";

import { animate, motionValue, type MotionValue } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { LIGHT_KEYS, lightAt, preset, type Light, type Preset } from "./light";
import type { LightMV } from "@/components/stage/Stage";

function make(initial: Light): LightMV {
  return Object.fromEntries(LIGHT_KEYS.map((k) => [k, motionValue(initial[k])])) as LightMV;
}

/** Light that follows a clock (minutes after midnight) through a day with the given sunset. */
export function useLightFromClock(clock: MotionValue<number>, sunsetMinutes: number) {
  const mvs = useMemo(() => make(lightAt(clock.get() - sunsetMinutes)), [clock, sunsetMinutes]);
  useEffect(() => {
    const apply = (m: number) => {
      const L = lightAt(m - sunsetMinutes);
      for (const k of LIGHT_KEYS) mvs[k].set(L[k]);
    };
    apply(clock.get());
    return clock.on("change", apply);
  }, [clock, sunsetMinutes, mvs]);
  return mvs;
}

/** Light that eases from one preset to the next. */
export function useLightPreset(name: Preset, instant = false) {
  // Created once, from whichever preset the component first shows.
  const [mvs] = useState(() => make(preset(name)));
  useEffect(() => {
    const target = preset(name);
    const controls = LIGHT_KEYS.map((k) =>
      instant ? (mvs[k].set(target[k]), null) : animate(mvs[k], target[k], { duration: 1.6, ease: [0.4, 0, 0.2, 1] }),
    );
    return () => controls.forEach((c) => c?.stop());
  }, [name, instant, mvs]);
  return mvs;
}
