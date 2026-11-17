// Tipos del Archivo Histórico y las 4 dimensiones de inmersión.
//
// Eder: "toma la información del archivo histórico directamente de la
// tabla CMS... y acomódala en orden cronológico" — los 16 casos del
// corpus del TFG (antes una lista fija en este archivo) ahora se leen
// en vivo de la pestaña "Archivo histórico" de la hoja de CMS (ver
// src/lib/cms.ts, función fetchArchivoHistorico, y claude/cms-estela.md
// para la estructura exacta de esa pestaña) — este archivo ya no
// guarda los casos en sí, solo los TIPOS que describen su forma
// (CasoDeEstudio, usado por FichaCard.tsx/FichaLightbox.tsx) y las 4
// dimensiones de inmersión, que sí son fijas (vienen de un artículo
// académico citado, no de la hoja de Eder).
export type DimensionInmersion =
  | "representacional"
  | "participativa"
  | "afectiva"
  | "narrativa";

export type CasoDeEstudio = {
  /** "C-01".."C-16", tal como aparece en la píldora superior de la ficha. */
  codigo: string;
  /** Título del caso. Un solo elemento (sin saltos de línea a mano,
   * a diferencia de cuando este archivo tenía los 16 casos escritos a
   * mano): el texto viene de una celda de la hoja, así que se deja que
   * el ajuste de línea natural del navegador haga el trabajo. */
  titulo: string[];
  /** Ámbito (Científico/Militar, Experimental/Diseño, etc.) — texto de la
   * píldora de encabezado ("firm-label"). */
  ambito: string;
  /** Autor/firma · periodo · lugar. */
  subtitulo: string;
  descripcion: string;
  tecnologia: string;
  contexto: string;
  fase: string;
  tipoUsuario: string;
  dimensiones: Record<DimensionInmersion, boolean>;
  /** URL completa de la imagen (ya publicada en el sitio — ver "Imagen
   * (URL)" en la pestaña Archivo histórico de la hoja de CMS). */
  imagen: string;
};

export type DimensionInfo = {
  id: DimensionInmersion;
  etiqueta: string;
  definicion: string;
  queImplica: string;
  ideaClave: string;
};

// Transcrito de la tabla "Dimensiones de la experiencia inmersiva"
// (Balcerak Jackson, 2024) que Eder adjuntó como referencia — es el
// contenido exacto que debe aparecer en el popover de cada burbuja.
export const DIMENSIONES_INMERSION: DimensionInfo[] = [
  {
    id: "representacional",
    etiqueta: "Representacional",
    definicion: "Construcción de un mundo coherente a nivel perceptivo y cognitivo.",
    queImplica: "Percepción del entorno, coherencia espacial, comprensión del mundo.",
    ideaClave: "La inmersión depende de la coherencia del mundo representado.",
  },
  {
    id: "participativa",
    etiqueta: "Participativa",
    definicion: "Grado en que el usuario actúa como agente dentro del entorno.",
    queImplica: "Acción, interacción, movimiento, toma de decisiones.",
    ideaClave: "La experiencia se construye mediante la acción.",
  },
  {
    id: "afectiva",
    etiqueta: "Afectiva",
    definicion: "Nivel de involucramiento emocional del usuario.",
    queImplica: "Emoción, empatía, respuesta emocional.",
    ideaClave: "La inmersión ocurre cuando hay respuesta emocional.",
  },
  {
    id: "narrativa",
    etiqueta: "Narrativa",
    definicion: "Grado en que la experiencia se organiza como una secuencia con sentido.",
    queImplica: "Historia, continuidad, significado.",
    ideaClave: "La inmersión surge al ser absorbido por una historia.",
  },
];
