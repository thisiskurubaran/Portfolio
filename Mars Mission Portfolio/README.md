# Mars Mission Portfolio

A developer portfolio you fly instead of scroll. The visitor rides a crewed mission from Earth to Mars, and projects, skills and contact details sit along the route as stations, payloads and landing sites.

The sky is the real one: the Sun, Earth's rotation and the stars are placed from the current date and time.

## Status

`v0.3.0`, launch and Earth orbit:

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
  app/       routes and layout
  scene/     three.js scene: sky layer (Earth, Sun, stars, planets) and local layer (pad, rocket, ship)
    craft/   rocket and spacecraft models
    launch/  launch site and the scripted ascent profile
  physics/   kepler propagation, verlet integrator, fixed stepper, light time
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
