import { useState } from 'react'
import { useApp } from '../state/app'
import { L } from '../lib/lore'
import { sfx } from '../lib/audio'

interface FormSpec {
  id: string
  name: { en: string; tr: string }
  formNumber: string
  archetype: { en: string; tr: string }
  notableUsers: string
  desc: { en: string; tr: string }
}

const forms: FormSpec[] = [
  {
    id: 'shii-cho',
    name: { en: 'Form I: Shii-Cho', tr: 'Form I: Shii-Cho' },
    formNumber: 'Form I',
    archetype: { en: 'The Determination Form', tr: 'Kararlılık Formu' },
    notableUsers: 'Kit Fisto, Luke Skywalker, Younglings',
    desc: {
      en: 'The oldest lightsaber combat form created when moving from metal swords to energy blades. Relies on fundamental strikes and parries.',
      tr: 'Metal kılıçlardan enerji bıçaklarına geçildiğinde oluşturulan en eski ışın kılıcı formu. Temel vuruşlara ve savuşturmalara dayanır.'
    }
  },
  {
    id: 'makashi',
    name: { en: 'Form II: Makashi', tr: 'Form II: Makashi' },
    formNumber: 'Form II',
    archetype: { en: 'The Contention Form', tr: 'Mücadele / Düello Formu' },
    notableUsers: 'Count Dooku, Asajj Ventress, Ki-Adi-Mundi',
    desc: {
      en: 'Designed specifically for lightsaber-to-lightsaber dueling with elegant one-handed footwork and precise thrusts.',
      tr: 'Zarif tek el ayak hareketleri ve hassas dürtüşlerle özellikle ışın kılıcı düelloları için tasarlanmıştır.'
    }
  },
  {
    id: 'soresu',
    name: { en: 'Form III: Soresu', tr: 'Form III: Soresu' },
    formNumber: 'Form III',
    archetype: { en: 'The Resilience Form', tr: 'Direniş / Savunma Formu' },
    notableUsers: 'Obi-Wan Kenobi, Kanan Jarrus',
    desc: {
      en: 'The ultimate defensive style, developed to deflect blaster fire and wait for the enemy to tire out or make a mistake.',
      tr: 'Blaster atışlarını saptırmak ve düşmanın yorulmasını veya hata yapmasını beklemek için geliştirilmiş nihai savunma tarzı.'
    }
  },
  {
    id: 'ataru',
    name: { en: 'Form IV: Ataru', tr: 'Form IV: Ataru' },
    formNumber: 'Form IV',
    archetype: { en: 'The Aggression Form', tr: 'Saldırı / Akrobasi Formu' },
    notableUsers: 'Yoda, Qui-Gon Jinn, Ahsoka Tano',
    desc: {
      en: 'An acrobatic, high-energy style using Force-assisted jumps, spins, and somersaults for rapid offensive strikes.',
      tr: 'Hızlı taarrruz vuruşları için Güç destekli sıçramalar, dönüşler ve taklalar kullanan akrobatik, yüksek enerjili bir tarz.'
    }
  },
  {
    id: 'djem-so',
    name: { en: 'Form V: Shien / Djem So', tr: 'Form V: Shien / Djem So' },
    formNumber: 'Form V',
    archetype: { en: 'The Perseverance Form', tr: 'Azim / Karşı Saldırı Formu' },
    notableUsers: 'Anakin Skywalker / Darth Vader, Ahsoka Tano',
    desc: {
      en: 'Created by Soresu masters who wanted more offense, focusing on heavy power blows and redirecting blaster fire back at enemies.',
      tr: 'Daha fazla saldırı isteyen Soresu ustaları tarafından oluşturuldu; ağır güç darbelerine ve blaster atışlarını düşmanlara geri yönlendirmeye odaklanır.'
    }
  },
  {
    id: 'niman',
    name: { en: 'Form VI: Niman', tr: 'Form VI: Niman' },
    formNumber: 'Form VI',
    archetype: { en: 'The Moderation Form', tr: 'Denge Formu' },
    notableUsers: 'Darth Maul (dual-blade), Exar Kun',
    desc: {
      en: 'A balanced form combining elements of earlier styles, often favored by Jedi Consulars and dual-blade users.',
      tr: 'Önceki stillerin unsurlarını birleştiren dengeli bir form; genellikle Jedi Diplomatları ve çift bıçak kullanıcıları tarafından tercih edilir.'
    }
  },
  {
    id: 'vaapad',
    name: { en: 'Form VII: Juyo / Vaapad', tr: 'Form VII: Juyo / Vaapad' },
    formNumber: 'Form VII',
    archetype: { en: 'The Ferocity Form', tr: 'Vahşet / Vaapad Formu' },
    notableUsers: 'Mace Windu, Darth Maul, Starkiller',
    desc: {
      en: 'The most ferocious and unpredictable form. Mace Windu created Vaapad to channel inner darkness back toward the attacker without succumbing to the Dark Side.',
      tr: 'En vahşi ve öngörülemez form. Mace Windu, Vaapad stilini içindeki karanlığı Karanlık Tarafa yenik düşmeden saldırgana geri yönlendirmek için yarattı.'
    }
  }
]

