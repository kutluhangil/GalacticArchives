// P0 data-verification pipeline, step 1: pull canon infobox data + intro text
// for every Tier-S entity from the Wookieepedia MediaWiki API and write a
// compact digest JSON. The digest is the verification reference used while
// authoring src/data/*.json — it is NOT shipped with the app.
//
// Usage: node scripts/fetch-lore.mjs <output-file.json>

const OUT = process.argv[2]
if (!OUT) {
  console.error('Usage: node scripts/fetch-lore.mjs <output-file.json>')
  process.exit(1)
}

const API = 'https://starwars.fandom.com/api.php'
const UA = 'GalacticArchives-research/1.0 (non-commercial fan project; data verification)'

const PLANETS = {
  tatooine: 'Tatooine',
  coruscant: 'Coruscant',
  naboo: 'Naboo',
  alderaan: 'Alderaan',
  hoth: 'Hoth',
  dagobah: 'Dagobah',
  bespin: 'Bespin',
  'endor-prime': 'Endor (planet)',
  'endor-moon': 'Endor',
  'kef-bir': 'Kef Bir',
  yavin: 'Yavin',
  'yavin-4': 'Yavin 4',
  mustafar: 'Mustafar',
  kamino: 'Kamino',
  geonosis: 'Geonosis',
  kashyyyk: 'Kashyyyk',
  utapau: 'Utapau',
  felucia: 'Felucia',
  jakku: 'Jakku',
  takodana: 'Takodana',
  'ahch-to': 'Ahch-To',
  crait: 'Crait',
  exegol: 'Exegol',
  ilum: 'Ilum',
  'starkiller-base': 'Starkiller Base',
  scarif: 'Scarif',
  jedha: 'Jedha',
  corellia: 'Corellia',
  kessel: 'Kessel',
  mandalore: 'Mandalore',
  nevarro: 'Nevarro',
  lothal: 'Lothal',
  dathomir: 'Dathomir',
  ryloth: 'Ryloth',
  peridea: 'Peridea',
  ferrix: 'Ferrix',
  'nal-hutta': 'Nal Hutta',
  shakari: 'Shakari',
  'nar-shaddaa': 'Nar Shaddaa',
  concordia: 'Concordia',
  'death-star': 'Death Star',
  'death-star-2': 'Death Star II',
  // Tier A expansion (PLAN 2.2)
  'cato-neimoidia': 'Cato Neimoidia',
  mygeeto: 'Mygeeto',
  saleucami: 'Saleucami',
  'polis-massa': 'Polis Massa',
  christophsis: 'Christophsis',
  umbara: 'Umbara',
  onderon: 'Onderon',
  moraband: 'Moraband',
  serenno: 'Serenno',
  eriadu: 'Eriadu',
  batuu: 'Batuu',
  'dqar': "D'Qar",
  cantonica: 'Cantonica',
  pasaana: 'Pasaana',
  kijimi: 'Kijimi',
  eadu: 'Eadu',
  lahmu: "Lah'mu",
  wobani: 'Wobani',
  mimban: 'Mimban',
  vandor: 'Vandor',
  savareen: 'Savareen',
  'numidian-prime': 'Numidian Prime',
  sorgan: 'Sorgan',
  'arvala-7': 'Arvala-7',
  tython: 'Tython',
  trask: 'Trask',
  morak: 'Morak',
  'plazir-15': 'Plazir-15',
  seatos: 'Seatos',
  atollon: 'Atollon',
  malachor: 'Malachor',
  krownest: 'Krownest',
  chandrila: 'Chandrila',
  ghorman: 'Ghorman',
  aldhani: 'Aldhani',
  'narkina-5': 'Narkina 5',
  daiyu: 'Daiyu',
  'hosnian-prime': 'Hosnian Prime',
  'at-attin': 'At Attin',
  'glavis-ringworld': 'Glavis Ringworld',
  // Legends layer (PLAN 2.3) — sourced from the /Legends articles, gated
  // behind the Legends toggle in the app and tagged continuity:"legends".
  korriban: 'Korriban/Legends',
  'dromund-kaas': 'Dromund Kaas/Legends',
  taris: 'Taris/Legends',
  manaan: 'Manaan/Legends',
  csilla: 'Csilla/Legends',
  lehon: 'Lehon/Legends',
  ossus: 'Ossus/Legends',
}

const CHARACTERS = {
  'luke-skywalker': 'Luke Skywalker',
  'leia-organa': 'Leia Organa',
  'han-solo': 'Han Solo',
  chewbacca: 'Chewbacca',
  'anakin-skywalker': 'Anakin Skywalker',
  'obi-wan-kenobi': 'Obi-Wan Kenobi',
  yoda: 'Yoda',
  palpatine: 'Sheev Palpatine',
  'padme-amidala': 'Padmé Amidala',
  'qui-gon-jinn': 'Qui-Gon Jinn',
  'darth-maul': 'Maul',
  'count-dooku': 'Dooku',
  grievous: 'Grievous',
  'ahsoka-tano': 'Ahsoka Tano',
  'captain-rex': 'Rex',
  thrawn: 'Thrawn',
  'ezra-bridger': 'Ezra Bridger',
  'kanan-jarrus': 'Kanan Jarrus',
  'hera-syndulla': 'Hera Syndulla',
  'sabine-wren': 'Sabine Wren',
  'din-djarin': 'Din Djarin',
  grogu: 'Grogu',
  'boba-fett': 'Boba Fett',
  'bo-katan': 'Bo-Katan Kryze',
  'cassian-andor': 'Cassian Andor',
  'jyn-erso': 'Jyn Erso',
  'mon-mothma': 'Mon Mothma',
  rey: 'Rey',
  'kylo-ren': 'Ben Solo',
  'poe-dameron': 'Poe Dameron',
  finn: 'Finn',
  'lando-calrissian': 'Lando Calrissian',
}

