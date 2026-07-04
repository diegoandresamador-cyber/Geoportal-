import { useEffect, useMemo, useState } from "react";
import type { Individual, Station, WildEvent } from "../types/wildtrack";
import { CONTRATO } from "../types/wildtrack";
import { timeAgo } from "../lib/api";
import { exportEventsCsv } from "../lib/exportData";
import { TAXONOMY } from "../data/taxonomy";

interface Props {
  station: Station;
  events: WildEvent[];
  individuals: Individual[];
  stations: Station[];
  onClose: () => void;
}

type VisitFilter = "todas" | "id" | "noid";

const SEX_LABEL: Record<Individual["sex"], string> = {
  M: "♂ Macho",
  F: "♀ Hembra",
  desconocido: "? Desc.",
};

function fullDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function StationVisitsModal({ station, events, individuals, stations, onClose }: Props) {
  const [filter, setFilter] = useState<VisitFilter>("todas");
  const [viewingPhoto, setViewingPhoto] = useState<{ ev: WildEvent; ind: Individual | null } | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!viewingPhoto) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); setViewingPhoto(null); }
    };
    window.addEventListener("keydown", h, true);
    return () => window.removeEventListener("keydown", h, true);
  }, [viewingPhoto]);

  const byRfid = useMemo(() => {
    const m = new Map<string, Individual>();
    for (const ind of individuals) m.set(ind.rfid_tag, ind);
    return m;
  }, [individuals]);

  const sorted = useMemo(
    () => [...events].sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [events]
  );

  const idCount = sorted.filter((e) => e.rfid_tag !== null).length;
  const noidCount = sorted.length - idCount;

  const visible = sorted.filter((e) => {
    if (filter === "id") return e.rfid_tag !== null;
    if (filter === "noid") return e.rfid_tag === null;
    return true;
  });

  const stationShort = station.name.replace(/^Estación \d+ — /, "");
  const tax = viewingPhoto?.ind ? TAXONOMY[viewingPhoto.ind.species] ?? null : null;

  return (
    <>
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal-dashboard">
        <div className="modal-head">
          <div>
            <div className="sib-header-id">{station.station_id}</div>
            <div className="modal-title">Visitas registradas — {stationShort}</div>
            <div className="sib-header-sci">{sorted.length} visita(s) · {idCount} identificadas · {noidCount} sin identificar</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {sorted.length > 0 && (
              <button
                className="btn-download-inline"
                title="Descargar visitas de esta estación (CSV)"
                aria-label="Descargar CSV"
                onClick={() => exportEventsCsv(sorted, stations, individuals, `wildtrack_${station.station_id}_visitas.csv`)}
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
          {sorted.length === 0 ? (
            <div className="dash-empty">
              <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
              <div>No hay visitas registradas en esta estación.</div>
            </div>
          ) : (
            <>
              <div className="filters" role="group" aria-label="Filtrar visitas" style={{ marginBottom: 16 }}>
                <button className="chip" data-active={filter === "todas"} onClick={() => setFilter("todas")}>Todas ({sorted.length})</button>
                <button className="chip" data-active={filter === "id"} onClick={() => setFilter("id")}>Identificadas ({idCount})</button>
                <button className="chip" data-active={filter === "noid"} onClick={() => setFilter("noid")}>Sin identificar ({noidCount})</button>
              </div>

              <div className="visit-list">
                {visible.map((ev, i) => {
                  const ind = ev.rfid_tag ? byRfid.get(ev.rfid_tag) ?? null : null;
                  const tempFlag = ev.temperature_c < CONTRATO.temperature_c.min || ev.temperature_c > CONTRATO.temperature_c.max;
                  const humFlag = ev.humidity_pct < CONTRATO.humidity_pct.min || ev.humidity_pct > CONTRATO.humidity_pct.max;
                  const dispensa = ev.weight_g < CONTRATO.weight_g.umbralDispensa;

                  return (
                    <div className="visit-card" key={`${ev.timestamp}-${i}`}>
                      <div className="visit-card-top">
                        <button
                          className="visit-photo"
                          data-has={String(!!ev.photo_ref)}
                          disabled={!ev.photo_ref}
                          onClick={() => { setViewingPhoto({ ev, ind }); setImgError(false); }}
                          title={ev.photo_ref ? "Ver foto de este registro" : "Esta visita no capturó fotografía"}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M4 5h3l1.5-2h7L17 5h3a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm8 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" />
                          </svg>
                          {ev.photo_ref ? "Foto disponible" : "Sin foto"}
                        </button>
                        <span className="visit-ts" title={ev.timestamp}>{fullDate(ev.timestamp)} · {timeAgo(ev.timestamp)}</span>
                      </div>

                      {ind ? (
                        <div className="visit-id-row">
                          <div>
                            <span className="ind-id">{ind.individual_id}</span>
                            <span className="ind-name" style={{ marginLeft: 8 }}>{ind.common_name}</span>
                            <span className="ind-sex" style={{ marginLeft: 8 }}>{SEX_LABEL[ind.sex]}</span>
                            <div className="ind-species">{ind.species}</div>
                          </div>
                          <div className="ind-chip">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                              <path d="M7 2v2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h2v2h2v-2h6v2h2v-2h2a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2zm0 6h10v8H7z"/>
                            </svg>
                            {ev.rfid_tag}
                          </div>
                        </div>
                      ) : (
                        <div className="visit-unid">Sin identificar — no se detectó chip RFID en esta visita</div>
                      )}

                      <div className="visit-metrics">
                        <div className="visit-metric">
                          <div className="visit-metric-v" data-flag={dispensa}>{ev.weight_g} g</div>
                          <div className="visit-metric-k">Peso{dispensa ? " · dispensa" : ""}</div>
                        </div>
                        <div className="visit-metric">
                          <div className="visit-metric-v" data-flag={tempFlag}>{ev.temperature_c} °C</div>
                          <div className="visit-metric-k">Temperatura</div>
                        </div>
                        <div className="visit-metric">
                          <div className="visit-metric-v" data-flag={humFlag}>{ev.humidity_pct}%</div>
                          <div className="visit-metric-k">Humedad</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="mock-note">
                Las fotografías, temperatura y humedad provienen de datos de ejemplo. Conecta MinIO y el backend en{" "}
                <code>src/lib/api.ts</code> para mostrar mediciones reales de campo.
              </p>
            </>
          )}
        </div>
      </div>
    </div>

    {viewingPhoto && (
      <div
        className="modal-overlay modal-overlay-top"
        role="dialog"
        aria-modal="true"
        onClick={(e) => { if (e.target === e.currentTarget) setViewingPhoto(null); }}
      >
        <div className="modal modal-sib">
          <div className="modal-head">
            <div>
              <div className="sib-header-id">{station.station_id} · {fullDate(viewingPhoto.ev.timestamp)}</div>
              <div className="modal-title">Registro fotográfico</div>
              <div className="sib-header-sci">{timeAgo(viewingPhoto.ev.timestamp)}</div>
            </div>
            <button className="modal-close" onClick={() => setViewingPhoto(null)} aria-label="Cerrar">×</button>
          </div>

          <div className="sib-body">
            <div className="sib-photo-wrap">
              {tax && !imgError ? (
                <img
                  src={tax.photoUrl}
                  alt={viewingPhoto.ind?.species ?? "individuo"}
                  className="sib-photo-img"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="sib-photo-placeholder">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="#2d6a4f">
                    <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z"/>
                  </svg>
                  <span>Fotografía de campo no disponible</span>
                </div>
              )}
              <div className="sib-photo-footer">
                {tax && !imgError
                  ? <span>{tax.photoCredit} — foto referencia de especie</span>
                  : <span>Conectar MinIO para la fotografía real de este registro</span>}
              </div>
            </div>

            {viewingPhoto.ind ? (
              <div className="visit-id-row" style={{ borderBottom: "none", marginBottom: 0, paddingBottom: 0 }}>
                <div>
                  <span className="ind-id">{viewingPhoto.ind.individual_id}</span>
                  <span className="ind-name" style={{ marginLeft: 8 }}>{viewingPhoto.ind.common_name}</span>
                  <span className="ind-sex" style={{ marginLeft: 8 }}>{SEX_LABEL[viewingPhoto.ind.sex]}</span>
                  <div className="ind-species">{viewingPhoto.ind.species}</div>
                </div>
                <div className="ind-chip">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                    <path d="M7 2v2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h2v2h2v-2h6v2h2v-2h2a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2zm0 6h10v8H7z"/>
                  </svg>
                  {viewingPhoto.ev.rfid_tag}
                </div>
              </div>
            ) : (
              <div className="visit-unid" style={{ borderBottom: "none", marginBottom: 0, paddingBottom: 0 }}>
                Individuo no identificado (sin chip)
              </div>
            )}

            <div className="visit-metrics" style={{ marginTop: 16 }}>
              <div className="visit-metric">
                <div className="visit-metric-v">{viewingPhoto.ev.weight_g} g</div>
                <div className="visit-metric-k">Peso</div>
              </div>
              <div className="visit-metric">
                <div className="visit-metric-v">{viewingPhoto.ev.temperature_c} °C</div>
                <div className="visit-metric-k">Temperatura</div>
              </div>
              <div className="visit-metric">
                <div className="visit-metric-v">{viewingPhoto.ev.humidity_pct}%</div>
                <div className="visit-metric-k">Humedad</div>
              </div>
            </div>

            <p className="mock-note">
              Referencia de archivo: <code>{viewingPhoto.ev.photo_ref}</code>. La fotografía real de campo se mostrará
              aquí una vez conectado el almacenamiento MinIO en <code>src/lib/api.ts</code>.
            </p>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
