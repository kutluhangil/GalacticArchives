// Organization Dossier Modal — Galactic Factions, Clans & Underworld Syndicates
// Ideology, headquarters, leadership hierarchy, sacred creeds, and historical influence.

import { useEffect } from 'react'
import type { Organization } from '../types/lore'
import { L, LL } from '../lib/lore'
import Aurebesh from './Aurebesh'
import SourceLink from './SourceLink'

interface Props {
  organization: Organization | null
  onClose: () => void
  lang: 'en' | 'tr'
}

export default function OrganizationModal({ organization, onClose, lang }: Props) {
  useEffect(() => {
    if (!organization) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [organization, onClose])

  if (!organization) return null

  const typeConfig = {
    'force-tradition': {
      color: 'text-holo-cyan border-holo-cyan/40 bg-holo-cyan/10 shadow-[0_0_12px_rgba(56,189,248,0.25)]',
      icon: '✨',
    },
    'military-clan': {
      color: 'text-teal-400 border-teal-500/40 bg-teal-500/10 shadow-[0_0_12px_rgba(20,184,166,0.25)]',
      icon: '🛡️',
    },
    'crime-syndicate': {
      color: 'text-purple-400 border-purple-500/40 bg-purple-500/10 shadow-[0_0_12px_rgba(168,85,247,0.25)]',
      icon: '💰',
    },
    'guild': {
      color: 'text-amber-400 border-amber-500/40 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
      icon: '🎯',
    },
  }[organization.type]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="org-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-holo-cyan/40 bg-panel/95 shadow-[0_0_50px_rgba(0,240,255,0.18)] backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 bg-black/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-holo-cyan/30 bg-holo-cyan/10 text-xl">
              {typeConfig.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="org-modal-title"
                  className="font-display text-lg sm:text-xl tracking-wide text-slate-100"
                >
                  {L(organization.names, lang)}
                </h2>
                <span
                  className={`rounded border px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider ${typeConfig.color}`}
                >
                  {L(organization.typeName, lang).toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{L(organization.leader, lang)}</span>
                <span className="text-slate-600">·</span>
                <Aurebesh text={organization.names.en} className="text-holo-cyan/60 text-[10px]" />
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={lang === 'tr' ? 'Kapat' : 'Close'}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:border-holo-cyan/40 hover:bg-holo-cyan/10 hover:text-holo-cyan transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Main Visual Asset (16:9 Archival Emblem) */}
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-holo-cyan/30 bg-space-dark/80 shadow-inner">
            <img
              src={`/organizations/${organization.id}.webp`}
              alt={L(organization.names, lang)}
              className="h-full w-full object-contain p-4"
              loading="lazy"
            />
            <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-black/70 px-2.5 py-1 text-[10px] font-mono text-holo-cyan/80 border border-holo-cyan/20 backdrop-blur-xs">
              ORGANIZATION DOSSIER // REF: {organization.id.toUpperCase()}
            </div>
          </div>

          {/* Quick Telemetry Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                {lang === 'tr' ? 'Karargâh / Üs' : 'Headquarters'}
              </span>
              <span className="mt-1 block font-display text-xs sm:text-sm text-slate-100">
                {L(organization.headquarters, lang)}
              </span>
            </div>

            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                {lang === 'tr' ? 'Liderlik / Yüksek Makam' : 'Leadership'}
              </span>
              <span className="mt-1 block font-mono text-xs sm:text-sm text-holo-cyan">
                {L(organization.leader, lang)}
              </span>
            </div>

            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                {lang === 'tr' ? 'Aktif Olduğu Dönemler' : 'Active Eras'}
              </span>
              <span className="mt-1 block font-mono text-xs sm:text-sm text-slate-200">
                {L(organization.activeEras, lang)}
              </span>
            </div>
          </div>

          {/* Sacred Creed / Organization Motto */}
          <div className="space-y-1.5 rounded-lg border border-star-gold/30 bg-star-gold/[0.04] p-4 shadow-sm">
            <h3 className="font-hud text-xs tracking-wider uppercase text-star-gold">
              {lang === 'tr' ? 'Kutsal Amentü / Resmi İlke' : 'Sacred Creed & Official Code'}
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-200 italic font-serif">
              "{L(organization.creedOrMotto, lang)}"
            </p>
          </div>

          {/* Philosophy & Purpose */}
          <div className="space-y-1.5 rounded-lg border border-holo-cyan/20 bg-holo-cyan/[0.03] p-4">
            <h3 className="font-hud text-xs tracking-wider uppercase text-holo-cyan">
              {lang === 'tr' ? 'Felsefe ve Stratejik Amaç' : 'Core Philosophy & Strategic Doctrine'}
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
              {L(organization.philosophyOrPurpose, lang)}
            </p>
          </div>

          {/* Notable Members / Key Personages */}
          <div className="space-y-2">
            <h3 className="font-hud text-xs tracking-wider uppercase text-slate-400">
              {lang === 'tr' ? 'Temsilci Şahsiyetler & Üyeler' : 'Notable Personages & Key Figures'}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {LL(organization.notableMembers, lang).map((member) => (
                <span
                  key={member}
                  className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 flex items-center gap-1.5"
                >
                  <span className="text-holo-cyan">●</span>
                  <span>{member}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Detailed Historical Narrative / Description */}
          <div className="space-y-2">
            <h3 className="font-hud text-xs tracking-wider uppercase text-slate-400">
              {lang === 'tr' ? 'Kanonik Tarihçe ve Arşiv Kaydı' : 'Canonical History & Operational Summary'}
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
              {L(organization.desc, lang)}
            </p>
          </div>

          {/* Canonical Media Appearances */}
          {organization.appearances.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-hud text-xs tracking-wider uppercase text-slate-400">
                {lang === 'tr' ? 'Göründüğü Yapımlar' : 'Canonical Appearances'}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {organization.appearances.map((app) => (
                  <span
                    key={app}
                    className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300"
                  >
                    {app}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Archival Citation */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
            <span>{lang === 'tr' ? 'Holocron Teşkilat Arşivi' : 'Holocron Organizations Database'}</span>
            <SourceLink source={organization.source} />
          </div>
        </div>
      </div>
    </div>
  )
}
