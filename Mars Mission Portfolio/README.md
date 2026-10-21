# Mars Mission Portfolio

A developer portfolio you fly instead of scroll. The visitor rides a crewed mission from Earth to Mars, and projects, skills and contact details sit along the route as stations, payloads and landing sites.

The sky is the real one: the Sun, Earth's rotation and the stars are placed from the current date and time.

## Status

`v0.1.0`, scene shell:

- Earth with day and night textures, city lights, sun glint on water, a drifting cloud layer and an atmosphere rim
- The Sun as the single light, positioned from the real date, with limb darkening and bloom
- About 5,000 catalogue stars (Hipparcos, to magnitude 6) at their real positions and colours
- Orbit camera and a mission clock (UTC and mission elapsed time)

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
  space/     astronomy: time, Sun position, reference frames
  shaders/   GLSL for planets, atmosphere, Sun and stars
  state/     simulation clock
  ui/        HUD
  content/   all copy shown on the site
public/
  textures/  planet maps
  data/      star catalogue
```

## Scale

One scene unit is one Earth radius. The Sun is drawn about 12 times closer than it really is so it fits inside the camera's far plane, and shrunk by the same factor so it keeps its real apparent size. See `src/scene/scale.ts`.

Data and texture sources are listed in [CREDITS.md](CREDITS.md).
