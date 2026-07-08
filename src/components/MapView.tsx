import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import type { Sector, Station, StationStats, Individual } from "../types/wildtrack";

export interface TraceStop { station: Station; timestamp: string; }
export interface TraceInfo { individual: Individual; stops: TraceStop[]; }

interface Props {
  stations: Station[];
  statsById: Map<string, StationStats>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  sectors: Sector[];
  trace: TraceInfo | null;
  onExitTrace: () => void;
}

const COLORS = { forest: "#2d6a4f", green: "#52b788", amber: "#e08a1e", muted: "#5f7669", live: "#3b82f6" };

type LayerKey = "dark" | "osm" | "terrain" | "satellite";

const BASE_LAYERS: Record<LayerKey, { label: string; url: string; attribution: string; maxZoom: number }> = {
  dark: {
    label: "Oscuro",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; <a href='https://openstreetmap.org'>OpenStreetMap</a> &copy; <a href='https://carto.com'>CARTO</a>",
    maxZoom: 19,
  },
  osm: {
    label: "Calles",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; <a href='https://openstreetmap.org'>OpenStreetMap</a> contributors",
    maxZoom: 19,
  },
  terrain: {
    label: "Relieve",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "&copy; <a href='https://openstreetmap.org'>OpenStreetMap</a> contributors, &copy; <a href='https://opentopomap.org'>OpenTopoMap</a>",
    maxZoom: 17,
  },
  satellite: {
    label: "Satélite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; <a href='https://www.esri.com'>Esri</a>, Maxar, Earthstar Geographics",
    maxZoom: 18,
  },
};

function buildIcon(stats: StationStats | undefined, status: Station["status"], active: boolean, isLive: boolean): L.DivIcon {
  const visitas = stats?.visitas ?? 0;
  const r = Math.max(11, Math.min(26, 11 + visitas * 0.55));
  // Espacio extra para el anillo de pulso de la estación en vivo.
  const size = (r + (isLive ? 10 : 6)) * 2;
  const c = size / 2;
  const noIdFrac = stats && stats.visitas ? stats.noIdentificados / stats.visitas : 0;

  const baseColor = status === "offline" ? COLORS.muted : isLive ? COLORS.live : COLORS.forest;
  const circumference = 2 * Math.PI * r;
  const amberArc = circumference * noIdFrac;

  const pulse = isLive
    ? `<circle cx="${c}" cy="${c}" r="${r + 3}" fill="none" stroke="${COLORS.live}" stroke-width="2" class="wt-live-pulse"/>`
    : "";

  const ring = `
    ${pulse}
    <circle cx="${c}" cy="${c}" r="${r}" fill="${baseColor}" fill-opacity="0.85"
      stroke="${active ? "#fff" : "#16241d"}" stroke-width="${active ? 3 : 2}"/>
    <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${COLORS.amber}" stroke-width="4"
      stroke-dasharray="${amberArc} ${circumference}" transform="rotate(-90 ${c} ${c})" stroke-linecap="round"/>
    <text x="${c}" y="${c + 4}" text-anchor="middle" fill="#fff"
      font-family="'Space Grotesk',sans-serif" font-size="${r > 16 ? 13 : 11}" font-weight="600">${visitas}</text>
  `;
  const html = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">${ring}</svg>`;
  return L.divIcon({ html, className: "marker-ring", iconSize: [size, size], iconAnchor: [c, c] });
}

function buildPopupHTML(
  station: Station,
  stats: StationStats | undefined,
  sectorName: string,
  sectorColor: string,
): string {
  const statusLabel: Record<Station["status"], string> = { online: "En línea", alert: "Alerta", offline: "Sin señal" };
  const statusColor: Record<Station["status"], string> = { online: "#52b788", alert: "#e08a1e", offline: "#5f7669" };

  const visitas = stats?.visitas ?? 0;
  const identificados = stats?.identificados ?? 0;
  const noId = stats?.noIdentificados ?? 0;
  const pesoAvg = stats?.pesoPromedio ? `${stats.pesoPromedio.toFixed(1)} g` : "—";
  const ultimaVisita = stats?.ultimaVisita
    ? new Date(stats.ultimaVisita).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })
    : "Sin registro";

  return `
    <div class="wt-popup">
      <div class="wt-popup-head">
        <span class="wt-popup-id">${station.station_id}</span>
        <span class="wt-popup-status" style="color:${statusColor[station.status]}">● ${statusLabel[station.status]}</span>
      </div>
      <div class="wt-popup-name">${station.name}</div>
      ${station.is_live ? `<div class="wt-popup-live">📡 EN VIVO — estación real de la demo</div>` : ""}
      <div class="wt-popup-sector" style="border-color:${sectorColor};color:${sectorColor}">${sectorName}</div>
      <div class="wt-popup-stats">
        <div class="wt-popup-stat"><span class="wt-popup-stat-v">${visitas}</span><span class="wt-popup-stat-k">Visitas</span></div>
        <div class="wt-popup-stat"><span class="wt-popup-stat-v" style="color:#52b788">${identificados}</span><span class="wt-popup-stat-k">Identificados</span></div>
        <div class="wt-popup-stat"><span class="wt-popup-stat-v" style="color:#e08a1e">${noId}</span><span class="wt-popup-stat-k">Sin ID</span></div>
      </div>
      <div class="wt-popup-row"><span class="wt-popup-lbl">Peso promedio</span><span>${pesoAvg}</span></div>
      <div class="wt-popup-row"><span class="wt-popup-lbl">Último registro</span><span>${ultimaVisita}</span></div>
      <div class="wt-popup-row"><span class="wt-popup-lbl">Coordenadas</span><span class="wt-popup-mono">${station.lat.toFixed(4)}, ${station.lng.toFixed(4)}</span></div>
      <button class="wt-popup-btn" data-station-id="${station.station_id}">Ver detalles →</button>
    </div>
  `;
}

