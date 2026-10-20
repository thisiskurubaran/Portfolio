uniform float uTime;
uniform float uSeaState;
uniform vec2 uWindDir;

varying vec3 vWorldPos;
varying float vCrest;

// Gerstner wave: points move in small circles, which gives sharper crests
// than plain sine waves as steepness rises.
vec3 gerstner(vec2 p, vec2 dir, float wavelength, float steepness, float amp, float speed) {
  float k = 6.28318 / wavelength;
  float c = sqrt(9.8 / k) * speed;
  float f = k * (dot(dir, p) - c * uTime);
  float q = steepness / (k * amp * 4.0 + 0.0001);
  return vec3(dir.x * q * amp * cos(f), amp * sin(f), dir.y * q * amp * cos(f));
}

vec2 rotate(vec2 v, float a) {
  float s = sin(a);
  float c = cos(a);
  return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
}

void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vec2 p = world.xz;

  float s = clamp(uSeaState, 0.0, 1.0);
  float amp = mix(0.25, 3.2, s * s);
  float steep = mix(0.2, 0.9, s);
  float speed = mix(0.55, 1.4, s);
  vec2 wind = normalize(uWindDir);

  vec3 offset = vec3(0.0);
  offset += gerstner(p, wind, 38.0, steep, amp * 0.55, speed);
  offset += gerstner(p, rotate(wind, 0.6), 21.0, steep, amp * 0.3, speed);
  offset += gerstner(p, rotate(wind, -0.45), 13.0, steep, amp * 0.18, speed);
  offset += gerstner(p, rotate(wind, 1.3), 7.0, steep * 0.8, amp * 0.1, speed);

  world.xyz += offset;
  vWorldPos = world.xyz;
  vCrest = offset.y / max(amp, 0.0001);

  gl_Position = projectionMatrix * viewMatrix * world;
}
