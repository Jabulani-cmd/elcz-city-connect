import type { Alert, Severity } from "./alerts";
import type { Farm } from "./types";

export type ForecastDay = {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  rainMm: number;
  rainChance: number;
  windKph: number;
};

export type WeatherResult = { alerts: Alert[]; location: string; updatedAt: string };
type Coordinates = { latitude: number; longitude: number; label: string };

const rank: Record<Severity, number> = { danger: 0, warning: 1, info: 2 };
const alert = (farmId: string, day: ForecastDay, key: string, severity: Severity, title: string, detail: string): Alert => ({
  id: `weather-${farmId}-${day.date}-${key}`, kind: "Weather", severity, title, detail, date: day.date, to: "/notifications", area: "Farm",
});

/** Convert the seven-day forecast into practical farm warnings. This is exported separately so the rules are testable offline. */
export function weatherAlertsFromForecast(farmId: string, days: ForecastDay[]): Alert[] {
  const out: Alert[] = [];
  for (const day of days) {
    if ([95, 96, 99].includes(day.weatherCode)) out.push(alert(farmId, day, "storm", "danger", `Thunderstorms expected ${day.date}`, "Secure animals, equipment and chemicals; avoid open fields and isolated trees during lightning."));
    if (day.rainMm >= 50) out.push(alert(farmId, day, "flood", "danger", `Very heavy rain expected ${day.date}`, `${Math.round(day.rainMm)} mm forecast. Move animals and feed away from low ground and check drainage.`));
    else if (day.rainMm >= 25 || (day.rainMm >= 10 && day.rainChance >= 80)) out.push(alert(farmId, day, "rain", "warning", `Heavy rain possible ${day.date}`, `${Math.round(day.rainMm)} mm forecast (${Math.round(day.rainChance)}% chance). Protect feed, young animals and freshly planted fields.`));
    if (day.tempMax >= 35) out.push(alert(farmId, day, "heat", "danger", `Extreme heat expected ${day.date}`, `${Math.round(day.tempMax)}°C maximum. Provide shade and extra clean water; handle animals early or late.`));
    else if (day.tempMax >= 32) out.push(alert(farmId, day, "heat", "warning", `Hot day expected ${day.date}`, `${Math.round(day.tempMax)}°C maximum. Check water, shade and heat stress in animals.`));
    if (day.tempMin <= 0) out.push(alert(farmId, day, "frost", "danger", `Frost expected ${day.date}`, `${Math.round(day.tempMin)}°C minimum. Protect seedlings, tender crops and young animals.`));
    else if (day.tempMin <= 3) out.push(alert(farmId, day, "cold", "warning", `Cold night expected ${day.date}`, `${Math.round(day.tempMin)}°C minimum. Shelter young animals and protect frost-sensitive crops.`));
    if (day.windKph >= 50) out.push(alert(farmId, day, "wind", "danger", `Damaging winds expected ${day.date}`, `${Math.round(day.windKph)} km/h forecast. Secure roofs, irrigation, greenhouses and loose equipment.`));
    else if (day.windKph >= 35) out.push(alert(farmId, day, "wind", "warning", `Strong winds expected ${day.date}`, `${Math.round(day.windKph)} km/h forecast. Avoid spraying and secure loose items.`));
  }
  const rain = days.reduce((n, d) => n + d.rainMm, 0);
  const hottest = days.length ? Math.max(...days.map((d) => d.tempMax)) : 0;
  if (days.length >= 7 && rain < 2 && hottest >= 30 && !out.some((a) => a.id.endsWith("-rain") || a.id.endsWith("-flood"))) {
    const day = days[0];
    out.push(alert(farmId, day, "dry", "info", "Dry, hot week ahead", `Only ${Math.round(rain)} mm of rain is forecast over seven days. Check irrigation, grazing and livestock water supplies.`));
  }
  return out.sort((a, b) => rank[a.severity] - rank[b.severity] || String(a.date).localeCompare(String(b.date)));
}

