import { useMemo, useState } from "react";
import { PageHeader, Panel, Empty } from "@/components/farm/kit";
import { ResourceManager } from "@/components/farm/ResourceManager";
import { toNum } from "@/lib/calc";
import { labelOf, MAP_TYPES, parseGps } from "@/lib/schema";
import { useFarm, useRows } from "@/lib/store";
import { cn } from "@/lib/utils";

type Feature = { id: string; type: string; name: string; lat: number; lng: number; areaHa?: number; detail: string };
const TYPE_COLOR: Record<string, string> = { Field: "#2f7d4a", Pasture: "#8a9a2f", Barn: "#8a6d3b", Feedlot: "#b5483a", "Water source": "#2b7bb9", Dam: "#1f5f8f", "Irrigation system": "#3d9a99", "Animal group": "#d98e04", Building: "#6b6b6b", "Storage facility": "#7a5ea8" };

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

  const shown = features.filter((f) => !hidden.has(f.type));
  const W = 800, H = 520, PAD = 60;
  const view = useMemo(() => {
    if (!features.length) return null;
    const lat0 = features.reduce((s, f) => s + f.lat, 0) / features.length;
    const kx = 111_320 * Math.cos((lat0 * Math.PI) / 180), ky = 110_540;
    const xs = features.map((f) => f.lng * kx), ys = features.map((f) => -f.lat * ky);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const span = Math.max(maxX - minX, maxY - minY, 300);
    const scale = (Math.min(W, H) - PAD * 2) / span;
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    return { project: (f: Feature) => ({ x: W / 2 + (f.lng * kx - cx) * scale, y: H / 2 + (-f.lat * ky - cy) * scale }), scale };
  }, [features]);

  const selected = features.find((f) => f.id === sel);
  const types = [...new Set(features.map((f) => f.type))];
  return (
    <div>
      <PageHeader title="Farm Map" description={`Fields, pastures, water and buildings plotted from GPS coordinates${farm?.location ? ` – ${farm.location}` : ""}. Add coordinates on a field, pasture or map feature (tap “My location” on your phone while standing there).`} />
      {!view ? <Empty>Nothing has GPS coordinates yet. Add a GPS location to a field or pasture, or add a map feature below.</Empty> : (
        <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
          <Panel title="Map" className="p-2 sm:p-4">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg border bg-[hsl(90_30%_92%)] dark:bg-[hsl(140_20%_12%)]" role="img" aria-label="Farm map" onClick={() => setSel(null)}>
              <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="hsl(var(--border))" strokeWidth="1" /></pattern></defs>
              <rect width={W} height={H} fill="url(#grid)" />
              <g transform={`translate(${W - 50} 40)`} aria-hidden><path d="M0-22 8 4 0 0-8 4Z" fill="hsl(var(--foreground))" /><text y="20" textAnchor="middle" fontSize="12" fill="hsl(var(--foreground))">N</text></g>
              {shown.map((f) => {
                const { x, y } = view.project(f);
                const color = TYPE_COLOR[f.type] ?? "#555";
                const side = f.areaHa ? Math.max(26, Math.sqrt(f.areaHa * 10_000) * view.scale) : 0;
                return (
                  <g key={f.id} className="cursor-pointer" onClick={(e) => { e.stopPropagation(); setSel(f.id); }} tabIndex={0} role="button" aria-label={`${f.type}: ${f.name}`} onKeyDown={(e) => e.key === "Enter" && setSel(f.id)}>
                    {side > 0 ? <rect x={x - side / 2} y={y - side / 2} width={side} height={side} rx="6" fill={color} fillOpacity={f.id === sel ? 0.55 : 0.32} stroke={color} strokeWidth={f.id === sel ? 3 : 2} />
                      : <circle cx={x} cy={y} r={f.id === sel ? 11 : 9} fill={color} stroke="white" strokeWidth="2" />}
                    <text x={x} y={side > 0 ? y + 4 : y + 24} textAnchor="middle" fontSize="13" fontWeight="600" fill="hsl(var(--foreground))" paintOrder="stroke" stroke="hsl(var(--background))" strokeWidth="3">{f.name}</text>
                  </g>
                );
              })}
            </svg>
          </Panel>
          <div className="space-y-4">
            <Panel title="Layers">
              <div className="space-y-1">{types.map((t) => (
                <label key={t} className="flex min-h-[40px] cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={!hidden.has(t)} onChange={() => setHidden((s) => { const n = new Set(s); if (n.has(t)) n.delete(t); else n.add(t); return n; })} /><span className="h-3 w-3 rounded-sm" style={{ background: TYPE_COLOR[t] }} />{t}</label>
              ))}</div>
            </Panel>
            <Panel title="Selected">{selected ? <div className="text-sm"><div className={cn("font-semibold")}>{selected.name}</div><div className="text-muted-foreground">{selected.type}</div><div className="mt-1">{selected.detail}</div><div className="mt-1 text-xs text-muted-foreground">{selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}</div></div> : <p className="text-sm text-muted-foreground">Tap a marker for details.</p>}</Panel>
          </div>
        </div>
      )}
      <div className="mt-8"><h2 className="mb-1 text-lg font-semibold">Map features</h2><p className="mb-3 text-sm text-muted-foreground">Barns, feedlots, water sources, dams, irrigation, animal groups, buildings and storage. Types: {MAP_TYPES.join(", ")}.</p><ResourceManager resource="mapItems" section="map" hideTitle /></div>
    </div>
  );
}
