varying vec3 vColor;

void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float d = dot(p, p);
  if (d > 1.0) discard;
  // Gaussian core approximates a point spread function, so stars read as
  // points of light rather than discs.
  float psf = exp(-d * 5.0);
  gl_FragColor = vec4(vColor * psf, 1.0);
}
