/**
 * Vehicle picker data for Kosovo-focused spare-parts search.
 * Fitment is NOT auto-confirmed — selection only scopes the query / WhatsApp ask.
 */

export type VehicleMake = {
  id: string;
  name: string;
  models: { id: string; name: string; years: [number, number] }[];
};

export type VehicleSelection = {
  makeId: string;
  makeName: string;
  modelId: string;
  modelName: string;
  year: number;
  engine: string;
};

export const VEHICLE_ENGINES = [
  "",
  "1.0",
  "1.2",
  "1.4",
  "1.5",
  "1.6",
  "1.8",
  "1.9 TDI",
  "2.0",
  "2.0 TDI",
  "2.0 TFSI",
  "2.5",
  "3.0",
  "Diesel",
  "Benzinë",
  "Hybrid",
] as const;

/** Popular makes/models seen in Kosovo workshops — extend as needed. */
export const VEHICLE_MAKES: VehicleMake[] = [
  {
    id: "vw",
    name: "Volkswagen",
    models: [
      { id: "golf", name: "Golf", years: [2004, 2024] },
      { id: "passat", name: "Passat", years: [2005, 2024] },
      { id: "polo", name: "Polo", years: [2005, 2024] },
      { id: "tiguan", name: "Tiguan", years: [2008, 2024] },
      { id: "caddy", name: "Caddy", years: [2004, 2024] },
    ],
  },
  {
    id: "audi",
    name: "Audi",
    models: [
      { id: "a3", name: "A3", years: [2004, 2024] },
      { id: "a4", name: "A4", years: [2005, 2024] },
      { id: "a6", name: "A6", years: [2005, 2024] },
      { id: "q5", name: "Q5", years: [2009, 2024] },
    ],
  },
  {
    id: "bmw",
    name: "BMW",
    models: [
      { id: "1", name: "1 Series", years: [2004, 2024] },
      { id: "3", name: "3 Series", years: [2005, 2024] },
      { id: "5", name: "5 Series", years: [2005, 2024] },
      { id: "x3", name: "X3", years: [2006, 2024] },
    ],
  },
  {
    id: "mercedes",
    name: "Mercedes-Benz",
    models: [
      { id: "c", name: "C-Class", years: [2005, 2024] },
      { id: "e", name: "E-Class", years: [2005, 2024] },
      { id: "a", name: "A-Class", years: [2005, 2024] },
      { id: "sprinter", name: "Sprinter", years: [2006, 2024] },
    ],
  },
  {
    id: "opel",
    name: "Opel",
    models: [
      { id: "astra", name: "Astra", years: [2004, 2024] },
      { id: "corsa", name: "Corsa", years: [2004, 2024] },
      { id: "insignia", name: "Insignia", years: [2008, 2024] },
    ],
  },
  {
    id: "ford",
    name: "Ford",
    models: [
      { id: "focus", name: "Focus", years: [2005, 2024] },
      { id: "fiesta", name: "Fiesta", years: [2005, 2024] },
      { id: "mondeo", name: "Mondeo", years: [2007, 2024] },
      { id: "transit", name: "Transit", years: [2006, 2024] },
    ],
  },
  {
    id: "skoda",
    name: "Škoda",
    models: [
      { id: "octavia", name: "Octavia", years: [2004, 2024] },
      { id: "fabia", name: "Fabia", years: [2004, 2024] },
      { id: "superb", name: "Superb", years: [2008, 2024] },
    ],
  },
  {
    id: "toyota",
    name: "Toyota",
    models: [
      { id: "corolla", name: "Corolla", years: [2004, 2024] },
      { id: "yaris", name: "Yaris", years: [2005, 2024] },
      { id: "rav4", name: "RAV4", years: [2006, 2024] },
    ],
  },
  {
    id: "peugeot",
    name: "Peugeot",
    models: [
      { id: "208", name: "208", years: [2012, 2024] },
      { id: "308", name: "308", years: [2008, 2024] },
      { id: "3008", name: "3008", years: [2009, 2024] },
    ],
  },
  {
    id: "renault",
    name: "Renault",
    models: [
      { id: "clio", name: "Clio", years: [2005, 2024] },
      { id: "megane", name: "Mégane", years: [2005, 2024] },
      { id: "scenic", name: "Scénic", years: [2005, 2024] },
    ],
  },
];

export const VEHICLE_STORAGE_KEY = "as_vehicle_v1";

export function yearsForModel(range: [number, number]): number[] {
  const [from, to] = range;
  const out: number[] = [];
  for (let y = to; y >= from; y -= 1) out.push(y);
  return out;
}

export function formatVehicleLabel(
  v: VehicleSelection,
  _locale?: "sq" | "en"
): string {
  const engine = v.engine ? ` · ${v.engine}` : "";
  return `${v.makeName} ${v.modelName} ${v.year}${engine}`;
}

export function vehicleSearchQuery(v: VehicleSelection): string {
  return [v.makeName, v.modelName, String(v.year), v.engine]
    .filter(Boolean)
    .join(" ");
}

export function vehicleWhatsAppBlurb(
  v: VehicleSelection,
  locale: "sq" | "en"
): string {
  const label = formatVehicleLabel(v, locale);
  return locale === "sq"
    ? `Përshëndetje AUTO SHABANI, kam nevojë për pjesë për: ${label}. `
    : `Hello AUTO SHABANI, I need parts for: ${label}. `;
}

export function readStoredVehicle(): VehicleSelection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(VEHICLE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VehicleSelection;
    if (!parsed?.makeId || !parsed?.modelId || !parsed?.year) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function storeVehicle(v: VehicleSelection | null) {
  if (typeof window === "undefined") return;
  if (!v) sessionStorage.removeItem(VEHICLE_STORAGE_KEY);
  else sessionStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(v));
}
