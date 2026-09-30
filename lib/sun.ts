// Sunset from the NOAA solar calculator (gml.noaa.gov/grad/solcalc), accurate to about
// a minute between ±72° latitude. Pure math: the same on the server and in the browser.

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

function julianDay(y: number, m: number, d: number) {
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

function solar(t: number) {
  const L0 = (((280.46646 + t * (36000.76983 + t * 0.0003032)) % 360) + 360) % 360;
  const M = 357.52911 + t * (35999.05029 - 0.0001537 * t);
  const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
  const C =
    Math.sin(rad(M)) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(rad(2 * M)) * (0.019993 - 0.000101 * t) +
    Math.sin(rad(3 * M)) * 0.000289;
  const omega = 125.04 - 1934.136 * t;
  const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(rad(omega));
  const seconds = 21.448 - t * (46.815 + t * (0.00059 - t * 0.001813));
  const eps = 23 + (26 + seconds / 60) / 60 + 0.00256 * Math.cos(rad(omega));
  const dec = deg(Math.asin(Math.sin(rad(eps)) * Math.sin(rad(lambda))));
  const y = Math.tan(rad(eps) / 2) ** 2;
  const eqTime =
    4 *
    deg(
      y * Math.sin(2 * rad(L0)) -
        2 * e * Math.sin(rad(M)) +
        4 * e * y * Math.sin(rad(M)) * Math.cos(2 * rad(L0)) -
        0.5 * y * y * Math.sin(4 * rad(L0)) -
        1.25 * e * e * Math.sin(2 * rad(M)),
    );
  return { dec, eqTime };
}

function setUTC(jd: number, lat: number, lon: number) {
  const t = (jd - 2451545) / 36525;
  const { dec, eqTime } = solar(t);
  const arg = Math.cos(rad(90.833)) / (Math.cos(rad(lat)) * Math.cos(rad(dec))) - Math.tan(rad(lat)) * Math.tan(rad(dec));
  const ha = -Math.acos(Math.max(-1, Math.min(1, arg)));
  return 720 - 4 * (lon + deg(ha)) - eqTime; // minutes after 0h UTC
}

/** Sunset on a calendar date ("YYYY-MM-DD") at a place, as a UTC instant. */
export function sunsetInstant(date: string, lat: number, lon: number) {
  const [y, m, d] = date.split("-").map(Number);
  const jd = julianDay(y, m, d);
  // A west-coast sunset is past midnight UTC, so iterate once on the refined day fraction.
  let mins = setUTC(jd, lat, lon);
  mins = setUTC(jd + mins / 1440, lat, lon);
  return new Date(Date.UTC(y, m - 1, d) + Math.round(mins) * 60000);
}

/** Minutes after local midnight, and a label like "9:10 pm". */
export function sunset(date: string, lat: number, lon: number, timeZone: string) {
  const at = sunsetInstant(date, lat, lon);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit", hourCycle: "h23" }).formatToParts(at);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return { minutes: h * 60 + m, label: clockLabel(h * 60 + m) };
}

export function clockLabel(minutes: number, withMeridiem = true) {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  const mm = String(m % 60).padStart(2, "0");
  return withMeridiem ? `${h}:${mm} ${h24 < 12 ? "am" : "pm"}` : `${h}:${mm}`;
}
