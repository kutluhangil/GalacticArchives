import { useState } from 'react'
import { useApp } from '../state/app'
import { sfx } from '../lib/audio'

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

export default function HolocronQuiz({ onClose }: { onClose: () => void }) {
  const lang = useApp((s) => s.lang)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null)

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

    setTimeout(() => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-lg border border-star-gold/40 bg-panel/95 p-6 shadow-[0_0_30px_rgba(255,232,31,0.2)]">
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="font-display text-lg tracking-[0.2em] text-star-gold">
            ◈ ARCHIVIST TRIAL
          </h2>
          <button
            onClick={() => {
              sfx.playHover()
              onClose()
            }}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {!finished ? (
          <div>
            <div className="mb-2 flex items-center justify-between text-[11px] font-hud tracking-widest text-slate-400">
              <span>QUESTION {currentIdx + 1} / {QUIZ_QUESTIONS.length}</span>
              <span className="text-holo-cyan">SCORE: {score}</span>
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
                return (
                  <button
                    key={opt}
                    onClick={() => handleSelect(idx)}
                    disabled={selectedOpt !== null}
                    className={`block w-full rounded border p-3 text-left font-hud text-[13px] tracking-wide transition-all ${btnStyle}`}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="py-6 text-center">
            <div className="mb-2 font-display text-2xl tracking-[0.2em] text-star-gold">
              {getRank()}
            </div>
            <p className="mt-2 text-[14px] text-slate-300">
              {lang === 'tr'
                ? `Testi ${QUIZ_QUESTIONS.length} soruda ${score} doğru cevap ile tamamladınız!`
                : `You scored ${score} out of ${QUIZ_QUESTIONS.length} correct!`}
            </p>
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
    </div>
  )
}
