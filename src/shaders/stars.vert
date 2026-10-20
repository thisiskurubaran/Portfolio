uniform float uTime;
uniform float uPixelRatio;
uniform float uTwinkle;

attribute float aSize;
attribute float aPhase;

varying float vAlpha;

void main() {
  vec3 dir = normalize(position);
  // Haze near the horizon hides low stars, like real sea air does.
  float haze = smoothstep(0.02, 0.16, dir.y);
  float twinkle = 1.0 - uTwinkle * 0.45 * (0.5 + 0.5 * sin(uTime * (0.6 + aPhase) + aPhase * 40.0));
  vAlpha = haze * twinkle;

  gl_PointSize = aSize * uPixelRatio;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
