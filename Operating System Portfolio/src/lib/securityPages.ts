// Self-contained pages the proxy can return without rendering the app: no
// scripts, inline styles only, and their own strict policy.
export const STATIC_PAGE_CSP = "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'";

const shell = (title: string, body: string) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${title}</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0e1116;color:#f6f4ef;font:15px/1.5 Inter,ui-sans-serif,system-ui,sans-serif}
  .card{width:min(420px,90vw);border:1px solid rgb(255 255 255/.12);border-radius:14px;background:rgb(255 255 255/.05);padding:28px}
  .badge{display:inline-block;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#ff8f8f;border:1px solid rgb(255 120 120/.4);border-radius:999px;padding:2px 10px}
  h1{font-size:20px;margin:14px 0 6px} p{opacity:.8;margin:0 0 10px}
  label{display:block;font-size:13px;margin-top:12px;opacity:.85}
  input{width:100%;box-sizing:border-box;margin-top:4px;padding:9px;border-radius:8px;border:1px solid rgb(255 255 255/.15);background:rgb(255 255 255/.06);color:inherit}
  button{margin-top:16px;width:100%;padding:10px;border:0;border-radius:8px;background:#4cc2a8;color:#0e1116;font-weight:600}
  a{color:#6fd6bd}
</style></head><body><main class="card">${body}</main></body></html>`;

export const deniedPage = () =>
  shell(
    "folioOS Firewall",
    `<span class="badge">folioOS Firewall</span>
<h1>Access denied</h1>
<p>folioOS Firewall blocked a connection to this path. Nothing lives here.</p>
<p>If you were just exploring, the portfolio is at <a href="/">the home page</a>, and everything is also in the <a href="/plain">plain view</a>.</p>`,
  );

// F38: a decoy admin screen. It holds nothing real, and the form fields are
// never stored; submitting only records that an attempt was made.
export const honeypotPage = () =>
  shell(
    "folioOS Admin",
    `<span class="badge">folioOS Admin</span>
<h1>Sign in</h1>
<p>Restricted area.</p>
<form method="post" action="/api/honeypot">
<label>Username<input name="u" autocomplete="off"></label>
<label>Password<input name="p" type="password" autocomplete="off"></label>
<button type="submit">Sign in</button>
</form>`,
  );

export const tooManyPage = () =>
  shell(
    "folioOS Firewall",
    `<span class="badge">folioOS Firewall</span>
<h1>Slow down</h1>
<p>Too many blocked requests came from this connection, so folioOS is taking a break from it for an hour.</p>`,
  );
