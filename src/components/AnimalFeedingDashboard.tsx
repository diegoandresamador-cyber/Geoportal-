import type { Individual, WildEvent, Station } from "../types/wildtrack";
import { timeAgo } from "../lib/api";
import { exportEventsCsv } from "../lib/exportData";

interface Props {
  individual: Individual;
  events: WildEvent[];
  stations: Station[];
  onClose: () => void;
}

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function stationShortName(full: string): string {
  return full.replace(/^Estación \d+ — /, "");
}

export default function AnimalFeedingDashboard({ individual, events, stations, onClose }: Props) {
  const myEvents = events
    .filter((e) => e.rfid_tag === individual.rfid_tag)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const stationById = new Map(stations.map((s) => [s.station_id, s]));

  // Frecuencia por estación
  const stationCounts = new Map<string, number>();
  for (const e of myEvents) {
    stationCounts.set(e.station_id, (stationCounts.get(e.station_id) ?? 0) + 1);
  }
  const sortedStations = [...stationCounts.entries()].sort((a, b) => b[1] - a[1]);
  const maxCount = sortedStations[0]?.[1] ?? 1;
  const total = myEvents.length;

  // KPIs
  const uniqueDays = new Set(myEvents.map((e) => e.timestamp.slice(0, 10))).size;
  const avgWeight = total > 0 ? myEvents.reduce((s, e) => s + e.weight_g, 0) / total : 0;

  // Patrón semanal (lun–dom)
  const byDow = [0, 0, 0, 0, 0, 0, 0];
  for (const e of myEvents) {
    const d = new Date(e.timestamp);
    byDow[(d.getUTCDay() + 6) % 7]++;
  }
  const maxDow = Math.max(...byDow, 1);

  // Insight de preferencia
  const topEntry = sortedStations[0];
  let insight = "";
  if (total === 0) {
    insight = "Sin registros de alimentación con este chip.";
  } else if (sortedStations.length === 1) {
    insight = `Todos los registros corresponden a ${topEntry[0]}. No se han detectado desplazamientos.`;
  } else {
    const topPct = Math.round((topEntry[1] / total) * 100);
    const topName = stationById.get(topEntry[0])?.name ?? topEntry[0];
    if (topPct >= 65) {
      insight = `Preferencia marcada: el ${topPct}% de las visitas fueron en ${stationShortName(topName)}. Visita ${sortedStations.length - 1} comedero(s) adicional(es).`;
    } else if (topPct >= 45) {
      insight = `Visita frecuente a ${stationShortName(topName)} (${topPct}% de visitas) con desplazamientos a ${sortedStations.length - 1} estación(es) más.`;
    } else {
      insight = `Distribución equilibrada entre ${sortedStations.length} comederos. No presenta fidelidad marcada a ninguno.`;
    }
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal modal-dashboard">

        {/* Header */}
        <div className="modal-head">
          <div>
            <div className="sib-header-id">{individual.individual_id} · chip {individual.rfid_tag}</div>
            <div className="modal-title">Historial de alimentación — {individual.common_name}</div>
            <div className="sib-header-sci">{individual.species}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {myEvents.length > 0 && (
              <button
                className="btn-download-inline"
                title="Descargar historial de alimentación (CSV)"
                aria-label="Descargar CSV"
                onClick={() =>
                  exportEventsCsv(
                    myEvents,
                    stations,
                    [individual],
                    `wildtrack_${individual.individual_id}_historial.csv`
                  )
                }
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 16l-5-5h3V4h4v7h3l-5 5zm-6 2h12v2H6v-2z" />
                </svg>
                CSV
              </button>
            )}
            <button className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>
          </div>
        </div>

        <div className="dash-body">

          {total === 0 ? (
            <div className="dash-empty">
              <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
              <div>No hay eventos registrados con el chip <strong>{individual.rfid_tag}</strong>.</div>
              <div style={{ marginTop: 6 }}>El ejemplar aún no ha sido detectado por ninguna estación.</div>
            </div>
          ) : (
            <>
              {/* Insight de comportamiento */}
              <div className="dash-insight">
                <span className="dash-insight-icon">&#x1F4CA;</span>
                {insight}
              </div>

              {/* KPIs */}
              <div className="dash-kpi-row">
                <div className="dash-kpi">
                  <div className="dash-kpi-v">{total}</div>
                  <div className="dash-kpi-k">Alimentaciones</div>
                </div>
                <div className="dash-kpi">
                  <div className="dash-kpi-v">{sortedStations.length}</div>
                  <div className="dash-kpi-k">Estaciones</div>
                </div>
                <div className="dash-kpi">
                  <div className="dash-kpi-v">{uniqueDays}</div>
                  <div className="dash-kpi-k">Días activo</div>
                </div>
                <div className="dash-kpi">
                  <div className="dash-kpi-v">{avgWeight.toFixed(0)} g</div>
                  <div className="dash-kpi-k">Peso prom.</div>
                </div>
              </div>

              {/* Columnas: frecuencia de estaciones + patrón semanal */}
              <div className="dash-cols">

                {/* Estaciones frecuentadas */}
                <div className="dash-col">
                  <div className="section-label">Comederos visitados</div>
                  <div className="dash-station-list">
                    {sortedStations.map(([stId, count], i) => {
                      const pct = Math.round((count / total) * 100);
                      const name = stationById.get(stId)?.name ?? stId;
                      const isHome = stId === individual.station_id;
                      return (
                        <div key={stId} className="dash-srow">
                          <div className="dash-srow-label">
                            <span className="dash-srow-rank">
                              {i === 0 ? "★" : `${i + 1}.`}
                            </span>
                            <div>
                              <div className="dash-srow-id">
                                {stId}
                                {isHome && <span className="dash-srow-home">base</span>}
                              </div>
                              <div className="dash-srow-name">{stationShortName(name)}</div>
                            </div>
                          </div>
                          <div className="dash-srow-bar-wrap">
                            <div
                              className="dash-srow-bar"
                              data-top={i === 0}
                              style={{ width: `${(count / maxCount) * 100}%` }}
                            />
                          </div>
                          <div className="dash-srow-count">
                            <span className="dash-srow-n">{count}</span>
                            <span className="dash-srow-pct">{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actividad semanal */}
                <div className="dash-col">
                  <div className="section-label">Actividad semanal</div>
                  <div className="dash-dow-chart">
                    {byDow.map((v, d) => (
                      <div key={d} className="dash-dow-col">
                        <div
                          className="dash-dow-bar"
                          data-peak={v === maxDow && v > 0}
                          style={{ height: `${Math.max(3, (v / maxDow) * 72)}px` }}
                        />
                        <div className="dash-dow-lbl">{DAYS[d]}</div>
                      </div>
                    ))}
                  </div>
                  <div className="dash-dow-note">
                    Día más activo: <strong>{DAYS[byDow.indexOf(maxDow)]}</strong> ({maxDow} visitas)
                  </div>
                </div>
              </div>

              {/* Línea de tiempo */}
              <div className="section-label" style={{ marginTop: 20 }}>
                Línea de tiempo · {total > 50 ? "últimos 50 registros" : `${total} registros`}
              </div>
              <div className="dash-timeline">
                {myEvents.slice(0, 50).map((e, i) => {
                  const st = stationById.get(e.station_id);
                  return (
                    <div key={i} className="dash-ev">
                      <div className="dash-ev-station-col">
                        <div className="dash-ev-stid">{e.station_id}</div>
                        <div className="dash-ev-stname">
                          {st ? stationShortName(st.name) : e.station_id}
                        </div>
                      </div>
                      <div className="dash-ev-weight">{e.weight_g} g</div>
                      <div className="dash-ev-photo">
                        {e.photo_ref
                          ? <span className="dash-ev-has-photo">foto</span>
                          : <span className="dash-ev-no-photo">—</span>
                        }
                      </div>
                      <div className="dash-ev-ts">{timeAgo(e.timestamp)}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
