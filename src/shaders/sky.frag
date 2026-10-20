uniform vec3 uHorizon;
uniform vec3 uZenith;
uniform vec3 uMoonDir;
uniform vec3 uMoonLight;
uniform float uMoonVisibility;
uniform vec3 uSunDir;
uniform vec3 uGlowColor;
uniform float uGlow;
uniform float uFlash;

varying vec3 vDir;

void main() {
  vec3 dir = normalize(vDir);
  // Below the horizon stays at the fog color so the sea edge has no seam.
  float h = smoothstep(0.0, 0.55, dir.y);
  vec3 color = mix(uHorizon, uZenith, h);

  float halo = pow(max(dot(dir, uMoonDir), 0.0), 24.0);
  color += uMoonLight * halo * 0.035 * uMoonVisibility;

  // Dawn and dusk: a warm band along the horizon on the sun's side.
  vec2 flatDir = dir.xz / max(length(dir.xz), 1e-4);
  vec2 flatSun = uSunDir.xz / max(length(uSunDir.xz), 1e-4);
  float toward = pow(max(dot(flatDir, flatSun), 0.0), 3.0);
  float band = 1.0 - smoothstep(0.0, 0.45, dir.y);
  color += uGlowColor * toward * band * uGlow * 0.5;

  // Sun disc and a soft bloom, only while it is above the horizon.
  float sd = dot(dir, uSunDir);
  float up = smoothstep(-0.03, 0.02, uSunDir.y);
  color += vec3(1.0, 0.95, 0.85) * smoothstep(0.9993, 0.9996, sd) * up * 2.5;
  color += vec3(1.0, 0.85, 0.6) * pow(max(sd, 0.0), 180.0) * up * 0.35;

  // Lightning lights the cloud base, strongest overhead.
  color += vec3(0.5, 0.55, 0.7) * uFlash * (0.35 + 0.65 * h);

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
