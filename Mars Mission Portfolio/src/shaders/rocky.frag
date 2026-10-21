// A rocky body seen from a distance, until real elevation and colour maps
// arrive with the Mars approach: bright and dark regions from noise, polar
// caps where a body has them, and a faint limb haze where it has air.
// Lit by the Sun only.

uniform vec3 uSunDir;
uniform float uSunIntensity;
uniform vec3 uLight;
uniform vec3 uDark;
uniform float uCaps;
uniform float uHaze;

varying vec3 vNormal;
varying vec3 vObjPos;

float hash(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i), hash(i + vec3(1, 0, 0)), u.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), u.x), u.y),
    mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), u.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), u.x), u.y),
    u.z
  );
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.1;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 p = normalize(vObjPos);
  float n = fbm(p * 3.0);
  // Finer mottling for close passes; it averages out to nothing from afar.
  float fine = fbm(p * 48.0) - 0.5;
  vec3 albedo = mix(uLight, uDark, smoothstep(0.48, 0.62, n)) * (1.0 + 0.35 * fine);
  float cap = uCaps * smoothstep(0.86, 0.92, abs(p.y) + 0.04 * (n - 0.5));
  albedo = mix(albedo, vec3(0.9, 0.88, 0.85), cap);

  vec3 nrm = normalize(vNormal);
  float light = max(dot(nrm, uSunDir), 0.0);
  vec3 color = albedo * light * uSunIntensity;
  float rim = pow(1.0 - abs(nrm.z), 4.0);
  color += uLight * rim * uHaze * smoothstep(-0.2, 0.3, dot(nrm, uSunDir));
  gl_FragColor = vec4(color, 1.0);
}
