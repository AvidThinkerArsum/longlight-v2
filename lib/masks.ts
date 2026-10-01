"use client";

// Masks computed once, from the hero photo itself, in a worker so the page never stalls:
//  - sky:   bright, un-green pixels above the calibrated skyline (holds tints and the sun)
//  - cloud: the whitest of those (turns peach, then rose, then slate)
//  - panes: each window's own glass, recoloured as lamplight, so frames and mullions stay dark
// Shared by every stage on the page. If the photo can't be read (no CORS, no worker or
// OffscreenCanvas), the sky layers switch off and the windows fall back to a plain warm fill.

import { useEffect, useState } from "react";
import { site } from "./site";

/** One pane's glow: a region of the shared atlas, in CSS px at the atlas's 1x size. */
export type PaneSprite = { url: string; x: number; y: number; w: number; h: number; aw: number; ah: number };

export type Masks = {
  sky: string | null;
  cloud: string | null;
  panes: Record<string, PaneSprite[]>;
  ok: boolean;
};

let cache: Promise<Masks> | null = null;
let resolved: Masks | null = null;

// Plain JS, run in a worker created from this string (no bundler involvement).
const WORKER = String.raw`
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function skylineAt(x, pts) {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    if (x <= x1) { const [x0, y0] = pts[i - 1]; return x1 === x0 ? Math.min(y0, y1) : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0); }
  }
  return pts[pts.length - 1][1];
}
// separable min filter of a one-channel buffer, in place (shrinks the bright region by r)
function erode(a, w, h, r) {
  const tmp = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let m = 255;
    for (let k = Math.max(0, x - r), e = Math.min(w - 1, x + r); k <= e; k++) { const v = a[y * w + k]; if (v < m) m = v; }
    tmp[y * w + x] = m;
  }
  for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) {
    let m = 255;
    for (let k = Math.max(0, y - r), e = Math.min(h - 1, y + r); k <= e; k++) { const v = tmp[k * w + x]; if (v < m) m = v; }
    a[y * w + x] = m;
  }
}
// separable box blur of an RGBA buffer's alpha, in place
function blurAlpha(d, w, h, r) {
  const tmp = new Float32Array(w * h), n = 2 * r + 1;
  for (let y = 0; y < h; y++) {
    let acc = 0;
    for (let x = -r; x <= r; x++) acc += d[(y * w + Math.min(w - 1, Math.max(0, x))) * 4 + 3];
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = acc / n;
      acc += d[(y * w + Math.min(w - 1, x + r + 1)) * 4 + 3] - d[(y * w + Math.max(0, x - r)) * 4 + 3];
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let y = -r; y <= r; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) {
      d[(y * w + x) * 4 + 3] = Math.round(acc / n);
      acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
    }
  }
}
// Lamplight through one pane: a lit room seen through glass, brighter at the top (the
// lamp) and warmer toward the sill. The glass's own daytime texture is kept only as a faint
// grain (softened first), so the pane reads as a lit room rather than a tinted photo of the
// garden; anything much darker than the glass around it (a muntin, a latch) stays dark.
function paneGlow(g, x, y, w, h) {
  const SC = 2, d = g.getImageData(x, y, w, h).data, lum = new Float32Array(w * h);
  for (let i = 0, k = 0; i < d.length; i += 4, k++) lum[k] = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
  const sorted = Array.from(lum).sort((a, b) => a - b);
  const lo = sorted[Math.floor(sorted.length * 0.08)], hi = sorted[Math.floor(sorted.length * 0.95)], med = sorted[Math.floor(sorted.length * 0.5)];
  // a 3x3 box blur of the texture (the muntin test below uses the sharp values)
  const soft = new Float32Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let acc = 0, n = 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const jj = j + dj, ii = i + di;
      if (jj >= 0 && jj < h && ii >= 0 && ii < w) { acc += lum[jj * w + ii]; n++; }
    }
    soft[j * w + i] = acc / n;
  }
  const small = new OffscreenCanvas(w, h), sg = small.getContext("2d", { willReadFrequently: true }), img = sg.createImageData(w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k = j * w + i, t = Math.min(1, Math.max(0, (soft[k] - lo) / (hi - lo || 1)));
    const up = 1 - j / Math.max(1, h - 1); // 1 at the top of the pane, 0 at the sill
    const edge = Math.min(i, w - 1 - i) / Math.max(1, w / 2); // 0 at the frame, 1 mid-pane
    const v = 0.8 + 0.08 * t + 0.14 * up - 0.06 * (1 - Math.min(1, edge * 2.2));
    img.data[k * 4] = Math.min(255, 255 * Math.min(1, v * 1.16));
    img.data[k * 4 + 1] = Math.min(255, (178 + 40 * up) * v + 8 * t);
    img.data[k * 4 + 2] = Math.min(255, (86 + 54 * up * up) * v + 6 * t);
    img.data[k * 4 + 3] = lum[k] < med - 28 ? 140 : 255;
  }
  sg.putImageData(img, 0, 0);
  return small;
}
self.onmessage = async (e) => {
  const { src, bitmap, W0, H0, skyline, hasSky, clouds, windows } = e.data;
  try {
    // The page hands over the photo it already decoded; fetch it only as a fallback.
    const bmp = bitmap || (await createImageBitmap(await (await fetch(src, { mode: "cors" })).blob()));
    const full = new OffscreenCanvas(W0, H0), fg = full.getContext("2d", { willReadFrequently: true });
    fg.drawImage(bmp, 0, 0, W0, H0);
    let sky = null, cloud = null;
    if (hasSky) {
      const top = Math.ceil(Math.max(...skyline.map((p) => p[1])));
      const px = fg.getImageData(0, 0, W0, top).data;
      // sky, at full resolution, so the tint meets the roofline with no halo
      const skyImg = new ImageData(W0, top), sd = skyImg.data, alpha = new Uint8Array(W0 * top);
      for (let x = 0; x < W0; x++) {
        const line = skylineAt(x, skyline), yMax = Math.min(top, Math.ceil(line));
        for (let y = 0; y < yMax; y++) {
          const i = (y * W0 + x) * 4, r = px[i], g = px[i + 1], b = px[i + 2];
          const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          // bright and not green; very bright pixels (cloud tops) pass whatever their tint
          alpha[y * W0 + x] = Math.round(ss(112, 160, L) * Math.max(ss(-14, 2, b - g), ss(178, 200, L)) * ss(3, 7, line - y) * 255);
        }
      }
      // Pull the sky back from every edge by two pixels (a 5x5 min filter): the photo's
      // half-sky, half-roof pixels would otherwise show un-graded, as a pale outline.
      erode(alpha, W0, top, 2);
      for (let k = 0; k < alpha.length; k++) { sd[k * 4] = sd[k * 4 + 1] = sd[k * 4 + 2] = 255; sd[k * 4 + 3] = alpha[k]; }
      // clouds, at half resolution and softened (they're all interior). In an overcast sky
      // the clouds are its brighter streaks, between the two calibrated luminances.
      const w = W0 / 2, h = Math.ceil(top / 2), cloudImg = new ImageData(w, h), cd = cloudImg.data;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = (2 * y * W0 + 2 * x) * 4, r = px[i], g = px[i + 1], b = px[i + 2];
        const L = 0.2126 * r + 0.7152 * g + 0.0722 * b, mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx ? (mx - mn) / mx : 0;
        const o = (y * w + x) * 4;
        cd[o] = cd[o + 1] = cd[o + 2] = 255;
        cd[o + 3] = Math.round((clouds ? ss(clouds[0], clouds[1], L) : ss(0.2, 0.04, sat) * ss(150, 215, L)) * 255);
      }
      blurAlpha(cd, w, h, clouds ? 4 : 2);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const o = (y * w + x) * 4;
        cd[o + 3] = Math.round((cd[o + 3] * alpha[Math.min(top - 1, 2 * y) * W0 + 2 * x]) / 255);
      }
      // masks are the whole photo's size; below the skyline they are simply empty
      // software canvases (willReadFrequently): encoding them never waits on a busy GPU
      const sc = new OffscreenCanvas(W0, H0); sc.getContext("2d", { willReadFrequently: true }).putImageData(skyImg, 0, 0);
      const cc = new OffscreenCanvas(w, H0 / 2); cc.getContext("2d", { willReadFrequently: true }).putImageData(cloudImg, 0, 0);
      [sky, cloud] = await Promise.all([sc.convertToBlob({ type: "image/png" }), cc.convertToBlob({ type: "image/png" })]);
    }
    // Every pane's glow goes into one atlas (a single PNG), upscaled 2x so it stays soft.
    const SC = 2, GAP = 2, all = [];
    for (const win of windows) for (const p of win.panes) all.push({ id: win.id, p });
    const AW = all.reduce((a, { p }) => a + p[2] * SC + GAP, 0), AH = Math.max(...all.map(({ p }) => p[3])) * SC;
    const atlas = new OffscreenCanvas(Math.max(1, AW), Math.max(1, AH)), ag = atlas.getContext("2d", { willReadFrequently: true });
    ag.imageSmoothingEnabled = true; ag.imageSmoothingQuality = "high";
    const panes = {};
    let ax = 0;
    for (const { id, p } of all) {
      ag.drawImage(paneGlow(fg, p[0], p[1], p[2], p[3]), ax, 0, p[2] * SC, p[3] * SC);
      (panes[id] ||= []).push([ax / SC, 0, p[2], p[3]]);
      ax += p[2] * SC + GAP;
    }
    const atlasBlob = await atlas.convertToBlob({ type: "image/png" });
    self.postMessage({ ok: true, sky, cloud, atlas: atlasBlob, atlasSize: [AW / SC, AH / SC], panes });
  } catch (err) {
    self.postMessage({ ok: false, error: String(err) });
  }
};
`;

