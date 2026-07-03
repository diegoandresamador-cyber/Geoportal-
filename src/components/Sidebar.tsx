import { useState } from "react";
import type { Sector, Station, StationStats } from "../types/wildtrack";

export type FilterMode = "todas" | "alerta" | "noid";

interface Props {
  sectors: Sector[];
  stations: Station[];
  statsById: Map<string, StationStats>;
  totals: { estaciones: number; eventos: number; alertas: number };
  query: string;
  setQuery: (q: string) => void;
  filter: FilterMode;
  setFilter: (f: FilterMode) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddSector: () => void;
  onAddStation: (sectorId: string) => void;
  onOpenExport: () => void;
  isFiltered: boolean;
}

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 12 12" fill="none"
      style={{ flexShrink: 0, transition: "transform 0.2s", transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
    >
      <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Sidebar({
  sectors, stations, statsById, totals, query, setQuery, filter, setFilter,
  selectedId, onSelect, onAddSector, onAddStation, onOpenExport, isFiltered,
}: Props) {
  // All sectors start expanded; toggling adds/removes the sector_id from this set
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  function toggleSector(sectorId: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(sectorId) ? next.delete(sectorId) : next.add(sectorId);
      return next;
    });
  }

  const stationsBySector = new Map<string, Station[]>();
  for (const st of stations) {
    const arr = stationsBySector.get(st.sector_id) ?? [];
    arr.push(st);
    stationsBySector.set(st.sector_id, arr);
  }

  const visibleSectors = isFiltered
    ? sectors.filter((sec) => (stationsBySector.get(sec.sector_id)?.length ?? 0) > 0)
    : sectors;

  return (
    <aside className="sidebar">
      <div className="brand">
        <h1><span className="dot" /> WildTrack</h1>
        <p>Geoportal de monitoreo de fauna · Valle de Aburrá</p>
      </div>

      <div className="kpis">
        <div className="kpi"><div className="num">{totals.estaciones}</div><div className="lbl">Estaciones</div></div>
        <div className="kpi"><div className="num">{totals.eventos}</div><div className="lbl">Eventos</div></div>
        <div className="kpi alert"><div className="num">{totals.alertas}</div><div className="lbl">Alertas</div></div>
      </div>

      <div className="controls">
        <input
          className="search"
          placeholder="Buscar estación…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar estación"
        />
        <div className="filters" role="group" aria-label="Filtrar estaciones">
          <button className="chip" data-active={filter === "todas"} onClick={() => setFilter("todas")}>Todas</button>
          <button className="chip" data-active={filter === "alerta"} onClick={() => setFilter("alerta")}>En alerta</button>
          <button className="chip" data-active={filter === "noid"} onClick={() => setFilter("noid")}>Sin identificar</button>
        </div>

        {/* Leyenda de viñetas de estado */}
        <div className="status-legend">
          <span className="legend-title">Estado de estaciones:</span>
          <span className="legend-item"><span className="st-status" data-s="online" style={{ display: "inline-block" }} />En línea</span>
          <span className="legend-item"><span className="st-status" data-s="alert" style={{ display: "inline-block" }} />Alerta</span>
          <span className="legend-item"><span className="st-status" data-s="offline" style={{ display: "inline-block" }} />Sin señal</span>
        </div>
      </div>

      <div className="station-list">
        <div className="sector-toolbar">
          <span className="sector-toolbar-label">{sectors.length} sector{sectors.length !== 1 ? "es" : ""}</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className="btn-add-sector"
              onClick={() => {
                // collapse all / expand all toggle
                if (collapsed.size === visibleSectors.length) {
                  setCollapsed(new Set());
                } else {
                  setCollapsed(new Set(visibleSectors.map((s) => s.sector_id)));
                }
              }}
              title={collapsed.size === visibleSectors.length ? "Expandir todos" : "Colapsar todos"}
            >
              <span>{collapsed.size === visibleSectors.length ? "▼" : "▲"}</span>
              {collapsed.size === visibleSectors.length ? "Expandir" : "Colapsar"}
            </button>
            <button className="btn-add-sector" onClick={onAddSector} title="Nuevo sector">
              <span>+</span> Sector
            </button>
          </div>
        </div>

        {visibleSectors.length === 0 && (
          <div className="empty">Ninguna estación coincide con el filtro.</div>
        )}

        {visibleSectors.map((sec) => {
          const secStations = stationsBySector.get(sec.sector_id) ?? [];
          const isCollapsed = collapsed.has(sec.sector_id);

          return (
            <div key={sec.sector_id} className="sector-group">
              {/* Sector header — clic en toda la fila despliega/pliega */}
              <button
                className="sector-header sector-toggle"
                onClick={() => toggleSector(sec.sector_id)}
                aria-expanded={!isCollapsed}
                aria-label={`${isCollapsed ? "Expandir" : "Colapsar"} sector ${sec.name}`}
              >
                <ChevronIcon collapsed={isCollapsed} />
                <span className="sector-color-dot" style={{ background: sec.color }} />
                <span className="sector-name">{sec.name}</span>
                <span className="sector-desc" title={sec.description}>
                  {secStations.length} est.
                </span>
                <button
                  className="btn-add-station"
                  onClick={(e) => { e.stopPropagation(); onAddStation(sec.sector_id); }}
                  title={`Nueva estación en ${sec.name}`}
                  aria-label={`Agregar estación al sector ${sec.name}`}
                >
                  +
                </button>
              </button>

              {/* Estaciones — ocultas cuando el sector está colapsado */}
              {!isCollapsed && (
                <>
                  {secStations.length === 0 && !isFiltered && (
                    <div className="sector-empty">Sin estaciones — usa + para agregar</div>
                  )}
                  {secStations.map((st) => {
                    const s = statsById.get(st.station_id);
                    return (
                      <button
                        key={st.station_id}
                        className="st-row"
                        data-active={st.station_id === selectedId}
                        style={{ "--sector-color": sec.color } as React.CSSProperties}
                        onClick={() => onSelect(st.station_id)}
                      >
                        <span className="st-status" data-s={st.status} />
                        <span className="st-main">
                          <span className="st-name">{st.name.replace(/^Estación \d+ — /, "")}</span>
                          <span className="st-sub">{st.station_id} · {s?.noIdentificados ?? 0} sin ID</span>
                        </span>
                        <span className="st-count">{s?.visitas ?? 0}</span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="sidebar-footer">
        <button className="btn-export-global" onClick={onOpenExport}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 16l-5-5h3V4h4v7h3l-5 5zm-6 2h12v2H6v-2z" />
          </svg>
          Exportar datos
        </button>
      </div>
    </aside>
  );
}
