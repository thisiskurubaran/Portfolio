# Credits

## Icons
All icons in `src/design/icons.tsx` and the device outlines in the continuity strip are original line drawings made for folioOS. No third party icon set is used, and nothing is copied from Apple or Microsoft.

## Fonts
Inter by Rasmus Andersson, under the SIL Open Font License 1.1. It is downloaded at build time through `next/font` and served from the site's own origin. https://rsms.me/inter/

## Data
- Weather: [Open-Meteo.com](https://open-meteo.com/), under CC BY 4.0. Requested by the server for the visitor's city, never from the browser.

## Libraries
All under the MIT license unless noted.

| Library | Used for |
| --- | --- |
| Next.js, React | app framework |
| Tailwind CSS | design system utilities |
| Zustand | window manager and OS state |
| Framer Motion | the device handoff animation |
| three, React Three Fiber, drei | the folioVision depth field |
| zod | validating every API and realtime payload |
| Upstash Redis and Ratelimit | guestbook, sticky notes, rate limits, threat log |
| PartyKit, PartySocket | anonymous visitor presence |
