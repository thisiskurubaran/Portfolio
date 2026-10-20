uniform vec3 uLightDir;
uniform float uDaylight;
uniform vec3 uBeamOrigin;
uniform vec3 uBeamDir;
uniform float uBeamCos;
uniform float uBeamIntensity;
/** Distance along the beam where it meets the sea. */
uniform float uBeamHitAlong;
uniform float uBeamLength;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vColor;

void main() {
  vec3 n = normalize(vNormal);

  // Moonlight alone leaves ships as dim shapes; the beam is what reveals
  // them at night. By day the sun lights them like everything else.
  // Linear values: sRGB output lifts the night term a lot, so it stays tiny.
  float night = 0.01 + 0.025 * abs(dot(n, uLightDir));
  float day = 0.35 + 0.65 * max(dot(n, uLightDir), 0.0);
  float ambient = mix(night, day, uDaylight);

  vec3 toFrag = vWorldPos - uBeamOrigin;
  float d = length(toFrag);
  vec3 L = toFrag / d;
  float cone = smoothstep(uBeamCos, mix(uBeamCos, 1.0, 0.5), dot(L, uBeamDir));
  float atten = 1.0 / (1.0 + d * d * 0.00015);
  // The sea stops the beam, so ships past where it lands stay dark.
  float hit = uBeamHitAlong * uBeamLength;
  atten *= 1.0 - smoothstep(hit * 1.05, hit * 1.3, dot(toFrag, uBeamDir));
  // abs() so sails and other single faces light from either side.
  float lambert = 0.35 + 0.65 * abs(dot(n, -L));
  float beam = cone * atten * lambert * 1.5 * uBeamIntensity;

  vec3 color = vColor * (ambient + beam);
  float fog = smoothstep(uFogNear, uFogFar, length(cameraPosition - vWorldPos));
  gl_FragColor = vec4(mix(color, uFogColor, fog), 1.0);
  #include <colorspace_fragment>
}