type Reply =
  | { ok: true; sky: Blob | null; cloud: Blob | null; atlas: Blob; atlasSize: [number, number]; panes: Record<string, [number, number, number, number][]> }
  | { ok: false; error: string };

/** The hero photo, decoded once on the page (it is usually already in the image cache). */
async function heroBitmap(src: string): Promise<ImageBitmap | null> {
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.src = src;
    await img.decode();
    return await createImageBitmap(img);
  } catch {
    return null;
  }
}

function compute(): Promise<Masks> {
  const off: Masks = { sky: null, cloud: null, panes: {}, ok: false };
  if (typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined") return Promise.resolve(off);
  return new Promise((resolve) => {
    const H = site.hero;
    const src = new URL(site.photos.hero.src, window.location.href).href;
    const url = URL.createObjectURL(new Blob([WORKER], { type: "text/javascript" }));
    const worker = new Worker(url);
    performance.mark("longlight:masks-start");
    let settled = false;
    const done = (m: Masks) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      performance.measure("longlight:masks", "longlight:masks-start");
      resolve(m);
    };
    // Never wait forever: without masks the sky layers stay off and the windows use a plain
    // warm fill. (It normally takes well under a second; the limit is generous so a busy
    // phone still gets its sky.)
    const timer = setTimeout(() => done(off), 90000);
    worker.onerror = () => done(off);
    worker.onmessage = (e: MessageEvent<Reply>) => {
      const r = e.data;
      if (!r.ok) return done(off);
      const obj = (b: Blob | null) => (b ? URL.createObjectURL(b) : null);
      const atlas = URL.createObjectURL(r.atlas);
      const [aw, ah] = r.atlasSize;
      const panes: Record<string, PaneSprite[]> = {};
      for (const [id, rects] of Object.entries(r.panes)) panes[id] = rects.map(([x, y, w, h]) => ({ url: atlas, x, y, w, h, aw, ah }));
      done({ sky: obj(r.sky), cloud: obj(r.cloud), panes, ok: true });
    };
    heroBitmap(src).then((bitmap) => {
      const msg = {
        src,
        bitmap,
        W0: H.size.w,
        H0: H.size.h,
        skyline: H.skyline,
        hasSky: H.hasSky,
        clouds: "overcast" in H ? H.overcast.clouds : null,
        windows: H.windows.map((w) => ({ id: w.id, panes: w.panes })),
      };
      worker.postMessage(msg, bitmap ? [bitmap] : []);
    });
  });
}

export function getMasks() {
  if (!cache) cache = compute().then((m) => (resolved = m));
  return cache;
}

export function useMasks() {
  const [m, setM] = useState<Masks | null>(resolved);
  useEffect(() => {
    let live = true;
    getMasks().then((r) => live && setM(r));
    return () => {
      live = false;
    };
  }, []);
  return m;
}
