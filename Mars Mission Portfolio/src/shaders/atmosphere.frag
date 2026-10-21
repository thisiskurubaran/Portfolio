// Thin shell drawn from the inside faces so only the limb glows. A cheap
// stand in for Rayleigh scattering: blue on the day side, orange where the
// light path grazes the terminator, nothing on the night side.

uniform vec3 uSunDir;
uniform float uSunIntensity;

varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  vec3 n = normalize(vNormal);
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float facing = dot(n, viewDir);
  // Back faces: facing runs from about 0 at the limb to -1 at the centre.
  float limb = pow(clamp(1.0 + facing, 0.0, 1.0), 6.0);
  float sun = dot(n, uSunDir);
  float lit = smoothstep(-0.35, 0.25, sun);
  vec3 blue = vec3(0.3, 0.55, 1.0);
  vec3 dusk = vec3(1.0, 0.45, 0.2);
  vec3 color = mix(dusk, blue, smoothstep(-0.1, 0.35, sun));
  gl_FragColor = vec4(color * limb * lit * uSunIntensity * 1.4, 1.0);
}