const bladeColors = [
  { id: 'blue', label: 'Blue', colorHex: '#0088FF', glow: 'rgba(0, 136, 255, 0.8)' },
  { id: 'green', label: 'Green', colorHex: '#00FF44', glow: 'rgba(0, 255, 68, 0.8)' },
  { id: 'red', label: 'Red (Sith Bleeded)', colorHex: '#FF0033', glow: 'rgba(255, 0, 51, 0.8)' },
  { id: 'purple', label: 'Purple (Mace Windu)', colorHex: '#AA00FF', glow: 'rgba(170, 0, 255, 0.8)' },
  { id: 'yellow', label: 'Yellow (Temple Guard)', colorHex: '#FFDD00', glow: 'rgba(255, 221, 0, 0.8)' },
  { id: 'white', label: 'White (Ahsoka Purified)', colorHex: '#FFFFFF', glow: 'rgba(255, 255, 255, 0.9)' }
]

export default function LightsaberChamber({ onClose }: { onClose: () => void }) {
  const lang = useApp((s) => s.lang)
  const [selectedForm, setSelectedForm] = useState<FormSpec>(forms[0])
  const [bladeColor, setBladeColor] = useState(bladeColors[0])
  const [ignited, setIgnited] = useState<boolean>(true)

  const toggleIgnition = () => {
    sfx.playLightsaberIgnition()
    setIgnited(!ignited)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-4xl rounded-xl border border-holo-cyan/40 bg-panel/95 p-6 shadow-[0_0_40px_rgba(102,217,255,0.2)]">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="font-display text-lg tracking-[0.2em] text-star-gold">
            ⚔️ {lang === 'tr' ? 'IŞIN KILIÇLARI & GÜÇ FORMLARI ODASI' : 'LIGHTSABER COMBAT FORMS CHAMBER'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100">✕</button>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-12">
          {/* Form Selector List */}
          <div className="md:col-span-5 space-y-1.5 max-h-[350px] overflow-y-auto pr-2">
            {forms.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  sfx.playHover()
                  setSelectedForm(f)
                }}
                className={`block w-full rounded border px-3 py-2 text-left transition-all ${
                  selectedForm.id === f.id
                    ? 'border-star-gold/60 bg-star-gold/15 text-star-gold'
                    : 'border-white/10 bg-black/40 text-slate-300 hover:border-white/20'
                }`}
              >
                <div className="font-hud text-xs font-bold">{f.formNumber} - {L(f.name, lang)}</div>
                <div className="text-[10px] text-slate-400">{L(f.archetype, lang)}</div>
              </button>
            ))}
          </div>

          {/* Visualizer & Details */}
          <div className="md:col-span-7 flex flex-col justify-between rounded-lg border border-white/10 bg-black/50 p-5">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-display text-xl tracking-wider text-slate-100">
                    {L(selectedForm.name, lang)}
                  </h3>
                  <div className="font-hud text-xs text-holo-cyan">{L(selectedForm.archetype, lang)}</div>
                </div>

                <button
                  onClick={toggleIgnition}
                  className="rounded border border-white/20 bg-white/5 px-3 py-1 font-hud text-[11px] uppercase tracking-wider text-slate-200 hover:bg-white/10"
                >
                  {ignited ? (lang === 'tr' ? 'Kapat 🔇' : 'Retract 🔇') : (lang === 'tr' ? 'Ateşle ⚡' : 'Ignite ⚡')}
                </button>
              </div>

              {/* Animated Lightsaber Blade */}
              <div className="my-6 flex flex-col items-center justify-center h-48">
                <div className="relative flex flex-col items-center">
                  {/* Blade */}
                  <div
                    className="w-3.5 rounded-t-full transition-all duration-500"
                    style={{
                      height: ignited ? '130px' : '0px',
                      backgroundColor: '#FFFFFF',
                      boxShadow: ignited
                        ? `0 0 10px #FFF, 0 0 20px ${bladeColor.glow}, 0 0 35px ${bladeColor.glow}`
                        : 'none',
                    }}
                  />
                  {/* Hilt */}
                  <div className="h-16 w-5 rounded-b border border-slate-500 bg-gradient-to-b from-slate-400 via-slate-700 to-slate-900 shadow-md" />
                </div>
              </div>

              {/* Kyber Color Selector */}
              <div className="mb-4">
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">
                  {lang === 'tr' ? 'Kyber Kristali Rengi:' : 'Kyber Crystal Color:'}
                </label>
                <div className="flex gap-2">
                  {bladeColors.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        sfx.playSelect()
                        setBladeColor(c)
                      }}
                      className={`h-6 w-6 rounded-full border-2 transition-transform ${
                        bladeColor.id === c.id ? 'scale-125 border-white' : 'border-transparent opacity-70'
                      }`}
                      style={{ backgroundColor: c.colorHex }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <p className="text-xs leading-relaxed text-slate-300">
                {L(selectedForm.desc, lang)}
              </p>
            </div>

            <div className="mt-4 border-t border-white/5 pt-2 text-[11px] text-slate-400">
              <strong className="text-slate-300">{lang === 'tr' ? 'Usta Kullanıcılar:' : 'Notable Practitioners:'}</strong> {selectedForm.notableUsers}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
