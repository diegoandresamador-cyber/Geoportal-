// Tipos del dominio WildTrack.
// Derivados directamente del "Contrato de datos" (sección 5.2 del documento integrador):
// variable, tipo, unidad, rango válido, umbral/acción.

/** Un evento registrado por una estación. Refleja el payload MQTT del firmware. */
export interface WildEvent {
  /** ID de una de las estaciones del catálogo (ver src/data/stations.ts). */
  station_id: string;
  /** 15 dígitos ISO 11784. null => "individuo no identificado" (el evento se guarda igual). */
  rfid_tag: string | null;
  /** Gramos, 0–500. Umbral: < 50 g dispara el dispensado automático. */
  weight_g: number;
  /** °C, rango DHT11 -10 a 50. Fuera de rango => lectura sospechosa. */
  temperature_c: number;
  /** %, rango DHT11 20–90. Fuera de rango => lectura sospechosa. */
  humidity_pct: number;
  /** Referencia a la imagen en MinIO. null => evento incompleto (se guarda igual). */
  photo_ref: string | null;
  /** El sensor de proximidad disparó el ciclo de lectura. */
  proximity_triggered: boolean;
  /** ISO 8601 UTC, asignado por el backend al recibir el evento. */
  timestamp: string;
}

/** Zona geográfica que agrupa estaciones. */
export interface Sector {
  sector_id: string;
  name: string;
  /** Color HEX para identificar el sector en la UI. */
  color: string;
  description?: string;
  municipio?: string;
  ciudad?: string;
  pais?: string;
  /** Coordenadas del centroide de la zona (EPSG:4326). */
  lat?: number;
  lng?: number;
}

/** Una estación de alimentación. Coordenadas administradas (no GPS del equipo). */
export interface Station {
  station_id: string;
  /** Nombre legible para el operador. */
  name: string;
  /** Coordenadas administrativas fijas (lat, lng) en EPSG:4326. */
  lat: number;
  lng: number;
  /** Estado operativo derivado del último reporte. */
  status: "online" | "alert" | "offline";
  /** Sector al que pertenece la estación. */
  sector_id: string;
  /** Tipo de alimento que se suministra en este comedero. */
  food_type?: string;
  /** Código o MAC del dispositivo ESP32 enlazado. */
  device_id?: string;
  /** Estación real usada en la demo de clase (envía datos reales); el resto son simulación. */
  is_live?: boolean;
}

/** Animal registrado en una estación con chip RFID. */
export interface Individual {
  individual_id: string;
  station_id: string;
  /** Etiqueta RFID ISO 11784, 15 dígitos. */
  rfid_tag: string;
  /** Nombre científico de la especie. */
  species: string;
  /** Nombre común. */
  common_name: string;
  sex: "M" | "F" | "desconocido";
  estimated_weight_g?: number;
  notes?: string;
  registration_date: string;
}

/** Estadística descriptiva por estación (simplificación acordada: sin Moran/variograma). */
export interface StationStats {
  station_id: string;
  visitas: number;
  identificados: number;
  noIdentificados: number;
  pesoPromedio: number;
  pesoMediana: number;
  pesoModa: number;
  ultimaVisita: string | null;
  /** Frecuencia de visitas por día de la semana (lun..dom), para el mini-gráfico. */
  visitasPorDia: number[];
}

/** Rangos válidos del contrato de datos, para validar lecturas en la UI. */
export const CONTRATO = {
  weight_g: { min: 0, max: 500, umbralDispensa: 50, unidad: "g" },
  temperature_c: { min: -10, max: 50, unidad: "°C" },
  humidity_pct: { min: 20, max: 90, unidad: "%" },
} as const;
