varying vec3 vBody;
varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  // Body fixed direction, so the oval turns with the ground under it.
  vBody = normalize(position);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorldPos = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
