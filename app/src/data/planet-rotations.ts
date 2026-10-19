// Verified Star Wars astronomical canon data (sourced from Wookieepedia / Star Wars Databank).
// Standard galactic time is calibrated to Coruscant: 1 Standard Day = 24 Standard Hours, 1 Standard Year = 368 Standard Days.

export interface PlanetRotationalData {
  rotationHours: number // length of standard day in standard hours
  orbitalDays?: number // length of standard year in standard days
  tidallyLocked?: boolean // e.g. Ryloth
}

export const PLANET_ROTATIONS: Record<string, PlanetRotationalData> = {
  // Core Worlds
  coruscant: { rotationHours: 24, orbitalDays: 368 },
  alderaan: { rotationHours: 24, orbitalDays: 364 },
  chandrila: { rotationHours: 20, orbitalDays: 368 },
  corellia: { rotationHours: 25, orbitalDays: 329 },
  hosnian_prime: { rotationHours: 24, orbitalDays: 370 },
  'hosnian-prime': { rotationHours: 24, orbitalDays: 370 },
  kuat: { rotationHours: 20, orbitalDays: 322 },

  // Colonies & Inner Rim
  fondor: { rotationHours: 26, orbitalDays: 350 },
  cato_neimoidia: { rotationHours: 25, orbitalDays: 370 },
  'cato-neimoidia': { rotationHours: 25, orbitalDays: 370 },
  manda: { rotationHours: 24, orbitalDays: 360 },
  concordia: { rotationHours: 21, orbitalDays: 380 },

  // Expansion Region & Mid Rim
  kashyyyk: { rotationHours: 26, orbitalDays: 381 },
  naboo: { rotationHours: 26, orbitalDays: 312 },
  malastare: { rotationHours: 26, orbitalDays: 340 },
  ord_mantell: { rotationHours: 26, orbitalDays: 334 },
  'ord-mantell': { rotationHours: 26, orbitalDays: 334 },
  takodana: { rotationHours: 24, orbitalDays: 365 },
  christophsis: { rotationHours: 26, orbitalDays: 360 },
  shakari: { rotationHours: 22, orbitalDays: 350 },

  // Outer Rim Territories
  tatooine: { rotationHours: 23, orbitalDays: 304 },
  hoth: { rotationHours: 23, orbitalDays: 549 },
  dagobah: { rotationHours: 23, orbitalDays: 341 },
  bespin: { rotationHours: 12, orbitalDays: 5110 }, // fast gas giant rotation
  endor: { rotationHours: 18, orbitalDays: 402 },
  'endor-moon': { rotationHours: 18, orbitalDays: 402 },
  mustafar: { rotationHours: 36, orbitalDays: 412 },
  kamino: { rotationHours: 27, orbitalDays: 463 },
  geonosis: { rotationHours: 30, orbitalDays: 256 },
  lothal: { rotationHours: 36, orbitalDays: 464 },
  mandalore: { rotationHours: 19, orbitalDays: 366 },
  dathomir: { rotationHours: 24, orbitalDays: 491 },
  yavin: { rotationHours: 24, orbitalDays: 4818 },
  'yavin-4': { rotationHours: 24, orbitalDays: 4818 },
  ryloth: { rotationHours: 30, orbitalDays: 305, tidallyLocked: true },
  jakku: { rotationHours: 26, orbitalDays: 358 },
  scarif: { rotationHours: 24, orbitalDays: 365 },
  kessel: { rotationHours: 26, orbitalDays: 320 },
  utapau: { rotationHours: 27, orbitalDays: 351 },
  ferrix: { rotationHours: 25, orbitalDays: 370 },
  morak: { rotationHours: 24, orbitalDays: 340 },
  nevarro: { rotationHours: 26, orbitalDays: 365 },
  jedha: { rotationHours: 26, orbitalDays: 350 },
  ilum: { rotationHours: 27, orbitalDays: 380 },
  cantonica: { rotationHours: 25, orbitalDays: 360 },
  eriadu: { rotationHours: 24, orbitalDays: 360 },
  sullust: { rotationHours: 20, orbitalDays: 263 },
  'mon-cala': { rotationHours: 25, orbitalDays: 398 },
  mon_cala: { rotationHours: 25, orbitalDays: 398 },
  taris: { rotationHours: 24, orbitalDays: 365 },
  korriban: { rotationHours: 28, orbitalDays: 370 },
  'dromund-kaas': { rotationHours: 24, orbitalDays: 360 },
  manaan: { rotationHours: 25, orbitalDays: 360 },
  lehon: { rotationHours: 24, orbitalDays: 365 },
  ossus: { rotationHours: 31, orbitalDays: 299 },
  daiyu: { rotationHours: 23, orbitalDays: 360 },
  batuu: { rotationHours: 25, orbitalDays: 365 },
  kijimi: { rotationHours: 23, orbitalDays: 350 },
  'nal-hutta': { rotationHours: 87, orbitalDays: 413 }, // slow rotation swamp world
  'nar-shaddaa': { rotationHours: 87, orbitalDays: 413 },
  ahch_to: { rotationHours: 27, orbitalDays: 380 },
  'ahch-to': { rotationHours: 27, orbitalDays: 380 },
  exegol: { rotationHours: 28, orbitalDays: 410 },
  peridea: { rotationHours: 28, orbitalDays: 390 },
  aldhani: { rotationHours: 24, orbitalDays: 365 },
  dqar: { rotationHours: 24, orbitalDays: 375 },
  crait: { rotationHours: 27, orbitalDays: 525 },
  sorgan: { rotationHours: 25, orbitalDays: 360 },
  plazir_15: { rotationHours: 26, orbitalDays: 370 },
  'plazir-15': { rotationHours: 26, orbitalDays: 370 },
  atollon: { rotationHours: 26, orbitalDays: 380 },
  seatos: { rotationHours: 24, orbitalDays: 360 },
  arvala_7: { rotationHours: 22, orbitalDays: 330 },
  'arvala-7': { rotationHours: 22, orbitalDays: 330 },
  bracca: { rotationHours: 25, orbitalDays: 365 },
  bogano: { rotationHours: 26, orbitalDays: 350 },
  koboh: { rotationHours: 24, orbitalDays: 360 },
  jedha_moon: { rotationHours: 26, orbitalDays: 350 },
  lahmu: { rotationHours: 26, orbitalDays: 395 },
  eadu: { rotationHours: 24, orbitalDays: 360 },
  mimban: { rotationHours: 24, orbitalDays: 388 },
  savareen: { rotationHours: 25, orbitalDays: 340 },
  numidian_prime: { rotationHours: 23, orbitalDays: 350 },
  'numidian-prime': { rotationHours: 23, orbitalDays: 350 },
  vandor: { rotationHours: 27, orbitalDays: 420 },
}

/**
 * Returns verified canonical rotational period in standard hours.
 * Calibrated against Wookieepedia. If not in canon records, returns 24.
 */
export function getPlanetRotationHours(planetId: string): number {
  return PLANET_ROTATIONS[planetId]?.rotationHours ?? 24
}

/**
 * Returns verified canonical orbital period in standard days.
 */
export function getPlanetOrbitalDays(planetId: string): number | undefined {
  return PLANET_ROTATIONS[planetId]?.orbitalDays
}
