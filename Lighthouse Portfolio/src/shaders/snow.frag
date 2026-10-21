uniform float uOpacity;

void main() {
  float d = length(gl_PointCoord - 0.5);
  gl_FragColor = vec4(vec3(0.95, 0.97, 1.0), smoothstep(0.5, 0.15, d) * uOpacity);
  #include <colorspace_fragment>
}
