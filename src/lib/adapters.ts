// Adaptadores backend -> tipos del geoportal (src/types/wildtrack.ts).
// Los tipos de wildtrack.ts no se modifican: toda la traducción/pérdida de
// información entre el modelo real (WildTrack FastAPI) y el modelo del
// geoportal ocurre aquí, en el borde.
import type { Individual, Sector, Station } from "../types/wildtrack";
import { TAXONOMY } from "../data/taxonomy";

export interface PaginatedDto<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

// ---- Zones (backend/modules/zones/schemas.py: ZoneRead) ----
export interface ZoneReadDto {
  id: string;
  name: string;
  municipality: string | null;
  city: string;
  country: string;
  altitude: number | null;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
}

// Paleta usada porque ZoneRead no tiene campo "color" (no existe en el
// backend). Se asigna de forma determinista a partir del id para que el
// color de cada zona sea estable entre recargas.
const ZONE_COLOR_PALETTE = ["#0ea5e9", "#f43f5e", "#a855f7", "#14b8a6", "#eab308", "#22c55e", "#f97316", "#6366f1"];

function colorForZoneId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return ZONE_COLOR_PALETTE[hash % ZONE_COLOR_PALETTE.length];
}

export function zoneToSector(zone: ZoneReadDto): Sector {
  return {
    // El backend no tiene un código humano tipo "SEC-01" para zonas, solo UUID.
    sector_id: zone.id,
    name: zone.name,
    color: colorForZoneId(zone.id),
    municipio: zone.municipality ?? undefined,
    ciudad: zone.city,
    pais: zone.country,
    lat: zone.latitude,
    lng: zone.longitude,
  };
}

// ---- Stations (backend/modules/stations/schemas.py: StationRead) ----
export type BackendStationStatus = "active" | "inactive" | "maintenance" | "offline";

export interface StationReadDto {
  id: string;
  code: string;
  name: string;
  zone_id: string;
  latitude: number;
  longitude: number;
  status: BackendStationStatus;
  created_at: string;
  updated_at: string;
}

// El backend no tiene un estado "alert" en StationStatus (solo
// active/inactive/maintenance/offline); las alertas son un recurso aparte
// (GET /api/v1/alerts?resolved=false, ver fetchStations en api.ts). Una
// estación se marca "alert" si tiene al menos una alerta sin resolver.
// inactive/maintenance colapsan a "offline": no hay un tercer estado en la UI
// y es preferible subrepresentar disponibilidad que afirmar "online" sin serlo.
function mapStationStatus(status: BackendStationStatus, hasUnresolvedAlert: boolean): Station["status"] {
  if (hasUnresolvedAlert) return "alert";
  return status === "active" ? "online" : "offline";
}

export function stationToStation(station: StationReadDto, unresolvedAlertStationIds: Set<string>): Station {
  return {
    station_id: station.code,
    name: station.name,
    lat: station.latitude,
    lng: station.longitude,
    status: mapStationStatus(station.status, unresolvedAlertStationIds.has(station.id)),
    sector_id: station.zone_id,
    // food_type / device_id viven en /station_foods y /devices (tablas de
    // unión aparte, no en StationRead) — no se resuelven en esta pasada.
  };
}

// ---- Alerts (backend/modules/alerts/schemas.py: AlertRead) ----
export interface AlertReadDto {
  alert_id: string;
  alert_type: string;
  station_id: string | null;
  device_id: string | null;
  event_id: string | null;
  message: string;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

// ---- Animals (backend/modules/animals/schemas.py: AnimalRead) ----
export type BackendAnimalSex = "male" | "female" | "unknown";

export interface AnimalReadDto {
  id: string;
  rfid_tag: string | null;
  species: string;
  sex: BackendAnimalSex;
  estimated_age: string | null;
  is_identified: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const SEX_MAP: Record<BackendAnimalSex, Individual["sex"]> = {
  male: "M",
  female: "F",
  unknown: "desconocido",
};

// GET /animals/{id}/stations existe pero hoy es un stub que siempre
// devuelve stations: [] (backend/modules/animals/service.py, comentario
// "MongoDB query deferred to Slice 6" — la ingesta de iot_events todavía no
// alimenta esa relación). Llamarlo por cada animal sería un N+1 que hoy
// siempre vuelve vacío, así que no se invoca: station_id queda vacío hasta
// que el backend implemente esa relación real.
//
// Se asume que solo animales con rfid_tag (llamador filtra is_identified/
// rfid_tag !== null) llegan aquí — "Individual" en el geoportal siempre
// significa "animal con chip registrado".
export function animalToIndividual(animal: AnimalReadDto): Individual {
  const tax = TAXONOMY[animal.species];
  return {
    individual_id: animal.id,
    station_id: "",
    rfid_tag: animal.rfid_tag ?? "",
    species: animal.species,
    common_name: tax?.commonName ?? animal.species,
    sex: SEX_MAP[animal.sex],
    notes: animal.notes ?? undefined,
    registration_date: animal.created_at.slice(0, 10),
  };
}
