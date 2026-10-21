uniform float uTime;
uniform vec3 uCenter;
uniform vec3 uBox;
uniform vec2 uWind;
uniform float uFall;
uniform float uAmount;
uniform float uPixelRatio;

attribute vec3 aSeed;
attribute float aRank;

void main() {
  if (aRank > uAmount) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }

  vec3 corner = uCenter - uBox * 0.5;
  vec3 drift = vec3(uWind.x, -uFall, uWind.y) * uTime;
  // Flakes wander side to side as they fall.
  drift.x += sin(uTime * 0.9 + aSeed.y * 40.0) * 0.8;
  drift.z += cos(uTime * 0.7 + aSeed.x * 40.0) * 0.8;
  vec3 p = mod(aSeed * uBox + drift - corner, uBox) + corner;

  vec4 view = viewMatrix * vec4(p, 1.0);
  gl_PointSize = clamp(160.0 / -view.z, 1.5, 10.0) * uPixelRatio;
  gl_Position = projectionMatrix * view;
}
