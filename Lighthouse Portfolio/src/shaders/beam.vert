varying float vAlong;
varying float vWorldY;
varying vec3 vViewNormal;
varying vec3 vViewPos;
varying vec3 vViewAxis;

void main() {
  // Cone uv.y runs 0 at the wide end to 1 at the apex.
  vAlong = 1.0 - uv.y;
  vWorldY = (modelMatrix * vec4(position, 1.0)).y;
  vec4 view = modelViewMatrix * vec4(position, 1.0);
  vViewPos = view.xyz;
  vViewNormal = normalize(normalMatrix * normal);
  vViewAxis = normalize(normalMatrix * vec3(0.0, 0.0, -1.0));
  gl_Position = projectionMatrix * view;
}