const PLANET_FIELDS = [
  'region', 'sector', 'system', 'coordinates', 'class', 'diameter', 'rotation',
  'orbital', 'suns', 'stars', 'moons', 'atmosphere', 'climate', 'terrain',
  'water', 'population', 'government', 'capital', 'affiliation',
]
const CHARACTER_FIELDS = [
  'homeworld', 'species', 'gender', 'birth', 'death', 'affiliation', 'masters', 'apprentices',
]

function cleanWikiValue(raw) {
  let v = raw
  v = v.replace(/<ref[^>]*\/>/g, '').replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
  v = v.replace(/<!--[\s\S]*?-->/g, '')
  v = v.replace(/\{\{[Pp]lainlist\|/g, '').replace(/\{\{[Uu]nordered list\|/g, '')
  v = v.replace(/\{\{C\|([^}]*)\}\}/g, '($1)')
  v = v.replace(/\{\{[^}]*\}\}/g, '')
  v = v.replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, '$1')
  v = v.replace(/'''?/g, '')
  v = v.replace(/^\*+/gm, '').replace(/\n+/g, ' | ')
  v = v.replace(/[{}]/g, '').replace(/\s+/g, ' ').trim()
  return v.replace(/^\|+|\|+$/g, '').trim()
}

function parseInfobox(wikitext, fields) {
  const out = {}
  for (const f of fields) {
    // param line: |field = value  (value runs until the next top-level |param= or template end)
    const re = new RegExp(`^\\|${f}\\s*=([\\s\\S]*?)(?=^\\|[a-z_]+\\s*=|^\\}\\})`, 'mi')
    const m = wikitext.match(re)
    if (m) {
      const cleaned = cleanWikiValue(m[1])
      if (cleaned) out[f] = cleaned.slice(0, 400)
    }
  }
  return out
}

function extractIntro(wikitext) {
  // Drop leading templates/infobox: find first paragraph that starts with a
  // letter/quote after the last top-level closing braces near the top.
  const noComments = wikitext.replace(/<!--[\s\S]*?-->/g, '')
  const lines = noComments.split('\n')
  let depth = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    depth += (line.match(/\{\{/g) || []).length
    depth -= (line.match(/\}\}/g) || []).length
    if (depth <= 0 && /^[A-Z"'\[]/.test(line.trim()) && line.trim().length > 80) {
      return cleanWikiValue(line).slice(0, 500)
    }
  }
  return ''
}

async function fetchPage(title) {
  const url = `${API}?action=query&prop=revisions&rvprop=content&rvslots=main&format=json&redirects=1&titles=${encodeURIComponent(title)}`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`HTTP ${res.status} for "${title}"`)
  const json = await res.json()
  const pages = json?.query?.pages
  if (!pages) throw new Error(`No pages in response for "${title}"`)
  const page = Object.values(pages)[0]
  if (page.missing !== undefined) return { missing: true }
  const wikitext = page.revisions?.[0]?.slots?.main?.['*']
  if (!wikitext) throw new Error(`No wikitext for "${title}"`)
  return { missing: false, resolvedTitle: page.title, wikitext }
}

const digest = { fetchedAt: new Date().toISOString(), planets: {}, characters: {}, errors: [] }

async function run(map, bucket, fields) {
  for (const [id, title] of Object.entries(map)) {
    try {
      const page = await fetchPage(title)
      if (page.missing) {
        digest[bucket][id] = { title, missing: true }
        console.log(`MISSING  ${id} (${title})`)
      } else {
        digest[bucket][id] = {
          title: page.resolvedTitle,
          infobox: parseInfobox(page.wikitext, fields),
          intro: extractIntro(page.wikitext),
        }
        console.log(`ok       ${id} <- ${page.resolvedTitle}`)
      }
    } catch (err) {
      digest.errors.push({ id, title, error: String(err) })
      console.error(`ERROR    ${id}: ${err}`)
    }
    await new Promise((r) => setTimeout(r, 150))
  }
}

await run(PLANETS, 'planets', PLANET_FIELDS)
await run(CHARACTERS, 'characters', CHARACTER_FIELDS)

const { writeFileSync } = await import('node:fs')
writeFileSync(OUT, JSON.stringify(digest, null, 1))
console.log(`\nDigest written: ${OUT}`)
console.log(`planets=${Object.keys(digest.planets).length} characters=${Object.keys(digest.characters).length} errors=${digest.errors.length}`)
