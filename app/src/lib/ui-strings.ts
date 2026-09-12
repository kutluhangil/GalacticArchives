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
  systems: { en: 'Systems', tr: 'Sistemler' },
  namedMoons: { en: 'Named moons', tr: 'Adı geçen aylar' },
  stations: { en: 'Stations', tr: 'İstasyonlar' },
  compareAdd: { en: 'Add a column', tr: 'Sütun ekle' },
  compareRemove: { en: 'Remove this column', tr: 'Bu sütunu kaldır' },
  compareFull: { en: 'Four is the most that stays readable', tr: 'Okunur kalan en fazla dört sütun' },
  toScale: { en: 'To scale', tr: 'Gerçek oranla' },
  tours: { en: 'Tours', tr: 'Turlar' },
  guidedRoutes: { en: 'Guided routes through this record', tr: 'Bu kayıttan geçen rehberli rotalar' },
  tourStart: { en: 'Start tour', tr: 'Turu başlat' },
  tourPrev: { en: 'Back', tr: 'Geri' },
  tourNext: { en: 'Next', tr: 'İleri' },
  tourPause: { en: 'Pause', tr: 'Duraklat' },
  tourResume: { en: 'Play', tr: 'Oynat' },
  tourFinish: { en: 'Finish', tr: 'Bitir' },
  tourExit: { en: 'Exit tour', tr: 'Turdan çık' },
  saveTour: { en: 'Save tour', tr: 'Turu kaydet' },
  removeSavedTour: { en: 'Remove saved tour', tr: 'Kayıtlı turu kaldır' },
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
  // Opening crawl body. Paragraphs are split on the blank line. Original prose —
  // it evokes the films' cadence without reproducing their text.
  crawlBody: {
    en: 'The galaxy turns, and its worlds turn with it — desert wastes and drowned moons, throne-worlds and forge-planets, each one a record waiting to be read.\n\nFrom the ashes of fallen empires, an archive endures. Within it lie every charted system, every star route, every name the war remembered.\n\nNow its vaults stand open. Set a course, traveller, and let the stars tell you where you have always been going....',
    tr: 'Galaksi döner, dünyaları da onunla döner — çöl çorakları ve boğulmuş aylar, taht-dünyaları ve demirci-gezegenler; her biri okunmayı bekleyen bir kayıt.\n\nDüşmüş imparatorlukların küllerinden bir arşiv ayakta kaldı. İçinde haritalanmış her sistem, her yıldız rotası, savaşın hatırladığı her isim yatıyor.\n\nŞimdi mahzenleri açık. Bir rota çiz yolcu — ve bırak yıldızlar sana hep nereye gitmekte olduğunu söylesin....',
  },
  skipIntro: { en: 'Skip intro', tr: 'Girişi geç' },
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
  allSectors: { en: 'All sectors', tr: 'Tüm sektörler' },
  sectorUnstated: { en: 'Sector unstated in canon', tr: 'Sektörü kanonda belirtilmemiş' },
  worlds: { en: 'Worlds', tr: 'Dünyalar' },
  characters: { en: 'Characters', tr: 'Karakterler' },
  starships: { en: 'Starships', tr: 'Yıldız Gemileri' },
  battles: { en: 'Battles', tr: 'Savaşlar' },
  manufacturer: { en: 'Manufacturer', tr: 'Üretici' },
  starshipClass: { en: 'Class', tr: 'Sınıf' },
  hyperdrive: { en: 'Hyperdrive', tr: 'Hiper-sürücü' },
  victor: { en: 'Victor', tr: 'Galip' },
  audioOn: { en: 'Audio FX Enabled', tr: 'Ses Efektleri Açık' },
  audioOff: { en: 'Audio FX Muted', tr: 'Ses Efektleri Kapalı' },
  close: { en: 'Close', tr: 'Kapat' },
  sfx: { en: 'Interface sound', tr: 'Arayüz sesi' },
  sfxHint: {
    en: 'Synthesised clicks and chimes for panels and jumps. The choice is remembered.',
    tr: 'Paneller ve sıçramalar için sentezlenmiş tık ve ton sesleri. Seçim hatırlanır.',
  },

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
  archiveConnections: { en: 'Archive connections', tr: 'Arşiv bağlantıları' },
  homeworldRelation: { en: 'Homeworld', tr: 'Anavatan' },
  appearsOnRelation: { en: 'Known world', tr: 'Bilinen dünya' },
  participatesInRelation: { en: 'Known event', tr: 'Bilinen olay' },
  relatedCharacterRelation: { en: 'Connected figure', tr: 'Bağlantılı isim' },
  eventLocationRelation: { en: 'Event location', tr: 'Olay konumu' },
  relationshipEvidence: { en: 'Record evidence', tr: 'Kayıt dayanağı' },
  relationshipUnavailable: { en: 'Archive connection data unavailable:', tr: 'Arşiv bağlantı verisi kullanılamıyor:' },
  biography: { en: 'Biography', tr: 'Biyografi' },
  sources: {
    en: 'Sources: Wookieepedia (CC BY-SA) · StarWars.com Databank',
    tr: 'Kaynaklar: Wookieepedia (CC BY-SA) · StarWars.com Databank',
  },
  notFound: { en: 'No such record in the archives.', tr: 'Arşivlerde böyle bir kayıt yok.' },
  recordMissing: { en: 'This route does not match a record in the archive.', tr: 'Bu rota arşivdeki bir kayda karşılık gelmiyor.' },
  textureErrorTitle: { en: 'Surface assets unavailable:', tr: 'Yüzey varlıkları yüklenemedi:' },
  webglUnavailableTitle: { en: '3D view unavailable', tr: '3B görünüm kullanılamıyor' },
  webglUnavailableBody: {
    en: 'This browser could not create a WebGL context. The archive record remains available below.',
    tr: 'Bu tarayıcı bir WebGL bağlamı oluşturamadı. Arşiv kaydı aşağıda kullanılabilir.',
  },
  webglRetry: { en: 'Retry 3D view', tr: '3B görünümü yeniden dene' },

  // data provenance
  unstated: { en: 'not stated in canon', tr: 'kanonda belirtilmemiş' },
  unstatedHint: {
    en: 'The sourced article states no value for this field. It is missing from canon, not from this archive.',
    tr: 'Kaynak madde bu alan için bir değer belirtmiyor. Eksik olan kanon, bu arşiv değil.',
  },
  authoredHint: {
    en: 'Summarised by this archive: the sourced article states no value for this field.',
    tr: 'Bu arşivin özeti: kaynak madde bu alan için bir değer belirtmiyor.',
  },
  archiveSummary: { en: 'archive summary', tr: 'arşiv özeti' },
  unverified: { en: 'not yet verified', tr: 'henüz doğrulanmadı' },
  unverifiedHint: {
    en: 'The archive has not verified this field against its cited source yet.',
    tr: 'Arşiv bu alanı atıf yaptığı kaynağa karşı henüz doğrulamadı.',
  },
  sourceLink: { en: 'Source', tr: 'Kaynak' },

  // first-visit onboarding
  onboardTitle: { en: 'Explore the archive', tr: 'Arşivi keşfet' },
  onboardEra: {
    en: 'Switch eras above to watch worlds rise, fall and change hands.',
    tr: 'Yukarıdan dönemleri değiştir; dünyaların doğuşunu, yıkımını ve el değiştirmesini izle.',
  },
  onboardLegends: {
    en: 'Open ⚙ settings to add non-canon Legends worlds to the map.',
    tr: 'Haritaya kanon dışı Legends dünyalarını eklemek için ⚙ ayarlarını aç.',
  },
  onboardDismiss: { en: 'Got it', tr: 'Anladım' },

  // error boundary
  errorTitle: { en: 'A disturbance in the archives', tr: 'Arşivlerde bir kesinti' },
  errorBody: {
    en: 'This record could not be rendered. The rest of the archive is intact.',
    tr: 'Bu kayıt görüntülenemedi. Arşivin geri kalanı sağlam.',
  },
  errorReload: { en: 'Reload', tr: 'Yeniden yükle' },
  errorHome: { en: 'Back to the galaxy', tr: 'Galaksiye dön' },

  // not found
  notFoundTitle: { en: 'No such record', tr: 'Böyle bir kayıt yok' },
  notFoundBody: {
    en: 'This address is not part of the archive. Nothing was lost — there was never a record here.',
    tr: 'Bu adres arşivin parçası değil. Kaybolan bir şey yok — burada hiç kayıt olmadı.',
  },
  notFoundPath: { en: 'Requested address', tr: 'İstenen adres' },
  notFoundHolocron: { en: 'Open the Holocron', tr: "Holocron'u aç" },

  // settings
  settings: { en: 'Settings', tr: 'Ayarlar' },
  quality: { en: 'Quality', tr: 'Kalite' },
  qualityHint: {
    en: 'Applies when a view is reopened.',
    tr: 'Bir görünüm yeniden açıldığında uygulanır.',
  },
  legends: { en: 'Legends worlds', tr: 'Legends dünyaları' },
  legendsHint: {
    en: 'Adds non-canon Legends worlds (KotOR-era Sith and Jedi worlds) to the map.',
    tr: "Haritaya kanon dışı Legends dünyalarını (KotOR dönemi Sith ve Jedi dünyaları) ekler.",
  },

  // hyperlanes and the course plotter
  lanes: { en: 'Hyperlanes', tr: 'Hiperuzay hatları' },
  lanesHint: {
    en: 'Draws the canon trade routes across the disk.',
    tr: 'Kanon ticaret yollarını diskin üzerine çizer.',
  },
  coursePlotter: { en: 'Plot a course', tr: 'Rota çiz' },
  courseFrom: { en: 'From', tr: 'Nereden' },
  courseTo: { en: 'To', tr: 'Nereye' },
  coursePick: { en: 'Pick a stop…', tr: 'Bir durak seç…' },
  courseClear: { en: 'Clear', tr: 'Temizle' },
  courseJumps: { en: 'jumps', tr: 'sıçrama' },
  courseParsecs: { en: 'parsecs', tr: 'parsek' },
  courseLaneChanges: { en: 'lane changes', tr: 'hat değişimi' },
  courseSameCell: { en: 'same grid square', tr: 'aynı grid karesi' },
  courseDeparture: { en: 'Departure', tr: 'Kalkış' },
  courseNone: {
    en: 'No charted lane connects these two stops.',
    tr: 'Bu iki durağı bağlayan çizili bir hat yok.',
  },
  courseSame: { en: 'Pick two different stops.', tr: 'İki farklı durak seç.' },
  stopsInArchive: { en: 'Worlds in this archive', tr: 'Bu arşivdeki dünyalar' },
  stopsCharted: { en: 'Other charted stops', tr: 'Diğer çizili duraklar' },
  courseScale: {
    en: 'Distances use the canon navigator grid: one grid square is 15 parsecs.',
    tr: 'Mesafeler kanon seyir gridine göre: bir grid karesi 15 parsek.',
  },

  arrowHint: {
    en: 'Use the arrow keys to move through the list, Enter to open.',
    tr: 'Listede ok tuşlarıyla gezinin, açmak için Enter.',
  },

  laneSelected: { en: 'Hyperlane', tr: 'Hiperuzay hattı' },
  lanesNav: { en: 'Hyperlanes', tr: 'Hiperuzay hatları' },
  laneStops: { en: 'stops', tr: 'durak' },
  laneInArchive: { en: 'in this archive', tr: 'bu arşivde' },
  laneFly: { en: 'Fly this lane', tr: 'Bu hattı uç' },
  laneClose: { en: 'Close', tr: 'Kapat' },
  laneTooThin: {
    en: 'Too few of this lane’s stops have a record here to fly it end to end.',
    tr: 'Bu hattın burada kaydı olan durağı, baştan sona uçmak için yeterli değil.',
  },
  laneSource: { en: 'Lane article', tr: 'Hat makalesi' },

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

