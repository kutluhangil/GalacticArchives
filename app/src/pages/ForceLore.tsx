// Force Lore Vault — Interactive page for Jedi/Sith philosophy, Codes, and
// Force powers. Features 3D-CSS animated Holocron shapes, bilingual content,
// and a searchable/filterable powers catalog.

import { useState } from 'react'
import TopBar from '../components/hud/TopBar'
import { useApp } from '../state/app'
import { sfx } from '../lib/audio'
import forcePowersData from '../data/force-powers.json'

type LangKey = 'en' | 'tr'
type Tier = 'basic' | 'intermediate' | 'advanced' | 'master'

interface ForcePower {
  id: string
  names: { en: string; tr: string }
  alignment: string
  tier: Tier
  sideOfForce: string
  desc: { en: string; tr: string }
  notableUsers: string[]
}

const powers = forcePowersData as ForcePower[]

const ALIGNMENT_COLOR: Record<string, string> = {
  light: '#66D9FF',
  dark: '#EF4444',
  neutral: '#A8B3C5',
}

const TIER_LABEL: Record<Tier, { en: string; tr: string }> = {
  basic: { en: 'Basic', tr: 'Temel' },
  intermediate: { en: 'Intermediate', tr: 'Orta' },
  advanced: { en: 'Advanced', tr: 'İleri' },
  master: { en: 'Master', tr: 'Usta' },
}

const TIER_ORDER: Tier[] = ['basic', 'intermediate', 'advanced', 'master']

const JEDI_CODE = {
  en: [
    'There is no emotion, there is peace.',
    'There is no ignorance, there is knowledge.',
    'There is no passion, there is serenity.',
    'There is no chaos, there is harmony.',
    'There is no death, there is the Force.',
  ],
  tr: [
    'Duygu yoktur, barış vardır.',
    'Cehalet yoktur, bilgi vardır.',
    'Tutku yoktur, sükunet vardır.',
    'Kaos yoktur, uyum vardır.',
    'Ölüm yoktur, Güç vardır.',
  ],
}

const SITH_CODE = {
  en: [
    'Peace is a lie, there is only passion.',
    'Through passion, I gain strength.',
    'Through strength, I gain power.',
    'Through power, I gain victory.',
    'Through victory, my chains are broken.',
    'The Force shall free me.',
  ],
  tr: [
    'Barış bir yalandır, yalnızca tutku vardır.',
    'Tutku aracılığıyla güç kazanırım.',
    'Güç aracılığıyla kuvvet kazanırım.',
    'Kuvvet aracılığıyla zafer kazanırım.',
    'Zafer aracılığıyla zincirlerim kırılır.',
    'Güç beni özgür kılacak.',
  ],
}

// 3D Holocron box (Jedi cube)
function HolocronCube({ active, lang }: { active: boolean; lang: LangKey }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative h-20 w-20"
        style={{ perspective: '300px' }}
        title={lang === 'tr' ? 'Jedi Holocron Küpü' : 'Jedi Holocron Cube'}
      >
        <div
          className="h-full w-full"
          style={{
            transformStyle: 'preserve-3d',
            animation: active ? 'holocron-spin 8s linear infinite' : 'none',
          }}
        >
          {/* front */}
          <div className="absolute inset-0 rounded border border-holo-cyan/60 bg-holo-cyan/10 backdrop-blur-sm" style={{ transform: 'translateZ(40px)' }} />
          {/* back */}
          <div className="absolute inset-0 rounded border border-holo-cyan/60 bg-holo-cyan/10" style={{ transform: 'rotateY(180deg) translateZ(40px)' }} />
          {/* left */}
          <div className="absolute inset-0 rounded border border-holo-cyan/40 bg-holo-cyan/5" style={{ transform: 'rotateY(-90deg) translateZ(40px)' }} />
          {/* right */}
          <div className="absolute inset-0 rounded border border-holo-cyan/40 bg-holo-cyan/5" style={{ transform: 'rotateY(90deg) translateZ(40px)' }} />
          {/* top */}
          <div className="absolute inset-0 rounded border border-holo-cyan/40 bg-holo-cyan/8" style={{ transform: 'rotateX(90deg) translateZ(40px)' }} />
          {/* bottom */}
          <div className="absolute inset-0 rounded border border-holo-cyan/40 bg-holo-cyan/8" style={{ transform: 'rotateX(-90deg) translateZ(40px)' }} />
        </div>
      </div>
      <span className="font-hud text-[9px] uppercase tracking-[0.3em] text-holo-cyan">
        {lang === 'tr' ? 'Jedi Holokronu' : 'Jedi Holocron'}
      </span>
    </div>
  )
}

