# Mars Mission Portfolio

A developer portfolio you fly instead of scroll. The visitor rides a crewed mission from Earth to Mars, and projects, skills and contact details sit along the route as stations, payloads and landing sites.

The sky is the real one: the Sun, Earth's rotation and the stars are placed from the current date and time.

## Status

`v0.6.0`, access, security and privacy:

- `/plain`, the mission file: the whole portfolio as plain server rendered HTML (about, experience, projects, skills, education, certifications, the route, contact). No WebGL, physics or sound. Lighthouse on `/plain`: performance 99, accessibility 100, best practices 100, SEO 100.
- A "skip to mission file" link is the first thing in the tab order and the first thing on screen, then shrinks to a small tab once the visitor starts flying.
- The plain site is offered automatically when WebGL is missing, on devices with two cores or fewer, or when the measured frame rate stays under 24 fps.
- Keyboard: arrow keys orbit the view and + and - zoom wherever free look is active; Tab reaches every control, and tabbing onto a planet aims the reticle at it.
- Reduced motion: no camera shake, no rotating titles, no ring spin, a steady engine flame, and CSS transitions switched off.
- Security headers: a nonce based Content Security Policy per request, HSTS, nosniff, Referrer-Policy, X-Frame-Options, COOP, and a Permissions-Policy that denies camera, microphone, geolocation and motion sensors. No console errors or CSP violations in any phase.
- `/privacy` in plain language: what the site stores today (nothing about visitors) and what planned features will store.

From `v0.5.0`, waypoint stops:

- Two real stops on the way out, defined in `src/content/stops.ts`: the Moon (a small station in low lunar orbit, holding education and early career roles) and Sun-Earth L2 (a deep space observatory, holding the technical highlights from the roles).
- Stops are gated by real geometry. At the burn, the escape path is searched for the moment it reaches each stop's distance from Earth, and the angle between path and stop decides whether it is on the way. The late 2026 departure passes within about 14 degrees of the Moon a day and a half out, so the Moon is a stop and takes over the education and early career stations. L2 lies away from the Sun, about 84 degrees off that path, so it is listed as off the path with a "visit anyway" override.
- The Moon stop computes the lunar flyby (patched conics): speed relative to the Moon, turn angle and velocity change for a 100 km pass.
- At a stop the ship eases from the transfer to a parking point and back, the short cinematic framing on arrival. The transfer itself is untouched, so leaving resumes it with the right velocity.
- The Moon is drawn at its real position (Meeus, chapter 47) from launch onward, and the station list shows each stop with its live distance.
- The clock's Mars distance and signal delay are measured from the ship once it has left Earth.

From `v0.4.0`, transit to Mars:

- A transfer planner in Earth orbit finds the next real launch window from today's planet positions: a porkchop search over departure date and flight time, solving Lambert's problem for each pair. From October 2026 it finds the late 2026 window (311 days, C3 about 9 km²/s²). Run from April 2020 it picks a departure of 1 August 2020 and arrival in late February 2021, close to what Perseverance flew.
- Departure jumps mission time to the window and fires the trans-Mars injection burn. Propellant comes from the rocket equation (70 t ship, 45 t propellant, 450 s engine).
- The cruise follows the transfer ellipse as an exact two-body orbit around the Sun. The sky switches to a ship centred frame in millions of km, with the orbits of Earth and Mars, the transfer arc, Earth shrinking behind and Mars ahead.
- Seven stations sit on the transfer arc. The ship stops at each, holds 40 m off, and docks to open that part of the portfolio: education, the three employers with their roles, an outpost for early career roles, certifications, and the Instant Eats project. Undocking resumes the cruise. Stations with a habitat ring spin it at the rate that gives Mars gravity at its radius.
- Comms panel with contact links, telemetry for the cruise (distance from the Sun, speed, distance to Mars, arrival, propellant), and a station timeline.

