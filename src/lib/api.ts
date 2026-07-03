import type { Sector, Station, Individual, StationStats, WildEvent } from "../types/wildtrack";
import { SECTORS, STATIONS, INDIVIDUALS, getMockEvents } from "../data/stations";

// ============================================================================
// CAPA DE ACCESO A DATOS
// Hoy devuelve datos mock. Aquí es donde se conecta el backend FastAPI real.
// ============================================================================

const USE_MOCK = true; // <-- pon en false cuando exista el backend

export async function fetchSectors(): Promise<Sector[]> {
  if (USE_MOCK) return SECTORS;
  // const res = await fetch("/api/sectors");
  // return res.json();
  return SECTORS;
}

export async function fetchStations(): Promise<Station[]> {
  if (USE_MOCK) return STATIONS;
  // const res = await fetch("/api/stations");
  // return res.json();
  return STATIONS;
}

export async function fetchEvents(): Promise<WildEvent[]> {
  if (USE_MOCK) return getMockEvents();
  // const res = await fetch("/api/events");
  // return res.json();
  return getMockEvents();
}

export async function fetchIndividuals(): Promise<Individual[]> {
  if (USE_MOCK) return INDIVIDUALS;
  // const res = await fetch("/api/individuals");
  // return res.json();
  return INDIVIDUALS;
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
