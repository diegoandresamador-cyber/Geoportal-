import { useState } from "react";
import type { Individual, Station } from "../types/wildtrack";
import { TAXONOMY, IUCN_COLOR } from "../data/taxonomy";

interface Props {
  individual: Individual;
  station: Station;
  onClose: () => void;
  onViewHistory?: () => void;
}

const SEX_FULL: Record<Individual["sex"], string> = {
  M: "Macho", F: "Hembra", desconocido: "Desconocido",
};

// Rows usadas en cada sección de la ficha
function Row({ field, value, mono }: { field: string; value: string; mono?: boolean }) {
  return (
    <div className="sib-row">
      <span className="sib-field">{field}</span>
      <span className={mono ? "sib-val sib-mono" : "sib-val"}>{value || "—"}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="sib-section-title">{children}</div>;
}

export default function IndividualDetailModal({ individual, station, onClose, onViewHistory }: Props) {
  const tax = TAXONOMY[individual.species] ?? null;
  const [imgError, setImgError] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const locality = station.name.replace(/^Estación \d+ — /, "");

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal-sib">

        {/* Header */}
        <div className="modal-head">
          <div>
            <div className="sib-header-id">{individual.individual_id}</div>
            <div className="modal-title">{individual.common_name}</div>
            <div className="sib-header-sci">{individual.species}</div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <div className="sib-body">

          {/* Acceso rápido al historial de alimentación */}
          {onViewHistory && (
            <div className="dash-history-btn-wrap">
              <button className="dash-history-btn" onClick={onViewHistory}>
                <span className="dash-history-btn-icon">&#x1F4CA;</span>
                Ver historial de alimentación entre estaciones
              </button>
            </div>
          )}

          {/* Foto de referencia de la especie */}
          <div className="sib-photo-wrap">
            {tax && !imgError ? (
              <img
                src={tax.photoUrl}
                alt={`${individual.species} — ${individual.common_name}`}
                className="sib-photo-img"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="sib-photo-placeholder">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="#2d6a4f">
                  <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z"/>
                </svg>
                <span>Foto de campo no disponible</span>
              </div>
            )}
            <div className="sib-photo-footer">
              {tax && !imgError
                ? <><span>{tax.photoCredit} — Foto referencia de especie</span></>
                : <span>Conectar MinIO para fotografías de campo</span>}
              {tax && (
                <span
                  className="sib-iucn-badge"
                  style={{ background: IUCN_COLOR[tax.iucnStatus] ?? "#5f7669" }}
                  title={`IUCN: ${tax.iucnLabel}`}
                >
                  IUCN {tax.iucnStatus}
                </span>
              )}
            </div>
          </div>

          {/* Sección 1: Clasificación taxonómica */}
          <SectionTitle>Clasificación taxonómica · Darwin Core</SectionTitle>
          <div className="sib-grid-2">
            <Row field="kingdom" value={tax?.kingdom ?? "Animalia"} />
            <Row field="phylum" value={tax?.phylum ?? "Chordata"} />
            <Row field="class" value={tax?.class_ ?? "Mammalia"} />
            <Row field="order" value={tax?.order ?? "—"} />
            <Row field="family" value={tax?.family ?? "—"} />
            <Row field="genus" value={tax?.genus ?? individual.species.split(" ")[0]} />
          </div>
          <Row field="specificEpithet" value={tax?.specificEpithet ?? individual.species.split(" ")[1] ?? "—"} />
          <Row field="scientificName" value={individual.species} />
          <Row field="scientificNameAuthorship" value={tax?.scientificNameAuthorship ?? "—"} />
          <Row field="vernacularName" value={individual.common_name} />
          <Row field="taxonRank" value="SPECIES" />
          <Row field="nomenclaturalCode" value="ICZN" />

          {/* Sección 2: Registro del individuo */}
          <SectionTitle>Registro del individuo · Occurrence</SectionTitle>
          <Row field="occurrenceID" value={individual.individual_id} mono />
          <Row field="catalogNumber (RFID)" value={individual.rfid_tag} mono />
          <Row field="basisOfRecord" value="MachineObservation" />
          <Row field="sex" value={`${SEX_FULL[individual.sex]} (${individual.sex})`} />
          <Row field="lifeStage" value="unknown" />
          <Row field="individualCount" value="1" />
          {individual.estimated_weight_g && (
            <Row field="bodyMassInGrams" value={`${individual.estimated_weight_g} g`} />
          )}
          <Row field="eventDate" value={individual.registration_date} />
          <Row field="recordedBy" value="WildTrack Biomonitoring System" />
          {individual.notes && (
            <Row field="occurrenceRemarks" value={individual.notes} />
          )}

          {/* Sección 3: Georreferencia */}
          <SectionTitle>Georreferencia · Location</SectionTitle>
          <div className="sib-grid-2">
            <Row field="decimalLatitude" value={station.lat.toFixed(6)} mono />
            <Row field="decimalLongitude" value={station.lng.toFixed(6)} mono />
          </div>
          <Row field="geodeticDatum" value="WGS84" />
          <Row field="coordinateUncertaintyInMeters" value="10" />
          <Row field="country" value="Colombia" />
          <Row field="countryCode" value="CO" />
          <Row field="stateProvince" value="Antioquia" />
          <Row field="municipality" value="Valle de Aburrá" />
          <Row field="locality" value={locality} />
          <Row field="verbatimLocality" value={station.name} />
          <Row field="locationRemarks" value={`Estación de biomonitoreo ${station.station_id}`} />

          {/* Sección 4: Institución y licencia */}
          <SectionTitle>Institución · Record-level</SectionTitle>
          <Row field="institutionCode" value="WildTrack" />
          <Row field="collectionCode" value="BIOMONIT-ABR" />
          <Row field="datasetName" value="WildTrack Geoportal — Monitoreo de Fauna Urbana, AMVA" />
          <Row field="rightsHolder" value="WildTrack / AMVA" />
          <Row field="license" value="CC BY-NC 4.0" />
          <Row field="modified" value={today} />

          <p className="sib-note">
            Ficha generada conforme al estándar <strong>Darwin Core</strong> (TDWG) y los lineamientos del
            <strong> SIB Colombia</strong>. Los datos de campo provienen del sistema de monitoreo WildTrack
            con lectores RFID ISO 11784. Foto: referencia de especie (no fotografía de campo).
          </p>
        </div>
      </div>
    </div>
  );
}
