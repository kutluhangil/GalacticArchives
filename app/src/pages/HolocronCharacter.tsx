// Full record for one figure, with links back out to their homeworld and to
// the people around them.

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import type { CelestialBody, Character } from '../types/lore'
import { factionById, L, loadAllPlanets, loadCharacters, mediaById } from '../lib/lore'
import { t } from '../lib/ui-strings'
import { useApp } from '../state/app'
import HoloPortrait from '../components/HoloPortrait'
import HolocronChrome from '../components/HolocronChrome'

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-6 border-b border-white/5 py-2 text-[13px]">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="text-right text-slate-200">{value}</dd>
    </div>
  )
}

export default function HolocronCharacter() {
  const { id = '' } = useParams()
  const { lang, era } = useApp()
  const [character, setCharacter] = useState<Character | null>(null)
  const [related, setRelated] = useState<Character[]>([])
  const [homeworld, setHomeworld] = useState<CelestialBody | null>(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    let cancelled = false
    setCharacter(null)
    setMissing(false)
    loadCharacters().then((all) => {
      if (cancelled) return
      const found = all.find((c) => c.id === id)
      if (!found) {
        setMissing(true)
        return
      }
      setCharacter(found)
      setRelated(all.filter((c) => (found.relatedCharacters ?? []).includes(c.id)))
      if (found.homeworldId) {
        loadAllPlanets().then((planets) => {
          if (cancelled) return
          setHomeworld(planets.find((p) => p.id === found.homeworldId) ?? null)
        })
      } else {
        setHomeworld(null)
      }
    })
    return () => {
      cancelled = true
    }
  }, [id])

  if (missing) {
    return (
      <HolocronChrome>
        <p className="py-16 text-center text-[13px] text-slate-500">{t('notFound', lang)}</p>
        <p className="text-center">
          <Link to="/holocron" className="text-[13px] text-holo-cyan hover:underline">
            ← {t('backToHolocron', lang)}
          </Link>
        </p>
      </HolocronChrome>
    )
  }

  if (!character) {
    return (
      <HolocronChrome>
        <p className="animate-pulse py-16 text-center text-[13px] tracking-[0.3em] text-holo-cyan">
          {t('loading', lang)}
        </p>
      </HolocronChrome>
    )
  }

  const faction = factionById(character.affiliationsByEra?.[era])

  return (
    <HolocronChrome>
      <Link
        to="/holocron"
        className="mb-6 inline-block font-hud text-[12px] tracking-wide text-slate-500 transition-colors hover:text-holo-cyan"
      >
        ← {t('backToHolocron', lang)}
      </Link>

      <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div>
          <div className="overflow-hidden rounded-lg border border-holo-cyan/20">
            <HoloPortrait id={character.id} name={L(character.names, lang)} />
          </div>
          <dl className="mt-5">
            <Row label={t('species', lang)} value={L(character.species, lang)} />
            <Row
              label={t('homeworld', lang)}
              value={homeworld ? L(homeworld.names, lang) : L(character.homeworldName, lang)}
            />
            <Row label={t('born', lang)} value={character.birth} />
            <Row label={t('died', lang)} value={character.death} />
          </dl>
          {homeworld && (
            <Link
              to={`/holocron/planet/${homeworld.id}`}
              className="mt-4 inline-block rounded border border-holo-cyan/40 bg-holo-cyan/5 px-2.5 py-1 text-[12px] text-holo-cyan transition-colors hover:bg-holo-cyan/15"
            >
              ◈ {L(homeworld.names, lang)}
            </Link>
          )}
        </div>

        <div>
          <h1 className="font-display text-3xl tracking-[0.18em] text-slate-100">
            {L(character.names, lang)}
          </h1>
          {character.aka?.length ? (
            <p className="mt-1 font-hud text-[12px] tracking-[0.25em] text-slate-500">
              {character.aka.join(' · ')}
            </p>
          ) : null}

          {faction && (
            <span className="mt-4 inline-flex items-center gap-2 rounded border border-white/10 bg-black/30 px-2.5 py-1 text-[12px] text-slate-300">
              <span className="h-2 w-2 rounded-full" style={{ background: faction.color }} />
              {t('affiliation', lang)}: {L(faction.names, lang)}
            </span>
          )}

          {character.quote && (
            <blockquote className="mt-5 border-l-2 border-star-gold/50 pl-4">
              <p className="font-display text-[15px] italic leading-relaxed text-star-gold/90">
                “{L(character.quote.text, lang)}”
              </p>
              {character.quote.attribution && (
                <cite className="mt-1 block font-hud text-[11px] not-italic tracking-wider text-slate-500">
                  — {character.quote.attribution}
                </cite>
              )}
            </blockquote>
          )}

          <section className="mt-6">
            <h2 className="mb-2 font-hud text-[12px] uppercase tracking-[0.35em] text-slate-500">
              {t('biography', lang)}
            </h2>
            <p className="max-w-2xl text-[14px] leading-relaxed text-slate-300">
              {L(character.bio, lang)}
            </p>
          </section>

          <section className="mt-6">
            <h2 className="mb-2 font-hud text-[11px] uppercase tracking-[0.3em] text-slate-500">
              {t('appearances', lang)}
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {character.appearances.map((mid) => {
                const entry = mediaById(mid)
                if (!entry) return null
                return (
                  <span
                    key={mid}
                    className="rounded-sm border border-white/8 bg-black/40 px-2 py-0.5 text-[11px] text-slate-400"
                  >
                    {L(entry.title, lang)} ({entry.year})
                  </span>
                )
              })}
            </div>
          </section>

          {related.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 font-hud text-[12px] uppercase tracking-[0.35em] text-slate-500">
                {t('relatedCharacters', lang)}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {related.map((other) => (
                  <Link
                    key={other.id}
                    to={`/holocron/character/${other.id}`}
                    className="overflow-hidden rounded-lg border border-white/10 transition-colors hover:border-holo-cyan/50"
                  >
                    <HoloPortrait id={other.id} name={L(other.names, lang)} size="sm" />
                    <div className="bg-panel/90 px-2 py-1.5 text-[12px] tracking-wide text-slate-200">
                      {L(other.names, lang)}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </HolocronChrome>
  )
}
