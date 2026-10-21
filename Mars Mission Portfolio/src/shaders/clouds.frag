uniform sampler2D uClouds;
uniform vec3 uSunDir;
uniform float uSunIntensity;
uniform float uCloudShift;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  vec3 n = normalize(vNormal);
  float cloud = texture2D(uClouds, vUv + vec2(uCloudShift, 0.0)).r;
  float geoLight = dot(n, uSunDir);
  // Clouds catch sunlight a little past the ground terminator because they sit higher.
  float light = smoothstep(-0.12, 0.25, geoLight) * max(geoLight + 0.1, 0.0);
  // Low sun reddens the cloud tops, as it does at dusk.
  vec3 tint = mix(vec3(1.0, 0.55, 0.3), vec3(1.0), smoothstep(0.0, 0.3, geoLight));
  gl_FragColor = vec4(tint * light * uSunIntensity, cloud * 0.92);
}
