// Hangar blueprints: the silhouette and the annotated components of every ship
// the archive holds. Kept out of the component file so the schematic data can
// be read by the test suite without importing the view.

export interface Hotspot {
  id: string
  cx: number
  cy: number
  label: { en: string; tr: string }
  detail: { en: string; tr: string }
}

export interface BlueprintSpec {
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

  'slave-i': {
    color: '#9BBF5E',
    paths: [
      // Hull wedge, nose left, widening to the engine deck
      'M 30 100 L 62 86 L 120 80 L 158 92 L 158 112 L 120 124 L 62 116 Z',
      // Rotating cockpit pod
      'M 62 86 L 88 82 L 88 95 L 62 97 Z',
      // Engine bells
      'M 158 88 L 176 88 L 176 116 L 158 116 Z',
      // Upper stabilizer wing
      'M 118 80 L 132 46 L 143 46 L 131 80 Z',
      // Lower stabilizer wing
      'M 118 124 L 132 158 L 143 158 L 131 124 Z',
    ],
    hotspots: [
      { id: 'cockpit', cx: 74, cy: 89, label: { en: 'Gyroscopic Cockpit', tr: 'Jiroskopik Kokpit' }, detail: { en: 'The cockpit rotates against the hull so the pilot stays upright whether the ship is standing on its landing struts or flying nose-first.', tr: 'Kokpit gövdeye karşı döner: gemi iniş ayakları üzerinde dikilirken de burun ileri uçarken de pilot dik kalır.' } },
      { id: 'blasters', cx: 40, cy: 100, label: { en: 'Twin Blaster Cannons', tr: 'Çift Blaster Topu' }, detail: { en: 'Forward twin blaster cannons, the Firespray-31 patrol craft’s factory armament — Kuat Systems Engineering built the class for prison patrol duty.', tr: 'İleri bakan çift blaster topu, Firespray-31 devriye gemisinin fabrika silahı — Kuat Systems Engineering sınıfı hapishane devriyesi için üretti.' } },
      { id: 'seismic', cx: 128, cy: 134, label: { en: 'Seismic Charges', tr: 'Sismik Yükler' }, detail: { en: 'Ventral seismic charge dispenser: a mine that detonates into a silent shockwave, used to break a pursuing fighter off the ship’s tail over Geonosis.', tr: 'Ventral sismik yük bırakıcı: sessiz bir şok dalgasına dönüşen mayın; Geonosis üzerinde peşindeki avcıyı kuyruğundan atmak için kullanıldı.' } },
      { id: 'hold', cx: 110, cy: 102, label: { en: 'Prisoner Hold', tr: 'Mahkûm Ambarı' }, detail: { en: 'Bounty hold with prisoner cells and a carbonite rack — where Han Solo rode frozen from Cloud City to Jabba’s palace.', tr: 'Mahkûm hücreleri ve karbonit rafı olan ödül ambarı — Han Solo, Bulut Şehri’nden Jabba’nın sarayına donmuş hâlde burada taşındı.' } },
      { id: 'engines', cx: 167, cy: 102, label: { en: 'Ion Engines', tr: 'İyon Motorları' }, detail: { en: 'Rear ion drive cluster with a Class 1.0 hyperdrive — fast enough to keep a 21.5-metre patrol craft on the trail of freighters twice its size.', tr: 'Sınıf 1,0 hiperürücülü arka iyon itiş kümesi — 21,5 metrelik devriye gemisini kendisinin iki katı kargo gemilerinin izinde tutacak kadar hızlı.' } },
    ],
  },

