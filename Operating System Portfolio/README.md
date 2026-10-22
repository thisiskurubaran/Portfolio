# Operating System Portfolio (folioOS)

A developer portfolio built as an invented operating system family. The site works out what device the visitor is on and boots the matching shell, and the portfolio runs inside it as apps: About, Experience, Projects, Skills and the rest.

| Shell | Device | Style |
| --- | --- | --- |
| folioDesk | laptop and desktop | menu bar, dock, draggable windows, spotlight, mission control |
| folioPhone | phone | lock screen, home grid with widgets, full screen apps, gestures |
| folioPad | tablet | home screen with a dock, split view, slide-over |
| folioVision | opt-in | floating glass panels in faked 3D depth |

All four shells read the same content and the same design system; only the framing differs. folioVision is a browser homage to spatial computing drawn with CSS 3D over a WebGL depth field. It is not AR, and it says so on screen.

folioOS is an original design. It borrows the grammar of desktop and mobile systems (a dock, a home grid, windows) but none of their names, icons or system fonts.

## Status

`v1.1.0`: the 14 original milestones, plus a redesign (logo, design system, app layouts) and the everyday capabilities of a desktop OS.

**Before going live, the owner still needs to add:**

- `public/resume.pdf`. The Resume app and the plain view link to it.
- Certificate images in `public/certs/`, listed in `src/content/photos.ts`, for the Photos app.
- Any writing for the Notes app, in `src/content/notes.ts`.
- The service keys in [Configuration](#configuration). Each feature that needs one says "not connected" until it has it.

## What it does

**System**
- Device detection picks the shell from viewport width, pointer type and user agent. A choice made in the switcher is remembered.
- The device switcher (the "continuity strip" in Settings, the control centers and the folioDesk logo menu) relaunches the portfolio as any shell. The screen shrinks into the new device's outline and grows back as the new shell. On a big screen, folioPhone and folioPad open at device size in a frame.
- First visits get a short boot (skippable, under two seconds), a guest login on folioDesk and a lock screen on folioPhone and folioPad. Repeat visits go straight in.
- folioDesk windows drag, resize, minimise into the dock, maximise and keep their z-order. Their layout survives a reload.
- Snap layouts: drag a window to an edge or corner, hover the maximise button for halves, thirds and quarters, or use Ctrl+Alt with the arrow keys.
- Three virtual desktops: switch from the menu bar, mission control or Alt+1 to Alt+3, and move windows between them.
- A launcher with every app (F4, or the first dock icon), and an App Library one swipe left on folioPhone.
- Right-click menus on the desktop, window title bars and the dock; desktop shortcuts; File, View, Window and Help menus in the menu bar.
- A power menu in every shell: lock, sleep, restart (replays the boot) and shut down.
- Spotlight (Ctrl+Space or Ctrl+K) searches apps, roles, skills, projects and certifications, and jumps straight to the matching item.
- Mission control (Ctrl+Up or F3) shows every open window. The phone and tablet have an app switcher.
- Settings: theme (system, light, dark, or auto by local time), accent colour, wallpaper, brightness, night light, text size, high contrast, a bigger pointer, reduced motion, sound and volume, focus mode, low-power mode, the device switcher, the firewall panel and privacy.
- Quick settings in every control center, with brightness and volume sliders and toggles for sound, focus, night light and reduced motion.
- Notifications reach every shell through one system, as toasts and in a notification center or shade, with a mini calendar. Focus mode keeps them quiet. Cards swipe away on touch.
- Ctrl+/ shows every keyboard shortcut.
- Deep links such as `/?app=experience&item=role-santan-lead` open straight to an app and a section, and every app can share its link.
- Installs as an app (web app manifest), and a service worker keeps it working offline.

**Apps**

About, Experience, Projects, Skills, Certifications, Mail, Resume, Photos, Browser, Notes, Terminal, Settings, Guestbook, Files, Calendar, Clock, Calculator, Text Editor, Activity Monitor, About folioOS, and one secret app.

- **Files:** the portfolio as folders and files (documents, roles, projects, certificates, links), with list and grid views, a preview and "Open".
- **Calendar:** a real month view with career milestones taken from the experience and certification records.
- **Clock:** world clock, timer, stopwatch and an in-tab alarm.
- **Calculator:** basic and scientific modes. Spotlight answers sums too.
- **Text Editor:** a scratchpad that stays in the browser and downloads as .txt.
- **Activity Monitor:** frame rate, JS memory, network and uptime, as the browser reports them.

- **Terminal:** `help`, `whoami`, `ls`, `cat`, `open <app>`, `resume`, `theme`, `history`, tab completion and command history. A few hidden commands too.
- **Mail:** posts to a real, rate limited, moderated endpoint. It only says "sent" when the relay accepted the message.

**Live**
- Real local time and a world clock.
- City-level weather from the server's geo headers, via Open-Meteo. The browser's location API is never used.
- A dynamic wallpaper that follows the visitor's time of day.
- Battery and network status where the browser reports them.

**Social**
- An anonymous "N online" count and live cursors on folioDesk, over PartyKit. Only a random alias and a pointer position are shared.
- A guestbook and sticky notes left on the folioDesk desktop. Both allow 140 characters and one post per visitor per hour, strip links, check for abuse, and let the owner delete.

**Security (defensive only)**
- A nonce Content Security Policy per request, HSTS, a strict Permissions-Policy and the usual headers.
- zod validation on every API and realtime payload, and rate limits on every write route.
- Probe paths (`/.env`, `/.git/`, `/xmlrpc.php` and similar) get a themed "access denied" page. Admin-looking paths (`/wp-admin` and similar) get a decoy sign-in whose fields are never read.
- Injection attempts in visitor text are refused, with a "folioOS Firewall" notification.
- Blocked attempts are logged for 7 days with a salted IP hash, never the address. Repeat offenders get a one hour 429.
- Settings shows the blocked attempts as counts by kind and by country. The country comes from the request's own header.
- Nothing ever scans, probes or reaches back toward a visitor.

**Reactions**
- A recruiter shortcut for visitors arriving from job boards.
- A hello in the visitor's language when it is not English.
- An idle screensaver.
- Low-power mode, which turns on for low frame rates or save-data connections and drops blur, animation and folioVision.
- A console greeting.
- The Konami code.

**Access**
- `/plain` has the whole portfolio as semantic HTML with no OS chrome. A skip link reaches it first, and it is offered automatically on weak devices.
- Every app works by keyboard. Windows and dialogs trap and return focus.
- Reduced motion is respected, from the OS setting or the one in Settings.
- Text size, high contrast and a bigger pointer in Settings. Screen readers hear when windows open and close and when the desktop changes.
- `/privacy` explains in plain language what is stored and why.

## Run it

Node 20.9 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Without service keys, development keeps the guestbook, sticky notes and threat log in memory. To see a different shell, use the switcher in Settings or the logo menu. To try the weather locally, add `?lat=13.08&lon=80.27&city=Chennai` to the URL.

For presence, run the PartyKit server next to it:

```bash
npx partykit dev
```

Then set `NEXT_PUBLIC_PARTYKIT_HOST=127.0.0.1:1999` in `.env.local` and restart `npm run dev`.

Checks:

```bash
npm run lint
npm run typecheck
npm run build
```

## Configuration

Every service is optional. Copy `.env.example` to `.env.local` and fill in what you use.

| Variable | For |
| --- | --- |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | guestbook, sticky notes, rate limits, threat log. Without them, production refuses writes. |
| `IP_HASH_SALT` | salting the IP hash. Use a long random string. |
| `ADMIN_SECRET` | owner-only deletes |
| `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` | the Mail app's relay |
| `NEXT_PUBLIC_PARTYKIT_HOST` | presence; it is also added to the CSP's `connect-src` |

To delete a guestbook entry or sticky note, run the request below. Use `stickies` in place of `guestbook` for a note.

```bash
curl -X DELETE "https://<site>/api/admin/guestbook?id=<entry id>" -H "x-admin-secret: $ADMIN_SECRET"
```

## Deploy

1. Create an Upstash Redis database and a Resend account (with a verified sender domain if you want your own address).
2. Deploy the presence server with `npx partykit deploy`, and note the host it prints.
3. Import the repo into Vercel with this folder as the project root. Add the variables above, then deploy.

## Performance

Measured on a production build, with each shell's first screen loaded:

| Shell | JavaScript (gzip) |
| --- | --- |
| folioPhone | 208 KB |
| folioPad | 209 KB |
| folioDesk | 218 KB |
| folioVision | 450 KB, including Three.js, which loads only when folioVision is entered |

Each shell is its own chunk, so a phone never downloads folioDesk or folioVision. App content loads when the app opens.

On a local production build, `/plain` reaches first paint in about 220 ms. A Lighthouse run has not been done yet, because there was no Chrome on the build machine.

## How it is put together

One kernel, many shells. The content and logic are shared; each shell is only presentation.

```
src/
  app/            routes: the OS, /plain, /privacy, API routes; Boot picks and code-splits the shell
  proxy.ts        per-request CSP nonce, probe blocking and the honeypot
  content/        the real portfolio data as typed modules, the single source of truth
  os/
    apps/         app registry, headless app components, terminal commands
    device/       useDevice, shell catalogue, capability checks
    state/        Zustand stores: windows, notifications, preferences
    system/       clock, weather, search, launcher, presence, handoff, reactions
  shells/
    desk/         folioDesk
    phone/        folioPhone
    pad/          folioPad
    vision/       folioVision (lazy loaded)
    shared/       pieces the shells share: spotlight, sheets, widgets, boot, toasts
  design/         tokens, wallpapers, the logo, app icon tiles and line icons
  lib/            server side: store, rate limits, hashing, moderation, threat log
party/            PartyKit presence server
```

- **Apps** declare an id, name, icon and a lazy content component in `src/os/apps/registry.ts`. A shell decides how to frame them.
- **The launcher** (`src/os/system/launcher.ts`) lets the terminal, spotlight and notifications open an app without knowing which shell is running.
- **Content** is never hardcoded in a component. To change any text on the site, edit `src/content/`.

Font, icon, data and library sources are listed in [CREDITS.md](CREDITS.md).
