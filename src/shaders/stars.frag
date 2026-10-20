uniform float uVisibility;

varying float vAlpha;

void main() {
  vec2 p = gl_PointCoord - 0.5;
  float d = length(p);
  float core = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vec3(0.85, 0.9, 1.0), core * vAlpha * uVisibility);
  #include <colorspace_fragment>
}
