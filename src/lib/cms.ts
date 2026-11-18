/**
 * Eder: "yo te he conectado a la tabla CMS del proyecto... necesito que
 * esté hecho de manera que si yo modifico algo, se actualice en la
 * página" — este archivo es lo que hace eso posible.
 *
 * La hoja de Google Sheets (ver claude/cms-estela.md en el proyecto) está
 * compartida como "cualquiera con el enlace puede ver", así que CUALQUIER
 * visitante del sitio publicado puede leerla directo desde su navegador,
 * sin que vos ni ellos tengan que iniciar sesión en Google. Para eso se
 * usa el endpoint "gviz" de Google (el mismo mecanismo que usan los
 * gráficos en vivo de Google Sheets embebidos en otras páginas) en vez
 * del botón normal de "Exportar a CSV": ese botón normal SÍ funciona
 * para descargar el archivo a mano, pero el navegador bloquea que el
 * código de OTRO sitio (el nuestro, corriendo en github.io) lo lea por
 * seguridad (política de "CORS") — el endpoint gviz sí lo permite,
 * porque Google lo diseñó justo para eso.
 *
 * Cada vez que alguien abre la página de Workflows, el navegador pide
 * esta hoja de nuevo — por eso un cambio tuyo en la hoja (agregar un
 * video, marcar/desmarcar "Publicado", corregir un título) se refleja
 * solo, sin que yo tenga que tocar el código ni subir nada a GitHub.
 */

import type { CasoDeEstudio } from "@/data/casos-de-estudio";

const SPREADSHEET_ID = "1dndj_LlbvZDz0fQu0CQfdDnIQfAFfrO2SOPrTR4so1Y";

export type WorkflowVideo = {
  id: string;
  titulo: string;
  youtubeUrl: string;
  youtubeId: string | null;
  programa: string;
  nivel: string;
  perfilPc: string;
  flujo: string;
  paso: number;
  duracionMin: number;
  descripcion: string;
};

export type ListasOptions = {
  programa: string[];
  nivel: string[];
  perfilPc: string[];
};

// Celdas de una fila gviz: cada una es `{v: valorCrudo, f: valorFormateado}`
// o `null` si está vacía. Preferimos `.f` (el texto ya formateado, tal
// como se ve en la hoja) sobre `.v` (el valor crudo) para texto — así
// evitamos el formato especial que gviz usa internamente para fechas
// (algo como "Date(2026,10,16)") y mostramos lo mismo que ve Eder en la
// hoja.
type GvizCell = { v: unknown; f?: string } | null;

function cellText(cell: GvizCell): string {
  if (!cell) return "";
  if (typeof cell.f === "string" && cell.f.length > 0) return cell.f.trim();
  return cell.v != null ? String(cell.v).trim() : "";
}

function cellNumber(cell: GvizCell): number {
  if (!cell) return 0;
  const n = Number(cell.v);
  return Number.isFinite(n) ? n : 0;
}

function cellBool(cell: GvizCell): boolean {
  if (!cell) return false;
  if (cell.v === true) return true;
  return String(cell.v).trim().toUpperCase() === "TRUE";
}

/**
 * Pide una hoja/rango por el endpoint gviz y devuelve las filas ya
 * separadas en celdas (sin la envoltura `google.visualization.Query.
 * setResponse(...)` que Google le pone alrededor del JSON — un resabio
 * de cuando este endpoint se usaba solo para gráficos JSONP).
 *
 * `headers=0` le dice a Google que NO intente adivinar cuál fila es el
 * encabezado — nosotros ya sabemos exactamente qué columna es cada cosa
 * (ver cms-estela.md) y empezamos el `range` directo en la primera fila
 * de datos reales, así que cualquier intento de "adivinar" el
 * encabezado de parte de Google solo estorba.
 */
