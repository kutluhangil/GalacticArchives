// GalacticIdGenerator — procedurally generates a Star Wars character identity
// with archetype, homeworld, name, and a downloadable Holo-ID card via Canvas API.

import { useState, useCallback } from 'react'
import { useApp } from '../state/app'
import { sfx } from '../lib/audio'

type LangKey = 'en' | 'tr'

interface Archetype {
  id: string
  label: { en: string; tr: string }
  color: string
  emoji: string
  titles: { en: string[]; tr: string[] }
  traits: { en: string[]; tr: string[] }
}

const ARCHETYPES: Archetype[] = [
  {
    id: 'jedi',
    label: { en: 'Jedi Knight', tr: 'Jedi Şövalyesi' },
    color: '#66D9FF',
    emoji: '⚔️',
    titles: {
      en: ['Jedi Knight', 'Jedi Master', 'Jedi Padawan', 'Jedi Guardian', 'Jedi Consular'],
      tr: ['Jedi Şövalyesi', 'Jedi Ustası', 'Jedi Padawan\'ı', 'Jedi Koruyucusu', 'Jedi Danışmanı'],
    },
    traits: {
      en: ['Force-sensitive', 'Lightsaber proficient', 'Loyal to the Republic', 'Mindful of the Living Force'],
      tr: ['Güce duyarlı', 'Işın kılıcı ustası', 'Cumhuriyete sadık', 'Yaşayan Güç\'e dikkatli'],
    },
  },
  {
    id: 'sith',
    label: { en: 'Sith Lord', tr: 'Sith Lordu' },
    color: '#EF4444',
    emoji: '⚡',
    titles: {
      en: ['Sith Apprentice', 'Sith Lord', 'Sith Warrior', 'Dark Side Adept', 'Inquisitor'],
      tr: ['Sith Çırağı', 'Sith Lordu', 'Sith Savaşçısı', 'Karanlık Taraf Ustası', 'Engizisyoncu'],
    },
    traits: {
      en: ['Dark-side channeler', 'Lightsaber combat master', 'Ruthless strategist', 'Seeker of power'],
      tr: ['Karanlık taraf kanalı', 'Işın kılıcı savaş ustası', 'Acımasız stratejist', 'Güç arayıcısı'],
    },
  },
  {
    id: 'mandalorian',
    label: { en: 'Mandalorian Warrior', tr: 'Mandaloryalı Savaşçı' },
    color: '#14B8A6',
    emoji: '🪖',
    titles: {
      en: ['Mandalorian Warrior', 'Death Watch Soldier', 'Tribe Elder', 'Super Commando', 'Foundling'],
      tr: ['Mandaloryalı Savaşçı', 'Ölüm Muhafızı Askeri', 'Kabile Yaşlısı', 'Süper Komando', 'Kurucu'],
    },
    traits: {
      en: ['This is the Way', 'Beskar armor wearer', 'Jetpack proficient', 'Bounty hunting specialist'],
      tr: ['Bu Yol\'dur', 'Beskar zırh giyicisi', 'Jetpack uzmanı', 'Ödül avcılığı uzmanı'],
    },
  },
  {
    id: 'smuggler',
    label: { en: 'Smuggler / Scoundrel', tr: 'Kaçakçı / Serseri' },
    color: '#F59E0B',
    emoji: '🃏',
    titles: {
      en: ['Freighter Captain', 'Corellian Smuggler', 'Outer Rim Outlaw', 'Gambler', 'Rogue Trader'],
      tr: ['Kargo Gemisi Kaptanı', 'Corellian Kaçakçı', 'Dış Bölge Haydut', 'Kumarbaz', 'Kaçak Tüccar'],
    },
    traits: {
      en: ['Never tell me the odds', 'Blaster quick-draw expert', 'Hyperlane knowledge', 'Always has a plan'],
      tr: ['Bana oranları söyleme', 'Blaster hızlı çekiş uzmanı', 'Hiperuzay yolu bilgisi', 'Her zaman planı var'],
    },
  },
  {
    id: 'bounty-hunter',
    label: { en: 'Bounty Hunter', tr: 'Ödül Avcısı' },
    color: '#A855F7',
    emoji: '🎯',
    titles: {
      en: ['Guild Bounty Hunter', 'Independent Contractor', 'Tracker', 'Assassin for Hire', 'Elite Huntsman'],
      tr: ['Lonca Ödül Avcısı', 'Bağımsız Yüklenici', 'İzci', 'Kiralanabilir Suikastçı', 'Elit Avcı'],
    },
    traits: {
      en: ['No disintegrations', 'Tracking expert', 'Weapons specialist', 'Guild registered'],
      tr: ['Parçalamak yasak', 'İz sürme uzmanı', 'Silah uzmanı', 'Lonca kayıtlı'],
    },
  },
  {
    id: 'rebel',
    label: { en: 'Rebel Alliance Fighter', tr: 'Asi İttifakı Savaşçısı' },
    color: '#F97316',
    emoji: '✊',
    titles: {
      en: ['Rebel Soldier', 'Starfighter Pilot', 'Intelligence Officer', 'Alliance Commander', 'Special Forces'],
      tr: ['Asi Askeri', 'Yıldız Savaşçısı Pilotu', 'İstihbarat Subayı', 'İttifak Komutanı', 'Özel Kuvvetler'],
    },
    traits: {
      en: ['Rebellions are built on hope', 'Espionage trained', 'Anti-Imperial', 'Survival specialist'],
      tr: ['İsyanlar umut üzerine kurulur', 'Casusluk eğitimli', 'İmparatorluk karşıtı', 'Hayatta kalma uzmanı'],
    },
  },
]

