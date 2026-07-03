import { useState } from "react";
import type { Sector } from "../types/wildtrack";

const PRESET_COLORS = [
  { hex: "#3b82f6", label: "Azul" },
  { hex: "#f59e0b", label: "Ámbar" },
  { hex: "#10b981", label: "Verde" },
  { hex: "#8b5cf6", label: "Violeta" },
  { hex: "#ef4444", label: "Rojo" },
  { hex: "#ec4899", label: "Rosa" },
];

interface Props {
  onClose: () => void;
  onCreate: (data: Omit<Sector, "sector_id">) => void;
}

export default function SectorModal({ onClose, onCreate }: Props) {
  const [name, setName] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [pais, setPais] = useState("Colombia");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0].hex);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("El nombre de la zona es obligatorio."); return; }
    const latN = lat ? parseFloat(lat) : undefined;
    const lngN = lng ? parseFloat(lng) : undefined;
    if (lat && (isNaN(latN!) || latN! < -90 || latN! > 90)) {
      setError("Latitud inválida (−90 a 90)."); return;
    }
    if (lng && (isNaN(lngN!) || lngN! < -180 || lngN! > 180)) {
      setError("Longitud inválida (−180 a 180)."); return;
    }
    onCreate({
      name: name.trim(),
      color,
      description: description.trim() || undefined,
      municipio: municipio.trim() || undefined,
      ciudad: ciudad.trim() || undefined,
      pais: pais.trim() || undefined,
      lat: latN,
      lng: lngN,
    });
    onClose();
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Nueva zona"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal modal-lg">
        <div className="modal-head">
          <h3 className="modal-title">Nueva zona</h3>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          {/* Nombre */}
          <div className="form-field">
            <label className="form-label">Nombre de la zona *</label>
            <input
              className="form-input"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="Ej. Árboles Parque Norte, Cuenca Media…"
              autoFocus
            />
          </div>

          {/* Ubicación */}
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Municipio</label>
              <input
                className="form-input"
                value={municipio}
                onChange={(e) => setMunicipio(e.target.value)}
                placeholder="Bello, Medellín…"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Ciudad</label>
              <input
                className="form-input"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                placeholder="Medellín"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="form-label">País</label>
              <input
                className="form-input"
                value={pais}
                onChange={(e) => setPais(e.target.value)}
                placeholder="Colombia"
              />
            </div>
            <div className="form-field" />
          </div>

          {/* Coordenadas del centroide */}
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Latitud <span className="form-hint">(opcional)</span></label>
              <input
                className="form-input"
                type="number"
                step="any"
                value={lat}
                onChange={(e) => { setLat(e.target.value); setError(""); }}
                placeholder="6.2789"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Longitud <span className="form-hint">(opcional)</span></label>
              <input
                className="form-input"
                type="number"
                step="any"
                value={lng}
                onChange={(e) => { setLng(e.target.value); setError(""); }}
                placeholder="-75.5012"
              />
            </div>
          </div>

          {/* Descripción */}
          <div className="form-field">
            <label className="form-label">Descripción</label>
            <input
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Área que cubre, notas de campo…"
            />
          </div>

          {/* Color */}
          <div className="form-field">
            <label className="form-label">Color identificador</label>
            <div className="color-swatches">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  className="color-swatch"
                  style={{ background: c.hex }}
                  data-active={color === c.hex}
                  onClick={() => setColor(c.hex)}
                  aria-label={c.label}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-submit">Crear zona</button>
          </div>
        </form>
      </div>
    </div>
  );
}