The first 12 hours after the burn blend the escape from Earth orbit onto the transfer. A real burn is aimed so the escape leaves along the transfer direction and is then trimmed by correction burns; the blend stands in for both and is the one scripted part of the cruise.

From `v0.3.0`, launch and Earth orbit:

- Phase 1, the pad: a launch complex at Satish Dhawan Space Centre under the real local sky (day, dusk or a floodlit night), with the mission brief (about) and a launch button
- Countdown, liftoff with exhaust and smoke, max Q, staging, abort tower jettison, second stage burn, orbit insertion, spacecraft separation and solar array deployment
- Phase 2, Earth orbit: a 200 km circular orbit, propagated as an exact two-body orbit from the state at engine cutoff, with free look around the spacecraft and skills shown as instrument panels
- Ship lighting from the Sun only, with earthshine from below and darkness in Earth's shadow
- A skip button for visitors who have seen the launch before

The ascent is the one scripted part of the flight: altitude, speed and pitch follow curves shaped like a real two stage crewed launch, kept in `src/scene/launch/` apart from the physics. It hands its state at engine cutoff to the Kepler propagator, so the orbit after that is pure physics. Mission time runs at 20x during the long burns and at 1x for liftoff, staging and orbit insertion.

From `v0.2.0`, orbital physics core:

- Earth with day and night textures, city lights, sun glint on water, a drifting cloud layer and an atmosphere rim
- The Sun as the single light, with limb darkening and bloom
- About 5,000 catalogue stars (Hipparcos, to magnitude 6) at their real positions and colours
- Planets from JPL orbital elements, shown as points of light in their real directions and brightness. Tap one, or pick it from the list, for facts and its live distance (F06)
- Time warp from real time up to 30 days per second, with a fixed timestep driver for integrated motion
- Mission clock: UTC, mission elapsed time, distance to Mars and the one way radio delay

All positions share one frame, the J2000 ecliptic. Earth's rotation is precessed from the equinox of date into that frame so the ground, Sun and stars line up.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Checks:

```bash
npm run lint
npm run typecheck
npm test
```

The tests check the integrator against closed circular orbits, energy over 100 orbits and analytic Kepler motion, and check the ephemeris against known events: the January 2025 Mars opposition, the 2026 equinox and solstice, and the equation of time.

## Git hooks

This project lives in a subfolder of a repo that holds several portfolios. To run its commit checks, point git at its hooks from the repo root:

```bash
git config core.hooksPath "Mars Mission Portfolio/.githooks"
```

## Layout

```
src/
  app/       routes and layout: the mission, /plain, /privacy
  scene/     three.js scene: sky layer (Earth, Sun, stars, planets) and local layer (pad, rocket, ship)
    craft/   rocket and spacecraft models
    launch/  launch site and the scripted ascent profile
    transit/ cruise sky (orbits, transfer arc, Mars) and stations
  physics/   kepler propagation, lambert solver, launch windows, rocket equation, verlet integrator, fixed stepper, light time
  space/     astronomy: planet elements, time, reference frames
  shaders/   GLSL for planets, atmosphere, Sun and stars
  state/     simulation clock and store
  ui/        HUD
  content/   all copy shown on the site
public/
  textures/  planet maps
  data/      star catalogue
```

## Two layers

The scene is drawn in two layers composited into one HDR buffer. The sky layer is Earth centred and measured in Earth radii. The local layer is measured in metres around the spacecraft, which always sits at the local origin. A shared frame (rotation and position, in `src/scene/missionRuntime.ts`) ties them together, so a 10 m ship and a planet 6,000 km away each get a usable depth range.

## Scale

One scene unit is one Earth radius. The Sun is drawn about 12 times closer than it really is so it fits inside the camera's far plane, and shrunk by the same factor so it keeps its real apparent size. See `src/scene/scale.ts`.

Data and texture sources are listed in [CREDITS.md](CREDITS.md).
