uniform vec3 uDeep;
uniform vec3 uCrest;
uniform vec3 uMoonDir;
uniform vec3 uMoonLight;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;
uniform vec3 uBeamOrigin;
uniform vec3 uBeamDir;
uniform vec3 uBeamColor;
uniform float uBeamCos;
uniform float uBeamIntensity;

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

  // The beam is the scene's one real light, done here instead of with a
  // three.js SpotLight so the water shader stays a single pass.
  vec3 toFrag = vWorldPos - uBeamOrigin;
  float beamDist = length(toFrag);
  vec3 L = toFrag / beamDist;
  float cone = smoothstep(uBeamCos, mix(uBeamCos, 1.0, 0.75), dot(L, uBeamDir));
  float atten = 1.0 / (1.0 + beamDist * beamDist * 0.0004);
  float facingBeam = 0.35 + 0.65 * max(dot(n, -L), 0.0);
  float beamSpec = pow(max(dot(n, normalize(viewDir - L)), 0.0), 40.0);
  float beam = cone * atten * uBeamIntensity;
  color += uBeamColor * beam * (facingBeam * 0.55 + beamSpec * 0.9);

  float dist = length(cameraPosition - vWorldPos);
  float fog = smoothstep(uFogNear, uFogFar, dist);
  gl_FragColor = vec4(mix(color, uFogColor, fog), 1.0);

  #include <colorspace_fragment>
}
