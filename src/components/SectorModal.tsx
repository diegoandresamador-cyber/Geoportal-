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
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0].hex);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("El nombre del sector es obligatorio."); return; }
    onCreate({ name: name.trim(), description: description.trim() || undefined, color });
    onClose();
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Nuevo sector">
      <div className="modal">
        <div className="modal-head">
          <h3 className="modal-title">Nuevo sector</h3>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-field">
            <label className="form-label">Nombre del sector *</label>
            <input
              className="form-input"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="Ej. Norte, Cuenca Media…"
              autoFocus
            />
          </div>
          <div className="form-field">
            <label className="form-label">Descripción (opcional)</label>
            <input
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Municipios o área que cubre…"
            />
          </div>
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
            <button type="submit" className="btn-submit">Crear sector</button>
          </div>
        </form>
      </div>
    </div>
  );
}
