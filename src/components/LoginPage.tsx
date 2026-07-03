import { useState } from "react";
import { login, register } from "../lib/auth";
import type { User } from "../lib/auth";

interface Props {
  onAuth: (user: User) => void;
}

export default function LoginPage({ onAuth }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  function reset() {
    setName(""); setEmail(""); setPassword(""); setConfirm(""); setError("");
  }

  function switchMode(m: "login" | "register") {
    setMode(m);
    reset();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (mode === "register") {
        if (!name.trim()) { setError("El nombre es obligatorio."); return; }
        if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
        if (password !== confirm) { setError("Las contraseñas no coinciden."); return; }
        onAuth(register(name.trim(), email.trim(), password));
      } else {
        onAuth(login(email.trim(), password));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    }
  }

  return (
    <div className="login-page">
      {/* Branding */}
      <div className="login-brand">
        <div className="login-brand-dot" />
        <h1 className="login-brand-title">WildTrack</h1>
        <p className="login-brand-sub">Geoportal de monitoreo de fauna</p>
        <p className="login-brand-desc">
          Plataforma IoT para el seguimiento de individuos con chip RFID
          en estaciones de alimentación inteligentes. Valle de Aburrá, Colombia.
        </p>
        <div className="login-brand-chips">
          <span className="login-chip">📡 IoT</span>
          <span className="login-chip">🗺 SIG</span>
          <span className="login-chip">🐾 RFID</span>
        </div>
      </div>

      {/* Card */}
      <div className="login-card">
        <div className="login-tabs">
          <button
            className="login-tab"
            data-active={mode === "login"}
            onClick={() => switchMode("login")}
          >
            Iniciar sesión
          </button>
          <button
            className="login-tab"
            data-active={mode === "register"}
            onClick={() => switchMode("register")}
          >
            Crear cuenta
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="form-field">
              <label className="form-label">Nombre completo *</label>
              <input
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                autoFocus
              />
            </div>
          )}

          <div className="form-field">
            <label className="form-label">Correo electrónico *</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              autoFocus={mode === "login"}
              required
            />
          </div>

          <div className="form-field">
            <label className="form-label">Contraseña *</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "register" ? "Mínimo 6 caracteres" : "Tu contraseña"}
              required
            />
          </div>

          {mode === "register" && (
            <div className="form-field">
              <label className="form-label">Confirmar contraseña *</label>
              <input
                className="form-input"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repite la contraseña"
              />
            </div>
          )}

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn-submit login-submit">
            {mode === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>
      </div>
    </div>
  );
}
