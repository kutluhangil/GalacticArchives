// ShipBlueprint — SVG-based schematic with labeled clickable hotspots.
// Each ship type has a unique silhouette and component annotations.

import { useState } from 'react'

type LangKey = 'en' | 'tr'

interface Hotspot {
  id: string
  cx: number
  cy: number
  label: { en: string; tr: string }
  detail: { en: string; tr: string }
}

interface BlueprintSpec {
  hotspots: Hotspot[]
  // SVG path for the schematic silhouette
  paths: string[]
  color: string
}

// Blueprint specifications per ship type
const BLUEPRINTS: Record<string, BlueprintSpec> = {
  'millennium-falcon': {
    color: '#66D9FF',
    paths: [
      // Saucer disc
      'M 100 80 A 60 45 0 1 1 100 80.01 Z',
      // Cockpit arm
      'M 100 50 L 140 35 L 155 45 L 145 55 L 110 60 Z',
      // Quad laser top
      'M 95 30 L 105 30 L 105 45 L 95 45 Z',
      // Rear engines
      'M 48 78 L 48 102 L 55 102 L 55 78 Z',
      'M 38 78 L 38 102 L 45 102 L 45 78 Z',
    ],
    hotspots: [
      { id: 'cockpit', cx: 148, cy: 45, label: { en: 'Cockpit', tr: 'Kokpit' }, detail: { en: 'Modified YT-1300 off-center cockpit pod with full sensor array and pilot-co-pilot dual station.', tr: 'Merkez dışı YT-1300 modifiyeli kokpit bölmesi; tam sensör dizisi ve pilot-ko-pilot çift istasyonlu.' } },
      { id: 'dejarik', cx: 100, cy: 80, label: { en: 'Dejarik Table', tr: 'Dejarik Masası' }, detail: { en: 'The iconic holographic monster chess table in the main hold. Chewbacca always wins.', tr: 'Ana ambarda ikonik holografik canavar satranç masası. Chewbacca her zaman kazanır.' } },
      { id: 'quad-laser', cx: 100, cy: 37, label: { en: 'Quad Laser', tr: 'Dörtlü Lazer' }, detail: { en: 'AG-2G quad laser cannon turret with 360° traverse — operated from a ventral/dorsal gunner seat.', tr: 'Ventral/dorsal nişancı koltuğundan kumanda edilen 360° dönüşlü AG-2G dörtlü lazer top kulesi.' } },
      { id: 'hyperdrive', cx: 65, cy: 90, label: { en: 'Hyperdrive (0.5)', tr: 'Hiperürücü (0.5)' }, detail: { en: 'Heavily modified Isu-Sim SSP05 hyperdrive rated at Class 0.5 — twice as fast as Imperial Star Destroyers.', tr: 'Sınıf 0,5 olarak değerlendirilen ağır modifiyeli Isu-Sim SSP05 hiperürücü — İmparatorluk Yıldız Yok Edicileri\'nden iki kat hızlı.' } },
      { id: 'engines', cx: 43, cy: 80, label: { en: 'Ion Engines', tr: 'İyon Motorları' }, detail: { en: 'Twin Quadex power cores feeding into three Girodyne SRB42 sublight engines — modified for maximum thrust output.', tr: 'Üç Girodyne SRB42 alt-ışık motoruna bağlanan çift Quadex güç çekirdeği — maksimum itme çıkışı için modifiye edilmiş.' } },
      { id: 'concussion', cx: 130, cy: 100, label: { en: 'Concussion Missiles', tr: 'Sarsıntı Füzeleri' }, detail: { en: 'Modified Arakyd ST2 concussion missile launcher tubes added by Solo\'s modifications — 2 tube array.', tr: 'Solo\'nun modifikasyonları tarafından eklenen Arakyd ST2 sarsıntı füze fırlatıcı tüpler — 2 tüp dizisi.' } },
    ],
  },

  'imperial-star-destroyer': {
    color: '#94A3B8',
    paths: [
      // Main wedge body
      'M 100 20 L 185 170 L 15 170 Z',
      // Bridge tower
      'M 90 100 L 110 100 L 115 70 L 85 70 Z',
      // Bridge globe
      'M 100 65 A 12 8 0 1 1 100 65.01 Z',
      // Engine glow left
      'M 30 160 L 65 160 L 65 175 L 30 175 Z',
      // Engine glow right
      'M 135 160 L 170 160 L 170 175 L 135 175 Z',
    ],
    hotspots: [
      { id: 'bridge', cx: 100, cy: 65, label: { en: 'Command Bridge', tr: 'Komuta Köprüsü' }, detail: { en: 'Durasteel-encased command tower with 360° viewports. Houses the Captain\'s command dais and navigation holotable.', tr: 'Durasteel kaplı komuta kulesi, 360° görüş noktalarıyla. Kaptanın komuta kürsüsü ve navigasyon holotablosunu barındırır.' } },
      { id: 'hangar', cx: 100, cy: 130, label: { en: 'Hangar Bay', tr: 'Hangar Güvertesi' }, detail: { en: 'Ventral twin hangar bays accommodating 72 TIE fighters, 20 AT-ATs, and 30 AT-STs across multiple levels.', tr: 'Birden fazla seviyede 72 TIE savaşçısı, 20 AT-AT ve 30 AT-ST barındırabilen ventral çift hangar güverteleri.' } },
      { id: 'turbolasers', cx: 55, cy: 110, label: { en: 'Turbolaser Batteries', tr: 'Turbolazer Bataryaları' }, detail: { en: '60 turbolaser batteries along dorsal hull supplemented by 60 ion cannon emplacements for disabling enemy craft.', tr: 'Düşman gemilerini devre dışı bırakmak için 60 iyon topu mevzisiyle desteklenen gövde üzerinde 60 turbolazer batarya.' } },
      { id: 'engines', cx: 100, cy: 165, label: { en: 'Ion Drive Engines', tr: 'İyon İtiş Motorları' }, detail: { en: 'Three KDY Destroyer-I ion drive engines providing sub-light propulsion. Primary and secondary coolant systems redundant.', tr: 'Alt-ışık iticisi sağlayan üç KDY Destroyer-I iyon itiş motoru. Birincil ve ikincil soğutma sistemleri yedekli.' } },
      { id: 'tractor', cx: 150, cy: 95, label: { en: 'Tractor Beam', tr: 'Çekim Işını' }, detail: { en: '10 phylon Q7 tractor beam projectors for capturing vessels — notably used to capture the Millennium Falcon above Tatooine.', tr: 'Gemileri yakalamak için 10 phylon Q7 çekim ışını projektörü — özellikle Tatooine üzerinde Millennium Falcon\'ı yakalamak için kullanıldı.' } },
    ],
  },

  't-65b-x-wing': {
    color: '#F97316',
    paths: [
      // Main fuselage
      'M 85 60 L 115 60 L 120 140 L 80 140 Z',
      // S-foil top left
      'M 85 80 L 30 65 L 28 73 L 82 92 Z',
      // S-foil top right
      'M 115 80 L 170 65 L 172 73 L 118 92 Z',
      // S-foil bottom left
      'M 82 108 L 28 127 L 30 135 L 85 120 Z',
      // S-foil bottom right
      'M 118 108 L 172 127 L 170 135 L 115 120 Z',
      // Nose
      'M 90 40 L 110 40 L 115 60 L 85 60 Z',
      // Engine
      'M 88 135 L 112 135 L 112 148 L 88 148 Z',
    ],
    hotspots: [
      { id: 'laser-cannons', cx: 30, cy: 70, label: { en: 'Laser Cannons (×4)', tr: 'Lazer Topları (×4)' }, detail: { en: 'Four KX9 laser cannons at S-foil wingtips — can fire linked (single point) or split (two pairs) for different combat needs.', tr: 'S-foil kanat uçlarında dört KX9 lazer topu — farklı savaş ihtiyaçları için bağlantılı (tek nokta) veya bölünmüş (iki çift) olarak ateşlenebilir.' } },
      { id: 'astromech', cx: 100, cy: 75, label: { en: 'Astromech Port', tr: 'Astronomi Dreid Yuvası' }, detail: { en: 'Dorsal astromech socket (typically R2-series) for hyperspace jump calculation, system repair, and flight assistance.', tr: 'Hiperuzay atlama hesaplama, sistem onarımı ve uçuş yardımı için dorsal astronomi droid soketi (genellikle R2 serisi).' } },
      { id: 'cockpit', cx: 100, cy: 55, label: { en: 'Cockpit', tr: 'Kokpit' }, detail: { en: 'Single-pilot transparisteel canopy with ejection seat, deflector shield controls and targeting computer display.', tr: 'Fırlatma koltuğu, yönlendirici kalkan kontrolleri ve hedefleme bilgisayarı ekranı ile tek pilotlu transparisteel kanopi.' } },
      { id: 'proton-torps', cx: 92, cy: 130, label: { en: 'Proton Torpedoes', tr: 'Proton Torpidolar' }, detail: { en: 'Krupx MG7 proton torpedo launchers — 2 per wing root (6 torpedoes total). Used to destroy both Death Stars.', tr: 'Krupx MG7 proton torpido fırlatıcılar — kanat kökü başına 2 (toplam 6 torpido). Her iki Ölüm Yıldızı\'nı yok etmek için kullanıldı.' } },
      { id: 'engine', cx: 100, cy: 142, label: { en: 'Incom 4L4 Engine', tr: 'Incom 4L4 Motoru' }, detail: { en: 'Incom Corporation 4L4 fusial thrust engine with electromagnetic gyrostabilizers — produces 1,087 kilonewtons thrust.', tr: 'Elektromanyetik jirositabilizatörlü Incom Corporation 4L4 füzyon itiş motoru — 1.087 kilonewton itme üretir.' } },
    ],
  },
}

