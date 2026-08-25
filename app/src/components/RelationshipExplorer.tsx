import { Link } from 'react-router'
import type { ArchiveEdgeType } from '../lib/archive-graph'
import type { ArchiveRelationshipItem } from '../lib/archive-relationships'
import type { Lang } from '../lib/lore'
import { t, type UiKey } from '../lib/ui-strings'

const relationKey: Record<ArchiveEdgeType, UiKey> = {
  homeworld: 'homeworldRelation',
  'appears-on': 'appearsOnRelation',
  'participates-in': 'participatesInRelation',
  'related-character': 'relatedCharacterRelation',
  'event-location': 'eventLocationRelation',
  'story-stop': 'archiveConnections',
}

/**
 * A deliberately lightweight graph adapter: the SVG gives the archive's
 * relationships a spatial cue, while the linked list remains the canonical
 * keyboard and screen-reader surface.
 */
export default function RelationshipExplorer({
  lang,
  focalLabel,
  items,
}: {
  lang: Lang
  focalLabel: string
  items: readonly ArchiveRelationshipItem[]
}) {
  if (!items.length) return null

  const visibleItems = items.slice(0, 8)

  return (
    <section className="mt-8 border-y border-holo-cyan/15 py-5" aria-label={t('archiveConnections', lang)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-hud text-[12px] uppercase tracking-[0.35em] text-slate-400">
          {t('archiveConnections', lang)}
        </h2>
        <span className="text-[10px] text-slate-600">{focalLabel}</span>
      </div>

      <svg
        aria-label={lang === 'tr' ? `${focalLabel} için ilişki haritası` : `Relationship map for ${focalLabel}`}
        role="img"
        viewBox="0 0 240 56"
        className="mt-3 h-14 w-full max-w-sm"
      >
        <circle cx="120" cy="28" r="7" className="fill-star-gold/80" />
        {visibleItems.map((item, index) => {
          const x = 16 + (index * 208) / Math.max(visibleItems.length - 1, 1)
          const y = index % 2 === 0 ? 10 : 46
          return (
            <g key={item.id}>
              <line x1="120" y1="28" x2={x} y2={y} className="stroke-holo-cyan/35" strokeWidth="1" />
              <circle cx={x} cy={y} r="3.5" className="fill-holo-cyan/70" />
            </g>
          )
        })}
      </svg>

      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
        {visibleItems.map((item) => (
          <li key={item.id}>
            <Link
              to={item.to}
              className="group block rounded border border-white/8 bg-black/20 px-3 py-2 transition-colors hover:border-holo-cyan/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-holo-cyan"
            >
              <span className="block text-[10px] uppercase tracking-[0.2em] text-slate-500">
                {t(relationKey[item.relation], lang)}
              </span>
              <span className="mt-0.5 block text-[13px] text-slate-200 group-hover:text-holo-cyan">
                {item.label}
              </span>
              <span className="mt-1 block text-[10px] text-slate-600">
                {t('relationshipEvidence', lang)}: {item.evidence}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