// Star Wars name phoneme pools
const NAME_PARTS = {
  prefix: ['An', 'Kyl', 'Tor', 'Rey', 'Mav', 'Zar', 'Ven', 'Or', 'Cal', 'Ahd', 'Jar', 'Bel', 'Drak', 'Vin', 'Ser'],
  mid: ['ek', 'a', 'ok', 'ias', 'un', 'en', 'ar', 'ov', 'ix', 'es', 'yl', 'ath', 'or', 'an'],
  suffix: ['us', 'a', 'is', 'o', 'ius', 'ax', 'ox', 'ys', 'an', 'el', 'ek', 'ara', 'os'],
  family: ['Skywalker', 'Kenobi', 'Solo', 'Fett', 'Syndulla', 'Jarrus', 'Dume', 'Tano', 'Vos', 'Kryze', 'Djarin', 'Antilles', 'Organa', 'Bridger', 'Erso', 'Jinn'],
}

const HOMEWORLDS = [
  'Tatooine', 'Coruscant', 'Mandalore', 'Naboo', 'Corellia', 'Ryloth', 'Kashyyyk',
  'Dathomir', 'Shili', 'Togruta Prime', 'Mon Cala', 'Alderaan', 'Lothal', 'Nar Shaddaa',
]

const AUREBESH_MAP: Record<string, string> = {
  a: 'ﬡ', b: 'ﬢ', c: 'ﬣ', d: 'ﬤ', e: 'ﬥ', f: 'ﬦ', g: 'ﬧ', h: 'ﬨ',
  i: '﬩', j: 'שׁ', k: 'שׂ', l: 'שּׁ', m: 'שּׂ', n: 'שׁ', o: 'שׂ', p: 'שּׁ',
  q: 'שּׂ', r: 'אַ', s: 'אָ', t: 'א', u: 'ב', v: 'ג', w: 'ד', x: 'ה',
  y: 'ו', z: 'ז',
}

function toAurebesh(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map((c) => AUREBESH_MAP[c] ?? c)
    .join('')
}

function rnd<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateName(): string {
  const given = rnd(NAME_PARTS.prefix) + rnd(NAME_PARTS.mid) + rnd(NAME_PARTS.suffix)
  const family = rnd(NAME_PARTS.family)
  return `${given} ${family}`
}

interface GeneratedId {
  name: string
  archetype: Archetype
  title: string
  homeworld: string
  trait: string
  idNumber: string
}

function generateId(archetype: Archetype, lang: LangKey): GeneratedId {
  const titles = archetype.titles[lang]
  const traits = archetype.traits[lang]
  return {
    name: generateName(),
    archetype,
    title: rnd(titles),
    homeworld: rnd(HOMEWORLDS),
    trait: rnd(traits),
    idNumber: `GA-${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 900 + 100)}`,
  }
}

