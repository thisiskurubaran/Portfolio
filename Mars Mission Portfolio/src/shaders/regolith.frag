// Martian ground near the rover: ochre dust over darker basalt, with
// finer mottling up close, lit by the Sun and the dusty sky, fading into
// haze toward the horizon.

uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uDaylight;
uniform vec3 uHaze;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec2 vUv;

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
    p *= 2.07;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 p = vUv;
  float n = fbm(p * 0.02);
  float fine = fbm(p * 0.9) - 0.5;
  vec3 dust = vec3(0.56, 0.3, 0.16);
  vec3 basalt = vec3(0.24, 0.15, 0.1);
  vec3 albedo = mix(dust, basalt, smoothstep(0.5, 0.7, n)) * (1.0 + 0.25 * fine);

  vec3 nrm = normalize(vNormal);
  float sun = max(dot(nrm, uSunDir), 0.0);
  vec3 lit = albedo * (uSunColor * sun * 1.6 + uHaze * 0.35) * uDaylight;
  lit += albedo * 0.003;

  float dist = length(vWorldPos.xz - cameraPosition.xz);
  float haze = 1.0 - exp(-dist / 900.0);
  gl_FragColor = vec4(mix(lit, uHaze * uDaylight * 0.9, haze), 1.0);
}
