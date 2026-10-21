// Rocket exhaust. Hottest and whitest at the nozzle, cooling to orange
// downstream, brightest along the axis where the line of sight crosses the
// most gas. Additive and HDR so bloom picks it up.

uniform float uIntensity;
uniform float uTime;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
  float along = vUv.y; // 1 at the nozzle, 0 at the tail
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float core = pow(abs(dot(normalize(vNormal), viewDir)), 1.5);
  float flicker = 0.85 + 0.15 * sin(uTime * 53.0 + vUv.x * 40.0) * sin(uTime * 31.0);
  vec3 hot = vec3(1.0, 0.92, 0.75);
  vec3 cool = vec3(1.0, 0.45, 0.12);
  vec3 color = mix(cool, hot, smoothstep(0.4, 1.0, along));
  float a = pow(along, 1.6) * core * flicker;
  gl_FragColor = vec4(color * a * uIntensity, 1.0);
}
