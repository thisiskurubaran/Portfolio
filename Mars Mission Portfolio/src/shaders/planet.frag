// Earth surface: day albedo lit by the Sun, city lights on the night side,
// sun glint on water and shadows from the cloud layer. Output is linear HDR;
// tone mapping happens in post.

uniform sampler2D uDay;
uniform sampler2D uNight;
uniform sampler2D uWater;
uniform sampler2D uTopo;
uniform sampler2D uClouds;
uniform vec3 uSunDir;
uniform vec3 uPole;
uniform float uSunIntensity;
uniform float uCloudShift;
uniform vec2 uTexel;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;

const vec3 SUN_COLOR = vec3(1.0, 0.97, 0.93);
// Relief is exaggerated: true Earth relief is under 0.2% of the radius and
// would not show at all.
const float RELIEF = 2.5;

void main() {
  vec3 n = normalize(vNormal);
  vec3 east = normalize(cross(uPole, n) + 1e-6);
  vec3 north = cross(n, east);

  float hE = texture2D(uTopo, vUv + vec2(uTexel.x, 0.0)).r;
  float hW = texture2D(uTopo, vUv - vec2(uTexel.x, 0.0)).r;
  float hN = texture2D(uTopo, vUv + vec2(0.0, uTexel.y)).r;
  float hS = texture2D(uTopo, vUv - vec2(0.0, uTexel.y)).r;
  vec3 bumped = normalize(n - RELIEF * ((hE - hW) * east + (hN - hS) * north));

  float geoLight = dot(n, uSunDir);
  float light = max(dot(bumped, uSunDir), 0.0) * smoothstep(-0.05, 0.08, geoLight);

  vec3 day = texture2D(uDay, vUv).rgb;
  float water = texture2D(uWater, vUv).r;

  float cloud = texture2D(uClouds, vUv + vec2(uCloudShift, 0.0)).r;
  float shadow = 1.0 - 0.55 * cloud;

  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  vec3 halfDir = normalize(uSunDir + viewDir);
  float glint = pow(max(dot(n, halfDir), 0.0), 600.0) * water * step(0.0, geoLight);

  vec3 color = day * light * shadow * SUN_COLOR * uSunIntensity;
  color += glint * SUN_COLOR * uSunIntensity * 1.5 * shadow;

  // City lights fade in past the terminator, and clouds hide them too.
  float night = smoothstep(0.05, -0.15, geoLight);
  vec3 lights = texture2D(uNight, vUv).rgb;
  color += lights * lights * vec3(1.0, 0.82, 0.55) * night * (1.0 - 0.7 * cloud) * 1.6;

  // Faint blue in-scatter toward the limb on the day side.
  float rim = pow(1.0 - max(dot(n, viewDir), 0.0), 3.0);
  color += vec3(0.25, 0.45, 0.9) * rim * smoothstep(-0.2, 0.4, geoLight) * 0.6 * uSunIntensity;

  gl_FragColor = vec4(color, 1.0);
}
