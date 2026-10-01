// Everything a client changes lives here: who they are, where they are, their photo,
// their prices, their run of show, and the hero calibration (in photo pixels).
// Change `town` (and its lat/lon/timeZone) and every mention and every sunset follows.

const pexels = (id: string, w = 2400) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

/** "22:30" -> "10:30" (or "10:30 pm"); for copy only. */
function clock(hhmm: string, meridiem = false) {
  const [h24, m] = hhmm.split(":").map(Number);
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  const hm = m ? `${h}:${String(m).padStart(2, "0")}` : `${h}`;
  return meridiem ? `${hm} ${h24 < 12 ? "am" : "pm"}` : hm;
}

export type Rect = [x: number, y: number, w: number, h: number];
export type Pt = [x: number, y: number];
/** A camera stop: focal point in photo pixels, and zoom over "cover" (1 = the whole photo). */
export type Focus = [x: number, y: number, zoom: number];
/** A clock time: "HH:MM" (24h), or minutes relative to that day's sunset. */
export type ClockTime = string | { sunset: number };

/**
 * A stock frame for the hero's scenes: a Pexels photo, or a Pexels clip's poster frame.
 * `src(w)` asks Pexels for a copy `w` pixels wide; `page` is where the credit links.
 */
export type Still = { id: string; by: string; alt: string; w: number; h: number; src: (w: number) => string; page: string };
/** A scene camera: focal point as fractions of the frame (0–1), and zoom over "cover". */
export type Cam = [fx: number, fy: number, zoom: number];
/**
 * One shot of a scene. The camera drifts from the first `d`/`m` to the second over the shot
 * (a slow Ken Burns). `clip` plays muted over the still on desktop only; `phone` swaps in
 * a different still on phones (a portrait frame, say), framed by `m`. `cut` is where the
 * shot takes over within its stop, in stops from the stop itself (negative: before it).
 */
export type Shot = { still: Still; clip?: string; phone?: Still; d: [Cam, Cam]; m: [Cam, Cam]; cut?: number };
/**
 * How the camera gets to a scene from the stop before it: pushes in, drops down, pulls
 * wide, drifts forward, slides across, glides through doors, comes in low, eases down.
 */
export type Move = "push" | "drop" | "wide" | "drift" | "slide" | "glide" | "low" | "ease";
/** How the camera comes back to the barn from a scene: rising over it, or pulling back. */
export type Back = "rise" | "pull";
export type Scene = { move: Move; shots: Shot[] };

const photo = (id: string, by: string, alt: string, w = 2400, h = 1600): Still => ({
  id,
  by,
  alt,
  w,
  h,
  src: (px: number) => pexels(id, px),
  page: `https://www.pexels.com/photo/${id}/`,
});
/** A Pexels clip's poster frame (1920 × 1080), named by the slug Pexels gives it. */
const poster = (id: string, slug: string, by: string, alt: string): Still => ({
  id,
  by,
  alt,
  w: 1920,
  h: 1080,
  src: (px: number) => `https://images.pexels.com/videos/${id}/${slug}.jpeg?auto=compress&cs=tinysrgb&w=${Math.min(px, 1920)}`,
  page: `https://www.pexels.com/video/${id}/`,
});
/** A Pexels clip file (the 1280 × 720 renditions: 1.4 to 2 MB each). */
const clipFile = (id: string, file: string) => `https://videos.pexels.com/video-files/${id}/${file}`;

/** Guest limits and prices; referenced by the copy below so the numbers never disagree. */
const pricing = {
  /** Which months (1–12) each season covers. */
  seasons: { peak: [6, 7, 8, 9], shoulder: [4, 5, 10], winter: [11, 12, 1, 2, 3] },
  peak: { fri: 9800, sat: 14500, sun: 7400 },
  shoulder: { fri: 8200, sat: 11800, sun: 6600 },
  winter: { fri: 5900, sat: 6900, sun: 5400 },
  weekday: 2400,
  includedGuests: 100,
  perGuest: 36,
  maxGuests: 200,
  minGuests: 40,
  cleaning: 650,
  attendant: 180,
  guestsPerAttendant: 60,
  security: 420,
  securityOver: 150,
};
/**
 * The venue's day: rooms open, music curfew, lights up, lane empty. "HH:MM", 24h. Every
 * "from 10 am", "10 am to 11 pm" and "yours from" on the page reads from here.
 */
