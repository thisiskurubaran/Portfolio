# Mars Mission Portfolio

A developer portfolio you fly instead of scroll. The visitor rides a crewed mission from Earth to Mars, and projects, skills and contact details sit along the route as stations, payloads and landing sites.

The sky is the real one: the Sun, Earth's rotation and the stars are placed from the current date and time.

## Status

`v0.2.0`, orbital physics core:

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
  scene/     three.js scene: Earth, Sun, Starfield, camera
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

## Scale

One scene unit is one Earth radius. The Sun is drawn about 12 times closer than it really is so it fits inside the camera's far plane, and shrunk by the same factor so it keeps its real apparent size. See `src/scene/scale.ts`.

Data and texture sources are listed in [CREDITS.md](CREDITS.md).
