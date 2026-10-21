// Mars from orbit: the colour map lit by the Sun only, with a thin dust
// haze at the limb. No city lights, no oceans, no clouds worth drawing at
// this scale.

uniform sampler2D uDay;
uniform vec3 uSunDir;
uniform float uSunIntensity;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  vec3 n = normalize(vNormal);
  float geo = dot(n, uSunDir);
  vec3 albedo = texture2D(uDay, vUv).rgb;
  // A soft terminator: the thin air scatters a little light past it.
  float light = max(geo, 0.0) * smoothstep(-0.04, 0.06, geo);
  vec3 color = albedo * light * uSunIntensity;

  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float rim = pow(1.0 - max(dot(n, viewDir), 0.0), 4.0);
  color += vec3(0.85, 0.55, 0.38) * rim * 0.25 * smoothstep(-0.2, 0.3, geo) * uSunIntensity;
  gl_FragColor = vec4(color, 1.0);
}
