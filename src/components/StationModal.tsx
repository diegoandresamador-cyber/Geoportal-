import { useState } from "react";
import type { Sector, Station } from "../types/wildtrack";

const FOOD_TYPES = [
  "Frutas",
  "Semillas",
  "Insectos",
  "Néctar",
  "Hojarasca",
  "Mezcla omnívora",
  "Otro",
];

interface Props {
  sector: Sector;
  onClose: () => void;
  onCreate: (data: Omit<Station, "station_id">) => void;
}

export default function StationModal({ sector, onClose, onCreate }: Props) {
  const [name, setName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [status, setStatus] = useState<Station["status"]>("online");
  const [foodType, setFoodType] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "El nombre es obligatorio.";
    const latN = parseFloat(lat);
    const lngN = parseFloat(lng);
    if (isNaN(latN) || latN < -90 || latN > 90) e.lat = "Latitud inválida (−90 a 90).";
    if (isNaN(lngN) || lngN < -180 || lngN > 180) e.lng = "Longitud inválida (−180 a 180).";
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onCreate({
      name: name.trim(),
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      status,
      sector_id: sector.sector_id,
      food_type: foodType || undefined,
    });
    onClose();
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Nuevo comedero"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal">
        <div className="modal-head">
          <h3 className="modal-title">Nuevo comedero</h3>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <div className="modal-sector-badge" style={{ borderColor: sector.color, color: sector.color }}>
          Zona: {sector.name}
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-field">
            <label className="form-label">Nombre del comedero *</label>
            <input
              className="form-input"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
              placeholder="Ej. Cerezo Sector Norte"
              autoFocus
            />
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Latitud *</label>
              <input
                className="form-input"
                type="number"
                step="any"
                value={lat}
                onChange={(e) => { setLat(e.target.value); setErrors((p) => ({ ...p, lat: "" })); }}
                placeholder="6.2789"
              />
              {errors.lat && <p className="form-error">{errors.lat}</p>}
            </div>
            <div className="form-field">
              <label className="form-label">Longitud *</label>
              <input
                className="form-input"
                type="number"
                step="any"
                value={lng}
                onChange={(e) => { setLng(e.target.value); setErrors((p) => ({ ...p, lng: "" })); }}
                placeholder="-75.5012"
              />
              {errors.lng && <p className="form-error">{errors.lng}</p>}
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Tipo de alimento</label>
            <select
              className="form-select"
              value={foodType}
              onChange={(e) => setFoodType(e.target.value)}
            >
              <option value="">— Sin asignar —</option>
              {FOOD_TYPES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">Estado inicial</label>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as Station["status"])}
            >
              <option value="online">En línea</option>
              <option value="alert">En alerta</option>
              <option value="offline">Sin reportar</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-submit">Crear comedero</button>
          </div>
        </form>
      </div>
    </div>
  );
}
