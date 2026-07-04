import type { Sector, Station, Individual, StationStats, WildEvent } from "../types/wildtrack";
import { SECTORS, STATIONS, INDIVIDUALS, getMockEvents } from "../data/stations";
import { authFetch, extractErrorMessage } from "./auth";
import { USE_MOCK } from "./config";
import {
  animalToIndividual, stationToStation, zoneToSector,
  type AlertReadDto, type AnimalReadDto, type PaginatedDto, type StationReadDto, type ZoneReadDto,
} from "./adapters";

// ============================================================================
// CAPA DE ACCESO A DATOS
// USE_MOCK (src/lib/config.ts) = false conecta al backend real (ver
// src/lib/adapters.ts para el mapeo de modelos). fetchEvents() se queda en
// mock siempre, independientemente del flag: no existe ningún endpoint REST
// de eventos en el backend — ver nota en esa función.
// ============================================================================

async function getJson<T>(path: string): Promise<T> {
  const res = await authFetch(path);
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
}

export async function fetchSectors(): Promise<Sector[]> {
  if (USE_MOCK) return SECTORS;
  const data = await getJson<PaginatedDto<ZoneReadDto>>("/api/v1/zones?page_size=100");
  return data.items.map(zoneToSector);
}

export async function fetchStations(): Promise<Station[]> {
  if (USE_MOCK) return STATIONS;

  const [stationsPage, alertsPage] = await Promise.all([
    getJson<PaginatedDto<StationReadDto>>("/api/v1/stations?page_size=100"),
    getJson<PaginatedDto<AlertReadDto>>("/api/v1/alerts?resolved=false&page_size=100"),
  ]);

  const unresolvedAlertStationIds = new Set(
    alertsPage.items.map((a) => a.station_id).filter((id): id is string => id !== null)
  );

  return stationsPage.items.map((st) => stationToStation(st, unresolvedAlertStationIds));
}

export async function fetchEvents(): Promise<WildEvent[]> {
  // No existe ningún router para iot_events en el backend (modules/iot_events
  // solo tiene schemas.py/service.py/processor.py — es el consumidor MQTT que
  // escribe a MongoDB, ver app/lifespan.py). app/main.py no registra un
  // router de eventos: no hay GET /api/v1/events ni equivalente. No se
  // inventa el endpoint; se mantiene siempre en datos de ejemplo hasta que
  // el backend exponga una lectura real.
  return getMockEvents();
}

export async function fetchIndividuals(): Promise<Individual[]> {
  if (USE_MOCK) return INDIVIDUALS;

  const data = await getJson<PaginatedDto<AnimalReadDto>>("/api/v1/animals?page_size=100");
  // "Individual" en el geoportal = animal con chip. Los animales sin
  // rfid_tag (is_identified=false) no tienen ficha propia, quedan
  // representados solo como eventos anónimos (cuando existan).
  return data.items
    .filter((a) => a.rfid_tag !== null)
    .map(animalToIndividual);
}

// --------- Estadística descriptiva (media, mediana, moda, frecuencia) --------

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function mode(nums: number[]): number {
  if (!nums.length) return 0;
  const bins = new Map<number, number>();
  for (const n of nums) {
    const b = Math.round(n / 10) * 10;
    bins.set(b, (bins.get(b) ?? 0) + 1);
  }
  let best = nums[0];
  let bestCount = -1;
  for (const [b, c] of bins) if (c > bestCount) { best = b; bestCount = c; }
  return best;
}

export function computeStats(stationId: string, events: WildEvent[]): StationStats {
  const evs = events.filter((e) => e.station_id === stationId);
  const pesos = evs.map((e) => e.weight_g);
  const identificados = evs.filter((e) => e.rfid_tag !== null).length;

  const visitasPorDia = [0, 0, 0, 0, 0, 0, 0];
  let ultima: string | null = null;
  for (const e of evs) {
    const d = new Date(e.timestamp);
    const day = (d.getUTCDay() + 6) % 7;
    visitasPorDia[day]++;
    if (!ultima || e.timestamp > ultima) ultima = e.timestamp;
  }

  const avg = pesos.length ? pesos.reduce((a, b) => a + b, 0) / pesos.length : 0;

  return {
    station_id: stationId,
    visitas: evs.length,
    identificados,
    noIdentificados: evs.length - identificados,
    pesoPromedio: Math.round(avg * 10) / 10,
    pesoMediana: Math.round(median(pesos) * 10) / 10,
    pesoModa: mode(pesos),
    ultimaVisita: ultima,
    visitasPorDia,
  };
}

export function timeAgo(iso: string | null): string {
  if (!iso) return "sin registros";
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600_000);
  if (h < 1) return "hace menos de 1 h";
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}
