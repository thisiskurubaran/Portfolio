uniform float uTime;
uniform vec3 uCenter;
uniform vec3 uBox;
uniform vec2 uWind;
uniform float uFall;
uniform float uLength;
uniform float uAmount;

attribute vec3 aSeed;
/** 0 for the top of a streak, 1 for the bottom. */
attribute float aEnd;
/** Spread 0..1 so uAmount can switch drops on in a stable order. */
attribute float aRank;

varying float vEnd;

void main() {
  if (aRank > uAmount) {
    // Park unused drops outside clip space so they cost nothing to shade.
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }

  // Drops live on a world anchored grid that wraps around the camera, so
  // they stay put as the camera moves instead of sliding with it.
  vec3 corner = uCenter - uBox * 0.5;
  vec3 drift = vec3(uWind.x, -uFall, uWind.y) * uTime;
  vec3 p = mod(aSeed * uBox + drift - corner, uBox) + corner;

  vec3 dir = normalize(vec3(uWind.x, -uFall, uWind.y));
  p -= dir * uLength * aEnd;

  vEnd = aEnd;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}