// Draw the Holo-ID card to canvas and download it
function downloadCard(card: GeneratedId, lang: LangKey) {
  const canvas = document.createElement('canvas')
  canvas.width = 560
  canvas.height = 320
  const ctx = canvas.getContext('2d')!

  // Background
  ctx.fillStyle = '#02060E'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Faction color gradient overlay
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
  grad.addColorStop(0, card.archetype.color + '18')
  grad.addColorStop(1, '#02060E')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Border
  ctx.strokeStyle = card.archetype.color + 'CC'
  ctx.lineWidth = 2
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20)

  // Inner accent border
  ctx.strokeStyle = card.archetype.color + '44'
  ctx.lineWidth = 1
  ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32)

  // Header bar
  ctx.fillStyle = card.archetype.color + '22'
  ctx.fillRect(10, 10, canvas.width - 20, 50)

  // Header text
  ctx.fillStyle = card.archetype.color
  ctx.font = 'bold 14px monospace'
  ctx.fillText('GALACTIC ARCHIVES · HOLO-ID', 28, 42)

  // Emoji + Archetype
  ctx.fillStyle = '#E2E8F0'
  ctx.font = '24px monospace'
  ctx.fillText(card.archetype.emoji, canvas.width - 60, 42)

  // Name
  ctx.fillStyle = '#F8FAFC'
  ctx.font = 'bold 28px serif'
  ctx.fillText(card.name, 28, 105)

  // Title
  ctx.fillStyle = card.archetype.color
  ctx.font = '14px monospace'
  ctx.fillText(card.title.toUpperCase(), 28, 130)

  // Divider line
  ctx.strokeStyle = card.archetype.color + '55'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(28, 145)
  ctx.lineTo(canvas.width - 28, 145)
  ctx.stroke()

  // Info fields
  const fields = [
    { label: lang === 'tr' ? 'KAYIT NO' : 'REG. NO', value: card.idNumber },
    { label: lang === 'tr' ? 'ANA DÜNYA' : 'HOMEWORLD', value: card.homeworld },
    { label: lang === 'tr' ? 'SINIF' : 'CLEARANCE', value: lang === 'tr' ? card.archetype.label.tr : card.archetype.label.en },
    { label: lang === 'tr' ? 'NİTELİK' : 'TRAIT', value: card.trait },
  ]

  ctx.font = '10px monospace'
  fields.forEach((f, i) => {
    const y = 170 + i * 28
    ctx.fillStyle = '#64748B'
    ctx.fillText(f.label, 28, y)
    ctx.fillStyle = '#CBD5E1'
    ctx.font = '13px monospace'
    ctx.fillText(f.value, 28, y + 14)
    ctx.font = '10px monospace'
  })

  // Aurebesh name strip
  ctx.fillStyle = card.archetype.color + '20'
  ctx.fillRect(canvas.width - 170, 60, 150, 230)
  ctx.save()
  ctx.translate(canvas.width - 95, 85)
  ctx.rotate(Math.PI / 2)
  ctx.fillStyle = card.archetype.color + '55'
  ctx.font = '11px monospace'
  ctx.fillText(toAurebesh(card.name), -100, 0)
  ctx.restore()

  // Download
  const link = document.createElement('a')
  link.download = `galactic-id-${card.name.replace(/\s+/g, '-').toLowerCase()}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export default function GalacticIdGenerator({ onClose }: { onClose: () => void }) {
  const lang = useApp((s) => s.lang) as LangKey
  const [selectedArchetype, setSelectedArchetype] = useState<Archetype>(ARCHETYPES[0])
  const [generatedId, setGeneratedId] = useState<GeneratedId | null>(null)
  const [copied, setCopied] = useState(false)

  const generate = useCallback(() => {
    sfx.playSelect()
    setGeneratedId(generateId(selectedArchetype, lang))
  }, [selectedArchetype, lang])

  const copy = useCallback(() => {
    if (!generatedId) return
    const text = [
      `=== GALACTIC ARCHIVES HOLO-ID ===`,
      `Name: ${generatedId.name}`,
      `Title: ${generatedId.title}`,
      `Archetype: ${lang === 'tr' ? generatedId.archetype.label.tr : generatedId.archetype.label.en}`,
      `Homeworld: ${generatedId.homeworld}`,
      `Trait: ${generatedId.trait}`,
      `ID: ${generatedId.idNumber}`,
    ].join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [generatedId, lang])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-xl border border-holo-cyan/30 bg-panel/95 p-6 shadow-[0_0_40px_rgba(102,217,255,0.15)]">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="font-display text-lg tracking-[0.2em] text-holo-cyan">
            🪪 {lang === 'tr' ? 'GALAKTİK KİMLİK ÜRETECİ' : 'GALACTIC ID GENERATOR'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100">✕</button>
        </div>

        {/* Archetype selector */}
        <div className="mt-5">
          <div className="mb-2 font-hud text-[10px] uppercase tracking-[0.3em] text-slate-400">
            {lang === 'tr' ? 'Arketip Seç' : 'Choose Archetype'}
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {ARCHETYPES.map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  sfx.playHover()
                  setSelectedArchetype(a)
                  setGeneratedId(null)
                }}
                className={`rounded-lg border py-2 px-1 text-center transition-all ${
                  selectedArchetype.id === a.id
                    ? 'border-opacity-60'
                    : 'border-white/10 bg-black/30 hover:border-white/20'
                }`}
                style={
                  selectedArchetype.id === a.id
                    ? { borderColor: a.color + '99', background: a.color + '15' }
                    : {}
                }
              >
                <div className="text-lg">{a.emoji}</div>
                <div className="mt-0.5 font-hud text-[8px] leading-tight" style={{ color: selectedArchetype.id === a.id ? a.color : '#94A3B8' }}>
                  {lang === 'tr' ? a.label.tr.split(' ')[0] : a.label.en.split(' ')[0]}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={generate}
          className="mt-5 w-full rounded border border-holo-cyan/50 bg-holo-cyan/15 py-2.5 font-hud text-xs font-bold uppercase tracking-[0.25em] text-holo-cyan transition-all hover:bg-holo-cyan/25 hover:shadow-[0_0_15px_rgba(102,217,255,0.3)]"
        >
          {lang === 'tr' ? '⚡ KİMLİK OLUŞTUR' : '⚡ GENERATE IDENTITY'}
        </button>

        {/* Generated ID card */}
        {generatedId && (
          <div
            className="mt-5 rounded-xl border p-5"
            style={{ borderColor: generatedId.archetype.color + '55', background: generatedId.archetype.color + '08' }}
          >
            {/* Card header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="font-hud text-[10px] uppercase tracking-[0.3em] text-slate-500">
                  {lang === 'tr' ? 'Galaktik Arşivler — Holo-Kimlik' : 'Galactic Archives — Holo-ID'}
                </div>
                <h3 className="mt-1 font-display text-2xl tracking-wider text-slate-100">
                  {generatedId.name}
                </h3>
                <div className="font-hud text-xs uppercase tracking-wider" style={{ color: generatedId.archetype.color }}>
                  {generatedId.title}
                </div>
              </div>

              <div className="text-4xl">{generatedId.archetype.emoji}</div>
            </div>

            {/* Divider */}
            <div className="my-3 h-px" style={{ background: generatedId.archetype.color + '30' }} />

            {/* Fields */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: lang === 'tr' ? 'Kayıt No' : 'ID Number', val: generatedId.idNumber },
                { key: lang === 'tr' ? 'Ana Dünya' : 'Homeworld', val: generatedId.homeworld },
                { key: lang === 'tr' ? 'Sınıf' : 'Archetype', val: lang === 'tr' ? generatedId.archetype.label.tr : generatedId.archetype.label.en },
                { key: lang === 'tr' ? 'Nitelik' : 'Trait', val: generatedId.trait },
              ].map((f) => (
                <div key={f.key}>
                  <div className="font-hud text-[9px] uppercase tracking-wider text-slate-500">{f.key}</div>
                  <div className="mt-0.5 font-hud text-[11px] text-slate-200">{f.val}</div>
                </div>
              ))}
            </div>

            {/* Aurebesh strip */}
            <div className="mt-4 overflow-hidden rounded border border-white/10 bg-black/40 px-3 py-2">
              <div className="font-hud text-[9px] uppercase tracking-[0.3em] text-slate-600 mb-1">
                Aurebesh
              </div>
              <div className="font-mono text-[13px] tracking-wider" style={{ color: generatedId.archetype.color + 'AA' }}>
                {toAurebesh(generatedId.name)}
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={copy}
                className="flex-1 rounded border border-white/20 bg-white/5 py-1.5 font-hud text-[10px] uppercase tracking-wider text-slate-300 hover:bg-white/10 transition-all"
              >
                {copied ? (lang === 'tr' ? '✓ Kopyalandı!' : '✓ Copied!') : (lang === 'tr' ? '📋 Kopyala' : '📋 Copy')}
              </button>
              <button
                onClick={() => downloadCard(generatedId, lang)}
                className="flex-1 rounded border py-1.5 font-hud text-[10px] uppercase tracking-wider transition-all hover:opacity-80"
                style={{
                  borderColor: generatedId.archetype.color + '80',
                  background: generatedId.archetype.color + '18',
                  color: generatedId.archetype.color,
                }}
              >
                {lang === 'tr' ? '⬇ PNG İndir' : '⬇ Download PNG'}
              </button>
              <button
                onClick={generate}
                className="rounded border border-white/15 bg-white/5 px-3 py-1.5 font-hud text-[10px] uppercase tracking-wider text-slate-400 hover:bg-white/10 transition-all"
              >
                ↻
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
