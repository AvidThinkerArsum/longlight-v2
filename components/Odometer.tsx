"use client";

// A clock that rolls like an odometer. It always comes to rest on a whole minute: the
// shown value springs toward the nearest minute, each digit holds still for most of the
// minute and turns over quickly at the half, and the tens and the hour turn only on the
// carry, the way a mechanical counter does.

import { motion, useSpring, useTransform, type MotionValue } from "framer-motion";

const ONES = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const TENS = ["0", "1", "2", "3", "4", "5", "0"];
const HOURS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "1"];

/**
 * How far a digit has turned between one minute and the next: it holds, then turns over
 * quickly around the half-minute. A value settling toward a whole minute from either side
 * therefore always reads as that minute, never as two half digits.
 */
function roll(f: number) {
  const t = Math.min(1, Math.max(0, (f - 0.38) / 0.24));
  return t * t * (3 - 2 * t);
}

function parts(m: number) {
  const whole = Math.floor(m + 1e-6);
  const r = roll(m - whole);
  const day = ((whole % 1440) + 1440) % 1440;
  const mm = day % 60;
  const h24 = Math.floor(day / 60);
  return { r, mm, h12: ((h24 + 11) % 12) + 1 };
}

function Column({ pos, digits, className = "w-[0.64em]", align = "text-center" }: { pos: MotionValue<number>; digits: string[]; className?: string; align?: string }) {
  const y = useTransform(pos, (p) => `${-(Math.round(p * 1000) / 1000 / digits.length) * 100}%`);
  return (
    <span className={`relative inline-block h-[1em] overflow-hidden align-top ${className}`}>
      <motion.span style={{ y }} className={`absolute inset-x-0 top-0 flex flex-col ${align}`}>
        {digits.map((d, i) => (
          <span key={i} className="block h-[1em] leading-[1em]">
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

export function Odometer({ minutes, className = "" }: { minutes: MotionValue<number>; className?: string }) {
  // Rest on whole minutes, whatever scroll position the page stops at.
  const target = useTransform(minutes, (m) => Math.round(m));
  const shown = useSpring(target, { stiffness: 320, damping: 34, restDelta: 0.001, restSpeed: 0.01 });

  const ones = useTransform(shown, (m) => {
    const { r, mm } = parts(m);
    return (mm % 10) + r;
  });
  const tens = useTransform(shown, (m) => {
    const { r, mm } = parts(m);
    return Math.floor(mm / 10) + (mm % 10 === 9 ? r : 0);
  });
  const hour = useTransform(shown, (m) => {
    const { r, mm, h12 } = parts(m);
    return h12 - 1 + (mm === 59 ? r : 0);
  });
  // A one-digit hour pulls the clock left by the width of the missing digit.
  const shift = useTransform(hour, (h) => `${-0.56 * (1 - Math.min(1, Math.max(0, h - 8)))}em`);
  const meridiem = useTransform(shown, (m): string => ((((Math.round(m) % 1440) + 1440) % 1440) < 720 ? "am" : "pm"));
  return (
    <motion.span style={{ x: shift }} className={`inline-flex items-baseline tabular-nums ${className}`} aria-hidden>
      <Column pos={hour} digits={HOURS} className="w-[1.2em]" align="text-right" />
      <span className="inline-block h-[1em] w-[0.3em] text-center leading-[0.92em]">:</span>
      <Column pos={tens} digits={TENS} />
      <Column pos={ones} digits={ONES} />
      <motion.span className="ml-[0.18em] text-[0.34em] font-medium tracking-[0.08em]">{meridiem}</motion.span>
    </motion.span>
  );
}
