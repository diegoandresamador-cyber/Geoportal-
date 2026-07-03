# WildTrack — Geoportal

Visualización del monitoreo de fauna: estaciones IoT sobre un mapa, eventos con/sin
identificación RFID y estadística descriptiva por estación (media, mediana, moda y
frecuencia de visitas).

Stack: **React + TypeScript + Vite + Leaflet**.

---

## Abrir y ejecutar (desde VS Code)

1. Abre esta carpeta en VS Code: **Archivo → Abrir carpeta… → `wildtrack-geoportal`**
2. Abre una terminal integrada (**Terminal → Nueva terminal**) y ejecuta:

   ```bash
   npm install
   npm run dev
   ```

3. Se abre solo en `http://localhost:5173`. Si no, ábrelo a mano.

Requiere Node.js 18 o superior. Verifica con `node -v`.

Otros comandos:

- `npm run build` — compila a producción en `dist/`.
- `npm run preview` — sirve el build de producción.

---

## ⚠️ Los datos son de ejemplo

Las 22 estaciones, sus eventos y todas las cifras se **generan localmente** (archivo
`src/data/stations.ts`). **No son mediciones de campo.** Sirven para que el geoportal
sea navegable mientras llega el backend real.

### Conectar el backend real (FastAPI)

1. Abre `src/lib/api.ts`.
2. Cambia `const USE_MOCK = true;` a `false`.
3. Descomenta los `fetch(...)` dentro de `fetchStations()` y `fetchEvents()` y apunta
   a tus endpoints reales (p. ej. `GET /api/stations`, `GET /api/events`).
4. Confirma las **coordenadas administradas** de cada estación con tu catálogo en
   PostGIS — las de ejemplo son aproximadas (sigue siendo un punto PENDIENTE del proyecto).

El contrato de datos (variables, rangos, umbrales) está en `src/types/wildtrack.ts` y
es el mismo que figura en la sección 5.2 del documento integrador.

---

## Estructura

```
src/
  types/wildtrack.ts     Tipos + contrato de datos (rangos y umbrales)
  data/stations.ts       DATOS MOCK — reemplazar por la API
  lib/api.ts             Capa de datos + estadística descriptiva (punto de conexión)
  components/
    Sidebar.tsx          KPIs, búsqueda, filtros, lista de estaciones
    MapView.tsx          Mapa Leaflet; marcadores proporcionales a las visitas
    DetailPanel.tsx      Panel de detalle: foto, estadística, gráfico, contrato
  App.tsx                Estado y composición
```

## Cómo leer el mapa

Cada estación es un anillo: **el tamaño** crece con el número de visitas y **el arco
ámbar** indica qué proporción de esas visitas fue de individuos sin identificar. Así se
ve dónde hay más actividad y dónde falta trazabilidad sin abrir ningún panel.
