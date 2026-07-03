import { useState } from "react";
import type { Individual, Station } from "../types/wildtrack";

const SPECIES_OPTIONS = [
  { value: "Sciurus granatensis", label: "Ardilla cola roja (Sciurus granatensis)" },
  { value: "Didelphis marsupialis", label: "Zarigüeya (Didelphis marsupialis)" },
  { value: "Coendou prehensilis", label: "Puercoespín (Coendou prehensilis)" },
  { value: "Mustela frenata", label: "Comadreja (Mustela frenata)" },
  { value: "Sturnira lilium", label: "Murciélago frutero (Sturnira lilium)" },
  { value: "Cebus capucinus", label: "Mono cariblanco (Cebus capucinus)" },
  { value: "Colibri coruscans", label: "Colibrí (Colibri coruscans)" },
  { value: "Otra", label: "Otra especie…" },
];

interface Props {
  station: Station;
  onClose: () => void;
  onCreate: (data: Omit<Individual, "individual_id">) => void;
}

export default function IndividualModal({ station, onClose, onCreate }: Props) {
  const [rfid, setRfid] = useState("");
  const [species, setSpecies] = useState(SPECIES_OPTIONS[0].value);
  const [customSpecies, setCustomSpecies] = useState("");
  const [commonName, setCommonName] = useState("");
  const [sex, setSex] = useState<Individual["sex"]>("desconocido");
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isCustomSpecies = species === "Otra";

  function validate() {
    const e: Record<string, string> = {};
    const rfidClean = rfid.replace(/\s/g, "");
    if (!/^\d{15}$/.test(rfidClean)) e.rfid = "El chip debe tener exactamente 15 dígitos numéricos.";
    if (isCustomSpecies && !customSpecies.trim()) e.species = "Ingresa el nombre de la especie.";
    if (!commonName.trim()) e.commonName = "El nombre común es obligatorio.";
    if (weight && (isNaN(Number(weight)) || Number(weight) <= 0)) e.weight = "Peso inválido.";
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onCreate({
      station_id: station.station_id,
      rfid_tag: rfid.replace(/\s/g, ""),
      species: isCustomSpecies ? customSpecies.trim() : species,
      common_name: commonName.trim(),
      sex,
      estimated_weight_g: weight ? Number(weight) : undefined,
      notes: notes.trim() || undefined,
      registration_date: new Date().toISOString().slice(0, 10),
    });
    onClose();
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Nuevo individuo">
      <div className="modal modal-lg">
        <div className="modal-head">
          <h3 className="modal-title">Registrar individuo</h3>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <div className="modal-sector-badge" style={{ borderColor: "#52b788", color: "#52b788" }}>
          Estación: {station.station_id} — {station.name.replace(/^Estación \d+ — /, "")}
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-field">
            <label className="form-label">Etiqueta RFID / chip * <span className="form-hint">(15 dígitos ISO 11784)</span></label>
            <input
              className="form-input form-mono"
              value={rfid}
              onChange={(e) => { setRfid(e.target.value); setErrors((p) => ({ ...p, rfid: "" })); }}
              placeholder="900215001000001"
              maxLength={15}
              autoFocus
            />
            {errors.rfid && <p className="form-error">{errors.rfid}</p>}
          </div>
          <div className="form-field">
            <label className="form-label">Especie *</label>
            <select
              className="form-select"
              value={species}
              onChange={(e) => { setSpecies(e.target.value); setErrors((p) => ({ ...p, species: "" })); }}
            >
              {SPECIES_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          {isCustomSpecies && (
            <div className="form-field">
              <label className="form-label">Nombre científico de la especie *</label>
              <input
                className="form-input"
                value={customSpecies}
                onChange={(e) => { setCustomSpecies(e.target.value); setErrors((p) => ({ ...p, species: "" })); }}
                placeholder="Género especie"
              />
              {errors.species && <p className="form-error">{errors.species}</p>}
            </div>
          )}
          <div className="form-field">
            <label className="form-label">Nombre común *</label>
            <input
              className="form-input"
              value={commonName}
              onChange={(e) => { setCommonName(e.target.value); setErrors((p) => ({ ...p, commonName: "" })); }}
              placeholder="Ej. Ardilla, Zarigüeya…"
            />
            {errors.commonName && <p className="form-error">{errors.commonName}</p>}
          </div>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Sexo</label>
              <select className="form-select" value={sex} onChange={(e) => setSex(e.target.value as Individual["sex"])}>
                <option value="desconocido">Desconocido</option>
                <option value="M">Macho</option>
                <option value="F">Hembra</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Peso estimado (g)</label>
              <input
                className="form-input"
                type="number"
                min="0"
                value={weight}
                onChange={(e) => { setWeight(e.target.value); setErrors((p) => ({ ...p, weight: "" })); }}
                placeholder="285"
              />
              {errors.weight && <p className="form-error">{errors.weight}</p>}
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">Observaciones (opcional)</label>
            <textarea
              className="form-input form-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Marcas físicas, comportamiento, condición…"
              rows={3}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-submit">Registrar individuo</button>
          </div>
        </form>
      </div>
    </div>
  );
}