// 3D Sith pyramid
function SithPyramid({ active, lang }: { active: boolean; lang: LangKey }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative h-20 w-20"
        style={{ perspective: '300px' }}
        title={lang === 'tr' ? 'Sith Holocron Piramidi' : 'Sith Holocron Pyramid'}
      >
        <div
          className="h-full w-full"
          style={{
            transformStyle: 'preserve-3d',
            animation: active ? 'sith-spin 6s linear infinite reverse' : 'none',
          }}
        >
          {/* CSS pyramid via clip-path faces */}
          <svg viewBox="0 0 80 80" className="absolute inset-0 h-full w-full" style={{ filter: 'drop-shadow(0 0 8px rgba(239,68,68,0.7))' }}>
            <polygon points="40,5 10,68 70,68" fill="rgba(239,68,68,0.15)" stroke="rgba(239,68,68,0.7)" strokeWidth="1.5" />
            <polygon points="40,5 10,68 40,55" fill="rgba(239,68,68,0.08)" stroke="rgba(239,68,68,0.4)" strokeWidth="1" />
            <polygon points="40,5 70,68 40,55" fill="rgba(239,68,68,0.12)" stroke="rgba(239,68,68,0.5)" strokeWidth="1" />
            <polygon points="10,68 70,68 40,55" fill="rgba(239,68,68,0.06)" stroke="rgba(239,68,68,0.3)" strokeWidth="0.8" />
            {/* Inner glow center */}
            <circle cx="40" cy="50" r="3" fill="rgba(239,68,68,0.6)" />
          </svg>
        </div>
      </div>
      <span className="font-hud text-[9px] uppercase tracking-[0.3em] text-red-400">
        {lang === 'tr' ? 'Sith Holokronu' : 'Sith Holocron'}
      </span>
    </div>
  )
}

