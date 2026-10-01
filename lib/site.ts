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
      id: "18032329",
      src: pexels("18032329"),
      alt: "The front of a white gambrel barn with two sliding wooden doors, black-framed windows and a cupola, under a summer sky",
      by: "Steven Van Elk",
    },
    lawn: { id: "18032331", src: pexels("18032331", 1600), alt: "Rows of wooden benches on the lawn facing the barn's white doors", by: "Steven Van Elk" },
    hall: { id: "13788574", src: pexels("13788574", 1600), alt: "Round dinner tables set under timber posts, a gallery and strings of bulbs inside the barn", by: "Rene Terp" },
    terrace: { id: "35870516", src: pexels("35870516", 1600), alt: "White folding chairs on the lawn beside the barn at sunset, with bulbs strung toward the fields", by: "Taylor Thompson" },
    loft: { id: "37713508", src: pexels("37713508", 1600), alt: "A wedding dress hanging by a tall mullioned window in a bright room", by: "Alexander Mass" },
    orchard: { id: "7143718", src: pexels("7143718", 1600), alt: "A table laid with fruit under apple trees heavy with apples, on a sunny lawn", by: "Mariam Gab" },
    owners: { id: "7728690", src: pexels("7728690", 1600), alt: "Two smiling owners standing together in a field on a spring day", by: "Greta Hoffman" },
  },

  /**
   * Hero calibration, in pixels of the 2400 × 1600 hero photo. Click new points out
   * with /?calibrate on any photo.
   */
  hero: {
    size: { w: 2400, h: 1600 },
    hasSky: true,
    /** Runs along the top of the roof's dark edge; only bright pixels above it count as sky. */
    skyline: [
      [0, 1250], [234, 1250], [238, 1206], [244, 1205], [898, 972], [1000, 836], [1040, 782],
      [1046, 748], [1051, 652], [1308, 652], [1318, 738], [1322, 778], [1467, 974], [1941, 1128],
      [1958, 1127], [2204, 1150], [2207, 1172], [2400, 1172],
    ] as Pt[],
    /** Window glass, in the order the lights come on. Each window may have several panes. */
    windows: [
      { id: "front-doors", panes: [[1137, 1257, 35, 80], [1198, 1257, 37, 80]] as Rect[] },
      { id: "transom-mid", panes: [[1171, 1172, 27, 42]] as Rect[] },
      { id: "transom-left", panes: [[1126, 1172, 27, 42]] as Rect[] },
      { id: "transom-right", panes: [[1216, 1172, 27, 42]] as Rect[] },
      { id: "west-doors", panes: [[701, 1256, 39, 83], [762, 1256, 40, 83]] as Rect[] },
      { id: "east-doors", panes: [[1565, 1255, 36, 81], [1626, 1255, 36, 81]] as Rect[] },
      { id: "gable-low", panes: [[1169, 926, 29, 40]] as Rect[] },
      { id: "west-2", panes: [[490, 1240, 33, 42]] as Rect[] },
      { id: "east-1", panes: [[1842, 1235, 32, 41]] as Rect[] },
      { id: "west-1", panes: [[369, 1240, 32, 42]] as Rect[] },
      { id: "east-2", panes: [[1961, 1234, 32, 42]] as Rect[] },
      { id: "loft", panes: [[1169, 755, 29, 38]] as Rect[] },
    ],
    /** Gooseneck sconces: where the shade's mouth is, and how far the wash falls. */
    lamps: [
      { at: [977, 982] as Pt, reach: 150 },
      { at: [1396, 988] as Pt, reach: 150 },
      { at: [746, 1160] as Pt, reach: 190 },
      { at: [1621, 1156] as Pt, reach: 190 },
    ],
    /**
     * Where the doors throw light onto the path, and where the send-off lines up. `horizon`
     * is the camera's eye level (y), which sets the perspective of the sparkler lines.
     */
    path: { door: [1186, 1384] as Pt, near: [1215, 1590] as Pt, horizon: 1290 },
    /**
     * The sun's track through golden hour: `from` about two and a half hours before sunset,
     * `to` at the minute of sunset (half behind the roofline). It keeps going past `to`.
     */
    sun: { from: [1440, 520] as Pt, to: [1290, 664] as Pt, r: 32 },
    /** Camera stops (desktop, phone). */
    focus: {
      // (the desktop landing frame stops short of the trailer and the field at the far right)
      landing: { d: [1100, 820, 1.15] as Focus, m: [1188, 820, 1] as Focus },
      // (phones: tilted up, so the close sits in the sky above the strand of bulbs)
      close: { d: [1200, 980, 1.08] as Focus, m: [1190, 560, 1.15] as Focus },
      relit: { d: [1150, 1000, 1.25] as Focus, m: [1188, 1080, 1.05] as Focus },
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
      focus: { d: [1184, 810, 2.05] as Focus, m: [1184, 780, 1.7] as Focus },
    },
    {
      id: "first-look",
      at: "14:30" as ClockTime,
      label: "First look",
      rail: "First look",
      place: "The orchard",
      line: "At the far end of the orchard rows, out of sight of the lot. One of you waits facing the trees; the other walks up behind.",
      focus: { d: [420, 1180, 1.7] as Focus, m: [360, 1160, 1.5] as Focus },
    },
    {
      id: "photos",
      at: "15:00" as ClockTime,
      label: "Wedding party & family photos",
      rail: "Photos",
      place: "Lawn and orchard",
      line: "The wedding party on the lawn, then both families under the trees, with a bench in the shade for the grandparents.",
      focus: { d: [1100, 1180, 1.1] as Focus, m: [1100, 1150, 1.05] as Focus },
    },
    {
      id: "ceremony",
      at: "16:30" as ClockTime,
      label: "Ceremony",
      rail: "Ceremony",
      place: "The front lawn",
      line: "Fir benches down 64 ft of aisle, a string trio by the doors. If it rains, the doors roll open and you marry just inside.",
      focus: { d: [1186, 1330, 1.75] as Focus, m: [1186, 1300, 1.9] as Focus },
    },
    {
      id: "cocktails",
      at: "17:00" as ClockTime,
      label: "Cocktail hour",
      rail: "Cocktails",
      place: "The orchard",
      line: "Drinks under the bulb-strung trees and an acoustic duo. The photos are done, so you two get to be at your own cocktail hour.",
      focus: { d: [760, 1240, 1.35] as Focus, m: [700, 1220, 1.3] as Focus },
    },
    {
      id: "dinner",
      at: "18:30" as ClockTime,
      label: "Dinner beneath the beams",
      rail: "Dinner",
      place: "The hall",
      line: `Dinner for up to ${pricing.maxGuests} under the timber trusses. The big doors stay open until the air cools.`,
      focus: { d: [880, 1200, 1.9] as Focus, m: [880, 1180, 1.6] as Focus },
    },
    {
      id: "golden-hour",
      at: { sunset: -50 } as ClockTime,
      label: "Golden hour, just the two of you",
      rail: "Golden hour",
      place: "The lawn",
      line: "Portraits on the lawn while the clouds go peach, then rose. Nobody has to chase the light.",
      focus: { d: [1330, 700, 1.22] as Focus, m: [1330, 700, 1.05] as Focus },
    },
    {
      id: "sunset",
      at: { sunset: 0 } as ClockTime,
      label: "Sunset",
      rail: "Sunset",
      place: "Behind the cupola",
      line: "Straight down behind the cupola. We move the toasts so everyone turns around in time.",
      focus: { d: [1196, 720, 1.5] as Focus, m: [1230, 700, 1.35] as Focus },
    },
    {
      id: "first-dance",
      at: { sunset: 30 } as ClockTime,
      label: "First dance & dance party",
      rail: "First dance",
      place: "West terrace, 30 × 40 ft floor",
      line: "Your first dance, then the band on the terrace fills the floor. The windows come on one by one, and the bulbs over the lawn.",
      focus: { d: [1190, 1150, 1.3] as Focus, m: [1188, 1000, 1.12] as Focus },
    },
    {
      id: "send-off",
      at: { sunset: 50 } as ClockTime,
      label: "Sparkler send-off",
      rail: "Sparklers",
      place: "The front walk",
      line: `Two lines down the front walk, the doors lit behind you. Music ends at ${clock(hours.musicEnds)}; the lane is lit to the road.`,
      focus: { d: [1195, 1350, 1.55] as Focus, m: [1200, 1330, 1.5] as Focus },
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
  /** "Walk the grounds": the five spaces, in the order the day uses them. */
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
