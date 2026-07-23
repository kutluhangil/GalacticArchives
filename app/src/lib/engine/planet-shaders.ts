// GLSL for the archetype planet uber-shader plus clouds, atmosphere, rings.
// Surfaces are procedural (seeded fbm per archetype) until Gemini textures
// land; when a texture is provided the shader blends to it (uUseAlbedo).

import { NOISE_GLSL } from './noise-glsl'

// Archetype ids — keep in sync with ARCHETYPE_IDS below and types/lore.ts.
export const ARCHETYPE_IDS: Record<string, number> = {
  desert: 0,
  ecumenopolis: 1,
  lava: 2,
  ice: 3,
  'ocean-storm': 4,
  'gas-giant': 5,
  verdant: 6,
  'swamp-fog': 7,
  'crystal-red': 8,
  'dark-storm': 9,
  barren: 10,
  station: 11,
}

export const PLANET_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;
varying vec3 vPosObj;
void main() {
  vUv = uv;
  vPosObj = normalize(position);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPosW = wp.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

export const PLANET_FRAG = /* glsl */ `
uniform int uArchetype;
uniform float uSeed;
uniform float uTime;
uniform vec3 uPrimary;
uniform vec3 uSecondary;
uniform vec3 uAtmoColor;
uniform vec3 uSun1Dir;
uniform vec3 uSun1Color;
uniform vec3 uSun2Dir;
uniform vec3 uSun2Color;
uniform float uHasSun2;
uniform sampler2D uAlbedo;
uniform float uUseAlbedo;
uniform sampler2D uNight;
uniform float uUseNight;
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;
varying vec3 vPosObj;

${NOISE_GLSL}

// --- procedural surface per archetype; p = seeded unit-sphere position ---
vec3 surfaceColor(vec3 p, out float emissiveMask, out float specMask) {
  emissiveMask = 0.0;
  specMask = 0.0;
  float lat = p.y; // -1..1
  vec3 col;

  if (uArchetype == 0) { // desert: dune bands + badlands
    float dunes = fbm(p * 5.0) * 0.5 + fbm3(p * 18.0) * 0.18;
    float basins = smoothstep(0.15, 0.55, fbm(p * 2.2 + 7.0));
    col = mix(uPrimary, uSecondary, dunes * 0.9 + 0.15);
    col = mix(col, uSecondary * 0.72, basins * 0.5);
  } else if (uArchetype == 1) { // ecumenopolis: continental districts, calm day side
    float districts = fbm(p * 2.2);
    float blocks = snoise(p * 26.0) * 0.5 + snoise(p * 90.0) * 0.2;
    col = mix(uPrimary, uSecondary, 0.5 + districts * 0.3);
    col *= 0.93 + blocks * 0.07;
    specMask = 0.12;
  } else if (uArchetype == 2) { // lava: black rock + glowing channels
    float rock = fbm(p * 4.0);
    float channels = ridged(p * 3.2 + uTime * 0.004);
    float glow = smoothstep(0.78, 0.98, channels);
    col = uPrimary * (0.7 + rock * 0.5);
    col = mix(col, uSecondary, glow);
    emissiveMask = glow * 1.6 + smoothstep(0.9, 1.0, channels) * 1.4;
  } else if (uArchetype == 3) { // ice: sastrugi streaks + crevasses
    float sheets = fbm(p * 3.5) * 0.5 + 0.5;
    float cracks = smoothstep(0.72, 0.93, ridged(p * 6.0));
    col = mix(uSecondary, uPrimary, sheets);
    col = mix(col, uSecondary * 0.75, cracks * 0.5);
    specMask = 0.85;
  } else if (uArchetype == 4) { // ocean-storm: swirling sea
    vec3 warp = vec3(fbm3(p * 2.0 + uTime * 0.006), fbm3(p * 2.0 + 11.0), 0.0);
    float sea = fbm(p * 3.0 + warp * 1.4);
    float caps = smoothstep(0.55, 0.9, fbm3(p * 9.0 + warp * 2.2 + uTime * 0.012));
    col = mix(uSecondary, uPrimary, sea * 0.5 + 0.5);
    col = mix(col, vec3(0.88, 0.93, 0.96), caps * 0.35);
    specMask = 1.0;
  } else if (uArchetype == 5) { // gas giant: warped latitude bands
    float warpAmt = fbm3(p * 2.4 + uSeed) * 0.35;
    float bands = sin((lat + warpAmt) * 14.0 + uSeed) * 0.5 + 0.5;
    bands = smoothstep(0.22, 0.78, bands);
    float fine = sin((lat + warpAmt * 0.6) * 34.0 + uSeed * 2.0) * 0.5 + 0.5;
    float storms = smoothstep(0.6, 0.95, fbm(p * 4.0 + vec3(uTime * 0.003, 0.0, 0.0)));
    col = mix(uPrimary, uSecondary, bands);
    col = mix(col, col * 0.86, fine * 0.35);
    col = mix(col, uPrimary * 1.18, storms * 0.45);
  } else if (uArchetype == 6) { // verdant: continents + seas + polar caps
    float land = fbm(p * 2.6 + uSeed);
    float landMask = smoothstep(0.02, 0.12, land);
    float forest = fbm3(p * 8.0) * 0.5 + 0.5;
    vec3 sea = uSecondary * (0.75 + fbm3(p * 5.0) * 0.15);
    vec3 ground = uPrimary * (0.72 + forest * 0.5);
    col = mix(sea, ground, landMask);
    float caps = smoothstep(0.78, 0.9, abs(lat) + fbm3(p * 4.0) * 0.05);
    col = mix(col, vec3(0.92, 0.95, 0.97), caps);
    specMask = (1.0 - landMask) * 0.7;
  } else if (uArchetype == 7) { // swamp-fog: murky lowlands
    float murk = fbm(p * 3.4) * 0.5 + 0.5;
    float channels = smoothstep(0.6, 0.85, ridged(p * 5.0));
    col = mix(uSecondary, uPrimary, murk);
    col = mix(col, uSecondary * 0.6, channels * 0.6);
  } else if (uArchetype == 8) { // crystal-red: veined mineral world
    float veins = ridged(p * 4.2);
    float crust = fbm(p * 3.0) * 0.5 + 0.5;
    col = mix(uPrimary, uSecondary, smoothstep(0.62, 0.95, veins));
    col *= 0.75 + crust * 0.4;
    specMask = 0.35;
  } else if (uArchetype == 9) { // dark-storm: cracked gloom + lightning
    float plain = fbm(p * 3.6) * 0.5 + 0.5;
    float cracks = smoothstep(0.75, 0.95, ridged(p * 7.0));
    col = mix(uPrimary * 0.8, uPrimary, plain);
    col = mix(col, uSecondary, cracks * 0.5);
    float t = uTime * 0.9 + uSeed;
    float flash = step(0.985, fract(sin(floor(t * 3.0)) * 43758.5)) *
                  smoothstep(0.65, 0.95, fbm3(p * 2.0 + floor(t * 3.0)));
    emissiveMask = flash * 0.9;
  } else { // barren (10): craters + dust
    float dust = fbm(p * 4.0) * 0.5 + 0.5;
    float craters = smoothstep(0.55, 0.8, fbm3(p * 10.0 + uSeed));
    col = mix(uPrimary, uSecondary, dust * 0.6);
    col *= 1.0 - craters * 0.25;
  }
  return col;
}

void main() {
  vec3 n = normalize(vNormalW);
  vec3 v = normalize(cameraPosition - vPosW);
  vec3 p = vPosObj + vec3(uSeed * 0.37);

  float em, spec;
  vec3 base = surfaceColor(p, em, spec);
  if (uUseAlbedo > 0.5) {
    vec3 tex = texture2D(uAlbedo, vUv).rgb;
    base = mix(base, tex, uUseAlbedo);
  }

  float d1 = dot(n, uSun1Dir);
  float d2 = dot(n, uSun2Dir);
  float lit1 = clamp(d1 * 1.1, 0.0, 1.0);
  float lit2 = clamp(d2 * 1.1, 0.0, 1.0) * uHasSun2;
  float dayMix = smoothstep(-0.08, 0.18, max(d1, mix(-1.0, d2, uHasSun2)));

  vec3 col = base * (uSun1Color * lit1 * 0.85 + uSun2Color * lit2 * 0.55);
  col += base * 0.018; // deep-space ambient floor

  // specular glint (ice / ocean)
  if (spec > 0.01) {
    vec3 h = normalize(uSun1Dir + v);
    col += uSun1Color * pow(max(dot(n, h), 0.0), 48.0) * spec * lit1 * 0.5;
  }

  // night side: city lights for ecumenopolis, texture map when available
  if (uArchetype == 1) {
    float grid = smoothstep(0.42, 0.92, fbm3(p * 24.0) * 0.5 + 0.5);
    float fine = smoothstep(0.55, 0.95, fbm3(p * 70.0) * 0.5 + 0.5);
    float districts = smoothstep(0.2, 0.8, fbm(p * 2.2) * 0.5 + 0.5);
    vec3 lights = vec3(1.0, 0.82, 0.5) * (grid * 0.7 + fine * 0.5) * (0.35 + districts * 0.9);
    if (uUseNight > 0.5) lights = texture2D(uNight, vUv).rgb * 1.2;
    col += lights * (1.0 - dayMix) * 1.2;
    col += lights * 0.012; // barely-there glow bleeding into day side
  }

  col += base * em * 1.6; // lava / lightning self-emission (bloom feeds on this)

  // atmosphere rim
  float rim = pow(1.0 - max(dot(n, v), 0.0), 3.2);
  col += uAtmoColor * rim * (0.12 + 0.55 * dayMix) * 0.55;

  gl_FragColor = vec4(col, 1.0);
}
`

export const CLOUD_VERT = PLANET_VERT

export const CLOUD_FRAG = /* glsl */ `
uniform float uTime;
uniform float uSeed;
uniform float uDensity;
uniform vec3 uTint;
uniform vec3 uSun1Dir;
uniform vec3 uSun1Color;
uniform vec3 uSun2Dir;
uniform vec3 uSun2Color;
uniform float uHasSun2;
varying vec3 vNormalW;
varying vec3 vPosW;
varying vec3 vPosObj;

${NOISE_GLSL}

void main() {
  vec3 p = vPosObj * 3.2 + vec3(uSeed);
  p.xz += uTime * 0.0045;
  float cover = fbm(p) * 0.5 + 0.5;
  float detail = fbm3(p * 3.5 + uTime * 0.002) * 0.5 + 0.5;
  float alpha = smoothstep(1.0 - uDensity - 0.18, 1.0 - uDensity + 0.22, cover * 0.72 + detail * 0.28);

  vec3 n = normalize(vNormalW);
  float lit = clamp(dot(n, uSun1Dir) * 1.1, 0.0, 1.0);
  lit += clamp(dot(n, uSun2Dir) * 1.1, 0.0, 1.0) * uHasSun2 * 0.55;
  vec3 col = uTint * (0.06 + min(lit, 1.0) * 0.97);
  gl_FragColor = vec4(col, alpha * 0.82);
}
`

export const ATMO_VERT = /* glsl */ `
varying vec3 vN;
void main() {
  vN = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const ATMO_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uDensity;
varying vec3 vN;
void main() {
  float intensity = pow(max(0.62 - dot(normalize(vN), vec3(0.0, 0.0, 1.0)), 0.0), 4.2);
  gl_FragColor = vec4(uColor, 1.0) * intensity * (1.1 + uDensity * 1.3);
}
`

export const RING_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vPosW;
void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPosW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

export const RING_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uSeed;
uniform float uBone;
uniform vec3 uSun1Dir;
varying vec2 vUv;
varying vec3 vPosW;

${NOISE_GLSL}

void main() {
  // vUv.x: 0 inner edge -> 1 outer edge (RingGeometry radial axis after remap)
  float r = vUv.x;
  float bands = fbm3(vec3(r * 26.0 + uSeed, uSeed, 0.0)) * 0.5 + 0.5;
  float fine = snoise(vec3(r * 140.0, uSeed * 2.0, 0.0)) * 0.5 + 0.5;
  float density = smoothstep(0.12, 0.5, bands) * (0.55 + fine * 0.45);
  density *= smoothstep(0.0, 0.08, r) * smoothstep(1.0, 0.86, r); // soft edges
  if (uBone > 0.5) {
    float chunks = smoothstep(0.5, 0.85, fbm3(vec3(r * 60.0, uSeed, 1.7)));
    density = max(density * 0.6, chunks * 0.85);
  }
  vec3 col = uColor * (0.5 + bands * 0.6);
  gl_FragColor = vec4(col, density * 0.85);
}
`

export const STAR_VERT = /* glsl */ `
attribute float aSize;
attribute vec3 aColor;
varying vec3 vColor;
uniform float uPixelRatio;
void main() {
  vColor = aColor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(aSize * uPixelRatio * (140.0 / -mv.z), 0.6, 4.0);
}
`

export const STAR_FRAG = /* glsl */ `
varying vec3 vColor;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.05, d);
  gl_FragColor = vec4(vColor, a);
}
`
