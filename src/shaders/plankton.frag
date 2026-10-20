uniform float uStrength;

varying float vGlow;

void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d) * vGlow * uStrength;
  gl_FragColor = vec4(vec3(0.35, 1.0, 0.9), min(1.0, a * 1.6));
  #include <colorspace_fragment>
}
