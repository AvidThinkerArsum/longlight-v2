"use client";

// Dev-only calibration: /?calibrate shows the hero photo whole, with the calibration drawn
// over it (skyline, window panes, lamps, sun track, focal stops) and the computed sky and
// cloud masks. Click anywhere to read off a point in photo pixels. Add &photo=<url> to
// click out points on a prospective client's photo.

import { useEffect, useState } from "react";
import { site } from "@/lib/site";
import { useMasks } from "@/lib/masks";
import { STOPS } from "@/lib/day";

const ENABLED = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_CALIBRATE === "1";

export function Calibrate() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!ENABLED) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the URL once
    setOn(new URLSearchParams(window.location.search).has("calibrate"));
  }, []);
  if (!on) return null;
  return <Overlay />;
}

function Overlay() {
  const H = site.hero;
  const { w: W0, h: H0 } = H.size;
  const masks = useMasks();
  const [photo] = useState(() => new URLSearchParams(window.location.search).get("photo") || site.photos.hero.src);
  const [show, setShow] = useState({ sky: true, cloud: false, calib: true, grid: false });
  const [pts, setPts] = useState<[number, number][]>([]);
  const custom = photo !== site.photos.hero.src;

  function click(e: React.MouseEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * W0);
    const y = Math.round(((e.clientY - r.top) / r.height) * H0);
    setPts((p) => [...p, [x, y]]);
  }
  const mask = (url: string | null | undefined, color: string): React.CSSProperties =>
    url ? { background: color, maskImage: `url("${url}")`, WebkitMaskImage: `url("${url}")`, maskSize: "100% 100%", WebkitMaskSize: "100% 100%" } : {};

  return (
    <div className="fixed inset-0 z-[100] overflow-auto bg-[#0b0d1a] p-4 font-mono text-[12px] text-linen">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <strong className="mr-2">?calibrate</strong>
        {(Object.keys(show) as (keyof typeof show)[]).map((k) => (
          <button key={k} onClick={() => setShow((s) => ({ ...s, [k]: !s[k] }))} className={`rounded px-2 py-1 ${show[k] ? "bg-amber text-ink" : "bg-white/10"}`}>
            {k}
          </button>
        ))}
        <span className="ml-3 opacity-60">
          photo px {W0}×{H0} · masks {masks ? (masks.ok ? "computed" : "unavailable (CORS)") : "…"}
        </span>
        <button onClick={() => setPts([])} className="ml-auto rounded bg-white/10 px-2 py-1">
          clear points
        </button>
      </div>
      <div className="relative w-full max-w-[1600px]" style={{ aspectRatio: `${W0} / ${H0}` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt="" crossOrigin="anonymous" className="absolute inset-0 h-full w-full" />
        {!custom && show.sky ? <div className="absolute inset-0 opacity-60" style={mask(masks?.sky, "#ff2d6f")} /> : null}
        {!custom && show.cloud ? <div className="absolute inset-0 opacity-70" style={mask(masks?.cloud, "#2dd4ff")} /> : null}
        <svg viewBox={`0 0 ${W0} ${H0}`} className="absolute inset-0 h-full w-full cursor-crosshair" onClick={click}>
          {show.grid
            ? Array.from({ length: 24 }, (_, i) => (
                <g key={i} opacity="0.35">
                  <line x1={i * 100} y1="0" x2={i * 100} y2={H0} stroke="#fff" strokeWidth="1" />
                  {i < 16 ? <line x1="0" y1={i * 100} x2={W0} y2={i * 100} stroke="#fff" strokeWidth="1" /> : null}
                  <text x={i * 100 + 4} y="22" fill="#fff" fontSize="18">
                    {i * 100}
                  </text>
                </g>
              ))
            : null}
          {show.calib && !custom ? (
            <g>
              <polyline points={H.skyline.map((p) => p.join(",")).join(" ")} fill="none" stroke="#ffe14d" strokeWidth="3" />
              {H.windows.map((w, i) =>
                w.panes.map((p, k) => (
                  <g key={`${w.id}${k}`}>
                    <rect x={p[0]} y={p[1]} width={p[2]} height={p[3]} fill="rgba(0,255,200,0.25)" stroke="#00ffc8" strokeWidth="2" />
                    {k === 0 ? (
                      <text x={p[0]} y={p[1] - 6} fill="#00ffc8" fontSize="20">
                        {i + 1}
                      </text>
                    ) : null}
                  </g>
                )),
              )}
              {H.lamps.map((l, i) => (
                <circle key={i} cx={l.at[0]} cy={l.at[1]} r="10" fill="none" stroke="#ff9f1c" strokeWidth="4" />
              ))}
              <line x1={H.sun.from[0]} y1={H.sun.from[1]} x2={H.sun.to[0]} y2={H.sun.to[1]} stroke="#ffcc00" strokeWidth="3" strokeDasharray="10 8" />
              <circle cx={H.sun.to[0]} cy={H.sun.to[1]} r={H.sun.r} fill="none" stroke="#ffcc00" strokeWidth="3" />
              <line x1={H.path.door[0]} y1={H.path.door[1]} x2={H.path.near[0]} y2={H.path.near[1]} stroke="#ff6bd6" strokeWidth="3" />
              {STOPS.map((s) => (
                <g key={s.label}>
                  <circle cx={s.focus.d[0]} cy={s.focus.d[1]} r="14" fill="none" stroke="#fff" strokeWidth="3" />
                  <circle cx={s.focus.m[0]} cy={s.focus.m[1]} r="8" fill="#fff" opacity="0.6" />
                  <text x={s.focus.d[0] + 18} y={s.focus.d[1] + 6} fill="#fff" fontSize="20">
                    {s.time} {s.label} ×{s.focus.d[2]}
                  </text>
                </g>
              ))}
            </g>
          ) : null}
          {pts.map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="7" fill="#ff2d6f" />
              <text x={x + 10} y={y - 8} fill="#ff2d6f" fontSize="20">
                {i + 1}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <pre className="mt-3 whitespace-pre-wrap rounded bg-white/5 p-3">{pts.length ? JSON.stringify(pts) : "Click the photo to collect points (photo pixels)."}</pre>
    </div>
  );
}
