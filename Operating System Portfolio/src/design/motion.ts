// One motion spec for framer-motion, matching the CSS --ease-out-soft and
// --spring tokens, so an app opening on the phone and a panel moving in
// folioVision settle the same way.
export const springs = {
  // Opening something: quick, with a touch of overshoot.
  open: { type: "spring", stiffness: 380, damping: 34, mass: 0.9 },
  // Closing: a little stiffer, so it gets out of the way.
  close: { type: "spring", stiffness: 420, damping: 38 },
} as const;

export const easeOutSoft = [0.3, 0.7, 0.2, 1] as const;
