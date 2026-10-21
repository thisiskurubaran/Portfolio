uniform float uPixelRatio;
uniform float uTime;

attribute float aAge;

varying float vGlow;

void main() {
  // Newest points glow brightest and fade as the wake settles.
  vGlow = (1.0 - aAge) * (0.75 + 0.25 * sin(uTime * 3.0 + position.x * 0.7 + position.z * 0.5));
  vec4 view = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = clamp(320.0 / -view.z, 2.0, 14.0) * uPixelRatio * (0.6 + 0.4 * (1.0 - aAge));
  gl_Position = projectionMatrix * view;
}
