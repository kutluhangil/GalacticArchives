// Shared archetype-surface material factory. The planet, system and galaxy
// engines all render the same bodies at different scales, so the uniform block
// lives here instead of being duplicated per engine.

import * as THREE from 'three'
import type { CelestialBody, EraId } from '../../types/lore'
import { ARCHETYPE_IDS, PLANET_FRAG, PLANET_VERT } from './planet-shaders'

export interface SunLight {
  dir: THREE.Vector3
  color: THREE.Color
}

/** stable per-body seed so a world looks identical across views and reloads */
export function seedFrom(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 1000
  return h / 100
}

export function makeBodyMaterial(
  body: CelestialBody,
  era: EraId,
  suns: SunLight[],
  /** 0 turns off relief shading — worth it for bodies only a few pixels wide */
  relief = 1,
): THREE.ShaderMaterial {
  const recipe = body.renderRecipe
  const s1 = suns[0]
  const s2 = suns[1] ?? suns[0]
  return new THREE.ShaderMaterial({
    vertexShader: PLANET_VERT,
    fragmentShader: PLANET_FRAG,
    uniforms: {
      uArchetype: { value: ARCHETYPE_IDS[recipe.archetype] ?? 10 },
      uSeed: { value: seedFrom(body.id) },
      uTime: { value: 0 },
      uPrimary: { value: new THREE.Color(recipe.palette.primary) },
      uSecondary: { value: new THREE.Color(recipe.palette.secondary ?? recipe.palette.primary) },
      uAtmoColor: { value: new THREE.Color(recipe.atmosphere?.color ?? '#88aaff') },
      uSun1Dir: { value: s1.dir.clone() },
      uSun1Color: { value: s1.color.clone() },
      uSun2Dir: { value: s2.dir.clone() },
      uSun2Color: { value: s2.color.clone() },
      uHasSun2: { value: suns.length > 1 ? 1 : 0 },
      uVariant: { value: recipe.variantsByEra?.[era] ? 1 : 0 },
      uRelief: { value: relief },
      uAlbedo: { value: null },
      uUseAlbedo: { value: 0 },
      uNight: { value: null },
      uUseNight: { value: 0 },
    },
  })
}

/** sun list for views that only know the body's declared star colors */
export function sunsFromBody(body: CelestialBody): SunLight[] {
  const declared = body.suns?.length ? body.suns : [{ name: 'Sun', color: '#FFEFD0' }]
  return declared.slice(0, 2).map((sun, i) => ({
    dir: new THREE.Vector3(Math.cos(0.45 + i * 0.09), 0.22 + i * 0.05, Math.sin(0.45 + i * 0.09) * 0.9).normalize(),
    color: new THREE.Color(sun.color),
  }))
}
