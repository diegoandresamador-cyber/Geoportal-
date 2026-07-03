import type { Individual, Station, StationStats } from "../types/wildtrack";
import { CONTRATO } from "../types/wildtrack";
import { timeAgo } from "../lib/api";

interface Props {
  station: Station | null;
  stats: StationStats | null;
  individuals: Individual[];
  onClose: () => void;
  onAddIndividual: () => void;
  onViewIndividual: (ind: Individual) => void;
  onDownloadStation: () => void;
}

const DIAS = ["L", "M", "X", "J", "V", "S", "D"];

const SEX_LABEL: Record<Individual["sex"], string> = {
  M: "♂ Macho",
  F: "♀ Hembra",
  desconocido: "? Desc.",
};

export default function DetailPanel({ station, stats, individuals, onClose, onAddIndividual, onViewIndividual, onDownloadStation }: Props) {
  const open = !!station && !!stats;
  const peak = stats ? Math.max(...stats.visitasPorDia) : 0;
  const lastIdentified = stats ? stats.identificados > 0 : false;

  return (
    <div className="detail" data-open={open} aria-hidden={!open}>
      {station && stats && (
        <>
          <div className="detail-head">
            <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 6 }}>
              <button
                className="btn-download-inline"
                onClick={onDownloadStation}
                title="Descargar eventos de esta estación (CSV)"
                aria-label="Descargar eventos CSV"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 16l-5-5h3V4h4v7h3l-5 5zm-6 2h12v2H6v-2z" />
                </svg>
                CSV
              </button>
              <button className="close" onClick={onClose} aria-label="Cerrar panel">×</button>
            </div>
            <div className="eyebrow">{station.station_id}</div>
            <h2>{station.name.replace(/^Estación \d+ — /, "")}</h2>
            <div className="meta">
              Última visita {timeAgo(stats.ultimaVisita)} · estado{" "}
              {station.status === "online" ? "en línea" : station.status === "alert" ? "en alerta" : "sin reportar"}
            </div>
          </div>

          <div className="detail-body">
            <div className="photo">
              <span className="ph-tag" data-id={lastIdentified}>
                {lastIdentified ? "último: identificado" : "último: no identificado"}
              </span>
              <span className="ph-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="#95d5b2">
                  <path d="M12 2a3 3 0 0 1 3 3c0 1.7-1.3 3-3 3S9 6.7 9 5a3 3 0 0 1 3-3zM5 8a2.5 2.5 0 0 1 2.5 2.5C7.5 12 6.4 13 5 13s-2.5-1-2.5-2.5A2.5 2.5 0 0 1 5 8zm14 0a2.5 2.5 0 0 1 2.5 2.5C21.5 12 20.4 13 19 13s-2.5-1-2.5-2.5A2.5 2.5 0 0 1 19 8zM12 10c2.8 0 5 3 5 5.5 0 1.9-1.6 2.5-5 2.5s-5-.6-5-2.5C7 13 9.2 10 12 10z"/>
                </svg>
              </span>
              <span className="ph-label">Foto del último evento (placeholder)</span>
            </div>

            <div className="stats-grid">
              <div className="stat"><div className="v">{stats.visitas}</div><div className="k">Visitas</div></div>
              <div className="stat"><div className="v">{stats.pesoPromedio} g</div><div className="k">Peso prom.</div></div>
              <div className="stat"><div className="v">{stats.pesoMediana} g</div><div className="k">Mediana</div></div>
            </div>
            <div className="split">
              <div className="stat id"><div className="v">{stats.identificados}</div><div className="k">Identificados</div></div>
              <div className="stat noid"><div className="v">{stats.noIdentificados}</div><div className="k">Sin identificar</div></div>
            </div>

            {/* ── Individuos registrados ── */}
            <div className="section-label" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>Individuos con chip ({individuals.length})</span>
              <button className="btn-add-individual" onClick={onAddIndividual} title="Registrar nuevo individuo">
                + Registrar
              </button>
            </div>

            {individuals.length === 0 ? (
              <div className="ind-empty">
                Ningún individuo registrado en esta estación.
                <br />
                <button className="ind-empty-btn" onClick={onAddIndividual}>+ Registrar primer individuo</button>
              </div>
            ) : (
              <div className="individuals-list">
                {individuals.map((ind) => (
                  <button
                    key={ind.individual_id}
                    className="individual-card ind-clickable"
                    onClick={() => onViewIndividual(ind)}
                    title="Ver ficha SIB"
                  >
                    <div className="ind-header">
                      <span className="ind-id">{ind.individual_id}</span>
                      <span className="ind-sex">{SEX_LABEL[ind.sex]}</span>
                    </div>
                    <div className="ind-name">{ind.common_name}</div>
                    <div className="ind-species">{ind.species}</div>
                    <div className="ind-chip">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                        <path d="M7 2v2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h2v2h2v-2h6v2h2v-2h2a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2zm0 6h10v8H7z"/>
                      </svg>
                      {ind.rfid_tag}
                    </div>
                    {ind.estimated_weight_g && (
                      <div className="ind-meta">{ind.estimated_weight_g} g · {ind.registration_date}</div>
                    )}
                    {ind.notes && <div className="ind-notes">{ind.notes}</div>}
                    <div className="ind-ficha-hint">Ver ficha SIB →</div>
                  </button>
                ))}
              </div>
            )}

            <div className="section-label">Frecuencia de visitas por día</div>
            <div className="bars" role="img" aria-label="Visitas por día de la semana">
              {stats.visitasPorDia.map((v, i) => (
                <div className="bar-col" key={i} data-peak={v === peak && peak > 0}>
                  <div className="bar" style={{ height: `${peak ? (v / peak) * 100 : 0}%` }} title={`${v} visitas`} />
                  <div className="bar-lbl">{DIAS[i]}</div>
                </div>
              ))}
            </div>

            <div className="section-label">Contrato de datos (resumen)</div>
            <div className="contract">
              <table>
                <thead>
                  <tr><th>Variable</th><th>Rango</th><th>Umbral</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="var">weight_g</td>
                    <td>{CONTRATO.weight_g.min}–{CONTRATO.weight_g.max} g</td>
                    <td className="rule">&lt; {CONTRATO.weight_g.umbralDispensa} g → dispensa</td>
                  </tr>
                  <tr>
                    <td className="var">temperature_c</td>
                    <td>{CONTRATO.temperature_c.min} a {CONTRATO.temperature_c.max} °C</td>
                    <td className="rule">fuera → sospechosa</td>
                  </tr>
                  <tr>
                    <td className="var">humidity_pct</td>
                    <td>{CONTRATO.humidity_pct.min}–{CONTRATO.humidity_pct.max} %</td>
                    <td className="rule">fuera → sospechosa</td>
                  </tr>
                  <tr>
                    <td className="var">rfid_tag</td>
                    <td>15 díg. ISO 11784</td>
                    <td className="rule">null → no identificado</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mock-note">
              Las cifras provienen de datos de ejemplo generados localmente, no de mediciones de campo.
              Para mostrar datos reales, conecta el backend en <code>src/lib/api.ts</code>.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