function savedCoordinates(farm: Farm): Coordinates | null {
  const latitude = Number(farm.latitude);
  const longitude = Number(farm.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !farm.latitude || !farm.longitude || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude, label: farm.location || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` };
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Weather service returned ${response.status}`);
    return await response.json() as T;
  } finally { clearTimeout(timer); }
}

async function coordinatesFor(farm: Farm): Promise<Coordinates> {
  const saved = savedCoordinates(farm);
  if (saved) return saved;
  if (!farm.location.trim()) throw new Error("Add the farm’s town/district or GPS coordinates in Settings.");
  const data = await fetchJson<{ results?: { latitude: number; longitude: number; name: string; admin1?: string; country?: string }[] }>(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(farm.location)}&count=1&language=en&format=json`,
  );
  const place = data.results?.[0];
  if (!place) throw new Error("The saved location could not be found. Add GPS latitude and longitude in Settings.");
  return { latitude: place.latitude, longitude: place.longitude, label: [place.name, place.admin1, place.country].filter(Boolean).join(", ") };
}

type OpenMeteo = { daily?: {
  time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[];
  precipitation_sum: number[]; precipitation_probability_max: number[]; wind_speed_10m_max: number[];
} };

async function download(farm: Farm): Promise<WeatherResult> {
  const place = await coordinatesFor(farm);
  const query = new URLSearchParams({
    latitude: String(place.latitude), longitude: String(place.longitude),
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max",
    timezone: "auto", forecast_days: "7", wind_speed_unit: "kmh",
  });
  const data = await fetchJson<OpenMeteo>(`https://api.open-meteo.com/v1/forecast?${query}`);
  const d = data.daily;
  if (!d?.time.length) throw new Error("The weather service returned no forecast.");
  const days = d.time.map((date, i): ForecastDay => ({
    date, weatherCode: Number(d.weather_code[i] ?? 0), tempMax: Number(d.temperature_2m_max[i] ?? 0), tempMin: Number(d.temperature_2m_min[i] ?? 0),
    rainMm: Number(d.precipitation_sum[i] ?? 0), rainChance: Number(d.precipitation_probability_max[i] ?? 0), windKph: Number(d.wind_speed_10m_max[i] ?? 0),
  }));
  return { alerts: weatherAlertsFromForecast(farm.id, days), location: place.label, updatedAt: new Date().toISOString() };
}

const memory = new Map<string, { at: number; result: WeatherResult }>();
const pending = new Map<string, Promise<WeatherResult>>();
const cacheKey = (farm: Farm) => `farmhelper.weather.${farm.id}.${farm.latitude},${farm.longitude},${farm.location}`;

function cached(key: string, maxAgeMs: number): WeatherResult | null {
  const m = memory.get(key);
  if (m && Date.now() - m.at <= maxAgeMs) return m.result;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const saved = JSON.parse(raw) as { at: number; result: WeatherResult };
    if (Date.now() - saved.at <= maxAgeMs) { memory.set(key, saved); return saved.result; }
  } catch { /* storage is optional */ }
  return null;
}

/** Open-Meteo forecast; no API key. Thirty-minute memory cache and six-hour offline cache prevent repeated requests. */
export async function getWeatherAlerts(farm: Farm, force = false): Promise<WeatherResult> {
  const key = cacheKey(farm);
  if (!force) {
    const fresh = cached(key, 30 * 60_000);
    if (fresh) return fresh;
    const running = pending.get(key);
    if (running) return running;
  }
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    const offline = cached(key, 6 * 60 * 60_000);
    if (offline) return offline;
    throw new Error("You’re offline. Reconnect to update the weather forecast.");
  }
  const request = download(farm).then((result) => {
    const saved = { at: Date.now(), result };
    memory.set(key, saved);
    try { localStorage.setItem(key, JSON.stringify(saved)); } catch { /* storage is optional */ }
    return result;
  }).finally(() => pending.delete(key));
  pending.set(key, request);
  return request;
}
