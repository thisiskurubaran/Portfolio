uniform float uPhase;
uniform float uVisibility;
uniform vec3 uColor;

varying vec2 vUv;

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r2 = dot(p, p);
  if (r2 > 1.0) discard;

  // Treat the disc as the front of a sphere and light it from where the sun
  // sits for this phase: behind at new moon, in front at full.
  vec3 surface = vec3(p, sqrt(1.0 - r2));
  float a = 6.28318 * uPhase;
  vec3 sun = vec3(sin(a), 0.0, -cos(a));
  float lit = smoothstep(-0.06, 0.06, dot(surface, sun));

  // The dark side keeps a trace of earthshine so a thin crescent still reads as a moon.
  vec3 color = mix(uColor * 0.05, uColor, lit);
  float edge = smoothstep(1.0, 0.94, r2);
  gl_FragColor = vec4(color, edge * uVisibility);
  #include <colorspace_fragment>
}
