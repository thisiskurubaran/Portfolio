// Auroral ovals around both geomagnetic poles, from the planetary K index.
// Oxygen at 100 to 250 km glows green (557.7 nm); higher up the red line
// (630 nm) takes over, so the top edge of a strong storm reddens.
uniform vec3 uMagPole;
uniform float uEdgeDeg;
uniform float uStrength;
uniform vec3 uSunDir;
uniform float uTime;

varying vec3 vBody;
varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  float magLat = degrees(asin(clamp(abs(dot(vBody, uMagPole)), 0.0, 1.0)));
  // The oval is a band a few degrees wide just poleward of its edge.
  float band = smoothstep(uEdgeDeg - 1.5, uEdgeDeg + 1.0, magLat) * (1.0 - smoothstep(uEdgeDeg + 4.0, uEdgeDeg + 9.0, magLat));
  // Curtains: slow ripples along the band.
  float lon = atan(vBody.z, vBody.x);
  float curtain = 0.5 + 0.5 * sin(lon * 40.0 + uTime * 0.3) * sin(lon * 13.0 - uTime * 0.17);
  // Only the night side shows it; daylight swamps the glow.
  float night = smoothstep(0.1, -0.2, dot(normalize(vNormal), uSunDir));
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  // Seen edge on near the limb, the glowing layer is thicker along the line of sight.
  float limb = 1.0 + 2.0 * pow(1.0 - abs(dot(viewDir, normalize(vNormal))), 3.0);
  vec3 green = vec3(0.2, 1.0, 0.45);
  vec3 red = vec3(0.9, 0.2, 0.3);
  // Red shows at the poleward top of the band only in strong storms.
  float strong = smoothstep(0.6, 0.9, uStrength);
  vec3 color = mix(green, red, smoothstep(uEdgeDeg + 4.0, uEdgeDeg + 8.0, magLat) * strong);
  // Faint even in a storm: aurora is a dim glow next to a sunlit planet.
  float a = band * curtain * night * min(limb, 2.0) * uStrength * 0.3;
  gl_FragColor = vec4(color * a, a);
}
