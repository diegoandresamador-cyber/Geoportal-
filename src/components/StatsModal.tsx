import { useMemo, useState } from "react";
import type { Sector, Station, Individual, StationStats, WildEvent } from "../types/wildtrack";
import { computeSectorStats, computeIndividualMovements, computeGlobalIndividualStats } from "../lib/stats";

interface Props {
  sectors: Sector[];
  stations: Station[];
  individuals: Individual[];
  events: WildEvent[];
  statsById: Map<string, StationStats>;
  onClose: () => void;
  onTraceIndividual: (individualId: string) => void;
}

type Tab = "estaciones" | "sectores" | "individuos";

const SEX_LABEL: Record<Individual["sex"], string> = { M: "♂ Macho", F: "♀ Hembra", desconocido: "? Desc." };

function shortName(full: string): string {
  return full.replace(/^Estación \d+ — /, "");
}

/** Colapsa paradas repetidas seguidas (A,A,B,B,A -> A,B,A) para una etiqueta legible. */
function dedupeConsecutive(stationIds: string[]): string[] {
  const out: string[] = [];
  for (const id of stationIds) if (out[out.length - 1] !== id) out.push(id);
  return out;
}

export default function StatsModal({ sectors, stations, individuals, events, statsById, onClose, onTraceIndividual }: Props) {
  const [tab, setTab] = useState<Tab>("estaciones");

  const sectorById = useMemo(() => new Map(sectors.map((s) => [s.sector_id, s])), [sectors]);
  const individualById = useMemo(() => new Map(individuals.map((i) => [i.individual_id, i])), [individuals]);

  const stationRows = useMemo(
    () => [...stations].sort((a, b) => (statsById.get(b.station_id)?.visitas ?? 0) - (statsById.get(a.station_id)?.visitas ?? 0)),
    [stations, statsById]
  );

  const sectorRows = useMemo(
    () => sectors.map((sec) => computeSectorStats(sec, stations, statsById)).sort((a, b) => b.visitas - a.visitas),
    [sectors, stations, statsById]
  );

  const movements = useMemo(() => computeIndividualMovements(individuals, events), [individuals, events]);
  const movers = useMemo(
    () => movements.filter((m) => m.distinctStations > 1).sort((a, b) => b.distinctStations - a.distinctStations),
    [movements]
  );
  const globalInd = useMemo(() => computeGlobalIndividualStats(individuals, events), [individuals, events]);
  const totalEventos = events.length;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal-dashboard">
        <div className="modal-head">
          <div>
            <div className="sib-header-id">Resumen general</div>
            <div className="modal-title">Estadísticas de WildTrack</div>
            <div className="sib-header-sci">{stations.length} estaciones · {sectors.length} sectores · {individuals.length} individuos con chip</div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <div className="dash-body">
          <div className="filters" role="group" aria-label="Elegir vista de estadísticas" style={{ marginBottom: 16 }}>
            <button className="chip" data-active={tab === "estaciones"} onClick={() => setTab("estaciones")}>Estaciones</button>
            <button className="chip" data-active={tab === "sectores"} onClick={() => setTab("sectores")}>Sectores</button>
            <button className="chip" data-active={tab === "individuos"} onClick={() => setTab("individuos")}>Individuos</button>
          </div>

          {tab === "estaciones" && (
            <div className="contract">
              <table>
                <thead>
                  <tr>
                    <th>Estación</th><th>Sector</th><th>Visitas</th><th>Identif.</th><th>Sin ID</th><th>Peso prom.</th><th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {stationRows.map((st) => {
                    const s = statsById.get(st.station_id);
                    const sec = sectorById.get(st.sector_id);
                    return (
                      <tr key={st.station_id}>
                        <td>
                          <span className="var">{st.station_id}</span><br />
                          <span style={{ color: "var(--muted)" }}>{shortName(st.name)}</span>
                        </td>
                        <td style={{ color: sec?.color }}>{sec?.name ?? st.sector_id}</td>
                        <td>{s?.visitas ?? 0}</td>
                        <td>{s?.identificados ?? 0}</td>
                        <td className="rule">{s?.noIdentificados ?? 0}</td>
                        <td>{s?.pesoPromedio ?? 0} g</td>
                        <td>{st.status === "online" ? "En línea" : st.status === "alert" ? "Alerta" : "Sin señal"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {tab === "sectores" && (
            <div className="contract">
              <table>
                <thead>
                  <tr>
                    <th>Sector</th><th>Estaciones</th><th>Visitas</th><th>Identif.</th><th>Sin ID</th><th>% sin ID</th><th>Peso prom.</th><th>En alerta</th>
                  </tr>
                </thead>
                <tbody>
                  {sectorRows.map((row) => {
                    const sec = sectorById.get(row.sector_id);
                    const pctNoId = row.visitas > 0 ? Math.round((row.noIdentificados / row.visitas) * 100) : 0;
                    return (
                      <tr key={row.sector_id}>
                        <td style={{ color: sec?.color }}>{sec?.name ?? row.sector_id}</td>
                        <td>{row.estaciones}</td>
                        <td>{row.visitas}</td>
                        <td>{row.identificados}</td>
                        <td className="rule">{row.noIdentificados}</td>
                        <td className="rule">{pctNoId}%</td>
                        <td>{row.pesoPromedio} g</td>
                        <td>{row.alertas}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {tab === "individuos" && (
            <>
              <div className="dash-kpi-row">
                <div className="dash-kpi">
                  <div className="dash-kpi-v">{globalInd.conChip}</div>
                  <div className="dash-kpi-k">Individuos con chip</div>
                </div>
                <div className="dash-kpi">
                  <div className="dash-kpi-v">{globalInd.sinChipEventos}</div>
                  <div className="dash-kpi-k">Avistamientos sin chip</div>
                </div>
                <div className="dash-kpi">
                  <div className="dash-kpi-v">{globalInd.porSexo.M} / {globalInd.porSexo.F}</div>
                  <div className="dash-kpi-k">Machos / Hembras</div>
                </div>
                <div className="dash-kpi">
                  <div className="dash-kpi-v">{movers.length}</div>
                  <div className="dash-kpi-k">Con desplazamiento</div>
                </div>
              </div>
              <p className="mock-note" style={{ marginTop: 0, marginBottom: 18 }}>
                Los avistamientos sin chip no se pueden atribuir a un individuo concreto (no hay forma de diferenciarlos entre sí);
                se cuentan como eventos, no como animales distintos. {totalEventos > 0 && `Representan el ${Math.round((globalInd.sinChipEventos / totalEventos) * 100)}% del total de eventos.`}
              </p>

              <div className="section-label">Individuos con desplazamiento entre estaciones ({movers.length})</div>
              {movers.length === 0 ? (
                <div className="dash-empty">Ningún individuo registrado ha visitado más de una estación todavía.</div>
              ) : (
                <div className="dash-station-list">
                  {movers.map((m) => {
                    const ind = individualById.get(m.individual_id);
                    if (!ind) return null;
                    const sequence = dedupeConsecutive(m.path.map((p) => p.station_id));
                    return (
                      <div key={m.individual_id} className="mover-row">
                        <div className="mover-row-info">
                          <div className="dash-srow-id">
                            {ind.individual_id}
                            <span className="dash-srow-home">{m.distinctStations} estaciones</span>
                          </div>
                          <div className="dash-srow-name" style={{ maxWidth: "none" }}>
                            {ind.common_name} · {ind.species} · {SEX_LABEL[ind.sex]}
                          </div>
                          <div className="mover-row-path">{sequence.join(" → ")}</div>
                        </div>
                        <button className="btn-trace" onClick={() => onTraceIndividual(m.individual_id)}>
                          Ver trazabilidad en el mapa →
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
