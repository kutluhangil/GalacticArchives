// Shared data-model types for Galactic Archives lore content.
// Every user-facing string is bilingual (en/tr). Facts are verified against
// Wookieepedia/Databank during P0 — see src/data/sources.json.

// 'old-republic' is a Legends-only era: it only appears in the era selector
// when the Legends layer is on, and gives the KotOR-era worlds a home on the
// timeline. Canon worlds simply carry no affiliation for it.
export type EraId = 'old-republic' | 'clone-wars' | 'empire' | 'new-republic'

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
  /** "wookieepedia:<article>" — the location's own article, verified to
   *  resolve. The placement is ours; the place itself is not. */
  source?: string
}

/** One stop on a hyperlane, as the lane's own infobox lists it. */
export interface RouteStop {
  /** the stop's Wookieepedia article title. Doubles as the citation
   *  ("wookieepedia:<article>") and as the identity that merges a stop shared
   *  by two lanes into one junction. */
  article: string
  /** the name the lane's article shows for it, when it differs from the title */
  label?: string
  /** Standard Galactic Grid cell, taken from the stop's own article */
  coordinates: string
  /** set when the stop is a world this archive ships a record for */
  bodyId?: string
}

/** A canon super-hyperroute: the lane itself, plus its stops in travel order
 *  (core-ward end first, as the article lists them). */
export interface HyperspaceRoute {
  id: string
  names: Localized
  blurb: Localized
  /** "wookieepedia:<article>" — the lane's own article */
  source: string
  /** lane color on the map */
  color: string
  stops: RouteStop[]
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
  /** some worlds have no verified figures yet, so this whole block is optional */
  stats?: {
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

/** "wookieepedia:<article>" — the record's own article, verified to resolve by
 *  scripts/fetch-codex.mjs and enforced by scripts/validate-lore.mjs. Required
 *  on every codex record: a fact this archive cannot point at is not a fact. */
type Citation = string

export interface Starship {
  id: string
  names: Localized
  model: string
  manufacturer: Localized
  starshipClass: Localized
  lengthMeters?: number
  hyperdriveRating?: string
  crew?: string
  passengers?: string
  affiliationsByEra?: Partial<Record<EraId, FactionId>>
  desc: Localized
  appearances: string[]
  hologram?: string
  source: Citation
}

export interface TimelineEvent {
  id: string
  yearLabel: string
  yearBBYABY: number // negative for BBY, positive for ABY
  era: EraId
  category: 'political' | 'battle' | 'jedi-sith' | 'construction'
  titles: Localized
  desc: Localized
  planetId?: string
  characterIds?: string[]
  battleId?: string
  source: Citation
}

export interface Transmission {
  id: string
  title: Localized
  speaker: Localized
  era: EraId
  yearLabel: string
  /** How the archive describes the medium the recording travelled on. No cited
   *  article states a frequency or a channel number for any of these, so this
   *  line is the archive's own wording and the player marks it as such.
   *  `validate-lore` rejects invented telemetry (MHz, hex addresses, channel
   *  numbers) so the fabricated precision cannot come back. */
  channelLabel: string
  transcript: Localized
  /** true only when the wording is quoted from the cited article; false marks a
   *  transcript this archive reconstructed from the scene. */
  verbatim: boolean
  source: Citation
}

export interface Battle {
  id: string
  names: Localized
  yearLabel: string
  era: EraId
  locationPlanetId: string
  locationName: Localized
  combatants: { factionId: FactionId; commander?: Localized }[]
  victorFactionId: FactionId
  desc: Localized
  appearances: string[]
  source: Citation
}

export interface ForcePower {
  id: string
  names: Localized
  alignment: 'light' | 'dark' | 'neutral'
  tier: 'basic' | 'intermediate' | 'advanced' | 'master'
  sideOfForce: 'light' | 'dark' | 'both'
  desc: Localized
  notableUsers: string[]
  /** absent = Disney canon; "legends" powers Wookieepedia documents only in the
   *  Legends continuity, shown with the same gold marking worlds use */
  continuity?: 'canon' | 'legends'
  source: Citation
}

export interface WatchGuideEntry {
  id: string
  titles: Localized
  type: 'film' | 'live-action' | 'animation'
  releaseYear: number
  chronologicalYear: string
  chronologicalOrder: number
  releaseOrder: number
  synopsis: Localized
  planets: string[]
  characters: string[]
  era: EraId
  source: Citation
}
