"use client";

// A site plan drawn in code, in the manner of a letterpress map: the barn, the lawn, the
// orchard, the terrace, the lane. The tour route fills in as footsteps (opacity only)
// while a marker walks it (transform only).

import { motion, useTransform, type MotionValue } from "framer-motion";
import { site } from "@/lib/site";

const W = 640, H = 480;
const r2 = (n: number) => Math.round(n * 100) / 100;

// Tour waypoints; stops are the indices of the five spaces.
const WAY: [number, number][] = [
  [320, 168], [320, 236], [318, 294], [372, 304], [440, 280], [497, 212], [470, 176], [428, 186],
  [372, 190], [300, 196], [232, 194], [182, 190], [146, 190],
];
const STOP_IDX = [0, 2, 5, 8, 12];

function catmull(pts: [number, number][], samples = 14) {
  const out: [number, number][] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < samples; k++) {
      const t = k / samples, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

const DENSE = catmull(WAY);
const CUM = DENSE.reduce<number[]>((acc, p, i) => {
  acc.push(i ? acc[i - 1] + Math.hypot(p[0] - DENSE[i - 1][0], p[1] - DENSE[i - 1][1]) : 0);
  return acc;
}, []);
const TOTAL = CUM[CUM.length - 1];
/** Where each stop sits along the route, 0..1. */
export const STOP_AT = STOP_IDX.map((i) => CUM[i * 14] / TOTAL);

function pointAt(f: number): [number, number] {
  const d = Math.min(1, Math.max(0, f)) * TOTAL;
  const i = CUM.findIndex((c) => c >= d);
  if (i <= 0) return DENSE[0];
  const t = (d - CUM[i - 1]) / (CUM[i] - CUM[i - 1] || 1);
  return [DENSE[i - 1][0] + (DENSE[i][0] - DENSE[i - 1][0]) * t, DENSE[i - 1][1] + (DENSE[i][1] - DENSE[i - 1][1]) * t];
}

const STEP = 11;
const DOTS = Array.from({ length: Math.floor(TOTAL / STEP) }, (_, k) => {
  const f = (k * STEP) / TOTAL;
  const [x, y] = pointAt(f);
  return { f, x: r2(x), y: r2(y) };
});

function Dot({ f, x, y, route }: { f: number; x: number; y: number; route: MotionValue<number> }) {
  const opacity = useTransform(route, (v) => (v >= f ? 1 : 0.14));
  return <motion.circle cx={x} cy={y} r={2.1} style={{ opacity }} className="fill-rose" />;
}

const TREES = Array.from({ length: 20 }, (_, i) => {
  const c = i % 5, r = Math.floor(i / 5);
  return { x: 470 + c * 26 + (r % 2) * 11, y: 118 + r * 34 };
});

/** `compact`: a thumbnail on phones, where only the numbered stops can be read. */
export function SitePlan({ route, active, compact = false, className = "" }: { route: MotionValue<number>; active: number; compact?: boolean; className?: string }) {
  const mx = useTransform(route, (v) => (pointAt(v)[0] / W) * 100 + "%");
  const my = useTransform(route, (v) => (pointAt(v)[1] / H) * 100 + "%");
  const labels: [number, number, string, "start" | "middle" | "end"][] = [
    [320, 128, "loft", "middle"],
    [320, 346, "lawn", "middle"],
    [530, 290, "orchard", "middle"],
    [320, 215, "hall", "middle"],
    [146, 146, "terrace", "middle"],
  ];
  const ink = "#1e2340";
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-full w-full" role="img" aria-label={`Site plan of ${site.name}: the barn, the front lawn, the orchard, the west terrace and the lane, with the tour route`}>
        <defs>
          <pattern id="gravel" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="0.7" fill={ink} opacity="0.22" />
            <circle cx="4.5" cy="4" r="0.5" fill={ink} opacity="0.16" />
          </pattern>
          <pattern id="grass" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M2 8 l1.4 -3 M6 9 l1 -2.6" stroke="#6f7f67" strokeWidth="0.7" opacity="0.5" />
          </pattern>
        </defs>

        {/* the five acres */}
        <path d="M44 62 L598 42 L618 298 L560 440 L92 452 L30 282 Z" fill="url(#grass)" stroke={ink} strokeWidth="1.2" strokeDasharray="1 5" strokeLinecap="round" opacity="0.8" />
        {/* road and lane */}
        <path d="M0 468 L640 462" stroke={ink} strokeWidth="1" opacity="0.35" />
        <path d="M336 466 C 350 420, 420 404, 470 388 M 336 466 C 330 400, 324 350, 322 306" stroke={ink} strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.1" />
        <path d="M336 466 C 350 420, 420 404, 470 388 M 336 466 C 330 400, 324 350, 322 306" stroke={ink} strokeWidth="0.8" strokeDasharray="3 3" fill="none" opacity="0.45" />
        {/* parking */}
        <rect x="430" y="336" width="140" height="74" rx="6" fill="url(#gravel)" stroke={ink} strokeWidth="0.8" opacity="0.8" />
        {Array.from({ length: 9 }, (_, i) => (
          <line key={i} x1={442 + i * 14.5} y1="340" x2={442 + i * 14.5} y2="356" stroke={ink} strokeWidth="0.6" opacity="0.35" />
        ))}
        {compact ? null : (
          <text x="500" y="432" textAnchor="middle" className="fill-ink/55 text-[15px] font-semibold uppercase tracking-[0.14em]">
            Parking · {site.parking.cars}
          </text>
        )}

        {/* orchard */}
        {TREES.map((t, i) => (
          <g key={i}>
            <circle cx={t.x} cy={t.y} r="9.5" fill="#8b9a7e" opacity="0.28" />
            <circle cx={t.x} cy={t.y} r="9.5" fill="none" stroke={ink} strokeWidth="0.6" opacity="0.45" />
          </g>
        ))}
        <line x1="470" y1="196" x2="560" y2="196" stroke={ink} strokeWidth="3" opacity="0.5" />

        {/* front lawn with bench rows */}
        <rect x="248" y="262" width="144" height="70" rx="8" fill="#8b9a7e" opacity="0.18" />
        {Array.from({ length: 5 }, (_, r) => (
          <g key={r} opacity="0.5">
            <line x1="258" y1={276 + r * 11} x2="310" y2={276 + r * 11} stroke={ink} strokeWidth="1.3" />
            <line x1="330" y1={276 + r * 11} x2="382" y2={276 + r * 11} stroke={ink} strokeWidth="1.3" />
          </g>
        ))}

        {/* the barn: gambrel centre, two wings, porch on the east */}
        <rect x="228" y="142" width="184" height="88" fill="#f8f3ea" stroke={ink} strokeWidth="1.6" />
        <rect x="276" y="142" width="88" height="88" fill="none" stroke={ink} strokeWidth="1.1" />
        <line x1="320" y1="142" x2="320" y2="230" stroke={ink} strokeWidth="0.6" strokeDasharray="2 3" opacity="0.6" />
        <rect x="309" y="175" width="22" height="22" fill="none" stroke={ink} strokeWidth="0.9" />
        <rect x="412" y="150" width="26" height="72" fill="url(#gravel)" stroke={ink} strokeWidth="0.9" />
        {/* doors */}
        <rect x="286" y="226" width="16" height="6" fill={ink} />
        <rect x="338" y="226" width="16" height="6" fill={ink} />

        {/* west terrace and its strands of bulbs */}
        <rect x="92" y="156" width="112" height="74" rx="6" fill="none" stroke={ink} strokeWidth="1" strokeDasharray="4 3" opacity="0.7" />
        <path d="M96 164 Q 125 176 150 164 T 200 164 M96 222 Q 125 210 150 222 T 200 222" fill="none" stroke={ink} strokeWidth="0.6" opacity="0.5" />
        {Array.from({ length: 9 }, (_, i) => (
          <circle key={i} cx={100 + i * 12} cy={i % 2 ? 170 : 166} r="1.8" fill="#e0953f" />
        ))}
        {/* fire circle */}
        <circle cx="150" cy="330" r="16" fill="none" stroke={ink} strokeWidth="0.9" opacity="0.6" />
        <circle cx="150" cy="330" r="4" fill="#e0953f" opacity="0.8" />
        {compact ? null : (
          <text x="150" y="368" textAnchor="middle" className="fill-ink/45 text-[14px] font-semibold uppercase tracking-[0.14em]">
            Fire circle
          </text>
        )}

        {/* the route */}
        {DOTS.map((d, i) => (
          <Dot key={i} {...d} route={route} />
        ))}
        {STOP_IDX.map((wi, k) => (
          <g key={k}>
            <circle cx={WAY[wi][0]} cy={WAY[wi][1]} r={(k === active ? 13 : 10) * (compact ? 1.6 : 1)} fill={k === active ? "#1e2340" : "#f3ece1"} stroke={ink} strokeWidth={compact ? 2 : 1.4} className="transition-all duration-500" />
            <text x={WAY[wi][0]} y={WAY[wi][1] + (compact ? 7.5 : 5)} textAnchor="middle" className={`${compact ? "text-[21px]" : "text-[14px]"} font-bold ${k === active ? "fill-linen" : "fill-ink"}`}>
              {k + 1}
            </text>
          </g>
        ))}
        {compact
          ? null
          : labels.map(([x, y, t], k) => (
              <text key={t} x={x} y={y} textAnchor="middle" className={`text-[17px] font-semibold uppercase tracking-[0.1em] transition-opacity duration-500 ${k === active ? "fill-ink opacity-100" : "fill-ink opacity-50"}`}>
                {t}
              </text>
            ))}

        {/* compass and scale */}
        <g transform="translate(590 96)" opacity="0.7">
          <path d="M0 -18 L5 4 L0 0 L-5 4 Z" fill={ink} />
          <text y="22" textAnchor="middle" className="fill-ink text-[14px] font-bold">
            N
          </text>
        </g>
        <g transform="translate(58 424)" opacity="0.65">
          <line x1="0" y1="0" x2="80" y2="0" stroke={ink} strokeWidth="1" />
          <line x1="0" y1="-4" x2="0" y2="4" stroke={ink} />
          <line x1="40" y1="-3" x2="40" y2="3" stroke={ink} />
          <line x1="80" y1="-4" x2="80" y2="4" stroke={ink} />
          {compact ? null : (
            <text x="40" y="20" textAnchor="middle" className="fill-ink text-[13px] font-semibold">
              100 ft
            </text>
          )}
        </g>
      </svg>
      {/* you are here: the SVG stays put; this marker is a div, moved by transform */}
      <motion.div aria-hidden style={{ x: mx, y: my }} className="pointer-events-none absolute inset-0">
        <span className="absolute -left-[9px] -top-[9px] block h-[18px] w-[18px] rounded-full bg-amber/40" />
        <span className="absolute -left-[4px] -top-[4px] block h-[8px] w-[8px] rounded-full bg-amber-2 ring-2 ring-paper" />
      </motion.div>
    </div>
  );
}