  'venator-star-destroyer': {
    color: '#D06A5A',
    paths: [
      // Main wedge hull
      'M 100 22 L 182 168 L 18 168 Z',
      // Dorsal flight deck, opening along the spine
      'M 90 58 L 110 58 L 110 150 L 90 150 Z',
      // Port command tower
      'M 68 128 L 84 128 L 84 98 L 68 98 Z',
      // Port sensor globe
      'M 76 94 A 5 4 0 1 1 76 94.01 Z',
      // Starboard command tower
      'M 116 128 L 132 128 L 132 98 L 116 98 Z',
      // Starboard sensor globe
      'M 124 94 A 5 4 0 1 1 124 94.01 Z',
      // Engine bank
      'M 44 163 L 156 163 L 156 177 L 44 177 Z',
    ],
    hotspots: [
      { id: 'flight-deck', cx: 100, cy: 76, label: { en: 'Dorsal Flight Deck', tr: 'Sırt Uçuş Güvertesi' }, detail: { en: 'The spine splits open into a full-length flight deck, which is why the Venator is a carrier first: it launches and recovers squadrons straight off its back.', tr: 'Omurga boydan boya açılıp uçuş güvertesine dönüşür; Venator’un önce bir taşıyıcı olmasının sebebi bu: filoları doğrudan sırtından fırlatır ve toplar.' } },
      { id: 'towers', cx: 76, cy: 113, label: { en: 'Dual Command Towers', tr: 'Çift Komuta Kulesi' }, detail: { en: 'Two bridge towers instead of one — port for ship command, starboard for air operations, a split the later Imperial classes dropped.', tr: 'Tek yerine iki köprü kulesi — iskele tarafı gemi komutası, sancak tarafı hava harekâtı için; sonraki İmparatorluk sınıfları bu ayrımı bıraktı.' } },
      { id: 'turbolasers', cx: 56, cy: 145, label: { en: 'Heavy Turbolaser Turrets', tr: 'Ağır Turbolazer Taretleri' }, detail: { en: 'DBY-827 heavy dual turbolaser turrets along the dorsal hull, each able to traverse on its own mount against capital targets.', tr: 'Sırt gövdesi boyunca DBY-827 ağır çift turbolazer taretleri; her biri kendi kaidesinde dönerek ana gemileri hedefleyebilir.' } },
      { id: 'hangar', cx: 136, cy: 148, label: { en: 'Ventral Hangar', tr: 'Ventral Hangar' }, detail: { en: 'Ventral hangar doors open the full width of the hull, large enough to drop gunships and walkers onto a surface under fire.', tr: 'Ventral hangar kapıları gövde genişliğince açılır; ateş altındaki bir yüzeye saldırı gemisi ve yürüyücü indirecek kadar geniş.' } },
      { id: 'engines', cx: 100, cy: 170, label: { en: 'Main Engine Bank', tr: 'Ana Motor Bankı' }, detail: { en: 'Eight sublight engines drive 1,137 metres of hull with a Class 1.0 hyperdrive behind them — a Republic cruiser built to arrive first.', tr: 'Sekiz alt-ışık motoru 1.137 metrelik gövdeyi sürer, arkasında Sınıf 1,0 hiperürücü — ilk varmak için yapılmış bir Cumhuriyet kruvazörü.' } },
    ],
  },

  'razor-crest': {
    color: '#9FB4C7',
    paths: [
      // Fuselage, seen in profile
      'M 45 85 L 70 70 L 150 70 L 150 125 L 70 125 L 45 110 Z',
      // Cockpit glass
      'M 50 88 L 70 77 L 70 104 L 50 104 Z',
      // Upper engine nacelle
      'M 118 48 L 172 48 L 172 68 L 118 68 Z',
      // Lower engine nacelle
      'M 118 127 L 172 127 L 172 147 L 118 147 Z',
      // Rear boarding ramp
      'M 150 82 L 166 82 L 166 112 L 150 112 Z',
    ],
    hotspots: [
      { id: 'cockpit', cx: 60, cy: 92, label: { en: 'Cockpit', tr: 'Kokpit' }, detail: { en: 'Single-seat forward cockpit of an ST-70 Assault Gunship — a pre-Empire military design already old enough to be out of production when Din Djarin flew it.', tr: 'ST-70 Saldırı Gemisi’nin tek koltuklu ön kokpiti — Din Djarin uçurduğunda üretimden çoktan kalkmış, İmparatorluk öncesi bir askeri tasarım.' } },
      { id: 'cannons', cx: 50, cy: 78, label: { en: 'Forward Laser Cannons', tr: 'Ön Lazer Topları' }, detail: { en: 'Chin-mounted forward laser cannons, the gunship’s only fixed armament — the ship was built to carry, not to dogfight.', tr: 'Çene altına yerleştirilmiş ön lazer topları, geminin tek sabit silahı — bu gemi it dalaşı için değil, taşımak için yapıldı.' } },
      { id: 'carbonite', cx: 104, cy: 98, label: { en: 'Carbonite Racks', tr: 'Karbonit Rafları' }, detail: { en: 'The hold carries a carbonite freezing chamber and a rack of filled slabs — a bounty hunter’s cargo, delivered warm or cold at the same rate.', tr: 'Ambar bir karbonit dondurma odası ve dolu blok rafı taşır — ödül avcısının kargosu; sıcak ya da soğuk teslim, ücret aynı.' } },
      { id: 'ramp', cx: 158, cy: 97, label: { en: 'Rear Ramp', tr: 'Arka Rampa' }, detail: { en: 'The full-height rear ramp is the only way in or out: it doubles as the loading bay for speeder bikes and prisoners alike.', tr: 'Tam boy arka rampa tek giriş çıkış yolu: aynı zamanda hız motorlarının ve mahkûmların yükleme bölmesi.' } },
      { id: 'engines', cx: 166, cy: 58, label: { en: 'Twin Nacelles', tr: 'Çift Motor Gondolu' }, detail: { en: 'Two outboard engine nacelles with a Class 2.0 hyperdrive — slow to jump, which is why most of its runs end in a hard landing rather than a clean escape.', tr: 'Sınıf 2,0 hiperürücülü iki dış motor gondolu — atlaması yavaş; bu yüzden seferlerinin çoğu temiz bir kaçışla değil, sert bir inişle biter.' } },
    ],
  },

