import type { Sector, Station, Individual, WildEvent } from "../types/wildtrack";

// ============================================================================
// DATOS DE EJEMPLO (MOCK) — REEMPLAZAR POR LA API REAL
// ============================================================================

export const SECTORS: Sector[] = [
  { sector_id: "SEC-01", name: "Norte",   color: "#0ea5e9", description: "Bello, Copacabana, Girardota, Barbosa y Palmitas" },
  { sector_id: "SEC-02", name: "Centro",  color: "#f43f5e", description: "Medellín central, Robledo, Belén, Manrique, Popular, Altavista" },
  { sector_id: "SEC-03", name: "Oriente", color: "#a855f7", description: "Parque Arví, Pan de Azúcar, Santa Elena" },
  { sector_id: "SEC-04", name: "Sur",     color: "#14b8a6", description: "Envigado, Sabaneta, Itagüí, La Estrella, Caldas, San Antonio de Prado" },
];

// Catálogo reducido a 8 estaciones (2 por sector) para las demos de clase.
// EST-07 (Envigado) es la única marcada is_live: true — la que se explica
// como "esta sí manda datos reales"; el resto se presenta como simulación.
// Para cambiar cuál es la estación en vivo, mueve is_live: true a otra entrada.
export const STATIONS: Station[] = [
  // --- Norte (SEC-01) ---
  { station_id: "EST-06", name: "Estación 06 — Bello (norte)", lat: 6.3372, lng: -75.5589, status: "online", sector_id: "SEC-01" },
  { station_id: "EST-12", name: "Estación 12 — Copacabana", lat: 6.3489, lng: -75.5089, status: "online", sector_id: "SEC-01" },
  // --- Centro (SEC-02) ---
  { station_id: "EST-01", name: "Estación 01 — Cerro El Volador", lat: 6.2614, lng: -75.5736, status: "online", sector_id: "SEC-02" },
  { station_id: "EST-02", name: "Estación 02 — Cerro Nutibara", lat: 6.2447, lng: -75.5812, status: "online", sector_id: "SEC-02" },
  // --- Oriente (SEC-03) ---
  { station_id: "EST-03", name: "Estación 03 — Parque Arví (sector)", lat: 6.2789, lng: -75.5012, status: "online", sector_id: "SEC-03" },
  { station_id: "EST-05", name: "Estación 05 — Cerro Pan de Azúcar", lat: 6.2502, lng: -75.5278, status: "online", sector_id: "SEC-03" },
  // --- Sur (SEC-04) ---
  { station_id: "EST-07", name: "Estación 07 — Envigado (sur)", lat: 6.1716, lng: -75.5912, status: "alert", sector_id: "SEC-04", is_live: true },
  { station_id: "EST-08", name: "Estación 08 — Sabaneta", lat: 6.1518, lng: -75.6166, status: "online", sector_id: "SEC-04" },
];

export const INDIVIDUALS: Individual[] = [
  // EST-01 — Cerro El Volador
  { individual_id: "IND-001", station_id: "EST-01", rfid_tag: "900215001000001", species: "Sciurus granatensis", common_name: "Ardilla cola roja", sex: "F", estimated_weight_g: 285, registration_date: "2026-01-15" },
  { individual_id: "IND-002", station_id: "EST-01", rfid_tag: "900215001000002", species: "Sciurus granatensis", common_name: "Ardilla cola roja", sex: "M", estimated_weight_g: 310, notes: "Cicatriz en oreja izquierda", registration_date: "2026-01-20" },
  { individual_id: "IND-003", station_id: "EST-01", rfid_tag: "900215001000003", species: "Didelphis marsupialis", common_name: "Zarigüeya", sex: "F", estimated_weight_g: 870, notes: "Vista con cría", registration_date: "2026-02-03" },
  // EST-02 — Cerro Nutibara
  { individual_id: "IND-004", station_id: "EST-02", rfid_tag: "900215002000001", species: "Sciurus granatensis", common_name: "Ardilla cola roja", sex: "M", estimated_weight_g: 295, registration_date: "2026-01-18" },
  { individual_id: "IND-005", station_id: "EST-02", rfid_tag: "900215002000002", species: "Didelphis marsupialis", common_name: "Zarigüeya", sex: "M", estimated_weight_g: 920, registration_date: "2026-02-10" },
  // EST-03 — Parque Arví
  { individual_id: "IND-006", station_id: "EST-03", rfid_tag: "900215003000001", species: "Coendou prehensilis", common_name: "Puercoespín", sex: "desconocido", estimated_weight_g: 2400, notes: "Animal nocturno, muy activo", registration_date: "2026-01-25" },
  { individual_id: "IND-007", station_id: "EST-03", rfid_tag: "900215003000002", species: "Sciurus granatensis", common_name: "Ardilla cola roja", sex: "F", estimated_weight_g: 270, registration_date: "2026-02-01" },
  { individual_id: "IND-008", station_id: "EST-03", rfid_tag: "900215003000003", species: "Mustela frenata", common_name: "Comadreja", sex: "M", estimated_weight_g: 185, registration_date: "2026-02-14" },
  // EST-06 — Bello Norte
  { individual_id: "IND-009", station_id: "EST-06", rfid_tag: "900215006000001", species: "Didelphis marsupialis", common_name: "Zarigüeya", sex: "F", estimated_weight_g: 760, registration_date: "2026-01-30" },
  { individual_id: "IND-010", station_id: "EST-06", rfid_tag: "900215006000002", species: "Sciurus granatensis", common_name: "Ardilla cola roja", sex: "M", estimated_weight_g: 305, registration_date: "2026-02-08" },
  // EST-07 — Envigado
  { individual_id: "IND-011", station_id: "EST-07", rfid_tag: "900215007000001", species: "Sturnira lilium", common_name: "Murciélago frutero", sex: "desconocido", estimated_weight_g: 22, notes: "Capturado en red de niebla, liberado", registration_date: "2026-02-20" },
  // EST-12 — Copacabana
  { individual_id: "IND-012", station_id: "EST-12", rfid_tag: "900215012000001", species: "Sciurus granatensis", common_name: "Ardilla cola roja", sex: "F", estimated_weight_g: 260, registration_date: "2026-03-01" },
  { individual_id: "IND-013", station_id: "EST-12", rfid_tag: "900215012000002", species: "Coendou prehensilis", common_name: "Puercoespín", sex: "F", estimated_weight_g: 2200, registration_date: "2026-03-05" },
];