// Fallback generic blueprint for ships without specific art
function getBlueprint(shipId: string): BlueprintSpec {
  if (BLUEPRINTS[shipId]) return BLUEPRINTS[shipId]
  return {
    color: '#A8B3C5',
    paths: ['M 100 40 L 160 160 L 40 160 Z'],
    hotspots: [
      {
        id: 'hull',
        cx: 100,
        cy: 120,
        label: { en: 'Hull', tr: 'Gövde' },
        detail: {
          en: 'Primary durasteel hull structure with deflector shield projector emitters.',
          tr: 'Yönlendirici kalkan projektör verici içeren birincil durasteel gövde yapısı.',
        },
      },
    ],
  }
}

export default function ShipBlueprint({
  shipId,
  lang,
}: {
  shipId: string
  lang: LangKey
}) {
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null)
  const spec = getBlueprint(shipId)

  return (
    <div className="relative rounded-lg border border-white/10 bg-black/60 p-3">
      <svg
        viewBox="0 0 200 200"
        className="h-48 w-full"
        style={{ filter: `drop-shadow(0 0 12px ${spec.color}40)` }}
      >
        {/* Grid lines */}
        {[40, 80, 120, 160].map((v) => (
          <g key={v}>
            <line x1={v} y1={10} x2={v} y2={190} stroke={spec.color} strokeOpacity="0.05" strokeWidth="0.5" />
            <line x1={10} y1={v} x2={190} y2={v} stroke={spec.color} strokeOpacity="0.05" strokeWidth="0.5" />
          </g>
        ))}

        {/* Ship silhouette */}
        {spec.paths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill={spec.color + '12'}
            stroke={spec.color}
            strokeWidth="1.2"
            strokeOpacity="0.7"
          />
        ))}

        {/* Hotspot rings */}
        {spec.hotspots.map((h) => (
          <g key={h.id}>
            <circle
              cx={h.cx}
              cy={h.cy}
              r="7"
              fill={activeHotspot?.id === h.id ? spec.color + '40' : 'transparent'}
              stroke={spec.color}
              strokeWidth="1"
              strokeOpacity="0.9"
              className="cursor-pointer"
              onClick={() => setActiveHotspot(activeHotspot?.id === h.id ? null : h)}
            />
            <circle
              cx={h.cx}
              cy={h.cy}
              r="2"
              fill={spec.color}
              className="pointer-events-none"
            />
          </g>
        ))}
      </svg>

      {/* Hotspot tooltip */}
      {activeHotspot && (
        <div
          className="mt-2 rounded border border-white/15 bg-black/80 p-3"
          style={{ borderColor: spec.color + '40' }}
        >
          <div className="mb-1 font-hud text-[10px] font-bold uppercase tracking-wider" style={{ color: spec.color }}>
            {activeHotspot.label[lang]}
          </div>
          <p className="text-[11px] leading-relaxed text-slate-300">{activeHotspot.detail[lang]}</p>
        </div>
      )}

      {/* Hotspot legend */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {spec.hotspots.map((h) => (
          <button
            key={h.id}
            onClick={() => setActiveHotspot(activeHotspot?.id === h.id ? null : h)}
            className="rounded px-1.5 py-0.5 font-hud text-[9px] transition-all"
            style={{
              color: activeHotspot?.id === h.id ? spec.color : '#6B7280',
              background: activeHotspot?.id === h.id ? spec.color + '15' : 'transparent',
            }}
          >
            ◉ {h.label[lang]}
          </button>
        ))}
      </div>
    </div>
  )
}
