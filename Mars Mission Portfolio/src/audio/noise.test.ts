import { describe, expect, it } from "vitest";
import { lightTimeSeconds } from "@/physics/lightTimeDelay";
import { roundTripMs } from "@/state/commsQueue";
import { fillNoise } from "./noise";

function lcg(seed: number) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

describe("noise", () => {
  it.each(["white", "pink", "brown"] as const)("keeps %s noise bounded and centred", (colour) => {
    const out = new Float32Array(48_000);
    fillNoise(out, colour, lcg(7));
    const mean = out.reduce((a, b) => a + b, 0) / out.length;
    const peak = out.reduce((a, b) => Math.max(a, Math.abs(b)), 0);
    expect(Math.abs(mean)).toBeLessThan(0.1);
    expect(peak).toBeLessThan(1.5);
    expect(peak).toBeGreaterThan(0.05);
  });

  it("puts brown noise's energy low: neighbouring samples move together", () => {
    const out = new Float32Array(48_000);
    fillNoise(out, "brown", lcg(3));
    let num = 0;
    let den = 0;
    for (let i = 1; i < out.length; i++) {
      num += out[i]! * out[i - 1]!;
      den += out[i]! * out[i]!;
    }
    expect(num / den).toBeGreaterThan(0.9);
  });
});

describe("comms delay", () => {
  it("is a full round trip of light time", () => {
    // 1 AU apart: about 499 s each way.
    const ms = roundTripMs([1, 0, 0], [0, 0, 0], lightTimeSeconds(1));
    expect(ms / 1000).toBeCloseTo(2 * 499.0, 0);
    expect(roundTripMs([1, 0, 0], null, lightTimeSeconds(1))).toBe(0);
  });
});
