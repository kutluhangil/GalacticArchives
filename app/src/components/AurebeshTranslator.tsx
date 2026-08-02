import { useState } from 'react'
import { useApp } from '../state/app'
import Aurebesh from './Aurebesh'
import { sfx } from '../lib/audio'


export default function AurebeshTranslator({ onClose }: { onClose: () => void }) {
  const lang = useApp((s) => s.lang)
  const [text, setText] = useState('May the Force be with you')
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    sfx.playSelect()
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-lg border border-holo-cyan/40 bg-panel/95 p-6 shadow-[0_0_30px_rgba(102,217,255,0.2)]">
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="font-display text-lg tracking-[0.2em] text-star-gold">
            🔤 AUREBESH TRANSLATOR
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

        <div className="mb-4">
          <label className="mb-1.5 block font-hud text-[11px] uppercase tracking-[0.25em] text-slate-400">
            {lang === 'tr' ? 'Metin Girin' : 'Enter Text'}
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type standard text..."
            className="w-full rounded border border-white/10 bg-black/50 px-3 py-2 text-[14px] text-slate-100 outline-none transition-colors focus:border-holo-cyan/70"
          />
        </div>

        <div className="mb-6 rounded border border-holo-cyan/20 bg-black/60 p-4">
          <div className="mb-1 text-[10px] uppercase tracking-[0.25em] text-holo-cyan/60">
            {lang === 'tr' ? 'Aurebesh Çıktısı' : 'Aurebesh Output'}
          </div>
          <div className="min-h-[3rem] overflow-x-auto py-2">
            <Aurebesh
              text={text || ' '}
              className="text-xl tracking-[0.25em] text-holo-cyan"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={handleCopy}
            className="rounded border border-holo-cyan/40 bg-holo-cyan/15 px-4 py-2 font-hud text-[11px] tracking-wider text-holo-cyan transition-colors hover:bg-holo-cyan/30"
          >
            {copied
              ? lang === 'tr'
                ? '✓ KOPYALANDI'
                : '✓ COPIED'
              : lang === 'tr'
                ? 'METNİ KOPYALA'
                : 'COPY TEXT'}
          </button>
        </div>
      </div>
    </div>
  )
}
