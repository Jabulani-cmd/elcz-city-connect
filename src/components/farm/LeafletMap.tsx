import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  color: string;
  label: string;
  /** Square side in metres for fields/pastures; omit for a point marker. */
  sideM?: number;
  /** 0–1, lower for stale positions. */
  opacity?: number;
  /** Ring style for live people/animals. */
  live?: boolean;
};

/**
 * OpenStreetMap tiles via Leaflet. Tiles are cached by the service worker after first view, so a map you have looked at still shows with patchy data;
 * when no tile is available the pale background and the markers still work.
 */
export function LeafletMap({ markers, selectedId, onSelect, className }: { markers: MapMarker[]; selectedId: string | null; onSelect: (id: string | null) => void; className?: string }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const fitted = useRef(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, { zoomControl: true, attributionControl: true }).setView([-19, 29.8], 6);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap contributors" }).addTo(m);
    m.on("click", () => onSelectRef.current(null));
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => { m.remove(); map.current = null; layer.current = null; fitted.current = false; };
  }, []);

  useEffect(() => {
    const m = map.current, g = layer.current;
    if (!m || !g) return;
    g.clearLayers();
    for (const k of markers) {
      const sel = k.id === selectedId;
      const click = (e: L.LeafletMouseEvent) => { L.DomEvent.stopPropagation(e); onSelectRef.current(k.id); };
      if (k.sideM) {
        const dLat = k.sideM / 2 / 110_540, dLng = k.sideM / 2 / (111_320 * Math.cos((k.lat * Math.PI) / 180));
        L.rectangle([[k.lat - dLat, k.lng - dLng], [k.lat + dLat, k.lng + dLng]], { color: k.color, weight: sel ? 3 : 2, fillColor: k.color, fillOpacity: sel ? 0.5 : 0.3 }).on("click", click).bindTooltip(k.label, { permanent: true, direction: "center", className: "farm-map-label" }).addTo(g);
      } else {
        L.circleMarker([k.lat, k.lng], { radius: sel ? 12 : 9, color: "#fff", weight: 2, fillColor: k.color, fillOpacity: k.opacity ?? 1, opacity: k.opacity ?? 1, className: k.live ? "farm-map-live" : undefined }).on("click", click).bindTooltip(k.label, { permanent: true, direction: "bottom", offset: [0, 8], className: "farm-map-label" }).addTo(g);
      }
    }
    if (!fitted.current && markers.length) {
      fitted.current = true;
      m.fitBounds(L.latLngBounds(markers.map((k) => [k.lat, k.lng] as [number, number])), { padding: [40, 40], maxZoom: 16 });
    }
  }, [markers, selectedId]);

  return <div ref={el} className={className} role="application" aria-label="Farm map" />;
}