  'executor-star-dreadnought': {
    color: '#64748B',
    paths: [
      // Dagger hull
      'M 100 12 L 152 176 L 48 176 Z',
      // Raised superstructure
      'M 86 126 L 114 126 L 120 168 L 80 168 Z',
      // Command tower
      'M 90 122 L 110 122 L 113 98 L 87 98 Z',
      // Port shield globe
      'M 88 92 A 5 4 0 1 1 88 92.01 Z',
      // Starboard shield globe
      'M 112 92 A 5 4 0 1 1 112 92.01 Z',
      // Engine bank
      'M 58 172 L 142 172 L 142 186 L 58 186 Z',
    ],
    hotspots: [
      { id: 'bridge', cx: 100, cy: 114, label: { en: 'Command Bridge', tr: 'Komuta Köprüsü' }, detail: { en: 'Darth Vader’s flagship bridge, 19 kilometres of hull commanded from one tower — and the single point an A-wing rode into at Endor.', tr: 'Darth Vader’ın amiral gemisi köprüsü; 19 kilometrelik gövde tek kuleden yönetilir — Endor’da bir A-wing’in daldığı nokta da burasıydı.' } },
      { id: 'shields', cx: 112, cy: 92, label: { en: 'Shield Globes', tr: 'Kalkan Küreleri' }, detail: { en: 'Twin deflector shield generator domes above the tower. Lose them and the bridge below is exposed, which is exactly how the ship died.', tr: 'Kulenin üzerinde çift yönlendirici kalkan jeneratör kubbesi. Onlar düşerse altındaki köprü açıkta kalır; gemi tam olarak böyle öldü.' } },
      { id: 'turbolasers', cx: 68, cy: 158, label: { en: 'Turbolaser Batteries', tr: 'Turbolazer Bataryaları' }, detail: { en: 'Turbolaser and ion batteries run the length of both flanks — an Executor-class dreadnought outguns any single ship the Alliance ever fielded.', tr: 'Turbolazer ve iyon bataryaları iki yanı boydan boya kaplar — Executor sınıfı bir dretnot, İttifak’ın sahaya sürdüğü herhangi bir tek gemiden üstündür.' } },
      { id: 'hangars', cx: 132, cy: 162, label: { en: 'Hangar Bays', tr: 'Hangar Güverteleri' }, detail: { en: 'Ventral hangar bays carry the TIE wings, landing craft and the Lambda shuttles that move a crew of 279,144 on and off the ship.', tr: 'Ventral hangar güverteleri TIE kanatlarını, iniş araçlarını ve 279.144 kişilik mürettebatı gemiye taşıyan Lambda mekiklerini barındırır.' } },
      { id: 'engines', cx: 100, cy: 179, label: { en: 'Engine Bank', tr: 'Motor Bankı' }, detail: { en: 'The main drive array pushes the largest hull the Empire ever launched, with a Class 2.0 hyperdrive — the fleet waits on it, not the other way round.', tr: 'Ana itiş dizisi İmparatorluğun denize indirdiği en büyük gövdeyi, Sınıf 2,0 hiperürücüyle sürer — filo onu bekler, tersi değil.' } },
    ],
  },

