# Longlight

A demo landing page for a fictional wedding venue: a barn and five acres in Woodinville, WA.
The hero follows a sample couple's wedding day as you scroll, ten stops from getting ready at
1:00 pm to the sparkler send-off, with the real sunset for the configured town.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export to out/
```

## Making it someone else's

Everything a client changes is in `lib/site.ts`:

- name, town, state, lat/lon and time zone (every mention and every sunset follows the town)
- phone, email, owners
- photo URLs (Pexels, hotlinked) and credits
- prices, packages, the five spaces, the run of show (each stop's time, label, place and
  caption; the hero's pinned scroll grows with the number of stops)
- the venue's hours (`hours.start` is the one start time the page quotes: rooms open at 10 am)
- the featured couple, date and guest count (the hero intro and the estimate's opening state)
- `showConceptBanner`: shows "Unofficial concept for {name}, not affiliated" and tags every
  invented figure "sample"
- the hero calibration, in photo pixels: skyline, window panes, lamps, sun track, focal stops

Availability is sample data, computed in the visitor's browser (`lib/availability.ts`,
`lib/useAvailability.ts`): every weekend from the current month through the next 18, each
date seeded by the date itself, so it's the same for everyone on a given day. Past weekends
drop off and holds expire on the date they show. The static HTML carries no calendar; it
fills in right after hydration. Dates the copy refers to (the featured Saturday, the letters,
the winter date) are pinned in `FIXED`.

### Calibrating a new photo

Run `npm run dev` and open `/?calibrate`. The photo is shown whole with the current
calibration and the computed sky and cloud masks; click to read off points in photo pixels.
`/?calibrate&photo=<url>` does the same for any photo. A photo with no sky: set
`hero.hasSky` to `false` and the sky layers switch off.

## How the hero works

- **Stage** (`components/stage/Stage.tsx`): one box the photo's own size; every overlay is
  written in photo pixels, and the parent applies a single cover-plus-camera transform.
- **Grades**: copies of the same `<img>` under different CSS filters, cross-faded.
- **Sky** (`lib/masks.ts`): a mask computed once on a canvas from the bright pixels above the
  skyline. It holds the tints, the clouds and the sun, so nothing stains the roof.
- **Windows**: each pane's glow is built from that pane's own pixels, so frames and mullions
  stay dark.
- **Light** (`lib/light.ts`): every layer's opacity as a function of minutes from sunset.
- **Sunset** (`lib/sun.ts`): NOAA solar equations.
- Only transform and opacity animate. Reduced motion gets the lit first-dance frame as a still.
