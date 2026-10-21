// Coastal ground around the pad: sandy scrub inland, the Bay of Bengal to
// the east, fading into haze toward the horizon.

uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uDaylight;
uniform float uOpacity;

varying vec3 vWorldPos;
varying vec2 vUv;

// Coast line in the ground's own coordinates (metres east of the pad).
const float COAST_X = 1800.0;
const vec3 HAZE = vec3(0.55, 0.66, 0.82);

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return v;
}

void main() {
  // vUv carries the ground's local metres, so patterns stay fixed to the land.
  vec2 p = vUv;
  float n = fbm(p * 0.004);
  vec3 sand = vec3(0.50, 0.44, 0.34);
  vec3 scrub = vec3(0.16, 0.22, 0.10);
  vec3 albedo = mix(sand, scrub, smoothstep(0.42, 0.62, n));

  // Pad apron: concrete within 90 m of the rocket.
  float apron = 1.0 - smoothstep(85.0, 95.0, max(abs(p.x), abs(p.y)));
  albedo = mix(albedo, vec3(0.32, 0.32, 0.30), apron);

  float coast = COAST_X + (fbm(vec2(p.y * 0.0008, 3.0)) - 0.5) * 900.0;
  float water = smoothstep(coast - 40.0, coast + 40.0, p.x);
  vec3 sea = vec3(0.02, 0.06, 0.10);
  albedo = mix(albedo, sea, water);

  float sunEl = max(uSunDir.y, 0.0);
  vec3 lit = albedo * (uSunColor * sunEl * 1.5 + HAZE * 0.35) * uDaylight;

  // Sun glint on the sea.
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  vec3 halfDir = normalize(uSunDir + viewDir);
  lit += water * uSunColor * pow(max(halfDir.y, 0.0), 400.0) * 6.0 * uDaylight;

  float dist = length(vWorldPos.xz - cameraPosition.xz);
  float haze = 1.0 - exp(-dist / 14000.0);
  vec3 color = mix(lit, HAZE * uDaylight * 1.2, haze);
  // Nights are dark but not pitch black: a little sky glow on the ground.
  color += albedo * 0.004;

  gl_FragColor = vec4(color, uOpacity);
}
