// Shared data-model types for Galactic Archives lore content.
// Every user-facing string is bilingual (en/tr). Facts are verified against
// Wookieepedia/Databank during P0 — see src/data/sources.json.

export type EraId = 'clone-wars' | 'empire' | 'new-republic'

export type FactionId =
  | 'republic'
  | 'separatist'
  | 'empire'
  | 'rebel'
  | 'new-republic'
  | 'first-order'
  | 'resistance'
  | 'hutt'
  | 'mandalorian'
  | 'jedi'
  | 'sith'
  | 'neutral'

export type RegionId =
  | 'deep-core'
  | 'core-worlds'
  | 'colonies'
  | 'inner-rim'
  | 'expansion-region'
  | 'mid-rim'
  | 'outer-rim'
  | 'wild-space'
  | 'unknown-regions'
  | 'far-galaxy'

export type Archetype =
  | 'desert'
  | 'ecumenopolis'
  | 'lava'
  | 'ice'
  | 'ocean-storm'
  | 'gas-giant'
  | 'verdant'
  | 'swamp-fog'
  | 'crystal-red'
  | 'dark-storm'
  | 'barren'
  | 'station'

export interface Localized {
  en: string
  tr: string
}

export interface LocalizedList {
  en: string[]
  tr: string[]
}

export interface SunSpec {
  name: string
  color: string // hex — drives system lighting temperature
}

export interface RingSpec {
  /** texture strip under public/textures/, procedural fallback when absent */
  texture?: string
  innerRadius: number // in planet radii
  outerRadius: number
  tilt: number // degrees
  kind: 'rock' | 'bone'
}

export interface RenderRecipe {
  archetype: Archetype
  palette: { primary: string; secondary?: string }
  atmosphere?: { color: string; density: number } // density 0..1
  textures?: {
    albedo?: string
    night?: string
    emissive?: string
    clouds?: 'temperate' | 'storm' | 'sickly'
  }
  rings?: RingSpec
  dualSun?: boolean
  effects?: string[] // 'heat-shimmer' | 'lightning' | 'aurora' | 'traffic' | ...
  /** era-gated visual variant, e.g. Ilum -> Starkiller trench */
  variantsByEra?: Partial<Record<EraId, { albedo?: string; effects?: string[] }>>
}

export interface Poi {
  id: string
  names: Localized
  /** artistic placement on the globe (lore maps rarely define lat/lon) */
  lat: number
  lon: number
  blurb: Localized
}

export interface DestructionEvent {
  /** in-universe year, negative = BBY, positive = ABY */
  year: number
  yearLabel: string
  by: Localized
  /** eras (inclusive) in which the body renders as destroyed */
  destroyedFromEra: EraId
  resultState: 'asteroid-field' | 'debris-in-orbit' | 'cratered' | 'gone'
}

export interface CelestialBody {
  id: string
  kind: 'planet' | 'moon' | 'gas-giant' | 'station'
  /** which continuity the body belongs to; absent = Disney canon. The galaxy
   *  map hides `legends` bodies unless the Legends layer is switched on. */
  continuity?: 'canon' | 'legends'
  names: Localized
  desc: Localized
  region: RegionId
  regionTags?: string[] // e.g. "Hutt Space", "Western Reaches"
  sector?: string
  system: string
  coordinates?: string // Standard Galactic Grid, verified only
  stats: {
    diameterKm?: number
    moonCount?: number
    population?: Localized
    government?: Localized
  }
  suns?: SunSpec[]
  moons?: string[] // simple name list (non-renderable minors)
  climate?: LocalizedList
  terrain?: LocalizedList
  affiliationsByEra?: Partial<Record<EraId, FactionId>>
  appearances: string[] // MediaId[]
  characters?: string[] // CharacterId[]
  poi?: Poi[]
  funFacts?: LocalizedList
  destruction?: DestructionEvent
  /** fully renderable companions (own recipe), e.g. Yavin 4, Nar Shaddaa */
  moonsDetail?: CelestialBody[]
  /** stations only: eras in which the structure exists (Death Stars) */
  existsInEras?: EraId[]
  /** stations only: id of the body this structure orbits */
  orbitHost?: string
  renderRecipe: RenderRecipe
}

export interface Character {
  id: string
  names: Localized
  aka?: string[]
  species: Localized
  homeworldId?: string // planet id when in our dataset
  homeworldName?: Localized // free text when not (Stewjon, Kalee, ...)
  birth?: string // as stated by Wookieepedia, e.g. "41 BBY, Tatooine"
  death?: string
  affiliationsByEra?: Partial<Record<EraId, FactionId>>
  bio: Localized
  quote?: { text: Localized; attribution?: string }
  appearances: string[]
  relatedCharacters?: string[]
  portrait?: string // holo portrait asset path
}

export interface MediaEntry {
  id: string
  type: 'film' | 'series' | 'game'
  title: Localized
  year: string // "1977" or "2008–2020"
}

export interface Era {
  id: EraId
  names: Localized
  range: string // "32–19 BBY"
  blurb: Localized
}

export interface Region {
  id: RegionId
  names: Localized
  blurb: Localized
}

export interface Faction {
  id: FactionId
  names: Localized
  color: string
}