export default function MapView({ stations, statsById, selectedId, onSelect, sectors, trace, onExitTrace }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const traceLayerRef = useRef<L.LayerGroup | null>(null);
  // Stable ref so the delegated click listener always has the latest onSelect
  const onSelectRef = useRef(onSelect);
  const [activeLayer, setActiveLayer] = useState<LayerKey>("dark");

  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  // Init map once + attach delegated click listener for popup buttons
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true }).setView([6.25, -75.56], 11);

    const cfg = BASE_LAYERS.dark;
    const tile = L.tileLayer(cfg.url, { attribution: cfg.attribution + " · WildTrack", maxZoom: cfg.maxZoom });
    tile.addTo(map);
    tileLayerRef.current = tile;
    mapRef.current = map;

    // Delegated listener: handles "Ver detalles" clicks inside any popup
    const handleContainerClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>(".wt-popup-btn[data-station-id]");
      if (!btn) return;
      const stationId = btn.dataset.stationId;
      if (!stationId) return;
      e.stopPropagation();
      map.closePopup();
      onSelectRef.current(stationId);
    };
    containerRef.current.addEventListener("click", handleContainerClick);

    return () => {
      containerRef.current?.removeEventListener("click", handleContainerClick);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Swap tile layer when activeLayer changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const cfg = BASE_LAYERS[activeLayer];
    if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
    const tile = L.tileLayer(cfg.url, { attribution: cfg.attribution + " · WildTrack", maxZoom: cfg.maxZoom });
    tile.addTo(map);
    tile.bringToBack();
    tileLayerRef.current = tile;
  }, [activeLayer]);

  // (Re)draw markers whenever stations/stats/selection change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    stations.forEach((st) => {
      const stats = statsById.get(st.station_id);
      const icon = buildIcon(stats, st.status, st.station_id === selectedId, !!st.is_live);
      const marker = L.marker([st.lat, st.lng], { icon, title: st.name }).addTo(map);

      const sector = sectors.find((s) => s.sector_id === st.sector_id);
      const sectorName = sector?.name ?? st.sector_id;
      const sectorColor = sector?.color ?? "#52b788";

      marker.bindPopup(
        L.popup({ className: "wt-leaflet-popup", maxWidth: 280, closeButton: true, autoPan: true })
          .setContent(buildPopupHTML(st, stats, sectorName, sectorColor))
      );

      marker.on("click", () => marker.openPopup());
      markersRef.current.set(st.station_id, marker);
    });
  }, [stations, statsById, selectedId, sectors]);

  // Pan to selected station
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const st = stations.find((s) => s.station_id === selectedId);
    if (st) map.panTo([st.lat, st.lng], { animate: true });
  }, [selectedId, stations]);

  // Trazabilidad espacial: dibuja la ruta cronológica de un individuo entre estaciones
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (traceLayerRef.current) {
      traceLayerRef.current.remove();
      traceLayerRef.current = null;
    }
    if (!trace || trace.stops.length === 0) return;

    const layer = L.layerGroup();
    const latlngs = trace.stops.map((s) => [s.station.lat, s.station.lng] as [number, number]);

    L.polyline(latlngs, { color: COLORS.amber, weight: 3, dashArray: "6 6", opacity: 0.9 }).addTo(layer);

    trace.stops.forEach((s, i) => {
      const icon = L.divIcon({
        html: `<div class="trace-stop-marker">${i + 1}</div>`,
        className: "trace-stop-wrap",
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      L.marker([s.station.lat, s.station.lng], { icon, zIndexOffset: 1000 }).addTo(layer);
    });

    layer.addTo(map);
    traceLayerRef.current = layer;
    map.fitBounds(L.latLngBounds(latlngs), { padding: [70, 70], maxZoom: 14 });
  }, [trace]);

  return (
    <div className="map-wrap">
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* Layer switcher */}
      <div className="layer-switcher">
        {(Object.keys(BASE_LAYERS) as LayerKey[]).map((key) => (
          <button
            key={key}
            className="layer-btn"
            data-active={activeLayer === key}
            onClick={() => setActiveLayer(key)}
            title={BASE_LAYERS[key].label}
          >
            {BASE_LAYERS[key].label}
          </button>
        ))}
      </div>

      {trace ? (
        <div className="banner trace-banner">
          <span className="dot" />
          Trazabilidad: <strong>{trace.individual.common_name}</strong> ({trace.individual.individual_id}) · {trace.stops.length} paradas
          <button className="btn-trace-exit" onClick={onExitTrace}>Salir</button>
        </div>
      ) : (
        <div className="banner"><span className="dot" /> Datos de ejemplo — reemplazar por mediciones reales de campo</div>
      )}
      <div className="legend">
        <h4>Cómo leer el mapa</h4>
        <div className="row"><span className="swatch" style={{ background: COLORS.forest }} /> Tamaño = nº de visitas</div>
        <div className="row"><span className="swatch" style={{ background: COLORS.amber }} /> Arco = % sin identificar</div>
        <div className="row"><span className="swatch" style={{ background: COLORS.muted }} /> Gris = estación offline</div>
        <div className="row"><span className="swatch" style={{ background: COLORS.live }} /> Azul pulsante 📡 = estación en vivo (real, para la demo)</div>
        <p className="note">Coordenadas administradas por estación (no GPS del equipo).</p>
      </div>
    </div>
  );
}