// PRNG determinista (mulberry32) para que los datos no cambien entre recargas.
function rng(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fakeTag(rand: () => number): string {
  let s = "9002";
  for (let i = 0; i < 11; i++) s += Math.floor(rand() * 10);
  return s;
}

export function getMockEvents(): WildEvent[] {
  const events: WildEvent[] = [];
  const now = Date.now();

  STATIONS.forEach((st, idx) => {
    const rand = rng(idx * 7919 + 13);
    const base = st.status === "offline" ? 4 : st.status === "alert" ? 9 : 18;
    // La estación is_live simula reportes más frecuentes y recientes, para
    // que se note en la demo cuál es "la que manda datos reales".
    const count = (st.is_live ? base + 10 : base) + Math.floor(rand() * 14);

    for (let i = 0; i < count; i++) {
      const identified = rand() > 0.42;
      const hoursAgo = st.is_live ? Math.floor(rand() * 3) : Math.floor(rand() * 24 * 7);
      const ts = new Date(now - hoursAgo * 3600_000).toISOString();

      events.push({
        station_id: st.station_id,
        rfid_tag: identified ? fakeTag(rand) : null,
        weight_g: Math.round((20 + rand() * 120) * 10) / 10,
        temperature_c: Math.round((14 + rand() * 16) * 10) / 10,
        humidity_pct: Math.round(45 + rand() * 40),
        photo_ref: rand() > 0.1 ? `minio://events/${st.station_id}/${ts}.jpg` : null,
        proximity_triggered: true,
        timestamp: ts,
      });
    }
  });

  // Eventos entre estaciones para individuos registrados con chip real.
  // Permiten rastrear en qué comederos se ha alimentado cada ejemplar.
  INDIVIDUALS.forEach((ind, idx) => {
    const rand = rng(idx * 4999 + 1337);
    const numEvents = 5 + Math.floor(rand() * 9); // 5–13 eventos por individuo
    const online = STATIONS.filter((s) => s.status !== "offline");

    // Incluir estación registrada + 1–3 adicionales (movimiento entre comederos)
    const visited = new Set<string>([ind.station_id]);
    const numExtra = 1 + Math.floor(rand() * 3);
    for (let j = 0; j < numExtra * 5 && visited.size < numExtra + 1; j++) {
      visited.add(online[Math.floor(rand() * online.length)].station_id);
    }
    const visitedArr = [...visited];

    for (let i = 0; i < numEvents; i++) {
      const stId = visitedArr[Math.floor(rand() * visitedArr.length)];
      const hoursAgo = Math.floor(rand() * 24 * 14); // últimas 2 semanas
      const ts = new Date(now - hoursAgo * 3600_000).toISOString();
      const base = ind.estimated_weight_g ?? 80;
      const minW = Math.max(5, base * 0.5);
      const maxW = Math.min(499, base * 1.05);
      const weight = Math.round((minW + rand() * (maxW - minW)) * 10) / 10;

      events.push({
        station_id: stId,
        rfid_tag: ind.rfid_tag,
        weight_g: weight,
        temperature_c: Math.round((14 + rand() * 16) * 10) / 10,
        humidity_pct: Math.round(45 + rand() * 40),
        photo_ref: rand() > 0.2 ? `minio://events/${stId}/${ts}.jpg` : null,
        proximity_triggered: true,
        timestamp: ts,
      });
    }
  });

  return events;
}
