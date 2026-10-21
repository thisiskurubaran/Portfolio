// Photosphere with limb darkening (linear law, u = 0.6 in the visible band).
// The value is far above 1 on purpose so bloom picks it up.

uniform float uIntensity;

varying vec3 vNormal;
varying vec3 vWorldPos;

const vec3 COLOR_5772K = vec3(1.0, 0.95, 0.88);

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float mu = clamp(dot(normalize(vNormal), viewDir), 0.0, 1.0);
  float limb = 1.0 - 0.6 * (1.0 - mu);
  // The limb also reddens slightly because it shows cooler, higher layers.
  vec3 color = mix(vec3(1.0, 0.7, 0.45), COLOR_5772K, mu);
  gl_FragColor = vec4(color * limb * uIntensity, 1.0);
}
