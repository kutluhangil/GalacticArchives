// Minimal UI chrome strings for P1/P2. Full i18next migration lands in P3.

import type { EraId } from '../types/lore'
import type { Lang } from './lore'

const STRINGS = {
  brand: { en: 'GALACTIC ARCHIVES', tr: 'GALACTIC ARCHIVES' },
  region: { en: 'Region', tr: 'Bölge' },
  sector: { en: 'Sector', tr: 'Sektör' },
  system: { en: 'System', tr: 'Sistem' },
  grid: { en: 'Grid', tr: 'Grid' },
  diameter: { en: 'Diameter', tr: 'Çap' },
  population: { en: 'Population', tr: 'Nüfus' },
  government: { en: 'Government', tr: 'Yönetim' },
  climate: { en: 'Climate', tr: 'İklim' },
  terrain: { en: 'Terrain', tr: 'Arazi' },
  moons: { en: 'Moons', tr: 'Aylar' },
  suns: { en: 'Suns', tr: 'Güneşler' },
  appearances: { en: 'Appearances', tr: 'Göründüğü Yapımlar' },
  didYouKnow: { en: 'From the Archives', tr: 'Arşivlerden' },
  affiliation: { en: 'Allegiance', tr: 'Bağlılık' },
  era: { en: 'Era', tr: 'Dönem' },
  galaxy: { en: 'Galaxy Map', tr: 'Galaksi Haritası' },
  planets: { en: 'Planets', tr: 'Gezegenler' },
  search: { en: 'Search', tr: 'Ara' },
  searchPlaceholder: { en: 'Search planets & characters…', tr: 'Gezegen ve karakter ara…' },
  noResults: { en: 'No records found in the archives.', tr: 'Arşivlerde kayıt bulunamadı.' },
  charactersGroup: { en: 'Characters', tr: 'Karakterler' },
  enterSystem: { en: 'System view', tr: 'Sistem görünümü' },
  enterPlanet: { en: 'Approach planet', tr: 'Gezegene yaklaş' },
  dragHint: { en: 'drag to rotate · scroll to zoom', tr: 'çevirmek için sürükle · yakınlaşmak için kaydır' },
  clickPlanetHint: { en: 'click a body to approach', tr: 'yaklaşmak için bir gök cismine tıkla' },
  clickSystemHint: { en: 'click a system to jump', tr: 'sıçramak için bir sisteme tıkla' },
  loading: { en: 'Accessing archives...', tr: 'Arşivlere erişiliyor...' },
  destroyedTag: { en: 'DESTROYED', tr: 'YOK EDİLDİ' },
  kmSuffix: { en: 'km', tr: 'km' },
} as const

export type UiKey = keyof typeof STRINGS

export const t = (key: UiKey, lang: Lang): string => STRINGS[key][lang]

/** short era chip labels (the range strings read as noise in the UI) */
export const ERA_SHORT: Record<EraId, { en: string; tr: string }> = {
  'clone-wars': { en: 'Clone Wars', tr: 'Klon Savaşları' },
  empire: { en: 'Empire', tr: 'İmparatorluk' },
  'new-republic': { en: 'New Republic', tr: 'Yeni Cumhuriyet' },
}
