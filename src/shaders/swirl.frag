uniform float uTime;
uniform float uStrength;
uniform vec3 uTint;
uniform float uSouth;

varying vec2 vUv;

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  if (r > 1.0) discard;

  // Logarithmic spiral arms around a clear eye. Southern storms turn the other way.
  float a = atan(p.y, p.x) * uSouth;
  float arms = 0.5 + 0.5 * sin(3.0 * a + 7.0 * log(r + 0.02) - uTime * 0.4);
  float body = smoothstep(1.0, 0.25, r) * smoothstep(0.04, 0.16, r);
  float density = body * mix(0.35, 1.0, arms);

  gl_FragColor = vec4(uTint, density * uStrength);
  #include <colorspace_fragment>
}