  'ghost-vcx-100': {
    color: '#8FA98F',
    paths: [
      // Hull, seen from above
      'M 60 70 L 148 70 L 164 100 L 148 130 L 60 130 L 44 100 Z',
      // Forward cockpit pod
      'M 26 88 L 46 82 L 46 118 L 26 112 Z',
      // Dorsal turret ring
      'M 104 100 A 13 13 0 1 1 104 100.01 Z',
      // Phantom docking port
      'M 148 86 L 172 86 L 172 114 L 148 114 Z',
      // Port engine
      'M 118 60 L 146 60 L 146 70 L 118 70 Z',
      // Starboard engine
      'M 118 130 L 146 130 L 146 140 L 118 140 Z',
    ],
    hotspots: [
      { id: 'cockpit', cx: 36, cy: 100, label: { en: 'Forward Cockpit', tr: 'Ön Kokpit' }, detail: { en: 'The VCX-100 puts its cockpit out front on the centreline rather than off to one side, so Hera Syndulla flies looking straight down the nose.', tr: 'VCX-100 kokpitini yana değil, tam ortaya ve öne koyar; Hera Syndulla bu yüzden doğrudan burun hattına bakarak uçar.' } },
      { id: 'turret', cx: 104, cy: 100, label: { en: 'Dorsal Turret', tr: 'Sırt Taretinde' }, detail: { en: 'A 360-degree rotating gun turret on the spine, reached by a ladder from the main deck — the Ghost’s answer to being chased.', tr: 'Omurgada 360 derece dönen, ana güverteden merdivenle çıkılan top taretinde — Ghost’un takip edilmeye verdiği cevap.' } },
      { id: 'phantom', cx: 160, cy: 100, label: { en: 'Phantom Docking Port', tr: 'Phantom Kenetlenme Yuvası' }, detail: { en: 'The rear port docks the Phantom, a VCX-series auxiliary shuttle that detaches as a separate starfighter and re-attaches in flight.', tr: 'Arka yuva, ayrı bir avcı gemisi olarak ayrılıp uçuş hâlinde yeniden kenetlenen VCX serisi yardımcı mekik Phantom’a aittir.' } },
      { id: 'cargo', cx: 78, cy: 118, label: { en: 'Cargo Hold', tr: 'Kargo Ambarı' }, detail: { en: 'A light freighter’s hold, which is the point: the Ghost passes as a hauler, and a Corellian hauler is the least interesting ship in any Imperial scan.', tr: 'Hafif bir kargo gemisinin ambarı — mesele de bu: Ghost bir nakliyeci gibi görünür ve Corellia yapımı nakliyeci, her İmparatorluk taramasındaki en ilgisiz gemidir.' } },
      { id: 'engines', cx: 132, cy: 65, label: { en: 'Twin Engines', tr: 'Çift Motor' }, detail: { en: 'Two outboard sublight engines with a Class 1.0 hyperdrive — freighter hull, courier speed.', tr: 'Sınıf 1,0 hiperürücülü iki dış alt-ışık motoru — kargo gemisi gövdesi, kurye hızı.' } },
    ],
  },

  'tantive-iv': {
    color: '#D6D3CB',
    paths: [
      // Main hull tube
      'M 56 90 L 150 90 L 150 116 L 56 116 Z',
      // Hammerhead bow
      'M 28 76 L 58 88 L 58 118 L 28 130 Z',
      // Dorsal turbolaser turret
      'M 94 83 A 7 6 0 1 1 94 83.01 Z',
      // Upper engine bank
      'M 150 80 L 180 80 L 180 100 L 150 100 Z',
      // Lower engine bank
      'M 150 106 L 180 106 L 180 126 L 150 126 Z',
    ],
    hotspots: [
      { id: 'bridge', cx: 42, cy: 103, label: { en: 'Hammerhead Bridge', tr: 'Çekiçbaş Köprü' }, detail: { en: 'The flared bow holds the command bridge — the shape that names the CR90 a hammerhead corvette, and the first thing the Devastator’s tractor beam reached for.', tr: 'Genişleyen baş, komuta köprüsünü taşır — CR90’a çekiçbaş korvet adını veren biçim ve Devastator’ın çekim ışınının ilk uzandığı yer.' } },
      { id: 'turret', cx: 94, cy: 83, label: { en: 'Turbolaser Turret', tr: 'Turbolazer Taretinde' }, detail: { en: 'Dorsal and ventral dual turbolaser turrets: enough to make a blockade runner expensive to stop, not enough to win the fight it started.', tr: 'Sırt ve karın çift turbolazer taretleri: bir abluka koşucusunu durdurmayı pahalı kılmaya yeter, başlattığı savaşı kazanmaya yetmez.' } },
      { id: 'escape-pods', cx: 122, cy: 120, label: { en: 'Escape Pods', tr: 'Kurtarma Kapsülleri' }, detail: { en: 'The pod bays along the flank — pod 2187 left here carrying two droids and the Death Star plans, and the Imperials held fire because it read as empty.', tr: 'Yan boyunca uzanan kapsül bölmeleri — 2187 numaralı kapsül iki droid ve Ölüm Yıldızı planlarıyla buradan ayrıldı; İmparatorluk boş göründüğü için ateş etmedi.' } },
      { id: 'diplomatic', cx: 76, cy: 103, label: { en: 'Consular Deck', tr: 'Konsolosluk Güvertesi' }, detail: { en: 'Diplomatic quarters and a senatorial transponder: the ship sailed as Alderaan’s consular vessel, which is the cover Leia Organa was using when it was boarded.', tr: 'Diplomatik kamaralar ve senatörlük vericisi: gemi Alderaan’ın konsolosluk aracı olarak yol alıyordu; Leia Organa’nın gemiye çıkıldığında kullandığı örtü buydu.' } },
      { id: 'engines', cx: 166, cy: 103, label: { en: 'Engine Bank (×11)', tr: 'Motor Bankı (×11)' }, detail: { en: 'Eleven sublight engines across two rows — the whole reason a 150-metre corvette is called a blockade runner.', tr: 'İki sırada on bir alt-ışık motoru — 150 metrelik bir korvete abluka koşucusu denmesinin tüm sebebi.' } },
    ],
  },

