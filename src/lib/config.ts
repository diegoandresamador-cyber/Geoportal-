// Interruptor único compartido por api.ts y auth.ts.
// true  = datos y autenticación simulados, sin necesidad de backend.
// false = backend real WildTrack (FastAPI + JWT) en VITE_API_URL.
export const USE_MOCK = true;
