import { useState } from "react";
import type { Station } from "../types/wildtrack";

interface Props {
  station: Station;
  onClose: () => void;
  onLink: (stationId: string, deviceId: string) => void;
}

export default function DeviceLinkModal({ station, onClose, onLink }: Props) {
  const [deviceId, setDeviceId] = useState(station.device_id ?? "");
  const [error, setError] = useState("");

  const isLinked = !!station.device_id;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!deviceId.trim()) { setError("El código del dispositivo es obligatorio."); return; }
    onLink(station.station_id, deviceId.trim());
    onClose();
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal">
        <div className="modal-head">
          <div>
            <div className="modal-title">
              {isLinked ? "Reconfigurar dispositivo" : "Enlazar con ESP32"}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
              {station.station_id} · {station.name.replace(/^Estación \d+ — /, "")}
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        {isLinked && (
          <div className="device-linked-badge">
            <span className="device-linked-dot" />
            Enlazado actualmente: <code>{station.device_id}</code>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-field">
            <label className="form-label">Código del dispositivo ESP32 *</label>
            <input
              className="form-input form-mono"
              value={deviceId}
              onChange={(e) => { setDeviceId(e.target.value); setError(""); }}
              placeholder="ESP32-XXXX  o  AA:BB:CC:DD:EE:FF"
              autoFocus
            />
            <span style={{ fontSize: 11, color: "var(--muted-2)", marginTop: 4, display: "block" }}>
              Encuéntralo en la pantalla OLED del dispositivo o en el monitor serial (Arduino IDE).
            </span>
          </div>

          <div className="device-help-box">
            <div className="device-help-title">¿Cómo obtener el código?</div>
            <ol className="device-help-list">
              <li>Enciende el ESP32 y abre el monitor serial a 115200 baud.</li>
              <li>Busca la línea <code>Device ID:</code> en la salida.</li>
              <li>Copia el código y pégalo aquí.</li>
            </ol>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-submit">
              {isLinked ? "Actualizar enlace" : "Enlazar dispositivo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
