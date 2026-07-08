import type { Sector, Station, Individual, StationStats, SectorStats, WildEvent, IndividualMovement } from "../types/wildtrack";

// ============================================================================
// Estadísticas agregadas (sector / individuos) y trazabilidad espacial.
// Complementa a computeStats() en lib/api.ts, que calcula por estación.
// ============================================================================

export function computeSectorStats(sector: Sector, stations: Station[], statsById: Map<string, StationStats>): SectorStats {
  const secStations = stations.filter((st) => st.sector_id === sector.sector_id);
  let visitas = 0;
  let identificados = 0;
  let noIdentificados = 0;
  let pesoAcumulado = 0;
  let alertas = 0;

  for (const st of secStations) {
    const s = statsById.get(st.station_id);
    if (st.status !== "online") alertas++;
    if (!s) continue;
    visitas += s.visitas;
    identificados += s.identificados;
    noIdentificados += s.noIdentificados;
    pesoAcumulado += s.pesoPromedio * s.visitas;
  }

  return {
    sector_id: sector.sector_id,
    estaciones: secStations.length,
    visitas,
    identificados,
    noIdentificados,
    pesoPromedio: visitas > 0 ? Math.round((pesoAcumulado / visitas) * 10) / 10 : 0,
    alertas,
  };
}

export function computeIndividualMovements(individuals: Individual[], events: WildEvent[]): IndividualMovement[] {
  return individuals.map((ind) => {
    const path = events
      .filter((e) => e.rfid_tag === ind.rfid_tag)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map((e) => ({ station_id: e.station_id, timestamp: e.timestamp }));
    const distinctStations = new Set(path.map((p) => p.station_id)).size;
    return { individual_id: ind.individual_id, rfid_tag: ind.rfid_tag, path, distinctStations };
  });
}

export function computeGlobalIndividualStats(individuals: Individual[], events: WildEvent[]) {
  const porSexo = { M: 0, F: 0, desconocido: 0 };
  for (const ind of individuals) porSexo[ind.sex]++;
  const sinChipEventos = events.filter((e) => e.rfid_tag === null).length;
  return { conChip: individuals.length, sinChipEventos, porSexo };
}
