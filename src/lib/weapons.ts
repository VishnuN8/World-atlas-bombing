// Historical facts below are drawn from public historical records.
// Derived effect radii are scaling-law APPROXIMATIONS (Glasstone & Dolan style), not measurements.

export type WeaponKind = "nuclear" | "thermonuclear" | "conventional";

export interface Weapon {
  id: string;
  name: string;
  nickname?: string;
  kind: WeaponKind;
  era: string;
  country: string;
  date: string;
  location: string;
  lat: number;
  lon: number;
  yieldKt: number; // TNT equivalent in kilotons
  yieldLabel: string;
  delivery: string;
  context: string;
  facts: string[];
}

export const WEAPONS: Weapon[] = [
  {
    id: "trinity",
    name: "Trinity (Gadget)",
    kind: "nuclear",
    era: "WWII",
    country: "United States",
    date: "16 July 1945",
    location: "Jornada del Muerto, New Mexico",
    lat: 33.6773,
    lon: -106.4754,
    yieldKt: 21,
    yieldLabel: "~21 kt",
    delivery: "Tower-mounted test device (30 m)",
    context:
      "First detonation of a nuclear device, conducted by the Manhattan Project. An implosion-type plutonium design, the same as Fat Man.",
    facts: [
      "Fused desert sand into a green glass later called trinitite.",
      "Yield estimate revised to ~24.8 kt in a 2021 reanalysis.",
    ],
  },
  {
    id: "little-boy",
    name: "Little Boy",
    kind: "nuclear",
    era: "WWII",
    country: "United States",
    date: "6 August 1945",
    location: "Hiroshima, Japan",
    lat: 34.3955,
    lon: 132.4536,
    yieldKt: 15,
    yieldLabel: "~15 kt",
    delivery: "B-29 Enola Gay, airburst ~580 m",
    context:
      "Gun-type uranium-235 weapon; the first nuclear weapon used in war. Destroyed most of central Hiroshima.",
    facts: [
      "Estimated 70,000–140,000 deaths by end of 1945.",
      "Less than 1 kg of its ~64 kg of uranium underwent fission.",
    ],
  },
  {
    id: "fat-man",
    name: "Fat Man",
    kind: "nuclear",
    era: "WWII",
    country: "United States",
    date: "9 August 1945",
    location: "Nagasaki, Japan",
    lat: 32.7737,
    lon: 129.8634,
    yieldKt: 21,
    yieldLabel: "~21 kt",
    delivery: "B-29 Bockscar, airburst ~500 m",
    context:
      "Implosion-type plutonium weapon. Hilly terrain partially shielded parts of the city from the blast.",
    facts: [
      "Estimated 39,000–80,000 deaths by end of 1945.",
      "Detonated over the Urakami Valley, ~3 km off its intended aim point.",
    ],
  },
  {
    id: "ivy-mike",
    name: "Ivy Mike",
    kind: "thermonuclear",
    era: "Cold War",
    country: "United States",
    date: "1 November 1952",
    location: "Elugelab, Enewetak Atoll",
    lat: 11.6667,
    lon: 162.1917,
    yieldKt: 10400,
    yieldLabel: "10.4 Mt",
    delivery: "Ground-based test device (~82 t)",
    context:
      "First full-scale test of a Teller–Ulam staged thermonuclear device, using cryogenic liquid deuterium.",
    facts: ["Vaporized the island of Elugelab, leaving a crater ~1.9 km wide.", "Mushroom cloud rose to ~41 km."],
  },
  {
    id: "castle-bravo",
    name: "Castle Bravo",
    kind: "thermonuclear",
    era: "Cold War",
    country: "United States",
    date: "1 March 1954",
    location: "Bikini Atoll, Marshall Islands",
    lat: 11.69,
    lon: 165.27,
    yieldKt: 15000,
    yieldLabel: "15 Mt",
    delivery: "Surface test device",
    context:
      "Largest US nuclear test. Yield was ~2.5× the predicted 6 Mt due to unexpected lithium-7 reactions.",
    facts: [
      "Fallout contaminated Rongelap residents and the Japanese fishing boat Daigo Fukuryū Maru.",
      "Spurred international concern about atmospheric testing.",
    ],
  },
  {
    id: "tsar-bomba",
    name: "Tsar Bomba (AN602)",
    kind: "thermonuclear",
    era: "Cold War",
    country: "Soviet Union",
    date: "30 October 1961",
    location: "Sukhoy Nos, Novaya Zemlya",
    lat: 73.807,
    lon: 54.973,
    yieldKt: 50000,
    yieldLabel: "~50 Mt",
    delivery: "Tu-95V, parachute-retarded airburst ~4 km",
    context:
      "The most powerful explosive ever detonated. Designed for ~100 Mt but tested at reduced yield to limit fallout.",
    facts: ["Mushroom cloud reached ~64 km altitude.", "Windows broke as far as ~900 km away."],
  },
  {
    id: "cookie",
    name: "HC 4000 lb 'Cookie'",
    kind: "conventional",
    era: "WWII",
    country: "United Kingdom",
    date: "1941–1945",
    location: "European theatre (shown: Hamburg)",
    lat: 53.5511,
    lon: 9.9937,
    yieldKt: 0.0018,
    yieldLabel: "~1.8 t (approx. TNT eq.)",
    delivery: "RAF Lancaster / Wellington",
    context:
      "High-capacity 'blockbuster' blast bomb used by RAF Bomber Command to blow roofs off and spread incendiaries.",
    facts: ["Roughly three-quarters of its weight was explosive (Amatol/Minol).", "Over 68,000 were dropped."],
  },
  {
    id: "grand-slam",
    name: "Grand Slam",
    kind: "conventional",
    era: "WWII",
    country: "United Kingdom",
    date: "14 March 1945",
    location: "Bielefeld Viaduct, Germany",
    lat: 52.005,
    lon: 8.59,
    yieldKt: 0.0065,
    yieldLabel: "~6.5 t (approx. TNT eq.)",
    delivery: "RAF Lancaster B.I Special, No. 617 Sqn",
    context:
      "22,000 lb 'earthquake bomb' designed by Barnes Wallis to penetrate the ground and collapse structures.",
    facts: ["Its first combat use collapsed spans of the Bielefeld railway viaduct.", "41 were dropped in the war."],
  },
  {
    id: "moab",
    name: "GBU-43/B MOAB",
    kind: "conventional",
    era: "Modern",
    country: "United States",
    date: "13 April 2017 (first combat use)",
    location: "Achin District, Afghanistan",
    lat: 34.07,
    lon: 70.68,
    yieldKt: 0.011,
    yieldLabel: "~11 t TNT eq.",
    delivery: "MC-130 cargo aircraft, parachute extraction",
    context: "Massive Ordnance Air Blast bomb, among the largest conventional weapons ever used in combat.",
    facts: ["Total weight ~9,800 kg with ~8,500 kg of H6 explosive.", "First tested at Eglin AFB in March 2003."],
  },
];

