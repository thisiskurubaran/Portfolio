uniform vec3 uColor;
uniform float uOpacity;

varying float vEnd;

void main() {
  // Bright head, fading tail.
  gl_FragColor = vec4(uColor, uOpacity * (1.0 - vEnd * 0.8));
  #include <colorspace_fragment>
}
