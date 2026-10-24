import { useState } from 'react'
import { useApp } from '../state/app'
import { sfx } from '../lib/audio'
import { L } from '../lib/lore'
import { tours } from '../lib/tours'
import ModalShell from './ModalShell'
import { useLater } from '../hooks/useLater'

interface Question {
  qEn: string
  qTr: string
  optionsEn: string[]
  optionsTr: string[]
  answerIdx: number
}

const QUIZ_QUESTIONS: Question[] = [
  {
    qEn: 'Which starship completed the Kessel Run in less than 12 parsecs?',
    qTr: "Kessel Rotası'nı 12 parsekten az sürede tamamlayan yıldız gemisi hangisidir?",
    optionsEn: ['Imperial Star Destroyer', 'Millennium Falcon', 'Razor Crest', 'Slave I'],
    optionsTr: ['İmparatorluk Yıldız Yok Edicisi', 'Millennium Falcon', 'Razor Crest', 'Slave I'],
    answerIdx: 1,
  },
  {
    qEn: 'On which desert world did Luke Skywalker grow up?',
    qTr: 'Luke Skywalker hangi çöl dünyasında büyümüştür?',
    optionsEn: ['Jakku', 'Geonosis', 'Tatooine', 'Korriban'],
    optionsTr: ['Jakku', 'Geonosis', 'Tatooine', 'Korriban'],
    answerIdx: 2,
  },
  {
    qEn: 'Which battle resulted in the destruction of the first Death Star?',
    qTr: 'İlk Ölüm Yıldızı hangi savaşın sonucunda imha edilmiştir?',
    optionsEn: ['Battle of Hoth', 'Battle of Endor', 'Battle of Geonosis', 'Battle of Yavin'],
    optionsTr: ['Hoth Savaşı', 'Endor Savaşı', 'Geonosis Savaşı', 'Yavin Savaşı'],
    answerIdx: 3,
  },
  {
    qEn: 'What is the capital world of the Galactic Republic?',
    qTr: 'Galaktik Cumhuriyet\'in başkent dünyası hangisidir?',
    optionsEn: ['Coruscant', 'Alderaan', 'Naboo', 'Corellia'],
    optionsTr: ['Coruscant', 'Alderaan', 'Naboo', 'Corellia'],
    answerIdx: 0,
  },
  {
    qEn: 'Who commanded the Separatist droid army during the Clone Wars?',
    qTr: 'Klon Savaşları sırasında Ayrılıkçı droyd ordusuna kim komuta etmiştir?',
    optionsEn: ['Count Dooku', 'General Grievous', 'Darth Maul', 'Jango Fett'],
    optionsTr: ['Kont Dooku', 'General Grievous', 'Darth Maul', 'Jango Fett'],
    answerIdx: 1,
  },
]

/** the trial's verdict picks a path, and each path is an authored tour */
const PATHS = {
  jedi: {
    tour: 'skywalker',
    title: { en: 'The Jedi path', tr: 'Jedi yolu' },
    blurb: { en: 'The archive trusts you with the light. Walk the saga that kept it.', tr: 'Arşiv ışığı sana emanet ediyor. Onu koruyan destanın izinden yürü.' },
  },
  sith: {
    tour: 'dark-side',
    title: { en: 'The Sith path', tr: 'Sith yolu' },
    blurb: { en: 'Gaps in your knowledge… the dark side fills them. Visit the worlds it claimed.', tr: 'Bilgindeki boşlukları… karanlık taraf dolduruyor. Onun sahiplendiği dünyaları gez.' },
  },
} as const