async function fetchGvizRows(sheetName: string, range: string): Promise<GvizCell[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(
    sheetName,
  )}&range=${encodeURIComponent(range)}&headers=0`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`No se pudo leer la hoja "${sheetName}" (status ${res.status})`);
  }
  const text = await res.text();
  const start = text.indexOf("(");
  const end = text.lastIndexOf(")");
  if (start === -1 || end === -1) {
    throw new Error(`Respuesta inesperada de Google Sheets para "${sheetName}"`);
  }
  const data = JSON.parse(text.slice(start + 1, end)) as {
    table?: { rows?: { c: GvizCell[] }[] };
  };
  return (data.table?.rows ?? []).map((row) => row.c ?? []);
}

/**
 * Pestaña "Tutoriales" (ver cms-estela.md): fila 3 = encabezados, datos
 * desde la fila 4. Columnas A–L: ID, Título, Fecha, URL de YouTube,
 * Programa, Nivel, Perfil de PC, Flujo, Paso, Duración (min),
 * Descripción, Publicado. Solo se devuelven las filas con ID y con
 * "Publicado" marcado — igual que ya hace el resto del sitio con esa
 * misma columna.
 */
export async function fetchTutoriales(): Promise<WorkflowVideo[]> {
  const rows = await fetchGvizRows("Tutoriales", "A4:L500");
  const videos: WorkflowVideo[] = [];

  for (const row of rows) {
    const id = cellText(row[0]);
    if (!id) continue; // fila vacía (la hoja deja muchas filas en blanco listas para usar)
    const publicado = cellBool(row[11]);
    if (!publicado) continue;

    const youtubeUrl = cellText(row[3]);
    videos.push({
      id,
      titulo: cellText(row[1]),
      youtubeUrl,
      youtubeId: extractYouTubeId(youtubeUrl),
      programa: cellText(row[4]),
      nivel: cellText(row[5]),
      perfilPc: cellText(row[6]),
      flujo: cellText(row[7]) || id, // si un video no tiene flujo asignado, queda solo (cadena de un solo punto)
      paso: cellNumber(row[8]) || 1,
      duracionMin: cellNumber(row[9]),
      descripcion: cellText(row[10]),
    });
  }

  return videos;
}

/**
 * Pestaña "Listas" (fila 1 = encabezados, datos desde la fila 2):
 * Programa, Nivel, Perfil de PC son las primeras 3 columnas — los
 * valores que alimentan los filtros de esta página. Eder: "para
 * agregar un programa, nivel... nuevo, escribirlo en Listas y aparece
 * en los desplegables" (ver cms-estela.md) — esta función es la que
 * cumple esa promesa para la página de Workflows.
 */
export async function fetchListas(): Promise<ListasOptions> {
  const rows = await fetchGvizRows("Listas", "A2:C500");
  const programa = new Set<string>();
  const nivel = new Set<string>();
  const perfilPc = new Set<string>();

  for (const row of rows) {
    const p = cellText(row[0]);
    const n = cellText(row[1]);
    const pc = cellText(row[2]);
    if (p) programa.add(p);
    if (n) nivel.add(n);
    if (pc) perfilPc.add(pc);
  }

  return {
    programa: Array.from(programa),
    nivel: Array.from(nivel),
    perfilPc: Array.from(perfilPc),
  };
}

export function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1) || null;
    const v = u.searchParams.get("v");
    if (v) return v;
    const embedMatch = u.pathname.match(/\/embed\/([^/?]+)/);
    if (embedMatch) return embedMatch[1];
    const shortsMatch = u.pathname.match(/\/shorts\/([^/?]+)/);
    if (shortsMatch) return shortsMatch[1];
    return null;
  } catch {
    return null;
  }
}

/**
 * Pestaña "Archivo histórico" (sheetId=1). Fila 1 = encabezados, datos
 * desde la fila 2. Columnas A–U: ID, Año, Periodo, Título, Categoría,
 * Ámbito, Autor o institución, Lugar, Descripción, Tecnología, Contexto
 * de aplicación, Fase del proceso, Tipo de usuario, Representacional,
 * Participativa, Afectiva, Narrativa, Imagen (URL), Fuente (APA 7),
 * Enlace, Publicado (ver claude/cms-estela.md para el detalle completo).
 *
 * "Categoría", "Fuente (APA 7)" y "Enlace" existen en la hoja pero
 * ningún componente del sitio los usa todavía (la ficha actual no cita
 * fuente ni distingue categoría) — no se leen acá; agregarlos más
 * adelante es solo sumar una línea a este mapeo, la hoja ya los tiene.
 *
 * Eder: "acomódala en orden cronológico" — el orden se resuelve ACÁ
 * (por la columna Año, ascendente) antes de devolver los casos, así
 * cualquier componente que use este resultado ya los recibe en el
 * orden correcto.
 */
export async function fetchArchivoHistorico(): Promise<CasoDeEstudio[]> {
  const rows = await fetchGvizRows("Archivo histórico", "A2:U200");

  const conAnio: { anio: number; caso: CasoDeEstudio }[] = [];

  for (const row of rows) {
    const codigo = cellText(row[0]);
    if (!codigo) continue;
    if (!cellBool(row[20])) continue; // Publicado

    const autor = cellText(row[6]);
    const periodo = cellText(row[2]);
    const lugar = cellText(row[7]);

    conAnio.push({
      anio: cellNumber(row[1]),
      caso: {
        codigo,
        titulo: [cellText(row[3])],
        ambito: cellText(row[5]),
        periodo,
        subtitulo: [autor, lugar].filter(Boolean).join(" · "),
        descripcion: cellText(row[8]),
        tecnologia: cellText(row[9]),
        contexto: cellText(row[10]),
        fase: cellText(row[11]),
        tipoUsuario: cellText(row[12]),
        dimensiones: {
          representacional: cellBool(row[13]),
          participativa: cellBool(row[14]),
          afectiva: cellBool(row[15]),
          narrativa: cellBool(row[16]),
        },
        imagen: cellText(row[17]),
      },
    });
  }

  // Cronológico ascendente por Año (Periodo conserva el texto de la
  // ficha; Año es el número puro que define el orden).
  conAnio.sort((a, b) => a.anio - b.anio);
  return conAnio.map((c) => c.caso);
}

