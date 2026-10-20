uniform vec3 uDeep;
uniform vec3 uCrest;
uniform vec3 uMoonDir;
uniform vec3 uMoonLight;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;

varying vec3 vWorldPos;
varying float vCrest;

void main() {
  // Face normal from screen space derivatives gives the flat, low poly facets
  // without duplicating vertices on the CPU.
  vec3 n = normalize(cross(dFdx(vWorldPos), dFdy(vWorldPos)));
  if (n.y < 0.0) n = -n;

  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float diffuse = max(dot(n, uMoonDir), 0.0);
  vec3 halfDir = normalize(uMoonDir + viewDir);
  float glint = pow(max(dot(n, halfDir), 0.0), 140.0);

  float crest = smoothstep(0.1, 1.0, vCrest);
  vec3 color = mix(uDeep, uCrest, crest * 0.6);
  // Small factors: these are linear values and sRGB output brightens them a lot.
  color += uMoonLight * (diffuse * 0.018 + glint * 0.4);

  float dist = length(cameraPosition - vWorldPos);
  float fog = smoothstep(uFogNear, uFogFar, dist);
  gl_FragColor = vec4(mix(color, uFogColor, fog), 1.0);

  #include <colorspace_fragment>
}
