// UI chrome strings. Bilingual by construction: every key must carry both
// languages or TypeScript rejects it, which is the property i18next would
// otherwise be pulled in to provide. Data strings live in the lore JSON.

import type { EraId } from '../types/lore'
import type { Lang } from './lore'

const STRINGS = {
  brand: { en: 'GALACTIC ARCHIVES', tr: 'GALACTIC ARCHIVES' },
  tagline: {
    en: 'An atlas of a galaxy far, far away',
    tr: 'Çok uzak bir galaksinin atlası',
  },
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
  favorites: { en: 'Favorites', tr: 'Favoriler' },
  recents: { en: 'Recently visited', tr: 'Son gezilenler' },
  addFavorite: { en: 'Add to favorites', tr: 'Favorilere ekle' },
  removeFavorite: { en: 'Remove from favorites', tr: 'Favorilerden çıkar' },
  compare: { en: 'Compare', tr: 'Kıyasla' },
  toScale: { en: 'To scale', tr: 'Gerçek oranla' },
  tours: { en: 'Tours', tr: 'Turlar' },
  tourStart: { en: 'Start tour', tr: 'Turu başlat' },
  tourPrev: { en: 'Back', tr: 'Geri' },
  tourNext: { en: 'Next', tr: 'İleri' },
  tourPause: { en: 'Pause', tr: 'Duraklat' },
  tourResume: { en: 'Play', tr: 'Oynat' },
  tourFinish: { en: 'Finish', tr: 'Bitir' },
  tourExit: { en: 'Exit tour', tr: 'Turdan çık' },
  aurebesh: { en: 'Aurebesh', tr: 'Aurebesh' },
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

  // landing
  crawlIntro: {
    en: 'A long time ago in a galaxy far, far away....',
    tr: 'Çok uzun zaman önce, çok çok uzak bir galakside....',
  },
  exploreCta: { en: 'EXPLORE THE GALAXY', tr: 'GALAKSİYİ KEŞFET' },
  holocronCta: { en: 'OPEN THE HOLOCRON', tr: "HOLOCRON'U AÇ" },
  featuredWorlds: { en: 'Featured worlds', tr: 'Öne çıkan dünyalar' },
  scrollHint: { en: 'scroll', tr: 'kaydır' },
  disclaimer: {
    en: 'Unofficial fan project. Not affiliated with Lucasfilm or Disney. Lore sourced from Wookieepedia (CC BY-SA) and StarWars.com Databank.',
    tr: 'Resmî olmayan hayran projesi. Lucasfilm veya Disney ile ilişkisi yoktur. Bilgiler Wookieepedia (CC BY-SA) ve StarWars.com Databank kaynaklıdır.',
  },

  // holocron
  holocron: { en: 'Holocron', tr: 'Holocron' },
  holocronIntro: {
    en: 'Every world and figure in the archive, cross-linked.',
    tr: 'Arşivdeki her dünya ve figür, birbirine bağlı.',
  },
  allRegions: { en: 'All regions', tr: 'Tüm bölgeler' },
  allMedia: { en: 'All productions', tr: 'Tüm yapımlar' },
  worlds: { en: 'Worlds', tr: 'Dünyalar' },
  characters: { en: 'Characters', tr: 'Karakterler' },
  resultCount: { en: 'records', tr: 'kayıt' },
  viewIn3d: { en: 'View in 3D', tr: "3B'de görüntüle" },
  openHolocron: { en: 'Open in Holocron', tr: "Holocron'da aç" },
  backToHolocron: { en: 'Back to Holocron', tr: "Holocron'a dön" },
  species: { en: 'Species', tr: 'Tür' },
  homeworld: { en: 'Homeworld', tr: 'Anavatan' },
  born: { en: 'Born', tr: 'Doğum' },
  died: { en: 'Died', tr: 'Ölüm' },
  notableResidents: { en: 'Notable figures', tr: 'Ünlü isimler' },
  pointsOfInterest: { en: 'Points of interest', tr: 'Önemli yerler' },
  relatedCharacters: { en: 'Connected figures', tr: 'Bağlantılı isimler' },
  biography: { en: 'Biography', tr: 'Biyografi' },
  sources: {
    en: 'Sources: Wookieepedia (CC BY-SA) · StarWars.com Databank',
    tr: 'Kaynaklar: Wookieepedia (CC BY-SA) · StarWars.com Databank',
  },
  notFound: { en: 'No such record in the archives.', tr: 'Arşivlerde böyle bir kayıt yok.' },

  // settings
  settings: { en: 'Settings', tr: 'Ayarlar' },
  quality: { en: 'Quality', tr: 'Kalite' },
  qualityHint: {
    en: 'Applies when a view is reopened.',
    tr: 'Bir görünüm yeniden açıldığında uygulanır.',
  },

  // easter eggs
  kesselRun: { en: 'Kessel Run', tr: 'Kessel Koşusu' },
  kesselStart: { en: 'Start the run', tr: 'Koşuyu başlat' },
  kesselAgain: { en: 'Run again', tr: 'Tekrar koş' },
  kesselResult: { en: 'parsecs', tr: 'parsek' },
  kesselBrag: {
    en: 'Under twelve. Han would still round down.',
    tr: "On ikinin altında. Han yine de aşağı yuvarlardı.",
  },
} as const

export type UiKey = keyof typeof STRINGS

export const t = (key: UiKey, lang: Lang): string => STRINGS[key][lang]

/** short era chip labels (the range strings read as noise in the UI) */
export const ERA_SHORT: Record<EraId, { en: string; tr: string }> = {
  'clone-wars': { en: 'Clone Wars', tr: 'Klon Savaşları' },
  empire: { en: 'Empire', tr: 'İmparatorluk' },
  'new-republic': { en: 'New Republic', tr: 'Yeni Cumhuriyet' },
}
