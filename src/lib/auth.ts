// Autenticación contra el backend WildTrack (FastAPI + JWT), con modo mock
// (src/lib/config.ts: USE_MOCK) para usar el geoportal sin backend corriendo.
// La sesión activa vive en memoria (variable de módulo). Si el usuario marca
// "recordarme", además se persiste en localStorage para sobrevivir recargas
// y cierres del navegador — esta app corre como sitio local normal
// (localhost / iniciar-wildtrack.bat), no dentro de un artifact restringido,
// así que localStorage es seguro de usar aquí. Riesgo aceptado: un XSS en la
// página podría robar el token persistido mientras no haya expirado.
import { USE_MOCK } from "./config";

export const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type UserRole = "admin" | "researcher" | "field_operator";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface Session {
  token: string;
  user: User;
}

interface StoredSession extends Session {
  /** epoch ms — reflejo de expires_in del backend (24h por defecto). */
  expiresAt: number;
}

const SESSION_KEY = "wt_session";

let session: Session | null = null;

/** Se lanza cuando el backend responde 401 (token ausente, inválido o expirado). */
export class UnauthorizedError extends Error {
  constructor(message = "Sesión expirada o inválida.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

// localStorage puede lanzar (modo privado de Safari, contexto restringido):
// se ignora en silencio y la sesión sigue funcionando solo en memoria.
function persistSession(s: StoredSession): void {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch { /* no-op */ }
}

function clearPersistedSession(): void {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* no-op */ }
}

function readPersistedSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: StoredSession = JSON.parse(raw);
    if (!parsed?.token || !parsed?.expiresAt) return null;
    if (parsed.expiresAt <= Date.now()) { clearPersistedSession(); return null; }
    return parsed;
  } catch {
    return null;
  }
}

export function getSession(): User | null {
  return session?.user ?? null;
}

export function getToken(): string | null {
  return session?.token ?? null;
}

/**
 * Se llama una sola vez al montar la app para recuperar una sesión
 * "recordada" (localStorage). Devuelve null si no hay ninguna, si expiró,
 * o si el usuario nunca marcó "recordarme".
 */
export function restoreSession(): User | null {
  const stored = readPersistedSession();
  if (!stored) return null;
  session = { token: stored.token, user: stored.user };
  return stored.user;
}

export function logout(): void {
  session = null;
  clearPersistedSession();
}

export async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.message === "string") return body.message;
    if (typeof body?.detail === "string") return body.detail;
    if (Array.isArray(body?.detail) && body.detail[0]?.msg) return body.detail[0].msg;
  } catch {
    // el cuerpo no era JSON, se usa el mensaje genérico de abajo
  }
  return `Error ${res.status}`;
}

// Forma de TokenResponse (backend/modules/auth/schemas.py)
interface TokenResponsePayload {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: { id: string; name: string; email: string; role: UserRole };
}

// Establece la sesión (memoria + localStorage opcional) sin pasar por red.
// Compartido por los caminos mock de login/register.
function establishSession(token: string, user: User, remember: boolean, ttlMs: number): User {
  session = { token, user };
  if (remember) {
    persistSession({ token, user, expiresAt: Date.now() + ttlMs });
  } else {
    // Por si el dispositivo tenía una sesión recordada de un login anterior.
    clearPersistedSession();
  }
  return user;
}

export async function login(email: string, password: string, remember: boolean): Promise<User> {
  if (USE_MOCK) {
    const trimmed = email.trim();
    if (!trimmed) throw new Error("El correo es obligatorio.");
    if (!password) throw new Error("La contraseña es obligatoria.");
    const user: User = { id: "mock-user", name: trimmed.split("@")[0] || "Investigador", email: trimmed, role: "researcher" };
    return establishSession("mock-token", user, remember, 24 * 3600_000);
  }

  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));

  const data: TokenResponsePayload = await res.json();
  const user: User = { id: data.user.id, name: data.user.name, email: data.user.email, role: data.user.role };
  return establishSession(data.access_token, user, remember, data.expires_in * 1000);
}

// El registro real (backend/modules/auth/schemas.py: RegisterRequest) exige
// "document" y una contraseña con mayúscula, minúscula y dígito (min. 8
// caracteres) — restricciones que el formulario anterior (localStorage) no
// tenía. /auth/register solo devuelve el usuario creado (no un token), así
// que encadenamos un login para obtener la sesión.
export async function register(
  name: string, document: string, email: string, password: string, remember: boolean
): Promise<User> {
  if (USE_MOCK) {
    if (!name.trim()) throw new Error("El nombre es obligatorio.");
    if (!document.trim()) throw new Error("El documento es obligatorio.");
    const user: User = { id: "mock-user", name: name.trim(), email: email.trim(), role: "researcher" };
    return establishSession("mock-token", user, remember, 24 * 3600_000);
  }

  const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, document, email, password }),
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return login(email, password, remember);
}

/**
 * fetch() con Authorization: Bearer <token> automático.
 * Si el backend responde 401, limpia la sesión y lanza UnauthorizedError
 * para que la app vuelva a mostrar el formulario de login.
 */
export async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (res.status === 401) {
    logout();
    throw new UnauthorizedError();
  }
  return res;
}
