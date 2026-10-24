// GLSL for the archetype planet uber-shader plus clouds, atmosphere, rings,
// and the liveliness-pass effect shaders (auroras, sparks, mist, lightning,
// Death Star greeble). Surfaces are procedural (seeded fbm per archetype)
// until Gemini textures land; uUseAlbedo blends a texture in when provided.

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
// east (+u) and north (+v) on the sphere, in world space: the relief gradient
// is measured in object space but must tilt the world-space normal
varying vec3 vTanW;
varying vec3 vBitW;
void main() {
  vUv = uv;
  vPosObj = normalize(position);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPosW = wp.xyz;
  mat3 m = mat3(modelMatrix);
  vNormalW = normalize(m * normal);
  vec3 tObj = normalize(cross(vec3(0.0, 1.0, 0.0), vPosObj) + vec3(1e-4));
  vTanW = normalize(m * tObj);
  vBitW = normalize(m * cross(vPosObj, tObj));
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

// Ring opacity as a function of radial position 0..1. Shared by the ring
// surface and by the planet shader, which looks it up to cast the ring's shadow.
const RING_DENSITY_GLSL = /* glsl */ `
float ringDensity(float r, float seed, float bone) {
  float bands = fbm3(vec3(r * 26.0 + seed, seed, 0.0)) * 0.5 + 0.5;
  float fine = snoise(vec3(r * 140.0, seed * 2.0, 0.0)) * 0.5 + 0.5;
  float density = smoothstep(0.12, 0.5, bands) * (0.55 + fine * 0.45);
  density *= smoothstep(0.0, 0.08, r) * smoothstep(1.0, 0.86, r); // soft edges
  if (bone > 0.5) {
    // Peridea's ring is purrgil bone: coarse debris with real gaps, not dust
    float chunks = smoothstep(0.45, 0.8, fbm3(vec3(r * 34.0, seed, 1.7)));
    float gaps = smoothstep(0.35, 0.6, fbm3(vec3(r * 9.0, seed * 3.0, 5.1)) * 0.5 + 0.5);
    density = chunks * gaps * 0.95;
  }
  return density;
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
uniform float uVariant; // ice: 1 = Starkiller trench-and-weapon state
uniform float uRelief;  // 0 disables normal perturbation (distant thumbnails)
uniform sampler2D uAlbedo;
uniform float uUseAlbedo;
uniform sampler2D uNight;
uniform float uUseNight;
uniform float uAtmoAmount;  // 0 airless .. 1 thick: how much grazing light reddens
uniform float uCityLights;  // procedural settlement lights where no night map ships
uniform float uCloudCover;  // 0 = no cloud deck; else the deck's density (shadows)
uniform float uCloudSpeed;
uniform float uCloudSeed;
uniform vec2 uRingRadii;    // inner, outer; outer 0 = no rings
uniform vec3 uRingNormal;
uniform float uRingBone;
uniform vec4 uMoons[4];     // xyz world centre, w radius — eclipse casters
uniform int uMoonCount;
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;
varying vec3 vPosObj;
varying vec3 vTanW;
varying vec3 vBitW;

${NOISE_GLSL}
${RING_DENSITY_GLSL}

float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

/** fraction of direct sunlight blocked on its way to this point: the ring
 *  plane, eclipsing moons and the drifting cloud deck */
float sunOcclusion(vec3 sunDir) {
  float block = 0.0;
  if (uRingRadii.y > 0.0) {
    float denom = dot(sunDir, uRingNormal);
    if (abs(denom) > 1e-3) {
      float t = -dot(vPosW, uRingNormal) / denom;
      if (t > 0.0) {
        float r = length(vPosW + sunDir * t);
        float rr = (r - uRingRadii.x) / (uRingRadii.y - uRingRadii.x);
        if (rr > 0.0 && rr < 1.0) block = max(block, ringDensity(rr, uSeed, uRingBone) * 0.85);
      }
    }
  }
  for (int i = 0; i < 4; i++) {
    if (i >= uMoonCount) break;
    vec3 toC = uMoons[i].xyz - vPosW;
    float t = dot(toC, sunDir);
    if (t > 0.0) {
      float d = length(toC - sunDir * t);
      float r = uMoons[i].w;
      block = max(block, 1.0 - smoothstep(r * 0.8, r * 1.3, d)); // umbra + soft penumbra
    }
  }
  if (uCloudCover > 0.0) {
    // same field CLOUD_FRAG draws, sampled a step toward the sun so the shadow
    // falls beside its cloud instead of hiding underneath it
    vec3 tObj = normalize(cross(vec3(0.0, 1.0, 0.0), vPosObj) + vec3(1e-4));
    vec3 q = vPosObj + (dot(sunDir, vTanW) * tObj + dot(sunDir, vBitW) * cross(vPosObj, tObj)) * 0.018;
    vec3 c = q * 3.2 + vec3(uCloudSeed);
    c.xz += uTime * uCloudSpeed;
    float cover = fbm(c) * 0.5 + 0.5;
    float a = smoothstep(1.0 - uCloudCover - 0.18, 1.0 - uCloudCover + 0.22, cover * 0.72 + 0.14);
    block = max(block, a * 0.42);
  }
  return block;
}

// --- procedural surface per archetype; p = seeded unit-sphere position ---
vec3 surfaceColor(vec3 p, float rim, out float emissiveMask, out vec3 emissiveColor, out float specMask) {
  emissiveMask = 0.0;
  emissiveColor = uSecondary;
  specMask = 0.0;
  // true latitude from the unshifted object normal: p carries a per-planet
  // seed offset, so p.y would put bands and trenches off the actual equator
  float lat = vPosObj.y; // -1..1
  vec3 col;

  if (uArchetype == 0) { // desert: dune bands + badlands + drifting sandstorm
    // heat shimmer: high-frequency wobble of the sample point near the limb
    vec3 ps = p + vec3(
      snoise(p * 40.0 + uTime * 0.9),
      snoise(p * 40.0 + 31.0 + uTime * 0.9),
      0.0) * 0.006 * rim;
    float dunes = fbm(ps * 5.0) * 0.5 + fbm3(ps * 18.0) * 0.18;
    float basins = smoothstep(0.15, 0.55, fbm(ps * 2.2 + 7.0));
    col = mix(uPrimary, uSecondary, dunes * 0.9 + 0.15);
    col = mix(col, uSecondary * 0.72, basins * 0.5);
    // sparse slow-roaming sandstorm blotch
    float storm = smoothstep(0.42, 0.72, fbm(p * 1.4 + vec3(uTime * 0.006, 0.0, uTime * 0.004) + uSeed));
    col = mix(col, col * vec3(0.86, 0.74, 0.58), storm * 0.4);
  } else if (uArchetype == 1) { // ecumenopolis: continental districts, calm day side
    float districts = fbm(p * 2.2);
    float blocks = snoise(p * 26.0) * 0.5 + snoise(p * 90.0) * 0.25;
    // canyons between the megablocks: without them the day face is a grey ball
    float canyons = smoothstep(0.55, 0.95, ridged(p * 16.0));
    float plazas = smoothstep(0.72, 0.95, fbm3(p * 6.0) * 0.5 + 0.5);
    col = mix(uPrimary, uSecondary, 0.5 + districts * 0.32);
    col *= 0.74 + blocks * 0.34;
    col = mix(col, col * vec3(0.46, 0.5, 0.58), canyons * 0.55);
    col = mix(col, vec3(0.78, 0.76, 0.7), plazas * 0.3);
    specMask = 0.2;
  } else if (uArchetype == 2) { // lava: black rock + flowing glowing channels
    float rock = fbm(p * 4.0);
    float channels = ridged(p * 3.2 + vec3(uTime * 0.022, 0.0, uTime * 0.014));
    float glow = smoothstep(0.78, 0.98, channels);
    col = uPrimary * (0.7 + rock * 0.5);
    col = mix(col, uSecondary, glow);
    float pulse = 0.85 + 0.3 * sin(uTime * 1.7 + fbm3(p * 3.0) * 6.0);
    emissiveMask = (glow * 1.6 + smoothstep(0.9, 1.0, channels) * 1.4) * pulse;
  } else if (uArchetype == 3) { // ice: sastrugi streaks + crevasses (+ Starkiller variant)
    float sheets = fbm(p * 3.5) * 0.5 + 0.5;
    float cracks = smoothstep(0.72, 0.93, ridged(p * 6.0));
    col = mix(uSecondary, uPrimary, sheets);
    col = mix(col, uSecondary * 0.75, cracks * 0.5);
    specMask = 0.85;
    if (uVariant > 0.5) { // Starkiller Base: equatorial weapon trench + red glow
      float trench = smoothstep(0.06, 0.035, abs(lat - 0.02));
      col = mix(col, vec3(0.16, 0.17, 0.2), trench * 0.9);
      float glowline = smoothstep(0.016, 0.0, abs(lat - 0.02));
      emissiveMask += glowline * 1.5;
      emissiveColor = vec3(1.0, 0.14, 0.1);
      specMask *= 1.0 - trench;
    }
  } else if (uArchetype == 4) { // ocean-storm: rotating storm cells + lightning
    vec3 pr = rotY(p, uTime * 0.010);
    vec3 warp = vec3(fbm3(pr * 2.0 + uTime * 0.006), fbm3(pr * 2.0 + 11.0), 0.0);
    float sea = fbm(pr * 3.0 + warp * 1.4);
    float caps = smoothstep(0.55, 0.9, fbm3(pr * 9.0 + warp * 2.2 + uTime * 0.012));
    col = mix(uSecondary, uPrimary, sea * 0.5 + 0.5);
    col = mix(col, vec3(0.88, 0.93, 0.96), caps * 0.35);
    specMask = 1.0;
    // lightning: a random storm cell flashes for a couple frames (Kamino signature)
    float cell = smoothstep(0.5, 0.85, fbm3(pr * 5.0 + 3.3));
    float tick = floor(uTime * 2.4);
    float cellId = hash31(floor(pr * 3.0) + tick);
    float flash = step(0.965, cellId) * step(0.4, cell);
    emissiveMask = flash * 1.1;
    emissiveColor = vec3(0.82, 0.9, 1.0);
  } else if (uArchetype == 5) { // gas giant: differential band rotation + drifting storm ovals
    // differential rotation: each latitude belt drifts at its own rate
    float bandSpeed = mix(0.006, 0.017, 0.5 + 0.5 * cos(lat * 7.0 + uSeed));
    vec3 pr = rotY(p, uTime * bandSpeed);
    // turbulence rides along the belts instead of swamping them
    float warpAmt = fbm3(pr * 2.4 + uSeed) * 0.06;
    float bands = sin((lat + warpAmt) * 13.0 + uSeed) * 0.5 + 0.5;
    bands = smoothstep(0.18, 0.82, bands);
    float fine = sin((lat + warpAmt * 0.6) * 38.0 + uSeed * 2.0) * 0.5 + 0.5;
    float storms = smoothstep(0.68, 0.95, fbm(pr * 3.4 + vec3(uTime * 0.006, 0.0, 0.0)));
    col = mix(uPrimary, uSecondary, bands);
    col = mix(col, col * 0.86, fine * 0.3);
    col = mix(col, uPrimary * 1.22, storms * 0.5);
  } else if (uArchetype == 6) { // verdant: continents + seas + polar caps + cloud shadows
    float land = fbm(p * 2.6 + uSeed);
    float landMask = smoothstep(0.02, 0.12, land);
    float forest = fbm3(p * 8.0) * 0.5 + 0.5;
    vec3 sea = uSecondary * (0.75 + fbm3(p * 5.0) * 0.15);
    vec3 ground = uPrimary * (0.72 + forest * 0.5);
    col = mix(sea, ground, landMask);
    float caps = smoothstep(0.78, 0.9, abs(lat) + fbm3(p * 4.0) * 0.05);
    col = mix(col, vec3(0.92, 0.95, 0.97), caps);
    specMask = (1.0 - landMask) * 0.7;
  } else if (uArchetype == 7) { // swamp-fog: murky lowlands, slow churn
    float murk = fbm(p * 3.4 + vec3(uTime * 0.003, 0.0, 0.0)) * 0.5 + 0.5;
    float channels = smoothstep(0.6, 0.85, ridged(p * 5.0));
    col = mix(uSecondary, uPrimary, murk);
    col = mix(col, uSecondary * 0.6, channels * 0.6);
  } else if (uArchetype == 8) { // crystal-red: veined mineral world
    float veins = ridged(p * 4.2);
    float crust = fbm(p * 3.0) * 0.5 + 0.5;
    col = mix(uPrimary, uSecondary, smoothstep(0.62, 0.95, veins));
    col *= 0.75 + crust * 0.4;
    specMask = 0.35;
  } else if (uArchetype == 9) { // dark-storm: cracked gloom + scudding cloud cap + lightning
    float plain = fbm(p * 3.6) * 0.5 + 0.5;
    float cracks = smoothstep(0.68, 0.95, ridged(p * 7.0));
    // lift the base tone well above the near-black palette so relief reads at all
    col = mix(uPrimary * 1.5, uPrimary * 2.6, plain);
    col = mix(col, uSecondary * 2.2 + vec3(0.05, 0.04, 0.09), cracks * 0.8);
    float scud = fbm(p * 2.5 + vec3(uTime * 0.012, 0.0, uTime * 0.007)) * 0.5 + 0.5;
    vec3 cloudTone = vec3(0.16, 0.15, 0.22);
    col = mix(col, cloudTone, smoothstep(0.4, 0.85, scud) * 0.7);
    // three independent storm cells flashing on their own clocks
    float flash = 0.0;
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float t = uTime * (1.1 + fi * 0.37) + uSeed + fi * 13.0;
      float tick = floor(t * 2.2);
      flash += step(0.7, hash11(tick + fi * 5.0)) *
               smoothstep(0.45, 0.9, fbm3(p * 2.6 + tick * 0.7 + fi * 9.0));
    }
    emissiveMask = min(flash, 1.4) * 1.5;
    emissiveColor = vec3(0.72, 0.82, 1.0);
  } else { // barren (10): craters + dust
    float dust = fbm(p * 4.0) * 0.5 + 0.5;
    float craters = smoothstep(0.55, 0.8, fbm3(p * 10.0 + uSeed));
    col = mix(uPrimary, uSecondary, dust * 0.6);
    col *= 1.0 - craters * 0.25;
  }
  return col;
}

// --- relief ---
// Height field mirroring each archetype's dominant landform. Shading the
// gradient of this is what turns a painted sphere into terrain: dunes, ridges
// and crater rims pick up the terminator instead of reading as flat colour.
float surfaceHeight(vec3 q) {
  if (uArchetype == 0) return fbm3(q * 5.0) * 0.7 + ridged2(q * 15.0) * 0.3;      // dunes
  if (uArchetype == 1) return fbm3(q * 2.2) * 0.35 + snoise(q * 26.0) * 0.12;     // city blocks
  if (uArchetype == 2) return fbm3(q * 4.0) * 0.8 + ridged2(q * 9.0) * 0.35;      // lava rock
  if (uArchetype == 3) return fbm3(q * 3.5) * 0.6 + ridged2(q * 12.0) * 0.45;     // sastrugi
  if (uArchetype == 4) return fbm3(q * 9.0) * 0.25;                               // swell
  if (uArchetype == 6) return fbm3(q * 3.2) * 0.9 + ridged2(q * 11.0) * 0.4;      // mountains
  if (uArchetype == 7) return fbm3(q * 4.5) * 0.4;                                // wetland
  if (uArchetype == 8) return ridged2(q * 7.0) * 0.9 + ridged2(q * 22.0) * 0.35;  // crystal
  if (uArchetype == 9) return fbm3(q * 3.0) * 0.5;                                // dark rock
  if (uArchetype == 10) return fbm3(q * 3.6) * 0.75 + ridged2(q * 13.0) * 0.5;    // craters
  return 0.0; // gas giants and stations have no solid relief
}

/** how hard the relief bites, per archetype */
float reliefStrength() {
  if (uArchetype == 5 || uArchetype == 11) return 0.0;
  if (uArchetype == 1) return 0.5;
  if (uArchetype == 4) return 0.35;
  if (uArchetype == 7 || uArchetype == 9) return 0.6;
  return 1.0;
}

void main() {
  vec3 n = normalize(vNormalW);
  vec3 v = normalize(cameraPosition - vPosW);
  vec3 p = vPosObj + vec3(uSeed * 0.37);
  float rim = pow(1.0 - max(dot(n, v), 0.0), 3.2);

  // perturb the normal along the surface gradient (east, north)
  float relief = reliefStrength() * uRelief;
  if (relief > 0.0) {
    vec2 g;
    if (uUseAlbedo > 0.5) {
      // the painted map carries the real landforms; procedural noise would
      // raise ridges the texture does not have, so bump from its luminance.
      // Divided by the texel's arc length so 1k/2k/4k tiers bite the same.
      vec2 texel = 1.0 / vec2(textureSize(uAlbedo, 0));
      float hl = luma(texture2D(uAlbedo, vUv - vec2(texel.x, 0.0)).rgb);
      float hr = luma(texture2D(uAlbedo, vUv + vec2(texel.x, 0.0)).rgb);
      float hd = luma(texture2D(uAlbedo, vUv - vec2(0.0, texel.y)).rgb);
      float hu = luma(texture2D(uAlbedo, vUv + vec2(0.0, texel.y)).rgb);
      g = vec2((hr - hl) / (texel.x * 12.566), (hu - hd) / (texel.y * 6.283)) * 0.35;
    } else {
      vec3 tangent = normalize(cross(vec3(0.0, 1.0, 0.0), vPosObj) + vec3(1e-4));
      vec3 bitangent = cross(vPosObj, tangent);
      float eps = 0.014;
      float h0 = surfaceHeight(p);
      g = vec2(surfaceHeight(p + tangent * eps) - h0, surfaceHeight(p + bitangent * eps) - h0) / eps;
    }
    // clamped: an unbounded gradient tips normals past the terminator and the
    // surface breaks into hard black speckle
    g = clamp(g, vec2(-8.0), vec2(8.0));
    n = normalize(n - (g.x * vTanW + g.y * vBitW) * relief * 0.012);
  }

  float em;
  vec3 emColor;
  float spec;
  vec3 base = surfaceColor(p, rim, em, emColor, spec);
  if (uUseAlbedo > 0.5) {
    vec3 tex = texture2D(uAlbedo, vUv).rgb;
    base = mix(base, tex, uUseAlbedo);
  }

  float d1 = dot(n, uSun1Dir);
  float d2 = dot(n, uSun2Dir);
  float lit1 = clamp(d1 * 1.1, 0.0, 1.0) * (1.0 - sunOcclusion(uSun1Dir));
  float lit2 = clamp(d2 * 1.1, 0.0, 1.0) * uHasSun2;
  if (uHasSun2 > 0.5) lit2 *= 1.0 - sunOcclusion(uSun2Dir);
  float dayMix = smoothstep(-0.08, 0.18, max(d1, mix(-1.0, d2, uHasSun2)));

  // sunlight grazing through an atmosphere reddens toward the terminator
  vec3 graze = vec3(1.0, 0.6, 0.36);
  vec3 tint1 = mix(vec3(1.0), mix(graze, vec3(1.0), smoothstep(0.0, 0.32, d1)), uAtmoAmount);
  vec3 tint2 = mix(vec3(1.0), mix(graze, vec3(1.0), smoothstep(0.0, 0.32, d2)), uAtmoAmount);
  vec3 col = base * (uSun1Color * tint1 * lit1 * 0.85 + uSun2Color * tint2 * lit2 * 0.55);
  // deep-space ambient floor + faint cool starlight on the night side
  col += base * 0.022;
  col += base * vec3(0.38, 0.48, 0.72) * 0.055 * (1.0 - dayMix);

  // specular glint (ice / ocean)
  if (spec > 0.01) {
    vec3 h = normalize(uSun1Dir + v);
    col += uSun1Color * pow(max(dot(n, h), 0.0), 48.0) * spec * lit1 * 0.5;
    if (uArchetype == 3) {
      // snow-crystal glitter: sparse facets that catch the sun, reshuffled as
      // the view angle changes so the field twinkles while you orbit
      float facet = step(0.9975, hash31(floor(p * 420.0) + floor(dot(v, n) * 40.0)));
      col += uSun1Color * facet * pow(max(dot(n, h), 0.0), 6.0) * lit1 * 0.9;
    }
  }

  // night lights on every other world: the painted night map where one ships
  // (only the ecumenopolis branch below used to read it), else procedural
  // settlement clusters on populous worlds
  if (uArchetype != 1 && (uUseNight > 0.5 || uCityLights > 0.0)) {
    vec3 lights;
    if (uUseNight > 0.5) {
      lights = texture2D(uNight, vUv).rgb * 1.2;
    } else {
      float clusters = smoothstep(0.3, 0.75, fbm(p * 3.0 + 17.0) * 0.5 + 0.5);
      float towns = smoothstep(0.55, 0.95, fbm3(p * 28.0) * 0.5 + 0.5);
      float sparks = step(0.982, hash31(floor(p * 160.0)));
      lights = vec3(1.0, 0.78, 0.45) * clusters * (towns * 0.9 + sparks * 0.6) * uCityLights;
      // painted seas are blue-dominant: keep the oceans dark
      if (uUseAlbedo > 0.5) lights *= 1.0 - smoothstep(-0.02, 0.06, base.b - max(base.r, base.g));
    }
    col += lights * (1.0 - dayMix) * 1.1;
  }

  // night side: city lights + flowing traffic lanes for ecumenopolis
  if (uArchetype == 1) {
    float grid = smoothstep(0.42, 0.92, fbm3(p * 24.0) * 0.5 + 0.5);
    float fine = smoothstep(0.55, 0.95, fbm3(p * 70.0) * 0.5 + 0.5);
    float districts = smoothstep(0.2, 0.8, fbm(p * 2.2) * 0.5 + 0.5);
    // block-by-block flicker: whole districts breathe slightly
    float flick = 0.9 + 0.16 * hash31(floor(p * 20.0) + floor(uTime * 1.6));
    vec3 lights = vec3(1.0, 0.82, 0.5) * (grid * 0.7 + fine * 0.5) * (0.35 + districts * 0.9) * flick;
    if (uUseNight > 0.5) lights = texture2D(uNight, vUv).rgb * 1.2;
    // traffic lanes: bright dashes streaming along latitude-parallel rings
    float lon = atan(vPosObj.z, vPosObj.x) / 6.28318 + 0.5;
    float lanes = 0.0;
    for (int i = 0; i < 4; i++) {
      float fi = float(i);
      float laneLat = -0.42 + fi * 0.27 + hash11(uSeed + fi) * 0.1;
      float band = exp(-pow((vPosObj.y - laneLat) * 110.0, 2.0));
      float dir = mix(-1.0, 1.0, step(0.5, hash11(fi + uSeed * 3.0)));
      float dashes = smoothstep(0.82, 0.98, fract((lon * dir + uTime * (0.014 + fi * 0.004)) * 34.0));
      lanes += band * dashes;
    }
    lights += vec3(0.85, 0.95, 1.0) * lanes * 1.4;
    col += lights * (1.0 - dayMix) * 1.2;
    col += lights * 0.012; // barely-there glow bleeding into day side
    // day side: fleeting micro-glints (ship hulls catching the sun)
    float glint = step(0.9965, hash31(floor(p * 90.0) + floor(uTime * 2.5)));
    col += vec3(1.0) * glint * dayMix * 0.3;
  }

  col += emColor * em * 1.6; // lava / lightning self-emission (bloom feeds on this)

  // iridescence: crystal worlds shift hue with view angle (Mandalore glass)
  if (uArchetype == 8) {
    vec3 shift = 0.5 + 0.5 * cos(6.28318 * dot(n, v) * 1.6 + vec3(0.0, 2.1, 4.2) + uSeed);
    col = mix(col, col * (0.6 + shift * 1.1), 0.24);
  }

  // atmosphere rim
  col += uAtmoColor * rim * (0.12 + 0.55 * dayMix) * 0.55;

  gl_FragColor = vec4(col, 1.0);
}
`

export const CLOUD_VERT = PLANET_VERT

export const CLOUD_FRAG = /* glsl */ `
uniform float uTime;
uniform float uSeed;
uniform float uDensity;
uniform float uSpeed;
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
  p.xz += uTime * uSpeed;
  float cover = fbm(p) * 0.5 + 0.5;
  float detail = fbm3(p * 3.5 + uTime * 0.002) * 0.5 + 0.5;
  float alpha = smoothstep(1.0 - uDensity - 0.18, 1.0 - uDensity + 0.22, cover * 0.72 + detail * 0.28);

  vec3 n = normalize(vNormalW);
  float lit = clamp(dot(n, uSun1Dir) * 1.1, 0.0, 1.0);
  lit += clamp(dot(n, uSun2Dir) * 1.1, 0.0, 1.0) * uHasSun2 * 0.55;
  vec3 col = uTint * (0.06 + min(lit, 1.0) * 0.97);
  gl_FragColor = vec4(col, alpha * 0.72);
}
`

export const ATMO_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vNW;
varying vec3 vPosW;
void main() {
  vN = normalize(normalMatrix * normal);
  vNW = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPosW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

export const ATMO_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uDensity;
uniform float uTime;
uniform vec3 uSun1Dir;
uniform vec3 uSun1Color;
uniform vec3 uSun2Dir;
uniform float uHasSun2;
uniform vec3 uGlow; // night-side self-glow (lava worlds light their own sky)
varying vec3 vN;
varying vec3 vNW;
varying vec3 vPosW;
void main() {
  float intensity = pow(max(0.62 - dot(normalize(vN), vec3(0.0, 0.0, 1.0)), 0.0), 4.2);
  vec3 nw = normalize(vNW);
  float s = max(dot(nw, uSun1Dir), mix(-1.0, dot(nw, uSun2Dir), uHasSun2));
  // the lit limb scatters sunlight; the night limb keeps only a faint airglow
  float day = smoothstep(-0.25, 0.4, s);
  // sunset band where the terminator meets the limb
  float dusk = smoothstep(-0.3, -0.02, s) * (1.0 - smoothstep(-0.02, 0.3, s));
  // forward scattering: a sun behind the world lights the whole rim
  float forward = pow(max(dot(normalize(vPosW - cameraPosition), uSun1Dir), 0.0), 6.0);
  vec3 col = uColor * (0.1 + day * 0.9) + vec3(1.0, 0.52, 0.26) * dusk * 0.7 + uSun1Color * forward * 0.8;
  col += uGlow * (1.0 - day);
  float breath = 1.0 + 0.05 * sin(uTime * 0.55); // slow atmospheric breathing
  gl_FragColor = vec4(col, 1.0) * intensity * (1.1 + uDensity * 1.3) * breath;
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
${RING_DENSITY_GLSL}

void main() {
  // vUv.x: 0 inner edge -> 1 outer edge (RingGeometry radial axis after remap)
  float r = vUv.x;
  float density = ringDensity(r, uSeed, uBone);
  float bands = fbm3(vec3(r * 26.0 + uSeed, uSeed, 0.0)) * 0.5 + 0.5;
  vec3 col = uColor * (0.5 + bands * 0.6);
  // the globe (unit sphere at the origin) shadows the ring behind it
  float b = dot(vPosW, uSun1Dir);
  float disc = b * b - (dot(vPosW, vPosW) - 1.0);
  float shadow = smoothstep(-0.03, 0.06, disc) * step(b, 0.0);
  col *= 1.0 - shadow * 0.88;
  gl_FragColor = vec4(col, density * 0.85);
}
`

export const STAR_VERT = /* glsl */ `
attribute float aSize;
attribute vec3 aColor;
attribute float aPhase;
varying vec3 vColor;
varying float vPhase;
uniform float uPixelRatio;
void main() {
  vColor = aColor;
  vPhase = aPhase;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  // the sprite carries a soft halo, so it needs a few pixels of room to fall
  // off in; brightness rather than size is what separates faint from bright
  gl_PointSize = clamp(aSize * uPixelRatio * (150.0 / -mv.z), 1.0, 7.0);
}
`

export const STAR_FRAG = /* glsl */ `
uniform float uTime;
uniform float uOpacity;
varying vec3 vColor;
varying float vPhase;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  // gaussian core plus a wide faint skirt: a hard-edged disc reads as a
  // painted dot, this reads as a point source seen through an atmosphere
  float core = exp(-d * d * 42.0);
  float halo = exp(-d * d * 7.0) * 0.22;
  float a = (core + halo) * uOpacity;
  // gentle twinkle — a subset of stars breathes, never strobing
  float tw = 0.82 + 0.18 * sin(uTime * (0.6 + vPhase * 2.4) + vPhase * 40.0);
  gl_FragColor = vec4(vColor, a * tw);
}
`

// --- liveliness-pass effect shaders -----------------------------------------

/** Aurora curtain over a pole: an open cylinder strip, additive, waving. */
// Nebula haze and dust lanes: one draw call each. Every point is a wide soft
// gaussian puff; hundreds of overlapping puffs at mixed scales merge into
// continuous unresolved light, which is what separates a photographed galaxy
// from a field of dots.
export const HAZE_VERT = /* glsl */ `
attribute float aSize;
attribute vec3 aColor;
attribute float aAlpha;
varying vec3 vColor;
varying float vAlpha;
uniform float uPixelRatio;
void main() {
  vColor = aColor;
  vAlpha = aAlpha;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(aSize * uPixelRatio * (150.0 / -mv.z), 2.0, 620.0);
}
`

export const HAZE_FRAG = /* glsl */ `
uniform float uOpacity;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float a = exp(-d * d * 11.0) - 0.063; // subtract the value at the cut edge
  gl_FragColor = vec4(vColor, max(a, 0.0) * vAlpha * uOpacity);
}
`

export const AURORA_VERT = /* glsl */ `
varying vec2 vUv;
uniform float uTime;
void main() {
  vUv = uv;
  vec3 pos = position;
  // curtain sway: bend the strip in/out as it waves
  float sway = sin(uv.x * 14.0 + uTime * 0.7) * 0.02 + sin(uv.x * 5.0 - uTime * 0.35) * 0.03;
  pos.xz *= 1.0 + sway;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

export const AURORA_FRAG = /* glsl */ `
uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
varying vec2 vUv;
void main() {
  float wave = sin(vUv.x * 22.0 + uTime * 0.9) * 0.5 + 0.5;
  float wave2 = sin(vUv.x * 7.0 - uTime * 0.5 + 1.7) * 0.5 + 0.5;
  float curtain = 0.45 + wave * 0.3 + wave2 * 0.25;
  // vertical falloff: bright base fading upward
  float vert = smoothstep(0.0, 0.15, vUv.y) * (1.0 - smoothstep(0.25, 1.0, vUv.y / curtain));
  vec3 col = mix(uColorA, uColorB, vUv.y * 1.6 + wave2 * 0.2);
  gl_FragColor = vec4(col, vert * 0.5);
}
`

/** Rising ember sparks over lava worlds (Points). */
export const SPARK_VERT = /* glsl */ `
attribute vec3 aDir;
attribute float aPhase;
attribute float aSpeed;
uniform float uTime;
uniform float uPixelRatio;
varying float vLife;
void main() {
  float life = fract(uTime * aSpeed + aPhase);
  vLife = life;
  vec3 pos = aDir * (1.005 + life * 0.13);
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp((2.6 - life * 2.0) * uPixelRatio * (60.0 / -mv.z), 0.5, 5.0);
}
`

export const SPARK_FRAG = /* glsl */ `
varying float vLife;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  if (length(c) > 0.5) discard;
  float fade = (1.0 - vLife) * (1.0 - vLife);
  vec3 col = mix(vec3(1.0, 0.72, 0.25), vec3(0.8, 0.2, 0.05), vLife);
  gl_FragColor = vec4(col, fade * 0.9);
}
`

/** Translucent seeping-mist shell (Dathomir's red haze). */
export const MIST_FRAG = /* glsl */ `
uniform float uTime;
uniform float uSeed;
uniform vec3 uColor;
varying vec3 vNormalW;
varying vec3 vPosW;
varying vec3 vPosObj;

${NOISE_GLSL}

void main() {
  vec3 n = normalize(vNormalW);
  vec3 v = normalize(cameraPosition - vPosW);
  float rim = pow(1.0 - abs(dot(n, v)), 1.6);
  float wisps = fbm(vPosObj * 3.0 + vec3(uSeed) + vec3(uTime * 0.014, uTime * 0.006, 0.0)) * 0.5 + 0.5;
  float alpha = smoothstep(0.35, 0.85, wisps) * rim * 0.55;
  gl_FragColor = vec4(uColor, alpha);
}
`

/** Vertical lightning column billboard (Exegol). Flash timing per-column. */
export const BOLT_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const BOLT_FRAG = /* glsl */ `
uniform float uTime;
uniform float uId;
varying vec2 vUv;

${NOISE_GLSL}

void main() {
  float tick = floor(uTime * 2.2 + uId * 7.31);
  float on = step(0.45, hash11(tick + uId));
  // sub-frame flicker inside the flash window
  float strobe = 0.6 + 0.4 * hash11(floor(uTime * 26.0) + uId);
  float jag = snoise(vec3(vUv.y * 7.0, tick + uId, 0.0)) * 0.16;
  float d = abs(vUv.x - 0.5 + jag);
  float core = smoothstep(0.045, 0.0, d);
  float glow = smoothstep(0.3, 0.0, d) * 0.45;
  float vert = smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
  // ground flare where the bolt strikes
  float base = smoothstep(0.16, 0.0, vUv.y) * smoothstep(0.5, 0.0, d) * 0.9;
  vec3 col = mix(vec3(0.45, 0.6, 1.0), vec3(1.0), core);
  gl_FragColor = vec4(col, ((core + glow) * vert + base) * on * strobe);
}
`

/** Death Star: procedural greeble panels, equator trench, superlaser dish.
 *  uBuild < 1 renders the DS2 half-built state: the incomplete region keeps
 *  only its structural skeleton (grid girders), the rest is discarded. */
export const DEATHSTAR_FRAG = /* glsl */ `
uniform float uSeed;
uniform float uTime;
uniform float uBuild; // 1 = complete (DS-1), < 1 = DS-2 scaffold state
uniform vec3 uSun1Dir;
uniform vec3 uSun1Color;
uniform vec3 uDishDir;
uniform vec3 uCapDir; // center of DS-2's unbuilt cap
varying vec3 vNormalW;
varying vec3 vPosW;
varying vec3 vPosObj;

${NOISE_GLSL}

void main() {
  vec3 n = normalize(vNormalW);
  vec3 v = normalize(cameraPosition - vPosW);
  vec3 p = vPosObj;
  float lat = p.y;
  float lon = atan(p.z, p.x);

  // panel grid in spherical coords
  vec2 panel = vec2(lon * 22.0, lat * 30.0);
  vec2 panelId = floor(panel);
  vec2 panelUv = fract(panel);
  float shade = 0.82 + hash31(vec3(panelId, uSeed)) * 0.3;
  float greeble = fbm3(p * 40.0 + uSeed) * 0.12;
  float edge = max(
    smoothstep(0.06, 0.0, min(panelUv.x, 1.0 - panelUv.x)),
    smoothstep(0.06, 0.0, min(panelUv.y, 1.0 - panelUv.y)));

  // DS-2's unfinished cap: one contiguous region (its iconic silhouette), not
  // scattered holes. Ragged border, and only structural girders remain inside.
  if (uBuild < 0.999) {
    float capAng = acos(clamp(dot(p, normalize(uCapDir)), -1.0, 1.0));
    float ragged = fbm(p * 2.6 + uSeed) * 0.22;
    float open = smoothstep(1.15 + ragged, 1.05 + ragged, capAng);
    if (open > 0.5) {
      // ribs run along the panel grid; everything between them is open space
      float rib = max(
        smoothstep(0.12, 0.0, min(panelUv.x, 1.0 - panelUv.x)),
        smoothstep(0.12, 0.0, min(panelUv.y, 1.0 - panelUv.y)));
      if (rib < 0.5) discard;
      float lit = clamp(dot(n, uSun1Dir), 0.0, 1.0);
      vec3 girder = vec3(0.4, 0.44, 0.5) * (0.35 + 0.75 * lit);
      gl_FragColor = vec4(girder, 1.0);
      return;
    }
  }

  vec3 base = vec3(0.58, 0.61, 0.66) * shade + greeble;

  // equatorial trench
  float trench = smoothstep(0.05, 0.03, abs(lat));
  base = mix(base, base * 0.42, trench);

  // superlaser dish: concave disc facing uDishDir, with concentric terracing
  float ang = acos(clamp(dot(p, normalize(uDishDir)), -1.0, 1.0));
  float dish = smoothstep(0.42, 0.39, ang);
  float dishRing = smoothstep(0.035, 0.0, abs(ang - 0.405));
  float terrace = 0.5 + 0.5 * sin(ang * 62.0);
  base = mix(base, base * (0.28 + terrace * 0.16), dish);
  base += vec3(0.55, 0.6, 0.68) * dishRing * 0.55;
  // dish focus lens: sinister green core
  base += vec3(0.25, 0.7, 0.38) * smoothstep(0.07, 0.0, ang) * 1.1;

  float lit = clamp(dot(n, uSun1Dir), 0.0, 1.0);
  vec3 col = base * (uSun1Color * (0.12 + lit * 0.95));

  // emissive window specks, denser near the trench, flickering faintly
  float windows = step(0.986, hash31(vec3(panelId * 3.0, uSeed + 9.0)));
  float wFlick = 0.7 + 0.3 * hash31(vec3(panelId, floor(uTime * 1.2)));
  col += vec3(0.75, 0.85, 1.0) * windows * wFlick * (0.25 + trench * 0.6) * (1.0 - dish);

  col *= 1.0 - edge * 0.35; // panel seams
  gl_FragColor = vec4(col, 1.0);
}
`

/** Instanced asteroids with simple lambert + rim (Alderaan graveyard). */
export const ASTEROID_VERT = /* glsl */ `
attribute float aShade;
varying vec3 vNormalW;
varying float vShade;
void main() {
  vShade = aShade;
  vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vNormalW = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

export const ASTEROID_FRAG = /* glsl */ `
uniform vec3 uSun1Dir;
uniform vec3 uSun1Color;
varying vec3 vNormalW;
varying float vShade;
void main() {
  vec3 n = normalize(vNormalW);
  float lit = clamp(dot(n, uSun1Dir), 0.0, 1.0);
  vec3 base = mix(vec3(0.32, 0.3, 0.28), vec3(0.55, 0.52, 0.48), vShade);
  gl_FragColor = vec4(base * (0.08 + lit * 0.95) * uSun1Color, 1.0);
}
`
