uniform vec3 uColor;

varying vec2 vUv;
varying float vAlpha;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453);
}

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  // Lumpy edge so puffs read as billows instead of discs.
  float lump = 0.12 * hash(floor(vUv * 6.0) + vAlpha * 13.0);
  float a = smoothstep(1.0, 0.35 - lump, r) * vAlpha;
  gl_FragColor = vec4(uColor * (0.75 + 0.25 * (1.0 - r)), a);
}
