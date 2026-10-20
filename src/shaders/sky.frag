uniform vec3 uHorizon;
uniform vec3 uZenith;
uniform vec3 uMoonDir;
uniform vec3 uMoonLight;

varying vec3 vDir;

void main() {
  vec3 dir = normalize(vDir);
  // Below the horizon stays at the fog color so the sea edge has no seam.
  float h = smoothstep(0.0, 0.55, dir.y);
  vec3 color = mix(uHorizon, uZenith, h);

  float halo = pow(max(dot(dir, uMoonDir), 0.0), 24.0);
  color += uMoonLight * halo * 0.035;

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
