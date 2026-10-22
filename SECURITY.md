# Security

## Reporting a problem

If you find a security issue in any of the three portfolios, report it privately through GitHub: open the repository's **Security** tab and choose **Report a vulnerability**. Please do not open a public issue for it.

Include the project, the URL or file, what you did and what happened. I will reply as soon as I can and say what I plan to do about it.

## Scope

In scope: the code in this repository and the sites built from it, including their API routes (live weather, hazards and space weather feeds) and security headers.

Out of scope: the third party services the sites read from (Open-Meteo, GDACS, NOAA, NASA, CelesTrak, JPL), and reports that only list missing best practices without a way to use them.

## What the sites do and do not do

- They do not track, fingerprint or identify visitors. There are no analytics cookies or third party trackers.
- Location is city level at most, from the request's geo headers, rounded and never stored. The browser's Geolocation API is never called.
- Lighthouse and Mars Mission serve every page with a per-request nonce Content Security Policy, HSTS, `nosniff`, a strict Referrer-Policy, `X-Frame-Options: DENY` and a Permissions-Policy that denies camera, microphone and geolocation. The OS portfolio adds the same headers in its `v0.5.0` milestone.
- External feeds are fetched on the server, validated with zod and cached. A feed that fails or returns something unexpected is dropped, and the site falls back to a quiet default.
- Any defensive feature (planned for the OS portfolio) only refuses service, rate limits and logs counts. Nothing on these sites scans, probes or reaches back toward a visitor's machine.
