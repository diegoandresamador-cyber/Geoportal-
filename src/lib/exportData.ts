import type { WildEvent, Station, Individual, Sector, StationStats } from "../types/wildtrack";

function escapeCsv(val: unknown): string {
  const s = val == null ? "" : String(val);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function toCsvRow(cells: unknown[]): string {
  return cells.map(escapeCsv).join(",");
}

function triggerDownload(content: string, filename: string, mime: string) {
  const bom = mime.includes("csv") ? "﻿" : "";
  const blob = new Blob([bom + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Eventos ────────────────────────────────────────────────────────────────

function buildEventsCsv(
  events: WildEvent[],
  stations: Station[],
  individuals: Individual[]
): string {
  const stById = new Map(stations.map((s) => [s.station_id, s]));
  const indByRfid = new Map(individuals.map((i) => [i.rfid_tag, i]));

  const header = toCsvRow([
    "timestamp", "station_id", "station_name",
    "rfid_tag", "individual_id", "species", "common_name", "sex",
    "weight_g", "temperature_c", "humidity_pct",
    "proximity_triggered", "photo_ref",
  ]);

  const rows = events.map((e) => {
    const st = stById.get(e.station_id);
    const ind = e.rfid_tag ? indByRfid.get(e.rfid_tag) : undefined;
    return toCsvRow([
      e.timestamp, e.station_id, st?.name ?? "",
      e.rfid_tag ?? "", ind?.individual_id ?? "",
      ind?.species ?? "", ind?.common_name ?? "", ind?.sex ?? "",
      e.weight_g, e.temperature_c, e.humidity_pct,
      e.proximity_triggered, e.photo_ref ?? "",
    ]);
  });

  return [header, ...rows].join("\r\n");
}

export function exportEventsCsv(
  events: WildEvent[],
  stations: Station[],
  individuals: Individual[],
  filename = "wildtrack_eventos.csv"
) {
  triggerDownload(buildEventsCsv(events, stations, individuals), filename, "text/csv;charset=utf-8");
}

export function exportEventsJson(
  events: WildEvent[],
  stations: Station[],
  individuals: Individual[],
  filename = "wildtrack_eventos.json"
) {
  const stById = new Map(stations.map((s) => [s.station_id, s]));
  const indByRfid = new Map(individuals.map((i) => [i.rfid_tag, i]));

  const enriched = events.map((e) => {
    const ind = e.rfid_tag ? indByRfid.get(e.rfid_tag) : undefined;
    return {
      ...e,
      station_name: stById.get(e.station_id)?.name ?? null,
      individual: ind
        ? { individual_id: ind.individual_id, species: ind.species, common_name: ind.common_name, sex: ind.sex }
        : null,
    };
  });

  const payload = { generated: new Date().toISOString(), total: enriched.length, events: enriched };
  triggerDownload(JSON.stringify(payload, null, 2), filename, "application/json");
}

// ─── Estaciones ──────────────────────────────────────────────────────────────

export function exportStationsGeoJson(
  stations: Station[],
  sectors: Sector[],
  statsById: Map<string, StationStats>,
  filename = "wildtrack_estaciones.geojson"
) {
  const secById = new Map(sectors.map((s) => [s.sector_id, s]));

  const features = stations.map((st) => {
    const sec = secById.get(st.sector_id);
    const stats = statsById.get(st.station_id);
    return {
      type: "Feature",
      geometry: { type: "Point", coordinates: [st.lng, st.lat] },
      properties: {
        station_id: st.station_id,
        name: st.name,
        status: st.status,
        sector_id: st.sector_id,
        sector_name: sec?.name ?? null,
        visitas: stats?.visitas ?? 0,
        identificados: stats?.identificados ?? 0,
        no_identificados: stats?.noIdentificados ?? 0,
        peso_promedio_g: stats?.pesoPromedio ?? 0,
        ultima_visita: stats?.ultimaVisita ?? null,
      },
    };
  });

  const geojson = {
    type: "FeatureCollection",
    name: "WildTrack_Estaciones",
    crs: { type: "name", properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" } },
    generated: new Date().toISOString(),
    features,
  };

  triggerDownload(JSON.stringify(geojson, null, 2), filename, "application/geo+json");
}

export function exportStationsCsv(
  stations: Station[],
  sectors: Sector[],
  statsById: Map<string, StationStats>,
  filename = "wildtrack_estaciones.csv"
) {
  const secById = new Map(sectors.map((s) => [s.sector_id, s]));

  const header = toCsvRow([
    "station_id", "name", "lat", "lng", "status",
    "sector_id", "sector_name",
    "visitas", "identificados", "no_identificados",
    "peso_promedio_g", "ultima_visita",
  ]);

  const rows = stations.map((st) => {
    const sec = secById.get(st.sector_id);
    const stats = statsById.get(st.station_id);
    return toCsvRow([
      st.station_id, st.name, st.lat, st.lng, st.status,
      st.sector_id, sec?.name ?? "",
      stats?.visitas ?? 0, stats?.identificados ?? 0, stats?.noIdentificados ?? 0,
      stats?.pesoPromedio ?? 0, stats?.ultimaVisita ?? "",
    ]);
  });

  triggerDownload([header, ...rows].join("\r\n"), filename, "text/csv;charset=utf-8");
}

// ─── Individuos ──────────────────────────────────────────────────────────────

export function exportIndividualsCsv(
  individuals: Individual[],
  stations: Station[],
  filename = "wildtrack_individuos.csv"
) {
  const stById = new Map(stations.map((s) => [s.station_id, s]));

  const header = toCsvRow([
    "individual_id", "station_id", "station_name", "rfid_tag",
    "species", "common_name", "sex", "estimated_weight_g",
    "registration_date", "notes",
  ]);

  const rows = individuals.map((ind) =>
    toCsvRow([
      ind.individual_id, ind.station_id, stById.get(ind.station_id)?.name ?? "",
      ind.rfid_tag, ind.species, ind.common_name, ind.sex,
      ind.estimated_weight_g ?? "", ind.registration_date, ind.notes ?? "",
    ])
  );

  triggerDownload([header, ...rows].join("\r\n"), filename, "text/csv;charset=utf-8");
}

export function exportIndividualsJson(
  individuals: Individual[],
  stations: Station[],
  filename = "wildtrack_individuos.json"
) {
  const stById = new Map(stations.map((s) => [s.station_id, s]));

  const enriched = individuals.map((ind) => ({
    ...ind,
    station_name: stById.get(ind.station_id)?.name ?? null,
  }));

  const payload = { generated: new Date().toISOString(), total: enriched.length, individuals: enriched };
  triggerDownload(JSON.stringify(payload, null, 2), filename, "application/json");
}
