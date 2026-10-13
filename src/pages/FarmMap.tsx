import { useEffect, useMemo, useState } from "react";
import { PageHeader, Panel, Empty } from "@/components/farm/kit";
import { ResourceManager } from "@/components/farm/ResourceManager";
import { toNum } from "@/lib/calc";
import { labelOf, MAP_TYPES, parseGps } from "@/lib/schema";
import { useFarm, useRows, useUser } from "@/lib/store";
import { canWrite } from "@/lib/permissions";
import { ago, freshness, withCoords, type Freshness } from "@/lib/tracking";
import { LeafletMap, type MapMarker } from "@/components/farm/LeafletMap";
import { CheckInPanel, ShiftPanel } from "@/components/farm/TrackingPanels";
import { cn } from "@/lib/utils";

type Feature = { id: string; type: string; name: string; lat: number; lng: number; areaHa?: number; detail: string; at?: string; fresh?: Freshness };
const TYPE_COLOR: Record<string, string> = { Field: "#2f7d4a", Pasture: "#8a9a2f", Barn: "#8a6d3b", Feedlot: "#b5483a", "Water source": "#2b7bb9", Dam: "#1f5f8f", "Irrigation system": "#3d9a99", "Animal group": "#d98e04", Building: "#6b6b6b", "Storage facility": "#7a5ea8", Livestock: "#c2410c", Employees: "#2563eb" };

export default function FarmMap() {
  const farm = useFarm();
  const fields = useRows("fields");
  const pastures = useRows("pastures");
  const items = useRows("mapItems");
  const animals = useRows("animals");
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [sel, setSel] = useState<string | null>(null);

  const features = useMemo<Feature[]>(() => {
    const out: Feature[] = [];
    for (const f of fields) { const p = parseGps(f.gps); if (p) out.push({ id: f.id, type: "Field", name: f.name, lat: p[0], lng: p[1], areaHa: toNum(f.sizeHa), detail: `${f.sizeHa} ha · ${f.currentCrop || "no crop"} · ${f.status}` }); }
    for (const p of pastures) {
      const g = parseGps(p.gps); if (!g) continue;
      const n = animals.filter((a) => a.pastureId === p.id && (a.status === "Active" || a.status === "Quarantined")).length;
      out.push({ id: p.id, type: "Pasture", name: labelOf("pastures", p), lat: g[0], lng: g[1], areaHa: toNum(p.areaHa), detail: `${p.areaHa} ha · ${n} animals · water ${String(p.water).toLowerCase()}` });
    }
    for (const m of items) { const p = parseGps(m.gps); if (p) out.push({ id: m.id, type: m.type, name: m.name, lat: p[0], lng: p[1], detail: m.notes || m.type }); }
    return out;
  }, [fields, pastures, items, animals]);

  const positions = useRows("positions");
  const role = useUser().role;
  const seeStaff = role === "Owner" || role === "Farm Manager";
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(t); }, []);

  const live = useMemo<Feature[]>(() => withCoords(positions).filter((p) => p.subjectType === "Animal" || seeStaff).map((p) => {
    const type = p.subjectType === "Employee" ? "Employees" : "Livestock";
    const fr = freshness(p.recordedAt, now);
    return { id: p.id, type, name: p.name || (type === "Employees" ? "Employee" : "Animal"), lat: Number(p.lat), lng: Number(p.lng), at: p.recordedAt, fresh: fr,
      detail: `Last seen ${ago(p.recordedAt, now)} · ${p.source || "unknown source"}${p.accuracy ? ` · ±${p.accuracy} m` : ""}` };
  }), [positions, seeStaff, now]);

  const all = useMemo(() => [...features, ...live], [features, live]);
  const shown = all.filter((f) => !hidden.has(f.type));
  const markers = useMemo<MapMarker[]>(() => shown.map((f) => ({
    id: f.id, lat: f.lat, lng: f.lng, color: TYPE_COLOR[f.type] ?? "#555", label: f.name,
    sideM: f.areaHa ? Math.max(40, Math.sqrt(f.areaHa * 10_000)) : undefined,
    opacity: f.fresh === "stale" ? 0.45 : f.fresh === "recent" ? 0.75 : 1, live: f.fresh === "live",
  })), [shown]);
  const view = all.length > 0;

  const selected = all.find((f) => f.id === sel);
  const types = [...new Set(all.map((f) => f.type))];
  return (
    <div>
      <PageHeader title="Farm Map" description={`Fields, pastures, water and buildings, plus the last known position of livestock and (for managers) staff on shift${farm?.location ? ` – ${farm.location}` : ""}. Add coordinates on a field, pasture or map feature (tap “My location” on your phone while standing there).`} />
      {(canWrite(role, "tasks") || canWrite(role, "livestock") || canWrite(role, "map")) && (
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          {canWrite(role, "tasks") && <ShiftPanel />}
          {(canWrite(role, "livestock") || canWrite(role, "map")) && <CheckInPanel />}
        </div>
      )}
      {!view ? <Empty>Nothing has GPS coordinates yet. Add a GPS location to a field or pasture, add a map feature below, or clock in / check in an animal to appear on the map.</Empty> : (
        <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
          <Panel title="Map" className="p-2 sm:p-4">
            <LeafletMap className="z-0 h-[26rem] w-full rounded-lg border sm:h-[34rem]" markers={markers} selectedId={sel} onSelect={setSel} />
          </Panel>
          <div className="space-y-4">
            <Panel title="Layers">
              <div className="space-y-1">{types.map((t) => (
                <label key={t} className="flex min-h-[40px] cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={!hidden.has(t)} onChange={() => setHidden((s) => { const n = new Set(s); if (n.has(t)) n.delete(t); else n.add(t); return n; })} /><span className="h-3 w-3 rounded-sm" style={{ background: TYPE_COLOR[t] }} />{t}</label>
              ))}</div>
            </Panel>
            <Panel title="Selected">{selected ? <div className="text-sm"><div className={cn("font-semibold")}>{selected.name}</div><div className="text-muted-foreground">{selected.type}{selected.fresh ? ` · ${selected.fresh === "live" ? "live" : selected.fresh === "recent" ? "recent" : "last known"}` : ""}</div><div className="mt-1">{selected.detail}</div><div className="mt-1 text-xs text-muted-foreground">{selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}</div></div> : <p className="text-sm text-muted-foreground">Tap a marker for details.</p>}</Panel>
            {live.length > 0 && (
              <Panel title="Last known positions">
                <ul className="space-y-1 text-sm">{[...live].sort((a, b) => String(b.at).localeCompare(String(a.at))).map((f) => (
                  <li key={f.id}><button className="flex min-h-[40px] w-full items-center gap-2 text-left" onClick={() => setSel(f.id)}>
                    <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", f.fresh === "live" ? "bg-success" : f.fresh === "recent" ? "bg-warning" : "bg-muted-foreground")} />
                    <span className="min-w-0 flex-1 truncate">{f.name}</span><span className="shrink-0 text-xs text-muted-foreground">{ago(f.at, now)}</span>
                  </button></li>
                ))}</ul>
              </Panel>
            )}
          </div>
        </div>
      )}
      <div className="mt-8"><h2 className="mb-1 text-lg font-semibold">Map features</h2><p className="mb-3 text-sm text-muted-foreground">Barns, feedlots, water sources, dams, irrigation, animal groups, buildings and storage. Types: {MAP_TYPES.join(", ")}.</p><ResourceManager resource="mapItems" section="map" hideTitle /></div>
    </div>
  );
}
