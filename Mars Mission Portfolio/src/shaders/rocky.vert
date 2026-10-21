varying vec3 vNormal;
varying vec3 vObjPos;

void main() {
  vObjPos = position;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