const hours = { start: "10:00", musicEnds: "22:30", lightsUp: "22:45", end: "23:00" };
/** Evening tours: which nights, what time, how long. */
const tour = { nights: ["Tuesday", "Wednesday", "Thursday"], at: "19:30", minutes: 40 };
const parking = { cars: 90, overflow: 60, overflowMonths: "July to September", shuttleMinutes: 9 };
const ownersShort = "Maren and Tom";
const town = "Woodinville";

export const site = {
  name: "Longlight",
  kind: "A barn and five acres",
  town,
  state: "WA",
  lat: 47.7543,
  lon: -122.1635,
  timeZone: "America/Los_Angeles",
  address: "18400 NE Longlight Lane",
  phone: "(425) 555-0148",
  email: "hello@longlight.example",
  owners: "Maren & Tom Ekholm",
  ownersShort,

  /** Shows the "Unofficial concept" banner and tags every figure and claim "sample". */
  showConceptBanner: false,
  /**
   * True only for the Longlight demo, which is an invented venue. Set it to false when
   * the name above is a real business: the footer stops calling it fictional, and the
   * stock owner portrait gives way to a "your photo here" placeholder.
   */
  fictional: true,

  /** The Saturday the hero is set on: the featured couple's date, and the estimate's opening date. */
  featuredDate: "2027-06-19",
  /** The featured couple's head count: the hero intro and the estimate's opening guest count. */
  featuredGuests: 120,
  /** The sample couple whose day the hero follows (placeholders; never the owners). Always tagged "sample". */
  couple: "Ava & Daniel",
  /** The winter date quoted in "The other six days". */
  winterDate: "2027-12-18",

  photos: {
    hero: {
      id: "29781785",
      src: pexels("29781785"),
      alt: "The front of a modern white board-and-batten barn: a glass gable end of twelve black-framed windows, a white sliding door on a black rail, black doors and lanterns, and steps up a striped lawn",
      by: "Steven Van Elk",
    },
    lawn: { id: "18032331", src: pexels("18032331", 1600), alt: "Rows of wooden benches on the lawn facing the barn's white doors", by: "Steven Van Elk" },
    hall: { id: "13788574", src: pexels("13788574", 1600), alt: "Round dinner tables set under timber posts, a gallery and strings of bulbs inside the barn", by: "Rene Terp" },
    terrace: { id: "35870516", src: pexels("35870516", 1600), alt: "White folding chairs on the lawn beside the barn at sunset, with bulbs strung toward the fields", by: "Taylor Thompson" },
    loft: { id: "37713508", src: pexels("37713508", 1600), alt: "A wedding dress hanging by a tall mullioned window in a bright room", by: "Alexander Mass" },
    orchard: { id: "7143718", src: pexels("7143718", 1600), alt: "A table laid with fruit under apple trees heavy with apples, on a sunny lawn", by: "Mariam Gab" },
    owners: { id: "7728690", src: pexels("7728690", 1600), alt: "Two smiling owners standing together in a field on a spring day", by: "Greta Hoffman" },
    /** "Walk the grounds": the wide views, shown large, with the close-ups above as insets. */
    orchardWide: { id: "32343728", src: pexels("32343728", 1920), alt: "From the air: diagonal rows of young green orchard trees casting long shadows across the grass", by: "Nikola Tomasic" },
    hallWide: {
      id: "34580061",
      src: pexels("34580061", 1920),
      alt: "A wide white barn hall under white trusses and chandeliers, with black-framed windows and French doors, round tables full of guests watching a first dance",
      by: "Taylor Thompson",
    },
    aerial: { id: "10421037", src: pexels("10421037", 1600), alt: "From the air at golden hour: a white barn with a metal roof among green fields and tree lines", by: "Tom Fisk" },
  },

  /**
   * Hero calibration, in pixels of the 2400 × 1600 hero photo. Click new points out
   * with /?calibrate on any photo.
   */
  hero: {
    size: { w: 2400, h: 1600 },
    hasSky: true,
    /**
     * An overcast photo: its sky is painted clear by day (`skyClear` in the light), and its
     * clouds are the brighter streaks of the overcast, between these two luminances.
     */
    overcast: { clouds: [231, 239] as [number, number] },
    /** A light grade on the photo itself (this one was shot in November: a little more summer). */
    grade: "saturate(1.14) contrast(1.04)",
    /** Runs along the top of the roof's dark edge; only bright pixels above it count as sky. */
    skyline: [
      [0, 1000], [27, 1004], [178, 969], [632, 966], [872, 894], [873, 844], [1070, 568], [1287, 461],
      [1508, 562], [1715, 838], [1716, 889], [2031, 979], [2240, 976], [2306, 1030], [2340, 1040], [2400, 1030],
    ] as Pt[],
    /** Window glass, in the order the lights come on. Each window may have several panes. */
    windows: [
      { id: "west-door", panes: [[957, 1048, 42, 52], [957, 1106, 42, 44]] as Rect[] },
      { id: "east-door", panes: [[1589, 1045, 47, 53], [1589, 1107, 47, 43]] as Rect[] },
      { id: "gable-low-mid", panes: [[1215, 839, 63, 93], [1306, 838, 63, 93]] as Rect[] },
      { id: "west-windows", panes: [[706, 1043, 59, 92], [777, 1043, 58, 92]] as Rect[] },
      { id: "east-windows", panes: [[1758, 1037, 60, 96], [1830, 1037, 62, 96]] as Rect[] },
      { id: "gable-low-west", panes: [[1016, 840, 64, 92], [1115, 839, 63, 93]] as Rect[] },
      { id: "gable-low-east", panes: [[1406, 838, 63, 93], [1505, 837, 63, 93]] as Rect[] },
      { id: "gable-mid", panes: [[1214, 719, 63, 90], [1304, 718, 63, 91]] as Rect[] },
      { id: "gable-mid-west", panes: [[1115, 719, 63, 91]] as Rect[] },
      { id: "gable-mid-east", panes: [[1404, 718, 63, 91]] as Rect[] },
      { id: "loft", panes: [[1214, 626, 62, 61], [1302, 625, 63, 62]] as Rect[] },
      { id: "west-wing", panes: [[320, 1060, 54, 64], [488, 1060, 53, 80]] as Rect[] },
    ],
    /** Lanterns either side of the big door: where the glass is, and how far the wash falls. */
    lamps: [
      { at: [1031, 1050] as Pt, reach: 130 },
      { at: [1562, 1048] as Pt, reach: 130 },
    ],
    /**
     * Where the doors throw light onto the path, and where the send-off lines up. `horizon`
     * is the camera's eye level (y), which sets the perspective of the sparkler lines.
     */
    path: { door: [1292, 1160] as Pt, near: [1302, 1596] as Pt, horizon: 1150 },
    /**
     * The sun's track through golden hour: `from` about two and a half hours before sunset,
     * `to` at the minute of sunset (half behind the peak of the roof). It keeps going past `to`.
     */
    sun: { from: [1470, 250] as Pt, to: [1290, 482] as Pt, r: 32 },
    /** Camera stops (desktop, phone). */
    focus: {
      // (desktop: the barn sits right of centre, clear of the headline)
      landing: { d: [980, 760, 1.12] as Focus, m: [1290, 820, 1] as Focus },
      // (phones: tilted up, so the close sits in the sky above the strand of bulbs)
      close: { d: [1290, 900, 1.08] as Focus, m: [1290, 520, 1.15] as Focus },
      relit: { d: [1290, 880, 1.22] as Focus, m: [1290, 900, 1.05] as Focus },
    },
  },

  /**
   * The run of show the hero plays, stop by stop: `label` is the caption's heading, `rail`
   * the short name under the timeline, `place` where on the grounds it happens. Times from
   * golden hour on follow the real sunset (on the featured date: 8:20, 9:10, 9:40, 10:00).
   */
  runOfShow: [
    {
      id: "getting-ready",
      at: "13:00" as ClockTime,
      label: "Getting ready",
      rail: "Getting ready",
      place: "Loft suite and tack room",
      line: "The loft suite: north light, a steamer, a full-length mirror and a door that locks. The other side gets the tack room.",
      // the barn camera pushes in to the loft windows, and through them
      focus: { d: [1290, 660, 6] as Focus, m: [1290, 660, 6.5] as Focus },
      scene: {
        move: "push",
        shots: [
          {
            still: photo("18354035", "Stephen Leonardi", "A beaded strapless wedding dress hanging on a plank wall beside a tall many-paned window"),
            d: [[0.45, 0.55, 1.1], [0.48, 0.56, 1.2]],
            m: [[0.52, 0.58, 1.04], [0.52, 0.58, 1.14]],
          },
          {
            // the point-of-view moment: hands on the dress
            still: poster("19742326", "pre-wedding-19742326", "Cinema Vlog", "Over a bride's shoulder as her mother, laughing, fastens the back of her dress by a window"),
            clip: clipFile("19742326", "19742326-hd_1280_720_50fps.mp4"),
            phone: photo("34327733", "Reborn Filmes", "The bride and her bridesmaids in blush robes, laughing and raising their glasses", 2400, 3600),
            d: [[0.5, 0.45, 1.06], [0.5, 0.45, 1.14]],
            m: [[0.52, 0.5, 1.02], [0.52, 0.48, 1.12]],
            cut: 0.1,
          },
          {
            // quick cut to the groom's side
            still: poster("16958794", "pexels-photo-16958794", "Harvey Tan Villarino", "A groom in a white shirt fastening his cuff by a tall window"),
            clip: clipFile("16958794", "16958794-hd_1280_720_50fps.mp4"),
            phone: photo("27691950", "Anastasia Nagibina", "Groomsmen in black tuxedos laughing as they button their jackets"),
            d: [[0.56, 0.5, 1.06], [0.56, 0.5, 1.14]],
            m: [[0.58, 0.5, 1.02], [0.6, 0.5, 1.1]],
            cut: 0.3,
          },
        ],
      } as Scene,
    },
    {
      id: "first-look",
      at: "14:30" as ClockTime,
      label: "First look",
      rail: "First look",
      place: "The orchard",
      line: "At the far end of the orchard rows, out of sight of the lot. One of you waits facing the trees; the other walks up behind.",
      focus: { d: [1290, 660, 6] as Focus, m: [1290, 660, 6.5] as Focus },
      scene: {
        move: "drop",
        shots: [
          {
            still: photo("29237402", "Photography Maghradze PH", "A groom in a navy tuxedo waits, smiling, as the bride walks up behind him through a leafy, sunlit garden"),
            d: [[0.58, 0.44, 1.1], [0.6, 0.42, 1.2]],
            m: [[0.62, 0.45, 1.02], [0.64, 0.42, 1.1]],
          },
          {
            still: photo("7119241", "Pavel Danilyuk", "The couple holding each other in a grassy meadow ringed by fir trees, with a lake behind", 2400, 1602),
            d: [[0.5, 0.5, 1.08], [0.48, 0.52, 1.18]],
            m: [[0.48, 0.55, 1.02], [0.48, 0.55, 1.12]],
            cut: 0.18,
          },
        ],
      } as Scene,
    },
    {
      id: "photos",
      at: "15:00" as ClockTime,
      label: "Wedding party & family photos",
      rail: "Photos",
      place: "Lawn and orchard",
      line: "The wedding party on the lawn, then both families under the trees, with a bench in the shade for the grandparents.",
      focus: { d: [1290, 660, 6] as Focus, m: [1290, 660, 6.5] as Focus },
      scene: {
        move: "wide",
        shots: [
          {
            still: photo("35029571", "Kevin Barillas", "The wedding party lined up on a lawn under big trees: groomsmen in navy vests on one side, bridesmaids in dusty blue on the other"),
            d: [[0.5, 0.56, 1.2], [0.5, 0.56, 1.06]],
            m: [[0.535, 0.58, 1.14], [0.535, 0.58, 1.02]],
          },
          {
            still: photo("6609722", "Juliana Navajas Robb", "Both families gathered around the couple behind a wooden rail, under the trees"),
            d: [[0.5, 0.55, 1.06], [0.48, 0.55, 1.14]],
            m: [[0.45, 0.55, 1.02], [0.45, 0.55, 1.1]],
            cut: 0.18,
          },
        ],
      } as Scene,
    },
    {
      id: "ceremony",
      at: "16:30" as ClockTime,
      label: "Ceremony",
      rail: "Ceremony",
      place: "The front lawn",
      line: "Fir benches down 64 ft of aisle, a string trio by the doors. If it rains, the doors roll open and you marry just inside.",
      focus: { d: [1290, 660, 6] as Focus, m: [1290, 660, 6.5] as Focus },
      scene: {
        move: "drift",
        shots: [
          {
            // the point-of-view moment: the view down the aisle, drifting toward the arch
            still: photo("17206059", "Bertelli Fotografia", "Looking down a long paved aisle between plain wooden benches, lined with flowers, to a floral arch among tall firs"),
            d: [[0.5, 0.62, 1.06], [0.5, 0.5, 1.7]],
            m: [[0.5, 0.6, 1.02], [0.5, 0.5, 1.55]],
          },
          {
            still: photo("18541917", "Douglas Ma", "From behind the seated guests: the couple before the officiant at a floral arch, flowers along the aisle, forested hills behind"),
            d: [[0.5, 0.6, 1.14], [0.51, 0.6, 1.24]],
            m: [[0.5, 0.62, 1.04], [0.5, 0.62, 1.14]],
            cut: -0.12,
          },
        ],
      } as Scene,
    },
    {
      id: "cocktails",
      at: "17:00" as ClockTime,
      label: "Cocktail hour",
      rail: "Cocktails",
      place: "The orchard",
      line: "Drinks under the bulb-strung trees and an acoustic duo. The photos are done, so you two get to be at your own cocktail hour.",
      focus: { d: [1290, 660, 6] as Focus, m: [1290, 660, 6.5] as Focus },
      scene: {
        move: "slide",
        shots: [
          {
            // the wide orchard shot (the same one "Walk the grounds" shows big)
            still: photo("32343728", "Nikola Tomasic", "From the air: diagonal rows of young green orchard trees casting long shadows across the grass"),
            d: [[0.42, 0.5, 1.16], [0.58, 0.5, 1.16]],
            m: [[0.4, 0.5, 1.02], [0.6, 0.5, 1.02]],
          },
          {
            still: photo("26975888", "Hello Josh Withers", "A long candlelit table and wooden chairs on a lawn under big leafy trees, bulbs strung overhead", 2400, 1601),
            d: [[0.5, 0.62, 1.1], [0.5, 0.64, 1.2]],
            m: [[0.5, 0.68, 1.02], [0.52, 0.68, 1.1]],
            cut: 0.2,
          },
        ],
      } as Scene,
    },
    {
      id: "dinner",
      at: "18:30" as ClockTime,
      label: "Dinner beneath the beams",
      rail: "Dinner",
      place: "The hall",
      line: `Dinner for up to ${pricing.maxGuests} under the timber trusses. The big doors stay open until the air cools.`,
      focus: { d: [1290, 660, 6] as Focus, m: [1290, 660, 6.5] as Focus },
      scene: {
        move: "glide",
        shots: [
          {
            still: photo("33524591", "Florence", "Long tables with cross-back chairs and bud vases down a timber barn hall, bulbs strung under the trusses", 2400, 1800),
            d: [[0.48, 0.52, 1.06], [0.5, 0.5, 1.18]],
            m: [[0.42, 0.56, 1.02], [0.44, 0.55, 1.1]],
          },
          {
            // the point-of-view moment: the room turning to toast
            still: photo("5130326", "Rafael Bertacini", "From inside the circle: the laughing couple and their guests reaching their glasses toward the camera"),
            d: [[0.5, 0.74, 1.3], [0.52, 0.75, 1.36]],
            // (phones: down from the bright sky to the faces)
            m: [[0.55, 0.8, 1.45], [0.56, 0.8, 1.55]],
            cut: 0.2,
          },
        ],
      } as Scene,
    },
    {
      id: "golden-hour",
      at: { sunset: -50 } as ClockTime,
      label: "Golden hour, just the two of you",
      rail: "Golden hour",
      place: "The lawn",
      line: "Portraits on the lawn while the clouds go peach, then rose. Nobody has to chase the light.",
      // (barn camera, unseen here: down on the lawn, ready to rise to the ridge for sunset)
      focus: { d: [1290, 1330, 1.8] as Focus, m: [1290, 1330, 1.7] as Focus },
      scene: {
        move: "low",
        shots: [
          {
            still: photo("34580060", "Taylor Thompson", "Just the two of them, small on a wide mown lawn before a golden field under a soft peach sky", 2400, 1532),
            d: [[0.46, 0.56, 1.2], [0.54, 0.58, 1.3]],
            m: [[0.5, 0.6, 1.1], [0.52, 0.6, 1.2]],
          },
        ],
      } as Scene,
    },
    {
      id: "sunset",
      at: { sunset: 0 } as ClockTime,
      label: "Sunset",
      rail: "Sunset",
      place: "Behind the barn",
      line: "Straight down behind the peak of the roof. We move the toasts so everyone turns around in time.",
      // back on the barn: the camera rises off the lawn to the peak
      focus: { d: [1290, 610, 1.4] as Focus, m: [1300, 560, 1.45] as Focus },
      back: "rise" as Back,
    },
    {
      id: "first-dance",
      at: { sunset: 30 } as ClockTime,
      label: "First dance & dance party",
      rail: "First dance",
      place: "West terrace, 30 × 40 ft floor",
      line: "Your first dance, then the band on the terrace fills the floor. The windows come on one by one, and the bulbs over the lawn.",
      // (barn camera: eases down onto the lit glass while the dance comes in over it)
      focus: { d: [1290, 900, 2.4] as Focus, m: [1290, 900, 2.2] as Focus },
      scene: {
        move: "ease",
        shots: [
          {
            still: poster("32009248", "pexels-photo-32009248", "Orhan Pergel", "A couple slow-dancing at night under a line of glowing bulbs, guests at candlelit tables behind"),
            clip: clipFile("32009248", "13642647_1280_720_25fps.mp4"),
            phone: photo("10360902", "Amar", "The first dance at night, the couple holding each other under a canopy strung with bulbs"),
            d: [[0.5, 0.5, 1.06], [0.5, 0.5, 1.14]],
            m: [[0.58, 0.5, 1.02], [0.58, 0.48, 1.12]],
          },
          {
            still: photo("15964956", "Danik Prihodko", "The floor fills: the couple dancing hand in hand among their guests under swags of fairy lights", 2400, 1602),
            d: [[0.45, 0.62, 1.1], [0.47, 0.6, 1.18]],
            m: [[0.4, 0.62, 1.02], [0.42, 0.62, 1.1]],
            cut: 0.2,
          },
        ],
      } as Scene,
    },
    {
      id: "send-off",
      at: { sunset: 50 } as ClockTime,
      label: "Sparkler send-off",
      rail: "Sparklers",
      place: "The front walk",
      line: `Two lines down the front walk, the doors lit behind you. Music ends at ${clock(hours.musicEnds)}; the lane is lit to the road.`,
      // back on the barn: the camera pulls up and back from the lit glass to the walk
      // (phones: the lit gable sits just below the clock, the sparklers between it and the caption)
      focus: { d: [1292, 1220, 1.45] as Focus, m: [1296, 860, 1.25] as Focus },
      back: "pull" as Back,
    },
  ],

  /**
   * Prices by season and day (the months are in `pricing.seasons`: peak Jun–Sep, shoulder
   * Apr–May & Oct, winter Nov–Mar). Each includes up to `includedGuests`.
   */
  pricing,
  hours,
  tour,
  parking,

  /**
   * "The other six days" — each relights the hero and filters the checker. `sunsetOn` says
   * whose sunset `when` is keyed to (the featured date, or `winterDate`); `caption` may use
   * {month} (the featured month), {after} (minutes after sunset), {date} and {sunset}.
   */
  packages: [
    {
      id: "friday",
      name: "Friday blue hour",
      short: "Friday",
      light: "friday" as const,
      when: { sunset: 25 } as ClockTime,
      sunsetOn: "featured" as const,
      caption: "A {month} Friday, {after} minutes after sunset",
      filter: { day: "fri" as const, season: "all" as const },
      cta: "See Fridays",
      perk: "Your rehearsal dinner on the porch the night before, on us.",
      note: "Same doors, same bulbs, same music curfew as Saturday.",
    },
    {
      id: "sunday",
      name: "Sunday brunch",
      short: "Sunday",
      light: "morning" as const,
      when: "10:30" as ClockTime,
      sunsetOn: "featured" as const,
      caption: "Sunday morning, doors at 10",
      filter: { day: "sun" as const, season: "all" as const },
      cta: "See Sundays",
      perk: "Doors at 10, out by 4, and the coffee cart is ours.",
      note: "Morning light comes straight through the loft window.",
    },
    {
      id: "winter",
      name: "Winter",
      short: "Winter",
      light: "winter" as const,
      when: { sunset: 22 } as ClockTime,
      sunsetOn: "winter" as const,
      caption: "Sunset {date}: {sunset}",
      filter: { day: "all" as const, season: "winter" as const },
      cta: "See winter dates",
      perk: "The windows are lit before dinner. Wood stove, wool blankets, cider on the porch.",
      note: "Any weekend, November through March.",
    },
  ],
  /** "Walk the grounds": the five spaces, in the order the day uses them (`photos.aerial` sits by the site plan). */
  spaces: [
    {
      id: "loft",
      name: "The loft suite",
      when: "Getting ready",
      photo: "loft" as const,
      capacity: "Up to 10 getting ready",
      size: "22 × 18 ft, north light",
      rain: "You're already inside.",
      line: "Up the stair behind the big doors. A steamer, a full-length mirror, a sofa for the people who are mostly there for snacks.",
    },
    {
      id: "lawn",
      name: "The front lawn",
      when: "Ceremony",
      photo: "lawn" as const,
      capacity: "180 seated on fir benches",
      size: "The aisle is 64 ft of paver walk",
      rain: "Inside the big doors; we turn the room during cocktails.",
      line: "You face the doors, your guests face the fields. The benches are ours; so is the arbor, if you want it.",
    },
    {
      id: "orchard",
      name: "The orchard",
      when: "First look & cocktail hour",
      photo: "orchard" as const,
      /** Shown large, with the close-up as an inset. */
      wide: "orchardWide" as const,
      capacity: `${pricing.maxGuests} standing, 60 at the long table`,
      size: "40 apple and pear trees, strung with bulbs",
      rain: "The covered porch: 120 standing, heaters on.",
      line: "The first look at the end of the rows, then cocktails under the trees while we turn the hall. Rehearsal dinners happen at the long table here, too.",
    },
    {
      id: "hall",
      name: "The hall",
      when: "Dinner beneath the beams",
      photo: "hall" as const,
      wide: "hallWide" as const,
      capacity: `${pricing.maxGuests} seated, rounds or long tables`,
      size: "Timber posts and trusses, a gallery above",
      rain: "This is the rain plan.",
      line: `Tables for ${pricing.maxGuests}, linens and the bulbs are already here. The big doors slide open on both ends when it's warm.`,
    },
    {
      id: "terrace",
      name: "The west terrace",
      when: "First dance & dance party",
      photo: "terrace" as const,
      capacity: "160 standing, 30 × 40 ft dance floor",
      size: "Faces the sunset, lit to the lane",
      rain: "The dance floor moves inside; the doors stay open.",
      line: "Where the sun goes down behind the fields. The band sets up on the terrace, the floor fills after your first dance, and the sparkler line forms out front.",
    },
  ],
  /** "Book with the people": in the owners' words. */
  ownerQuote:
    "We live at the top of the lane. One of us walks every couple through their day, and one of us is standing by the big doors when the sparklers come out.",
  promises: [
    { title: "A free 7-day hold.", body: "Tell us your date and it's penciled in for a week while you talk to your families. No card, no deposit, no chasing." },
    {
      title: "You talk to whoever runs your day.",
      body: `The person on your tour is the person by the doors at 10 pm. ${ownersShort} answer the phone themselves, and there's no events team to hand you to.`,
    },
    {
      title: "The price here is the price.",
      body: "The estimate on this page is the number on the contract. No service charge, no admin fee, no cake-cutting fee, no surprise at the final walkthrough.",
    },
  ],
  /** Always shown labelled "Sample review". */
  reviews: [
    { quote: "We changed our date twice and our guest count four times. Every answer came back the same afternoon, from the same person.", who: "A couple married in August" },
    { quote: "It rained at 4:15. By 4:40 we were getting married just inside the doors and nobody's shoes were wet.", who: "A couple married in May" },
    { quote: "The sparkler line down the front walk is the photo on our wall. The quote we signed was the bill we paid.", who: "A couple married in September" },
  ],
  /**
   * "You were going to ask": the inquiry subject lines, after the first (which asks about
   * the Saturday a week before the featured date and is answered from the availability).
   */
  faq: [
    {
      subject: "Can we bring our own caterer?",
      meta: "Sent Tuesday, 2:05 pm",
      answer: "Yes: any licensed, insured caterer, and no fee for choosing your own. There's a prep kitchen with two fridges, a three-bay sink and 40 amps.",
    },
    {
      subject: "What happens if it rains?",
      meta: "Sent in April, twice",
      answer: "You marry just inside the big doors, and we turn the room during cocktails (about 45 minutes). No rain fee, no tent to rent.",
    },
    {
      subject: "How late can the party go?",
      meta: "Sent Friday, 10:31 pm",
      answer: `Music until ${clock(hours.musicEnds)}, lights up at ${clock(hours.lightsUp)}, lane empty by ${clock(hours.end, true)}. It's county code, and it's why the neighbors still wave.`,
    },
    {
      subject: "Is there parking for 150 guests?",
      meta: "Sent Monday, 8:12 am",
      answer: `${parking.cars} cars on the gravel, ${parking.overflow} more on the east pasture from ${parking.overflowMonths}. A shuttle from the ${town} park-and-ride takes ${parking.shuttleMinutes} minutes.`,
    },
    {
      subject: "Where do we get ready?",
      meta: "Sent Sunday, 9:40 am",
      answer: `The loft suite (north light, a steamer, a full-length mirror, a door that locks) and the tack room for the other side. Both yours from ${clock(hours.start, true)}.`,
    },
    {
      subject: "Can our dog be in the ceremony?",
      meta: "Sent with three photos of the dog",
      answer: "Yes. Leashed, with a named human after the ceremony. The water bowl has a ribbon on it.",
    },
    {
      subject: "What's actually included in the price?",
      meta: "Sent Wednesday, 1:17 pm",
      answer: `Tables and chairs for ${pricing.maxGuests}, linens, the bulbs, a day-of coordinator, setup, breakdown and cleaning. Not included: food, drink, flowers, and you.`,
    },
  ],
  offsite: {
    line: "Tuesday to Thursday, 9 to 5, up to 60 people. The long table, a projector, Wi-Fi that reaches the orchard, and lunch from anyone you like.",
  },
} as const;

export type Site = typeof site;
export type LightName = "day" | "friday" | "morning" | "winter" | "firstDance";