/** Copy with holes in it. Kept apart from STRINGS because these are not
 *  lookups: every one of them is meaningless until its values are filled, and
 *  the two languages put the numbers in different places. */
const FORMATS = {
  laneStopOf: {
    en: 'Stop {n} of {total} on the {lane}',
    tr: '{lane} üzerinde {total} durağın {n}.',
  },
  laneLegFrom: {
    en: '{parsecs} parsecs out from {from}.',
    tr: '{from} çıkışından {parsecs} parsek.',
  },
  laneDeparture: {
    en: 'The core-ward end of the lane, where the run begins.',
    tr: 'Hattın çekirdeğe bakan ucu; koşu burada başlar.',
  },
  laneSkipped: {
    en: '{n} charted stops on this lane have no record in the archive and were passed.',
    tr: 'Bu hattaki {n} çizili durağın arşivde kaydı yok; geçildiler.',
  },
} as const

export type FormatKey = keyof typeof FORMATS

/**
 * Fill `{name}` holes in a bilingual template. Throws on a hole with no value:
 * a sentence shipped with `{total}` still in it is a bug that should stop the
 * test run, not copy a visitor gets to read.
 */
export const tf = (
  key: FormatKey,
  lang: Lang,
  vars: Record<string, string | number>,
): string =>
  FORMATS[key][lang].replace(/\{(\w+)\}/g, (_, name: string) => {
    if (!(name in vars)) {
      throw new Error(`ui-strings: "${key}" (${lang}) has no value for {${name}}`)
    }
    return String(vars[name])
  })

/** short era chip labels (the range strings read as noise in the UI) */
export const ERA_SHORT: Record<EraId, { en: string; tr: string }> = {
  'old-republic': { en: 'Old Republic', tr: 'Eski Cumhuriyet' },
  'clone-wars': { en: 'Clone Wars', tr: 'Klon Savaşları' },
  empire: { en: 'Empire', tr: 'İmparatorluk' },
  'new-republic': { en: 'New Republic', tr: 'Yeni Cumhuriyet' },
}
