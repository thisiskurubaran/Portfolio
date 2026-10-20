uniform vec3 uColor;
uniform float uIntensity;
/** Fraction of the cone length where the axis meets the sea. */
uniform float uHitAlong;

varying float vAlong;
varying float vWorldY;
varying vec3 vViewNormal;
varying vec3 vViewPos;
varying vec3 vViewAxis;

void main() {
  vec3 toEye = normalize(-vViewPos);
  // Side on, faces seen head on are the middle of the shaft and faces seen
  // edge on are its outline, so fading by facing softens the edges.
  float facing = pow(abs(dot(normalize(vViewNormal), toEye)), 0.9);
  // Looking down the beam from the tower every face is edge on, which would
  // hide it. Blend toward an even glow as the view lines up with the axis.
  float along = abs(dot(vViewAxis, toEye));
  float body = mix(facing, 0.6, along * along) * (1.0 + 1.5 * along);

  float falloff = pow(1.0 - vAlong, 1.8);
  float nearFade = smoothstep(0.0, 0.025, vAlong);
  // Fade out before the water so the sea does not slice the cone into a disc.
  // The lit pool on the water carries the light from there.
  float endFade = 1.0 - smoothstep(uHitAlong * 0.25, uHitAlong * 0.9, vAlong);
  float waterFade = smoothstep(-0.5, 2.5, vWorldY) * endFade;

  float a = body * falloff * nearFade * waterFade * uIntensity * 0.35;
  // Additive blending in three already scales by alpha, so color stays unscaled.
  gl_FragColor = vec4(uColor, a);
  #include <colorspace_fragment>
}
