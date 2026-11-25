import { useCallback, useEffect, useState } from "react";
import { getWeatherAlerts, type WeatherResult } from "./weather";
import { useFarm } from "./store";

export type WeatherStatus = "loading" | "ready" | "error" | "needs-location";

/** Weather for the active farm, shared by the notification list and badge. */
export function useWeatherAlerts() {
  const farm = useFarm();
  const [result, setResult] = useState<WeatherResult | null>(null);
  const [status, setStatus] = useState<WeatherStatus>("loading");
  const [error, setError] = useState("");
  const load = useCallback(async (force = false) => {
    if (!farm || (!farm.location.trim() && (!farm.latitude || !farm.longitude))) { setResult(null); setStatus("needs-location"); return; }
    setStatus("loading"); setError("");
    try { setResult(await getWeatherAlerts(farm, force)); setStatus("ready"); }
    catch (e) { setStatus("error"); setError(e instanceof Error ? e.message : "Could not load the weather forecast"); }
  }, [farm]);
  useEffect(() => { void load(); }, [load]);
  return { alerts: result?.alerts ?? [], result, status, error, refresh: () => load(true) };
}
