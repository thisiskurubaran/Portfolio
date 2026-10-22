# Lighthouse Portfolio

A developer portfolio you play instead of scroll. The visitor keeps a lighthouse on a rock at night and sweeps the beam across the sea. Projects sail past as ships that are only visible where the beam lands. Light one up and it shows its name; open it to read about the project.

The sea follows the visitor's real conditions: their local time of day, season, weather and tide.

## Status

`v0.7.0`. The scene, beam, ships, live weather and the hidden finds all work. **The entries are still placeholders**: the ships (including about and contact), wrecks, ghost ship and hidden finds carry sample text until real content is written into `src/content/`.

### What is on the water

- **Ships.** Cargo ships are bigger products, fishing boats are smaller experiments, a sailboat holds the about section and a rowboat holds contact. They drift in the dark and are lit only by the beam. Opening one shows its summary, role, stack, links and media.
- **The beam.** Turn and tilt it with the mouse, arrow keys, scroll wheel or touch. On phones it can also be steered by tilting the device (opt-in, since it needs motion sensor access). It is a faked volumetric cone that lights a pool on the water where it lands.
- **Day and night.** The sky and light follow the visitor's local time. By day the scene is a harbour with a switch to jump to night and use the beam.
- **Seasons.** Snow in winter, haze in summer and wind in autumn, from the visitor's hemisphere and date.

### Live conditions

- **Weather.** The `/api/conditions` route reads the visitor's city from the request's geo headers, rounds the position to 0.1 degree and asks Open-Meteo for the weather. Wind, waves, fog, cloud, rain and snow in the scene follow it.
- **Tides.** Hourly sea level from the Open-Meteo marine API, scaled to the day's own range. Where there is no marine data, a moon based estimate (the M2 tide with a two hour lag) stands in, and the scene says it is an estimate.
- **Storms.** The barometer lets the visitor pick the weather: clear, fog, rain, storm, tropical storm, a region named major storm (hurricane, typhoon or cyclone), monsoon squall or nor'easter. Storms bring lightning with delayed thunder, slanted rain, tossing ships and a flickering beam. The choice lasts until reload.
- **Real hazards.** The `/api/hazards` route reads live cyclones from GDACS and NOAA's National Hurricane Center and strong earthquakes from GDACS. Cyclones show as swirls on the horizon. A strong quake near the visitor shows a calm banner. When rough weather is real and close, the sea is kept calm rather than dramatised.

### Things found by playing

Each is also listed on the plain site, so nobody misses the content.

- **Rescue (storms only).** A boat in distress appears; guiding it to the jetty with the beam opens a hidden entry.
- **Low tide.** Rocks come out of the water, with a find wedged on them.
- **Shipwrecks.** Abandoned projects on the seabed, visible through clear water when the beam points steeply down. Each says what went wrong and what was learned.
- **Ghost ship.** Drifts past after midnight on the visitor's clock, carrying an archived project.
- **Sea life.** Whales, dolphins and glowing plankton turn up for visitors who stay a while. Whales come twice as often in winter.

### Access, security and privacy

- `/plain`: every entry as plain server rendered HTML, with no WebGL. A "skip to plain site" link is first in the tab order. The plain site is offered automatically when WebGL is missing or the device is struggling to draw the scene.
- Tab moves between ships and points the beam at the focused one.
- Reduced motion slows the waves.
- A nonce based Content Security Policy per request (in `src/proxy.ts`) and static security headers (in `next.config.ts`). The Permissions-Policy denies camera, microphone and geolocation, and allows motion sensors for this origin only, for tilt steering.
- `/privacy` in plain language. Nothing about visitors is stored.

### Milestones

| Tag | Added |
| --- | --- |
| `v0.1.0` | scene: sea, rock, lighthouse, night sky |
| `v0.2.0` | the beam |
| `v0.3.0` | ships and panels |
| `v0.4.0` | plain site, accessibility, security headers |
| `v0.5.0` | time of day, seasons, real weather |
| `v0.6.0` | storms, barometer, rescue mode |
| `v0.7.0` | live storms, tides, creatures, wrecks, ghost ship, quake banner |

## Run it

Node 20.9 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Checks:

```bash
npm run lint
npm run typecheck
```

## Adding real content

All copy lives in `src/content/`; components hold no text.

| File | Holds |
| --- | --- |
| `profile.ts` | about and contact |
| `projects.ts` | ships: `cargo` for products, `fishing` for experiments |
| `wrecks.ts` | abandoned projects with what went wrong and what was learned |
| `ghost.ts` | the archived project on the ghost ship |
| `hidden.ts` | the rescue reward and the low tide find |
| `ui.ts` | interface labels |
| `privacy.ts` | the privacy page |

Images and video for a project go in `public/media/` and are listed in the entry's `media` field.

## Layout

```
src/
  app/        routes: the scene, /plain, /privacy, /api/conditions, /api/hazards
  scene/      three.js scene: sea, sky, island, beam, weather effects, creatures, wrecks
    ships/    ship models, drift, the tracker that tells which ship the beam is on, rescue boat
  shaders/    GLSL for the water, sky, moon, stars, beam, ships, rain, snow, swirls, plankton
  weather/    weather mapping, storm presets, sun and moon position, seasons, tides, hazards, zod schemas
  state/      Zustand store
  ui/         panels, labels, barometer, banners, toggles
  content/    all copy shown on the site
  proxy.ts    per-request CSP nonce
public/
  media/      project images and video
  models/     3D models
```

Shaders are kept in their own `.vert` and `.frag` files and loaded with `raw-loader`, so they get editor highlighting and clean diffs.
