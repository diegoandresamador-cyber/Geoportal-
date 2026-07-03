import { useEffect, useMemo, useState, useCallback } from "react";
import type { Sector, Station, Individual, StationStats, WildEvent } from "./types/wildtrack";
import { fetchSectors, fetchStations, fetchEvents, fetchIndividuals, computeStats } from "./lib/api";
import { getSession, logout } from "./lib/auth";
import type { User } from "./lib/auth";
import Sidebar, { type FilterMode } from "./components/Sidebar";
import MapView from "./components/MapView";
import DetailPanel from "./components/DetailPanel";
import SectorModal from "./components/SectorModal";
import StationModal from "./components/StationModal";
import IndividualModal from "./components/IndividualModal";
import IndividualDetailModal from "./components/IndividualDetailModal";
import AnimalFeedingDashboard from "./components/AnimalFeedingDashboard";
import ExportModal from "./components/ExportModal";
import DeviceLinkModal from "./components/DeviceLinkModal";
import LoginPage from "./components/LoginPage";
import { exportEventsCsv } from "./lib/exportData";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getSession());

  const [sectors, setSectors] = useState<Sector[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [events, setEvents] = useState<WildEvent[]>([]);
  const [individuals, setIndividuals] = useState<Individual[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterMode>("todas");

  // Modal states
  const [sectorModalOpen, setSectorModalOpen] = useState(false);
  const [stationModalSectorId, setStationModalSectorId] = useState<string | null>(null);
  const [individualModalStationId, setIndividualModalStationId] = useState<string | null>(null);
  const [viewingIndividual, setViewingIndividual] = useState<Individual | null>(null);
  const [viewingHistory, setViewingHistory] = useState<Individual | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [deviceLinkStationId, setDeviceLinkStationId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([fetchSectors(), fetchStations(), fetchEvents(), fetchIndividuals()]).then(
      ([sec, st, ev, ind]) => {
        if (!alive) return;
        setSectors(sec);
        setStations(st);
        setEvents(ev);
        setIndividuals(ind);
      }
    );
    return () => { alive = false; };
  }, []);

  const statsById = useMemo(() => {
    const m = new Map<string, StationStats>();
    for (const st of stations) m.set(st.station_id, computeStats(st.station_id, events));
    return m;
  }, [stations, events]);

  const totals = useMemo(() => ({
    estaciones: stations.length,
    eventos: events.length,
    alertas: stations.filter((s) => s.status === "alert" || s.status === "offline").length,
  }), [stations, events]);

  const isFiltered = query.trim() !== "" || filter !== "todas";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stations.filter((st) => {
      if (q && !st.name.toLowerCase().includes(q) && !st.station_id.toLowerCase().includes(q)) return false;
      if (filter === "alerta" && st.status === "online") return false;
      if (filter === "noid") {
        const s = statsById.get(st.station_id);
        if (!s || s.noIdentificados === 0) return false;
      }
      return true;
    });
  }, [stations, query, filter, statsById]);

  const onSelect = useCallback((id: string) => setSelectedId(id), []);
  const selectedStation = stations.find((s) => s.station_id === selectedId) ?? null;
  const selectedStats = selectedId ? statsById.get(selectedId) ?? null : null;
  const selectedIndividuals = selectedId
    ? individuals.filter((i) => i.station_id === selectedId)
    : [];
  const deviceLinkStation = deviceLinkStationId
    ? stations.find((s) => s.station_id === deviceLinkStationId) ?? null
    : null;

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (deviceLinkStationId) { setDeviceLinkStationId(null); return; }
        if (exportModalOpen) { setExportModalOpen(false); return; }
        if (viewingHistory) { setViewingHistory(null); return; }
        if (viewingIndividual) { setViewingIndividual(null); return; }
        if (sectorModalOpen) { setSectorModalOpen(false); return; }
        if (stationModalSectorId) { setStationModalSectorId(null); return; }
        if (individualModalStationId) { setIndividualModalStationId(null); return; }
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [deviceLinkStationId, exportModalOpen, viewingHistory, viewingIndividual, sectorModalOpen, stationModalSectorId, individualModalStationId]);

  // --- Creación / actualización de entidades ---

  function handleCreateSector(data: Omit<Sector, "sector_id">) {
    const sector_id = `SEC-${String(sectors.length + 1).padStart(2, "0")}`;
    setSectors((prev) => [...prev, { ...data, sector_id }]);
  }

  function handleCreateStation(data: Omit<Station, "station_id">) {
    const num = stations.length + 1;
    const station_id = `EST-${String(num).padStart(2, "0")}`;
    setStations((prev) => [...prev, { ...data, station_id }]);
  }

  function handleCreateIndividual(data: Omit<Individual, "individual_id">) {
    const individual_id = `IND-${Date.now().toString().slice(-6)}`;
    setIndividuals((prev) => [...prev, { ...data, individual_id }]);
  }

  function handleLinkDevice(stationId: string, deviceId: string) {
    setStations((prev) =>
      prev.map((st) => st.station_id === stationId ? { ...st, device_id: deviceId } : st)
    );
  }

  function handleLogout() {
    logout();
    setCurrentUser(null);
  }

  const stationModalSector = stationModalSectorId
    ? sectors.find((s) => s.sector_id === stationModalSectorId) ?? null
    : null;

  // ── Pantalla de login ──────────────────────────────────────────────────────
  if (!currentUser) {
    return <LoginPage onAuth={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="app">
      <Sidebar
        sectors={sectors}
        stations={filtered}
        statsById={statsById}
        totals={totals}
        query={query}
        setQuery={setQuery}
        filter={filter}
        setFilter={setFilter}
        selectedId={selectedId}
        onSelect={onSelect}
        onAddSector={() => setSectorModalOpen(true)}
        onAddStation={(sectorId) => setStationModalSectorId(sectorId)}
        onOpenExport={() => setExportModalOpen(true)}
        onLogout={handleLogout}
        currentUser={currentUser}
        isFiltered={isFiltered}
      />
      <MapView
        stations={stations}
        statsById={statsById}
        selectedId={selectedId}
        onSelect={onSelect}
        sectors={sectors}
      />
      <DetailPanel
        station={selectedStation}
        stats={selectedStats}
        individuals={selectedIndividuals}
        onClose={() => setSelectedId(null)}
        onAddIndividual={() => setIndividualModalStationId(selectedId)}
        onViewIndividual={(ind) => setViewingIndividual(ind)}
        onLinkDevice={() => selectedId && setDeviceLinkStationId(selectedId)}
        onDownloadStation={() => {
          if (!selectedId) return;
          const stEvts = events.filter((e) => e.station_id === selectedId);
          exportEventsCsv(stEvts, stations, individuals, `wildtrack_${selectedId}_eventos.csv`);
        }}
      />

      {sectorModalOpen && (
        <SectorModal
          onClose={() => setSectorModalOpen(false)}
          onCreate={handleCreateSector}
        />
      )}

      {stationModalSector && (
        <StationModal
          sector={stationModalSector}
          onClose={() => setStationModalSectorId(null)}
          onCreate={handleCreateStation}
        />
      )}

      {individualModalStationId && selectedStation && (
        <IndividualModal
          station={selectedStation}
          onClose={() => setIndividualModalStationId(null)}
          onCreate={handleCreateIndividual}
        />
      )}

      {viewingIndividual && selectedStation && (
        <IndividualDetailModal
          individual={viewingIndividual}
          station={selectedStation}
          onClose={() => setViewingIndividual(null)}
          onViewHistory={() => {
            setViewingIndividual(null);
            setViewingHistory(viewingIndividual);
          }}
        />
      )}

      {exportModalOpen && (
        <ExportModal
          events={events}
          stations={stations}
          individuals={individuals}
          sectors={sectors}
          statsById={statsById}
          onClose={() => setExportModalOpen(false)}
        />
      )}

      {deviceLinkStation && (
        <DeviceLinkModal
          station={deviceLinkStation}
          onClose={() => setDeviceLinkStationId(null)}
          onLink={handleLinkDevice}
        />
      )}

      {viewingHistory && (
        <AnimalFeedingDashboard
          individual={viewingHistory}
          events={events}
          stations={stations}
          onClose={() => setViewingHistory(null)}
        />
      )}
    </div>
  );
}