export const R_EARTH_KM = 6371;

/** Scaling-law approximations. W in kilotons. Results in km. */
export function effects(W: number) {
  const fireball = 0.066 * Math.pow(W, 0.4); // fireball max radius
  const blast5 = 0.71 * Math.cbrt(W); // ~5 psi overpressure (airburst)
  const blast1 = 1.9 * Math.cbrt(W); // ~1 psi overpressure
  const thermal = 0.67 * Math.pow(W, 0.41); // 3rd-degree burns
  const cloudTop = 4 * Math.pow(W, 0.25); // mushroom cloud top height
  const energyJ = W * 4.184e12; // exact definition of 1 kt
  return { fireball, blast5, blast1, thermal, cloudTop, energyJ };
}

export const DESCENT = 3; // seconds of sim time before impact
export const SIM_TOTAL = 24;

export function phaseName(t: number) {
  if (t < 0) return "Standby";
  if (t < DESCENT) return "Descent";
  const p = t - DESCENT;
  if (p < 0.6) return "Flash / Fireball";
  if (p < 4) return "Shockwave";
  if (p < 12) return "Cloud rise";
  return "Dissipation";
}

export function latLonToVec(lat: number, lon: number, r = 1): [number, number, number] {
  const phi = ((lon + 180) * Math.PI) / 180;
  const theta = ((90 - lat) * Math.PI) / 180;
  return [-Math.cos(phi) * Math.sin(theta) * r, Math.cos(theta) * r, Math.sin(phi) * Math.sin(theta) * r];
}

export function vecToLatLon(x: number, y: number, z: number) {
  const l = Math.hypot(x, y, z);
  const lat = 90 - (Math.acos(y / l) * 180) / Math.PI;
  let phi = Math.atan2(z, -x);
  if (phi < 0) phi += Math.PI * 2;
  let lon = (phi * 180) / Math.PI - 180;
  if (lon < -180) lon += 360;
  return { lat, lon };
}

export function fmtKm(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 2 : 1)} km`;
}