export default function ForceLore() {
  const lang = useApp((s) => s.lang) as LangKey
  const [activeTab, setActiveTab] = useState<'jedi' | 'sith' | 'powers'>('jedi')
  const [alignFilter, setAlignFilter] = useState<string>('all')
  const [tierFilter, setTierFilter] = useState<string>('all')
  const [selectedPower, setSelectedPower] = useState<ForcePower | null>(null)

  const filteredPowers = powers.filter((p) => {
    if (alignFilter !== 'all' && p.alignment !== alignFilter) return false
    if (tierFilter !== 'all' && p.tier !== tierFilter) return false
    return true
  })

  return (
    <div className="relative min-h-screen w-full overflow-y-auto bg-space pb-24">
      <TopBar />

      {/* CSS Keyframes injected inline */}
      <style>{`
        @keyframes holocron-spin {
          0% { transform: rotateX(10deg) rotateY(0deg); }
          100% { transform: rotateX(10deg) rotateY(360deg); }
        }
        @keyframes sith-spin {
          0% { transform: rotateZ(0deg); }
          100% { transform: rotateZ(360deg); }
        }
      `}</style>

      <div className="mx-auto max-w-5xl px-4 pt-24">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="font-display text-2xl tracking-[0.25em] text-slate-100">
              {lang === 'tr' ? '⚡ GÜÇ KAZINAĞI' : '⚡ FORCE LORE VAULT'}
            </h1>
            <p className="mt-1 font-hud text-xs text-slate-400">
              {lang === 'tr'
                ? 'Işık ve Karanlık Taraf: Kodlar, Felsefe ve Güç Yetenekleri'
                : 'The Light and Dark Side: Codes, Philosophy, and Force Abilities'}
            </p>
          </div>

          <div className="flex items-end gap-6">
            <HolocronCube active={activeTab === 'jedi'} lang={lang} />
            <SithPyramid active={activeTab === 'sith'} lang={lang} />
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex rounded border border-white/10 bg-black/40 p-0.5">
          {[
            { id: 'jedi', label: lang === 'tr' ? '☀️ JEDİ KODU' : '☀️ JEDI CODE' },
            { id: 'sith', label: lang === 'tr' ? '⚡ SİTH KODU' : '⚡ SITH CODE' },
            { id: 'powers', label: lang === 'tr' ? '🔮 GÜÇ YETENEKLERİ' : '🔮 FORCE POWERS' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                sfx.playHover()
                setActiveTab(tab.id as typeof activeTab)
              }}
              className={`flex-1 rounded px-3 py-2 font-hud text-[11px] uppercase tracking-wider transition-all ${
                activeTab === tab.id
                  ? tab.id === 'sith'
                    ? 'bg-red-900/40 text-red-300'
                    : 'bg-holo-cyan/15 text-holo-cyan'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Jedi Code Tab */}
        {activeTab === 'jedi' && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Code */}
            <div className="rounded-xl border border-holo-cyan/30 bg-panel/60 p-6">
              <h2 className="mb-4 font-hud text-[11px] uppercase tracking-[0.35em] text-holo-cyan">
                {lang === 'tr' ? 'Jedi Kodu' : 'The Jedi Code'}
              </h2>
              <div className="space-y-3">
                {JEDI_CODE[lang].map((line, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 font-hud text-[10px] text-holo-cyan/50">{String(i + 1).padStart(2, '0')}</span>
                    <p className="font-display text-[15px] italic leading-relaxed text-slate-200">{line}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Jedi Philosophy */}
            <div className="space-y-4">
              {[
                {
                  title: { en: 'The Living Force', tr: 'Yaşayan Güç' },
                  desc: {
                    en: 'The energy that flows through all living things. Qui-Gon Jinn taught that one must be mindful of the Living Force — the present moment — rather than focusing solely on the prophesied future.',
                    tr: 'Tüm canlılardan geçen enerji. Qui-Gon Jinn, yalnızca kehanet edilen geleceğe odaklanmak yerine Yaşayan Güç\'e — şu ana — dikkat edilmesi gerektiğini öğretti.',
                  },
                  color: '#66D9FF',
                },
                {
                  title: { en: 'The Cosmic Force', tr: 'Kozmik Güç' },
                  desc: {
                    en: 'The binding energy that connects all life and death across the galaxy. The Cosmic Force is what allows Force Ghosts to persist after death — the broader tapestry of destiny itself.',
                    tr: 'Galaksi genelinde tüm yaşam ve ölümü birbirine bağlayan enerji. Kozmik Güç, Güç Hayaletlerinin ölümden sonra varlığını sürdürmesini sağlayan şeydir — kaderin kendisinin daha geniş dokusudur.',
                  },
                  color: '#818CF8',
                },
                {
                  title: { en: 'Midi-chlorians', tr: 'Midi-Kloryenler' },
                  desc: {
                    en: 'Microscopic symbiotic lifeforms found in every living cell. They serve as the interface between living beings and the Force. A high midi-chlorian count indicates Force sensitivity — Anakin Skywalker had over 20,000.',
                    tr: 'Her canlı hücrede bulunan mikroskobik simbiyotik yaşam formları. Canlılar ile Güç arasındaki arayüz işlevi görürler. Yüksek midi-kloryen sayısı Güç duyarlılığına işaret eder — Anakin Skywalker\'ın 20.000\'den fazlası vardı.',
                  },
                  color: '#34D399',
                },
              ].map((item, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-black/30 p-4">
                  <h3 className="mb-2 font-display text-[13px] tracking-wider" style={{ color: item.color }}>
                    {item.title[lang]}
                  </h3>
                  <p className="text-[12px] leading-relaxed text-slate-300">{item.desc[lang]}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sith Code Tab */}
        {activeTab === 'sith' && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Code */}
            <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-6">
              <h2 className="mb-4 font-hud text-[11px] uppercase tracking-[0.35em] text-red-400">
                {lang === 'tr' ? 'Sith Kodu' : 'The Sith Code'}
              </h2>
              <div className="space-y-3">
                {SITH_CODE[lang].map((line, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 font-hud text-[10px] text-red-500/50">{String(i + 1).padStart(2, '0')}</span>
                    <p className="font-display text-[15px] italic leading-relaxed text-slate-200">{line}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sith Philosophy */}
            <div className="space-y-4">
              {[
                {
                  title: { en: 'The Rule of Two', tr: 'İki Kuralı' },
                  desc: {
                    en: 'Established by Darth Bane after the Thought Bomb catastrophe at Ruusan destroyed the Brotherhood of Darkness: Always two there are — a Master to embody power, an Apprentice to crave it. This prevented Sith from destroying themselves through infighting.',
                    tr: 'Ruusan\'daki Düşünce Bombası felaketi Karanlık Kardeşlik\'i yok ettikten sonra Darth Bane tarafından kuruldu: Her zaman iki vardır — gücü somutlaştıran bir Usta, onu arzulayan bir Çırak. Bu, Sith\'in iç çatışmalarla kendini yok etmesini engelledi.',
                  },
                  color: '#EF4444',
                },
                {
                  title: { en: 'The Darth Title', tr: 'Darth Unvanı' },
                  desc: {
                    en: 'A title of Sith Mastery first used by ancient Sith Lords, reclaimed by Darth Bane. Notable Darths: Plagueis, Sidious, Maul, Tyranus (Dooku), Vader (Anakin). Each name reflects their philosophy of darkness.',
                    tr: 'Antik Sith Lordları tarafından ilk kullanılan ve Darth Bane tarafından geri kazanılan Sith Ustalığı unvanı. Önemli Darth\'lar: Plagueis, Sidious, Maul, Tyranus (Dooku), Vader (Anakin). Her isim karanlık felsefelerini yansıtır.',
                  },
                  color: '#F97316',
                },
                {
                  title: { en: 'Darth Plagueis\'s Secret', tr: 'Darth Plagueis\'in Sırrı' },
                  desc: {
                    en: 'Darth Plagueis the Wise discovered how to use the Force to influence midi-chlorians to create life — and prevent death. He was so powerful he even cheated death... until he taught his apprentice Palpatine everything he knew, who killed him in his sleep.',
                    tr: 'Bilge Darth Plagueis, yaşam yaratmak ve ölümü önlemek için midi-kloriyenleri etkilemek üzere Gücü nasıl kullanacağını keşfetti. O kadar güçlüydü ki ölümü bile aldattı... ta ki çırağı Palpatine\'e bildiği her şeyi öğretene kadar; Palpatine onu uyurken öldürdü.',
                  },
                  color: '#A855F7',
                },
              ].map((item, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-black/30 p-4">
                  <h3 className="mb-2 font-display text-[13px] tracking-wider" style={{ color: item.color }}>
                    {item.title[lang]}
                  </h3>
                  <p className="text-[12px] leading-relaxed text-slate-300">{item.desc[lang]}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Force Powers Tab */}
        {activeTab === 'powers' && (
          <div>
            {/* Filters */}
            <div className="mb-5 flex flex-wrap gap-4">
              <div className="flex gap-1 rounded border border-white/10 bg-black/40 p-0.5">
                {['all', 'light', 'dark', 'neutral'].map((a) => (
                  <button
                    key={a}
                    onClick={() => setAlignFilter(a)}
                    className={`rounded px-2.5 py-1 font-hud text-[10px] uppercase tracking-wider transition-all ${
                      alignFilter === a
                        ? a === 'dark'
                          ? 'bg-red-900/50 text-red-300'
                          : a === 'light'
                          ? 'bg-holo-cyan/20 text-holo-cyan'
                          : 'bg-white/10 text-slate-200'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {a === 'all' ? (lang === 'tr' ? 'Hepsi' : 'All') :
                     a === 'light' ? (lang === 'tr' ? '☀️ Işık' : '☀️ Light') :
                     a === 'dark' ? (lang === 'tr' ? '⚡ Karanlık' : '⚡ Dark') :
                     (lang === 'tr' ? '○ Nötr' : '○ Neutral')}
                  </button>
                ))}
              </div>

              <div className="flex gap-1 rounded border border-white/10 bg-black/40 p-0.5">
                {['all', ...TIER_ORDER].map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setTierFilter(tier)}
                    className={`rounded px-2.5 py-1 font-hud text-[10px] uppercase tracking-wider transition-all ${
                      tierFilter === tier
                        ? 'bg-star-gold/20 text-star-gold'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {tier === 'all' ? (lang === 'tr' ? 'Hepsi' : 'All') : TIER_LABEL[tier as Tier][lang]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPowers.map((power) => {
                const color = ALIGNMENT_COLOR[power.alignment] ?? '#A8B3C5'
                return (
                  <button
                    key={power.id}
                    onClick={() => {
                      sfx.playSelect()
                      setSelectedPower(selectedPower?.id === power.id ? null : power)
                    }}
                    className={`group rounded-lg border p-4 text-left transition-all ${
                      selectedPower?.id === power.id
                        ? 'border-white/30 bg-panel/90'
                        : 'border-white/10 bg-panel/50 hover:border-white/20 hover:bg-panel/70'
                    }`}
                    style={selectedPower?.id === power.id ? { borderColor: color + '60' } : {}}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-[13px] tracking-wide text-slate-100">
                        {power.names[lang]}
                      </h3>
                      <span
                        className="shrink-0 rounded px-1.5 py-0.5 font-hud text-[9px] uppercase tracking-wider"
                        style={{ color, background: color + '20' }}
                      >
                        {TIER_LABEL[power.tier][lang]}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-1.5">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: color }}
                      />
                      <span className="font-hud text-[9px] uppercase tracking-wider" style={{ color }}>
                        {power.alignment === 'light' ? (lang === 'tr' ? 'Işık Tarafı' : 'Light Side') :
                         power.alignment === 'dark' ? (lang === 'tr' ? 'Karanlık Taraf' : 'Dark Side') :
                         (lang === 'tr' ? 'Nötr' : 'Neutral')}
                      </span>
                    </div>

                    {selectedPower?.id === power.id && (
                      <div className="mt-3 border-t border-white/10 pt-3">
                        <p className="text-[12px] leading-relaxed text-slate-300">
                          {power.desc[lang]}
                        </p>
                        <div className="mt-3">
                          <div className="font-hud text-[9px] uppercase tracking-wider text-slate-500 mb-1">
                            {lang === 'tr' ? 'Ünlü Kullanıcılar' : 'Notable Users'}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {power.notableUsers.map((u) => (
                              <span
                                key={u}
                                className="rounded bg-white/5 px-1.5 py-0.5 font-hud text-[10px] text-slate-400"
                              >
                                {u}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {filteredPowers.length === 0 && (
              <p className="py-12 text-center font-hud text-[12px] text-slate-500">
                {lang === 'tr' ? 'Bu filtre için güç bulunamadı.' : 'No powers match this filter.'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
