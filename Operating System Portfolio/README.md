# Operating System Portfolio (kbOS)

A developer portfolio built as an invented operating system family. The site works out what device the visitor is on and boots the matching shell, and the portfolio runs inside it as apps: About, Experience, Projects, Skills and the rest.

| Shell | Device | Style |
| --- | --- | --- |
| kbDesk | laptop and desktop | menu bar, dock, draggable windows |
| kbPhone | phone | lock screen, home grid, full screen apps |
| kbPad | tablet | dock, split view, slide-over |
| kbVision | opt-in | floating glass panels in faked 3D depth |

All four shells read the same content and the same design system; only the framing differs. kbVision is a browser homage to spatial computing drawn with faked depth, not real AR.

kbOS is an original design. It borrows the grammar of desktop and mobile systems (a dock, a home grid, windows) but none of their names, icons or system fonts.

## Status

`v0.3.0`: milestones 1 to 3 of 14 are done. kbDesk is the only shell so far, and every device boots it.

**Works now**

- Device detection (`useDevice`) resolves phone, tablet or desktop from viewport width, pointer type and user agent, honouring a stored override.
- kbDesk: a menu bar with the clock, a dock, and windows that drag, resize, minimise, maximise, close, take focus and snap to the screen edges.
- Apps rendered from the content modules in windows: About, Experience, Projects, Skills, Certifications, Mail, Resume, Photos, Browser and Notes. Each app's code loads only when it is first opened.
- Original line icons and design tokens (colour, type, spacing, radius, blur).

**Not finished yet**

- Mail: the form is disabled until the contact endpoint is built (F30), so it never pretends to send.
- Resume: the viewer and download link are wired, but the PDF is not in `public/` yet.
- Photos: no certificate images added yet.
- Notes: empty until there is writing to publish.
- Terminal and Settings: in the dock, not built yet (milestone 6).

### Milestones

| # | Version | Scope | State |
| --- | --- | --- | --- |
| 1 | `v0.1.0` | kernel: content modules, app registry, state stores, design tokens, icons, `useDevice` | done |
| 2 | `v0.2.0` | kbDesk: menu bar, dock, window manager, About | done |
| 3 | `v0.3.0` | all content apps framed in kbDesk windows | done |
| 4 | `v0.4.0` | kbPhone: lock screen, home grid, widgets, full screen apps, control center | next |
| 5 | `v0.5.0` | `/plain` route, keyboard navigation, ARIA, reduced motion, security headers, privacy screen | |
| 6 | `v0.6.0` | spotlight search, mission control, terminal, settings, saved preferences | |
| 7 | `v0.7.0` | kbPad: dock, split view, slide-over | |
| 8 | `v0.8.0` | real clock, local weather, dynamic wallpaper, battery and network status, notifications | |
| 9 | `v0.9.0` | device switcher with handoff animation, boot and login per shell | |
| 10 | `v0.10.0` | kbVision (lazy loaded React Three Fiber), spatial invite, kbDesk fallback | |
| 11 | `v0.11.0` | visitor presence, guestbook, sticky notes, contact pipeline | |
| 12 | `v0.12.0` | security hardening, firewall notifications, honeypot, threat panel, console greeting | |
| 13 | `v0.13.0` | easter eggs, recruiter shortcut, language hello, screensaver, low-power mode | |
| 14 | `v1.0.0` | loader, polish, performance pass, deploy | |

Features are numbered F01 to F39 and used as commit scopes, for example `feat(kbos/f04): add edge snapping`.

## Run it

Node 20.9 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Resize the window or use device emulation to see the shell detection; until kbPhone and kbPad exist, every size boots kbDesk.

Checks:

```bash
npm run lint
npm run typecheck
```

## How it is put together

One kernel, many shells. The content and logic are shared; each shell is only presentation.

```
src/
  app/            layout, page and Boot, which picks the shell and code-splits it
  content/        the real portfolio data as typed modules, the single source of truth
  os/
    apps/         app registry and headless content components, one per app
    device/       useDevice and the form factor resolver
    state/        Zustand stores: windows, notifications, preferences
  shells/
    desk/         kbDesk: menu bar, dock, window chrome and the window manager
  design/         design tokens and the kbOS icon set
```

- **Apps** declare an id, name, icon and a lazy loaded content component in `src/os/apps/registry.ts`. A shell decides how to frame them: a window on kbDesk, a full screen view on kbPhone.
- **Shells** are code-split in `src/app/Boot.tsx`, so a device never downloads another shell's code.
- **Window state** (position, size, z-order, minimised, maximised, focus) lives in a Zustand store, so kbPad can reuse the same window manager.
- **Content** is never hardcoded in a component. To change any text on the site, edit `src/content/`.

Font and icon sources are listed in [CREDITS.md](CREDITS.md).