  'tie-interceptor': {
    color: '#8DA2C0',
    paths: [
      // Cockpit ball
      'M 100 100 A 22 22 0 1 1 100 100.01 Z',
      // Port solar wing, dagger cut
      'M 78 95 L 40 25 L 22 45 L 22 155 L 40 175 Z',
      // Starboard solar wing
      'M 122 95 L 160 25 L 178 45 L 178 155 L 160 175 Z',
      // Port pylon
      'M 78 92 L 78 108 L 42 108 L 42 92 Z',
      // Starboard pylon
      'M 122 92 L 122 108 L 158 108 L 158 92 Z',
    ],
    hotspots: [
      { id: 'cockpit', cx: 100, cy: 100, label: { en: 'Cockpit Ball', tr: 'Kokpit Küresi' }, detail: { en: 'A pressurised sphere with no shields and no life support beyond the pilot’s flight suit — Sienar bought speed with everything it left out.', tr: 'Kalkansız ve pilotun uçuş giysisi dışında yaşam desteği olmayan basınçlı bir küre — Sienar hızı, dışarıda bıraktığı her şeyle satın aldı.' } },
      { id: 'cannons', cx: 34, cy: 40, label: { en: 'Wingtip Laser Cannons', tr: 'Kanat Ucu Lazer Topları' }, detail: { en: 'Four laser cannons moved out to the wingtips, where the daggers are cut away — the upgrade that separates the interceptor from a line TIE/ln.', tr: 'Hançer uçlarının kesildiği kanat uçlarına taşınmış dört lazer topu — önleyiciyi sıradan bir TIE/ln’den ayıran yükseltme.' } },
      { id: 'wings', cx: 168, cy: 120, label: { en: 'Solar Collector Wings', tr: 'Güneş Toplayıcı Kanatlar' }, detail: { en: 'Angled solar collector arrays feed the twin ion engines directly. The forward cut is what buys the pilot the visibility a standard TIE never has.', tr: 'Açılı güneş toplayıcı diziler çift iyon motorunu doğrudan besler. Öndeki kesik, standart bir TIE’ın asla sahip olmadığı görüşü pilota kazandırır.' } },
      { id: 'engines', cx: 100, cy: 132, label: { en: 'Twin Ion Engines', tr: 'Çift İyon Motoru' }, detail: { en: 'The P-s5.6 twin ion engines the whole class is named for — the loudest thing in the sky and the fastest thing the Imperial Navy flies in numbers.', tr: 'Tüm sınıfa adını veren P-s5.6 çift iyon motoru — gökyüzündeki en gürültülü şey ve İmparatorluk Donanması’nın sayıca uçurduğu en hızlı araç.' } },
      { id: 'no-hyperdrive', cx: 60, cy: 100, label: { en: 'Wing Pylons', tr: 'Kanat Direkleri' }, detail: { en: 'Short pylons bolt the wings to the ball. There is no hyperdrive behind them: at 9.6 metres the interceptor rides to battle inside a carrier and cannot leave without one.', tr: 'Kısa direkler kanatları küreye cıvatalar. Arkalarında hiperürücü yoktur: 9,6 metrelik önleyici savaşa bir taşıyıcının içinde gider ve onsuz ayrılamaz.' } },
    ],
  },
}

// A ship the archive holds no schematic for gets no schematic. The previous
// fallback drew one generic triangle and captioned it with hull boilerplate
// that was true of no ship in particular, which is the kind of invented detail
// the rest of the archive refuses to ship. `starships.test.ts` keeps this
// branch unreachable for the ships that are in the data.
export function getBlueprint(shipId: string): BlueprintSpec | null {
  return BLUEPRINTS[shipId] ?? null
}

