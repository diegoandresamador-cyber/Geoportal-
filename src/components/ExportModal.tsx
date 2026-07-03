import type { WildEvent, Station, Individual, Sector, StationStats } from "../types/wildtrack";
import {
  exportEventsCsv, exportEventsJson,
  exportStationsGeoJson, exportStationsCsv,
  exportIndividualsCsv, exportIndividualsJson,
} from "../lib/exportData";

interface Props {
  events: WildEvent[];
  stations: Station[];
  individuals: Individual[];
  sectors: Sector[];
  statsById: Map<string, StationStats>;
  onClose: () => void;
}

function DownloadIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M12 16l-5-5h3V4h4v7h3l-5 5zm-6 2h12v2H6v-2z" />
    </svg>
  );
}

export default function ExportModal({ events, stations, individuals, sectors, statsById, onClose }: Props) {
  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal modal-export">

        <div className="modal-head">
          <div>
            <div id="export-modal-title" className="modal-title">Exportar datos</div>
            <div className="export-subtitle">
              Descarga los registros de campo para análisis externo
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <div className="export-cards">

          {/* ── Eventos ── */}
          <div className="export-card">
            <div className="export-card-head">
              <span className="export-card-icon">📊</span>
              <div className="export-card-info">
                <div className="export-card-title">Eventos de campo</div>
                <div className="export-card-meta">
                  {events.length.toLocaleString("es-CO")} registros · sensores + RFID
                </div>
              </div>
            </div>
            <div className="export-card-desc">
              Lecturas de peso, temperatura, humedad y chip RFID de todas las
              estaciones. Incluye nombre del individuo identificado cuando aplica.
            </div>
            <div className="export-formats">
              <button
                className="btn-export"
                onClick={() => exportEventsCsv(events, stations, individuals)}
              >
                <DownloadIcon /> CSV
              </button>
              <button
                className="btn-export"
                onClick={() => exportEventsJson(events, stations, individuals)}
              >
                <DownloadIcon /> JSON
              </button>
            </div>
          </div>

          {/* ── Estaciones ── */}
          <div className="export-card">
            <div className="export-card-head">
              <span className="export-card-icon">📍</span>
              <div className="export-card-info">
                <div className="export-card-title">Catálogo de estaciones</div>
                <div className="export-card-meta">
                  {stations.length} estaciones · coordenadas + estadísticas
                </div>
              </div>
            </div>
            <div className="export-card-desc">
              Ubicaciones georreferenciadas (EPSG:4326) con estadísticas de visitas.
              GeoJSON compatible con QGIS, ArcGIS y otras plataformas SIG.
            </div>
            <div className="export-formats">
              <button
                className="btn-export btn-export-geo"
                onClick={() => exportStationsGeoJson(stations, sectors, statsById)}
              >
                <DownloadIcon /> GeoJSON
              </button>
              <button
                className="btn-export"
                onClick={() => exportStationsCsv(stations, sectors, statsById)}
              >
                <DownloadIcon /> CSV
              </button>
            </div>
          </div>

          {/* ── Individuos ── */}
          <div className="export-card">
            <div className="export-card-head">
              <span className="export-card-icon">🐾</span>
              <div className="export-card-info">
                <div className="export-card-title">Individuos registrados</div>
                <div className="export-card-meta">
                  {individuals.length} individuos · ficha completa
                </div>
              </div>
            </div>
            <div className="export-card-desc">
              Catálogo de animales con chip RFID: especie, sexo, peso estimado,
              estación de registro y notas de campo.
            </div>
            <div className="export-formats">
              <button
                className="btn-export"
                onClick={() => exportIndividualsCsv(individuals, stations)}
              >
                <DownloadIcon /> CSV
              </button>
              <button
                className="btn-export"
                onClick={() => exportIndividualsJson(individuals, stations)}
              >
                <DownloadIcon /> JSON
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
