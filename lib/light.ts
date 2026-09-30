// The light on the barn as a function of the clock. Everything after the afternoon is
// keyed to minutes from that day's sunset, so a different town (or a December date)
// relights itself. Values are layer opacities, except `windows` and `bulbs` (how many
// are on) and `sunT` (how far along its track the sun is).

import { site } from "./site";

export const WINDOW_COUNT = site.hero.windows.length;
export const BULB_COUNT = 11;

export const LIGHT_KEYS = [
  "golden", "backlit", "dusk", "blue", "winter", "morning", "cool", "skyPlate", "night", "ground",
  "facadeWarm", "facadeCool",
  "skyDay", "skyPeach", "skyRose", "skyGlow", "skyBlue", "skyDeep", "skyMorning", "skyWinter",
  "cloudPeach", "cloudRose", "cloudLit", "cloudNight",
  "sun", "sunT", "sunBloom", "rim", "rimLight", "morningSun",
  "windows", "sconces", "bulbs", "spill", "sparklers", "dew", "mist", "frost", "grain",
] as const;
export type LightKey = (typeof LIGHT_KEYS)[number];
export type Light = Record<LightKey, number>;

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Piecewise curve through [x, y] keys, eased between keys, held flat outside them. */
function curve(keys: [number, number][], x: number) {
  if (x <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [x1, y1] = keys[i];
    if (x <= x1) {
      const [x0, y0] = keys[i - 1];
      return y0 + (y1 - y0) * smooth((x - x0) / (x1 - x0));
    }
  }
  return keys[keys.length - 1][1];
}

