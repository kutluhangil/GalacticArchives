// The warm-up compiles a post-processing pass's programs before the loop
// starts, and it finds them by scanning the pass for shader materials rather
// than by field name — the bloom chain keeps five of them in an array and the
// rest behind names three has renamed between releases. A scan that quietly
// stopped finding them would look exactly like a warm-up that still worked, so
// what is guarded here is the scan itself.

import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { passMaterials } from '../../src/lib/engine/engine-base'

describe('passMaterials', () => {
  it('finds the whole bloom chain: the five blur mips included', () => {
    const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.6, 0.32, 0.85)
    const materials = passMaterials(bloom)

    expect(materials).toContain(bloom.materialHighPassFilter)
    expect(materials).toContain(bloom.compositeMaterial)
    expect(materials).toContain(bloom.blendMaterial)
    for (const blur of bloom.separableBlurMaterials) expect(materials).toContain(blur)
    // every blur mip is its own program, because its kernel is a define rather
    // than a uniform. The define's name is three's to change — it was
    // KERNEL_RADIUS until 0.186 and KERNEL_PAIRS after — so what is asserted is
    // that the five differ, not what they are called.
    const kernels = bloom.separableBlurMaterials.map((m) => JSON.stringify(m.defines))
    expect(new Set(kernels).size).toBe(kernels.length)
    bloom.dispose()
  })

  it('finds the output encode, and nothing from a pass that owns no material', () => {
    const output = new OutputPass()
    expect(passMaterials(output).length).toBe(1)

    const render = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera())
    expect(passMaterials(render)).toEqual([])
  })

  it('ignores values that are not shader materials', () => {
    const material = new THREE.ShaderMaterial()
    const found = passMaterials({
      material,
      basic: new THREE.MeshBasicMaterial(),
      list: [new THREE.MeshBasicMaterial(), material],
      size: new THREE.Vector2(),
      enabled: true,
    })
    expect(found).toEqual([material, material])
  })
})
