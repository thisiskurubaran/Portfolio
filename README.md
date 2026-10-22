# Portfolio

Three developer portfolios by Kurubaran Anandhan, each one a different way to browse the same kind of content: projects, experience, skills and contact details.

| Project | What it is | Version |
| --- | --- | --- |
| [Lighthouse Portfolio](Lighthouse%20Portfolio/) | Keep a lighthouse at night. Sweep the beam across the sea to find projects sailing past as ships. | `v0.7.0` |
| [Mars Mission Portfolio](Mars%20Mission%20Portfolio/) | Fly a crewed mission from Earth to Mars. Projects, roles and skills sit along the route as stations and landing sites. | `v0.11.0` |
| [Operating System Portfolio](Operating%20System%20Portfolio/) | folioOS, an invented operating system. The site boots a desktop, phone, tablet or spatial shell to match the device, and the portfolio runs as its apps. | `v0.3.0` |

Each project has its own README with what it does, how it is built and where it stands.

## Layout

```
Lighthouse Portfolio/         Next.js + React Three Fiber, GLSL sea and beam
Mars Mission Portfolio/       Next.js + React Three Fiber, orbital mechanics, Rapier physics
Operating System Portfolio/   Next.js + Tailwind + Zustand, one kernel with a shell per device
.gitignore                    rules shared by all three projects
```

The three projects are separate apps. Each has its own `package.json`, lockfile and build, and none of them imports from another. Work on one by running commands inside its folder.

## Run a project

Node 20.9 or newer.

```bash
cd "Mars Mission Portfolio"
npm install
npm run dev
```

Open http://localhost:3000. Every project has the same scripts:

| Script | Does |
| --- | --- |
| `npm run dev` | dev server with hot reload |
| `npm run build` | production build |
| `npm run start` | serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

Mars Mission also has `npm test` (Vitest) for its physics and ephemeris checks.

## Shared conventions

- Commits follow Conventional Commits, lowercase and imperative, for example `feat: add tide rocks at low water`. Work in the OS portfolio is scoped `folioos`, for example `feat(folioos/f04): add edge snapping`.
- All work happens on `main`. Each project tags its milestones with semver.
- No analytics, trackers or cookies in any project. Location is city level at most, taken from the request's geo headers, never from the browser's Geolocation API.
- Lighthouse and Mars Mission have a `/plain` route with all of their content as fast, accessible HTML, for visitors who cannot or would rather not use the interactive version. The OS portfolio gets one in its `v0.5.0` milestone.
- Security issues: see [SECURITY.md](SECURITY.md).

## Contact

- GitHub: [thisiskurubaran](https://github.com/thisiskurubaran)
- LinkedIn: [iamkurubaran](https://www.linkedin.com/in/iamkurubaran)
