// Sky seen from inside the atmosphere. An analytic stand in for Rayleigh
// and Mie scattering: blue overhead, paler at the horizon, red near a low
// Sun, a bright halo around the Sun and the disc itself. It is drawn over
// the sky layer, so its alpha lets real stars through at night and as the
// air thins on the way up.

uniform vec3 uSunDir;
uniform float uDaylight;
uniform float uAir;

varying vec3 vWorldPos;

// Earth: blue overhead, red sunsets. Mars inverts it: fine dust makes the
// day sky butterscotch and the glow around a setting Sun blue.
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uSunset;
uniform vec3 uHalo;
// cos(0.267 deg): the Sun's angular radius.
const float SUN_COS = 0.999989;

void main() {
  vec3 dir = normalize(vWorldPos - cameraPosition);
  float h = dir.y;
  float mu = dot(dir, uSunDir);
  float sunEl = uSunDir.y;

  float toHorizon = pow(1.0 - clamp(h, 0.0, 1.0), 4.0);
  vec3 color = mix(uZenith, uHorizon, toHorizon);

  // Low Sun: the horizon on the Sun's side takes the sunset colour.
  float low = 1.0 - smoothstep(0.0, 0.3, sunEl);
  color = mix(color, uSunset, low * toHorizon * pow(max(mu, 0.0) * 0.5 + 0.5, 6.0));

  // Mie forward scattering around the Sun.
  color += uHalo * (pow(max(mu, 0.0), 300.0) * 3.0 + pow(max(mu, 0.0), 16.0) * 0.35);

  // Thin air scatters less, so the sky darkens toward black with altitude.
  color *= uDaylight * mix(0.25, 1.0, uAir) * 1.4;

  // Below the horizon the dome reads as distant haze.
  if (h < 0.0) color = mix(uHorizon, uHorizon * 0.6, clamp(-h * 8.0, 0.0, 1.0)) * uDaylight * 1.2;

  float disc = step(SUN_COS, mu) * step(0.0, h + 0.005);
  color += vec3(1.0, 0.95, 0.88) * disc * 60.0 * mix(0.4, 1.0, smoothstep(0.0, 0.2, sunEl));

  float alpha = clamp(uDaylight * smoothstep(0.0, 0.25, uAir) + disc, 0.0, 1.0);
  gl_FragColor = vec4(color, alpha);
}
