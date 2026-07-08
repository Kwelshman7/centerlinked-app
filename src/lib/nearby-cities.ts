type CityRow = [name: string, stateAbbr: string, lat: number, lon: number, population: number];

let citiesPromise: Promise<CityRow[]> | null = null;

function loadCities(): Promise<CityRow[]> {
  if (!citiesPromise) {
    citiesPromise = import("@/data/us-cities-major.json").then((mod) => mod.default as CityRow[]);
  }
  return citiesPromise;
}

const STATE_ABBR: Record<string, string> = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  "District of Columbia": "DC",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
};

const ABBR_TO_STATE = Object.fromEntries(Object.entries(STATE_ABBR).map(([name, abbr]) => [abbr, name]));

function normalizeStateAbbr(state: string | null | undefined): string | null {
  const raw = state?.trim();
  if (!raw) return null;
  if (raw.length === 2) return raw.toUpperCase();
  return STATE_ABBR[raw] ?? null;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

async function geocodeCity(city: string, state: string): Promise<{ lat: number; lon: number; stateAbbr: string } | null> {
  const stateAbbr = normalizeStateAbbr(state);
  const stateName = stateAbbr ? ABBR_TO_STATE[stateAbbr] : state;
  const params = new URLSearchParams({
    name: city.trim(),
    count: "5",
    language: "en",
    format: "json",
    countryCode: "US",
  });
  if (stateName) params.set("admin1", stateName);

  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
  if (!res.ok) return null;

  const data = (await res.json()) as {
    results?: Array<{ latitude: number; longitude: number; admin1?: string; name?: string }>;
  };

  const match =
    data.results?.find((row) => row.name?.toLowerCase() === city.trim().toLowerCase()) ??
    data.results?.[0];

  if (!match) return null;

  const abbr = normalizeStateAbbr(match.admin1) ?? stateAbbr;
  if (!abbr) return null;

  return { lat: match.latitude, lon: match.longitude, stateAbbr: abbr };
}

export async function findNearbyCities(
  city: string | null | undefined,
  state: string | null | undefined,
  options?: { min?: number; max?: number; minDistanceKm?: number; maxDistanceKm?: number },
): Promise<string[]> {
  const min = options?.min ?? 5;
  const max = options?.max ?? 8;
  const minDistanceKm = options?.minDistanceKm ?? 8;
  const maxDistanceKm = options?.maxDistanceKm ?? 80;

  if (!city?.trim() || !state?.trim()) return [];

  const origin = await geocodeCity(city, state);
  if (!origin) return [];

  const US_CITIES = await loadCities();
  const facilityKey = city.trim().toLowerCase();

  const ranked = US_CITIES.map(([name, abbr, lat, lon, population]) => ({
    name,
    abbr,
    population,
    distance: haversineKm(origin.lat, origin.lon, lat, lon),
  }))
    .filter(
      (row) =>
        row.abbr === origin.stateAbbr &&
        row.name.toLowerCase() !== facilityKey &&
        row.distance >= minDistanceKm &&
        row.distance <= maxDistanceKm,
    )
    .sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      return b.population - a.population;
    });

  const unique: string[] = [];
  const seen = new Set<string>();
  for (const row of ranked) {
    const key = row.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(row.name);
    if (unique.length >= max) break;
  }

  return unique.slice(0, Math.max(min, Math.min(max, unique.length)));
}
