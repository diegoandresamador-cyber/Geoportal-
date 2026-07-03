export interface User {
  user_id: string;
  name: string;
  email: string;
}

interface StoredUser extends User {
  password: string;
}

const USERS_KEY = "wt_users";
const SESSION_KEY = "wt_session";

function getStoredUsers(): StoredUser[] {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]"); }
  catch { return []; }
}

export function register(name: string, email: string, password: string): User {
  const users = getStoredUsers();
  if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("Ya existe una cuenta con ese correo.");
  }
  const user: StoredUser = {
    user_id: `USR-${Date.now()}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
  };
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
  const session: User = { user_id: user.user_id, name: user.name, email: user.email };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function login(email: string, password: string): User {
  const users = getStoredUsers();
  const found = users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
  );
  if (!found) throw new Error("Correo o contraseña incorrectos.");
  const session: User = { user_id: found.user_id, name: found.name, email: found.email };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession(): User | null {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null"); }
  catch { return null; }
}
