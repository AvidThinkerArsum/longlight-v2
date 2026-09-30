import { site, type Focus } from "./site";

const W0 = site.hero.size.w;
const H0 = site.hero.size.h;

/**
 * Cover-plus-camera: scale the photo to cover the viewport, zoom about a focal point,
 * put that point at `target` (fractions of the viewport), and never let an edge show.
 */
export function cameraTransform(vw: number, vh: number, [fx, fy, z]: Focus, target: [number, number] = [0.5, 0.5]) {
  const c = Math.max(vw / W0, vh / H0);
  const s = c * Math.max(1, z);
  let x = vw * target[0] - fx * s;
  let y = vh * target[1] - fy * s;
  x = Math.min(0, Math.max(vw - W0 * s, x));
  y = Math.min(0, Math.max(vh - H0 * s, y));
  return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100, scale: Math.round(s * 10000) / 10000 };
}