/** Straight-line interpolation through [x, y] keys (for motion that shouldn't pause at keys). */
function linear(keys: [number, number][], x: number) {
  if (x <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [x1, y1] = keys[i];
    if (x <= x1) {
      const [x0, y0] = keys[i - 1];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return keys[keys.length - 1][1];
}

/** `dt` is minutes after sunset (negative before it). */
export function lightAt(dt: number): Light {
  const N = WINDOW_COUNT;
  return {
    // The afternoon warms from the first stop on, so 6:30 already looks later in the day.
    golden: curve([[-340, 0], [-300, 0.08], [-200, 0.18], [-150, 0.32], [-110, 0.42], [-70, 0.3], [-30, 0.08], [0, 0]], dt),
    // From an hour before sunset the sun is behind the barn: the facade falls into its own
    // shade (darker, cooler) while the sky stays bright behind it.
    backlit: curve([[-115, 0], [-65, 0.85], [-25, 1], [2, 0.9], [16, 0]], dt),
    cool: curve([[-100, 0], [-50, 0.5], [-10, 0.6], [12, 0]], dt),
    skyPlate: curve([[-115, 0], [-65, 1], [-4, 1], [14, 0]], dt),
    dusk: curve([[-30, 0], [-6, 0.75], [8, 1], [30, 0]], dt),
    blue: curve([[0, 0], [18, 0.75], [30, 1]], dt),
    winter: 0,
    morning: 0,
    night: curve([[4, 0], [22, 0.5], [32, 0.78], [50, 1]], dt),
    // The lawn goes into shade first, then the building.
    ground: curve([[-75, 0], [-35, 0.34], [0, 0.46], [10, 0.5], [40, 0.9], [52, 1]], dt),
    // The shaded facade takes the sky's colour: warm rose while the clouds are peach, then
    // lavender once the sun is down behind the ridge.
    facadeWarm: curve([[-95, 0], [-60, 0.3], [-28, 0.32], [-6, 0]], dt),
    facadeCool: curve([[-34, 0], [-8, 0.34], [10, 0.34], [26, 0]], dt),
    // Afternoon: the blue deepens overhead as the sun drops.
    skyDay: curve([[-340, 0], [-280, 0.25], [-160, 0.55], [-100, 0.6], [-60, 0.3], [-30, 0]], dt),
    // Golden hour: clear blue overhead, gold on the horizon ...
    skyPeach: curve([[-125, 0], [-82, 0.72], [-55, 1], [-38, 0.85], [-14, 0]], dt),
    // ... then rose and violet as the sun reaches the ridge.
    skyRose: curve([[-50, 0], [-24, 1], [0, 0.9], [16, 0]], dt),
    skyGlow: curve([[-16, 0], [0, 0.72], [10, 0.7], [30, 0]], dt),
    // Painted skies stay translucent so the photo's own clouds read through.
    skyBlue: curve([[4, 0], [20, 0.62], [30, 0.72]], dt),
    skyDeep: curve([[24, 0], [52, 0.66]], dt),
    skyMorning: 0,
    // The clouds themselves: peach first, then rose, then lit from underneath at sunset.
    cloudPeach: curve([[-100, 0], [-76, 0.4], [-52, 0.85], [-36, 0.75], [-22, 0]], dt),
    cloudRose: curve([[-48, 0], [-25, 0.95], [2, 0.85], [16, 0]], dt),
    cloudLit: curve([[-20, 0], [-4, 0.8], [6, 0.6], [18, 0]], dt),
    // After sunset the clouds go dark against a sky that is still glowing.
    cloudNight: curve([[0, 0], [14, 0.62], [30, 0.58], [52, 0.62]], dt),
    sun: curve([[-170, 0], [-115, 1], [8, 1], [13, 0]], dt),
    // Along its track at a steady pace: 1 is the minute of sunset, half behind the roofline.
    sunT: linear([[-170, 0], [0, 1], [14, 1.18]], dt),
    // The glare around a low sun, which spills over the ridge instead of stopping at it.
    sunBloom: curve([[-150, 0], [-90, 0.55], [-40, 0.85], [0, 1], [10, 0.5], [18, 0]], dt),
    rim: curve([[-26, 0], [0, 1], [12, 0.6], [28, 0]], dt),
    // A thin line of sun catching the top of the cupola while the sun sits right behind it.
    rimLight: curve([[-40, 0], [-12, 0.35], [-2, 0.35], [8, 0]], dt),
    morningSun: 0,
    skyWinter: 0,
    windows: curve([[1, 0], [28, N]], dt),
    sconces: curve([[9, 0], [17, 1]], dt),
    bulbs: curve([[11, 0], [27, BULB_COUNT]], dt),
    spill: curve([[2, 0], [30, 1]], dt),
    sparklers: curve([[37, 0], [45, 1]], dt),
    dew: 0,
    mist: 0,
    frost: 0,
    grain: curve([[0, 0], [30, 1]], dt),
  };
}

export type Preset = "firstDance" | "friday" | "morning" | "winter";

export function preset(name: Preset): Light {
  switch (name) {
    case "firstDance":
      return lightAt(30);
    case "friday":
      return { ...lightAt(25), sparklers: 0 };
    case "morning": {
      // 10:30 am: low, warm light from behind the camera's left, dew on the lawn, a pale
      // warm horizon. Softer and warmer than the midday photo.
      const zero = Object.fromEntries(LIGHT_KEYS.map((k) => [k, 0])) as Light;
      return { ...zero, morning: 1, skyMorning: 1, morningSun: 1, dew: 1 };
    }
    case "winter": {
      // 22 minutes after a December sunset is civil twilight: a colder, brighter sky than a
      // June blue hour, frost on the grass, mist in the tree line, every window lit.
      const zero = Object.fromEntries(LIGHT_KEYS.map((k) => [k, 0])) as Light;
      return {
        ...zero,
        winter: 1,
        night: 0.3,
        ground: 0.55,
        skyWinter: 1,
        cloudNight: 0.12,
        frost: 1,
        mist: 1,
        windows: WINDOW_COUNT,
        sconces: 1,
        bulbs: BULB_COUNT,
        spill: 1,
        grain: 0.7,
      };
    }
  }
}
