// Camera facing puffs: each instance is placed by its matrix, then the quad
// is spread along the camera's right and up axes so it always faces the view.

attribute float aAlpha;

varying vec2 vUv;
varying float vAlpha;

void main() {
  vUv = uv;
  vAlpha = aAlpha;
  vec4 center = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  float size = length(instanceMatrix[0].xyz);
  vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  vec3 world = center.xyz + (right * position.x + up * position.y) * size;
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
