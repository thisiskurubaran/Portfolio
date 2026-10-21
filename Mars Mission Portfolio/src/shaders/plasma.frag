// Shock layer in front of the ship during aerocapture: air compressed
// ahead of the heat shield glows orange-pink, brightest on the leading edge.

uniform float uIntensity;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float edge = pow(1.0 - abs(dot(normalize(vNormal), viewDir)), 2.0);
  // vUv.y runs from the nose (1) back along the flow (0).
  float lead = smoothstep(0.0, 1.0, vUv.y);
  vec3 color = mix(vec3(1.0, 0.35, 0.25), vec3(1.0, 0.75, 0.55), lead);
  gl_FragColor = vec4(color * (0.35 + edge) * lead * uIntensity, 1.0);
}
