// A full page load on purpose: /plain and /privacy should arrive without the
// OS in memory, each with its own per-request CSP nonce.
export function leaveTo(path: "/plain" | "/privacy") {
  window.location.href = path;
}