export default function HolocronQuiz({ onClose }: { onClose: () => void }) {
  const lang = useApp((s) => s.lang)
  const startTour = useApp((s) => s.startTour)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null)
  const later = useLater()

  const currentQ = QUIZ_QUESTIONS[currentIdx]

  const handleSelect = (idx: number) => {
    if (selectedOpt !== null) return
    setSelectedOpt(idx)
    const isCorrect = idx === currentQ.answerIdx
    if (isCorrect) {
      sfx.playSelect()
      setScore((s) => s + 1)
    } else {
      sfx.playHover()
    }

    later(() => {
      if (currentIdx + 1 < QUIZ_QUESTIONS.length) {
        setCurrentIdx((i) => i + 1)
        setSelectedOpt(null)
      } else {
        setFinished(true)
      }
    }, 1200)
  }

  const getRank = () => {
    if (score === 5) return lang === 'tr' ? '🏆 GALAKTİK BAŞ ARŞİVCİ' : '🏆 GRAND ARCHIVAL MASTER'
    if (score >= 3) return lang === 'tr' ? '⚔️ JEDI ARŞİV MUHAFIZI' : '⚔️ JEDI ARCHIVIST'
    return lang === 'tr' ? '📜 ARŞİV ÇIRAGI' : '📜 ARCHIVAL CHRONICLER'
  }

  // Colour alone said whether an answer was right, and nothing announced the
  // change of question, so a screen reader heard the same four buttons twice.
  const markFor = (idx: number) => {
    if (selectedOpt === null) return null
    if (idx === currentQ.answerIdx) return { glyph: '✓', label: lang === 'tr' ? 'Doğru cevap' : 'Correct answer' }
    if (idx === selectedOpt) return { glyph: '✗', label: lang === 'tr' ? 'Yanlış cevap' : 'Wrong answer' }
    return null
  }

  return (
    <ModalShell
      title={lang === 'tr' ? '◈ ARŞİVCİ SINAVI' : '◈ ARCHIVIST TRIAL'}
      onClose={onClose}
      accent="star-gold"
    >
      <div className="mt-4">
        {!finished ? (
          <div>
            <div className="mb-2 flex items-center justify-between text-[11px] font-hud tracking-widest text-slate-400">
              <span>
                {lang === 'tr' ? 'SORU' : 'QUESTION'} {currentIdx + 1} / {QUIZ_QUESTIONS.length}
              </span>
              <span className="text-holo-cyan">{lang === 'tr' ? 'PUAN' : 'SCORE'}: {score}</span>
            </div>

            <h3 className="mb-6 font-display text-[15px] leading-relaxed tracking-wide text-slate-100">
              {lang === 'tr' ? currentQ.qTr : currentQ.qEn}
            </h3>

            <div className="space-y-2.5">
              {(lang === 'tr' ? currentQ.optionsTr : currentQ.optionsEn).map((opt, idx) => {
                let btnStyle = 'border-white/10 bg-black/40 text-slate-200 hover:border-holo-cyan/50'
                if (selectedOpt !== null) {
                  if (idx === currentQ.answerIdx) {
                    btnStyle = 'border-green-500/80 bg-green-500/20 text-green-300'
                  } else if (idx === selectedOpt) {
                    btnStyle = 'border-sith-red/80 bg-sith-red/20 text-red-300'
                  }
                }
                const mark = markFor(idx)
                return (
                  <button
                    key={opt}
                    onClick={() => handleSelect(idx)}
                    disabled={selectedOpt !== null}
                    className={`flex w-full items-center justify-between gap-3 rounded border p-3 text-left font-hud text-[13px] tracking-wide transition-all ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {mark && (
                      <span aria-label={mark.label} className="shrink-0">
                        {mark.glyph}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Announces the verdict once per question, so the outcome does not
                live only in the border colour. */}
            <p aria-live="polite" className="sr-only">
              {selectedOpt === null
                ? ''
                : selectedOpt === currentQ.answerIdx
                  ? lang === 'tr'
                    ? `Doğru. Puan ${score}.`
                    : `Correct. Score ${score}.`
                  : lang === 'tr'
                    ? `Yanlış. Doğru cevap: ${currentQ.optionsTr[currentQ.answerIdx]}.`
                    : `Wrong. Correct answer: ${currentQ.optionsEn[currentQ.answerIdx]}.`}
            </p>
          </div>
        ) : (
          <div className="py-6 text-center" aria-live="polite">
            <div className="mb-2 font-display text-2xl tracking-[0.2em] text-star-gold">
              {getRank()}
            </div>
            <p className="mt-2 text-[14px] text-slate-300">
              {lang === 'tr'
                ? `Testi ${QUIZ_QUESTIONS.length} soruda ${score} doğru cevap ile tamamladınız!`
                : `You scored ${score} out of ${QUIZ_QUESTIONS.length} correct!`}
            </p>
            {(() => {
              const pathId = score >= 3 ? 'jedi' : 'sith'
              const path = PATHS[pathId]
              const other = PATHS[pathId === 'jedi' ? 'sith' : 'jedi']
              const tour = tours.find((t) => t.id === path.tour)
              return (
                <div
                  className={`mx-auto mt-5 max-w-sm rounded border p-3 text-left ${
                    pathId === 'jedi' ? 'border-holo-cyan/40 bg-holo-cyan/5' : 'border-sith-red/50 bg-sith-red/10'
                  }`}
                >
                  <p className={`font-display text-[14px] tracking-[0.2em] ${pathId === 'jedi' ? 'text-holo-cyan' : 'text-sith-red'}`}>
                    {path.title[lang]}
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-slate-300">{path.blurb[lang]}</p>
                  {tour && (
                    <button
                      onClick={() => {
                        sfx.playSelect()
                        onClose()
                        startTour({ kind: 'authored', id: tour.id })
                      }}
                      className="mt-2 rounded border border-star-gold/50 px-3 py-1 font-hud text-[11px] tracking-wider text-star-gold hover:bg-star-gold/15"
                    >
                      ▶ {L(tour.names, lang)}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      sfx.playSelect()
                      onClose()
                      startTour({ kind: 'authored', id: other.tour })
                    }}
                    className="ml-2 font-hud text-[10.5px] text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline"
                  >
                    {lang === 'tr' ? `ya da: ${other.title.tr}` : `or: ${other.title.en}`}
                  </button>
                </div>
              )
            })()}
            <button
              onClick={() => {
                sfx.playSelect()
                onClose()
              }}
              className="mt-6 rounded border border-star-gold/50 bg-star-gold/15 px-6 py-2.5 font-hud text-[12px] tracking-widest text-star-gold transition-colors hover:bg-star-gold/30"
            >
              {lang === 'tr' ? 'ARŞİVE DÖN' : 'RETURN TO ARCHIVES'}
            </button>
          </div>
        )}
      </div>
    </ModalShell>
  )
}
