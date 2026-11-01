import { withBase } from "@/lib/withBase";
// Los 16 casos de estudio del corpus del TFG (Capítulo 4, "Del objeto al
// entorno"), condensados para la ficha visual de la sección "Casos de
// Estudio". El contenido de cada campo proviene del documento
// "01_Arquitectura en transición..." (Bloque A: C-01 a C-08, casos varios;
// Bloque B: C-09 a C-16, casos pensados desde la arquitectura), resumido a
// la extensión que cabe en una ficha de 500x750 y sin las secciones que el
// TFG usa solo para su propio criterio interno (Viabilidad en UCR,
// Relevancia para el TFG, Nota de análisis) — ver ficha_C11_v2.html, el
// diseño de referencia que este archivo alimenta junto con FichaCard.tsx.
export type DimensionInmersion =
  | "representacional"
  | "participativa"
  | "afectiva"
  | "narrativa";

export type CasoDeEstudio = {
  /** "C-01".."C-16", tal como aparece en la píldora superior de la ficha. */
  codigo: string;
  /** Título del caso, partido en líneas para el mismo control manual de
   * salto de línea que usaba ficha_C11_v2.html (un <br> a mano). */
  titulo: string[];
  /** Ámbito (Científico/Militar, Experimental/Diseño, etc.) — texto de la
   * píldora de encabezado ("firm-label"). */
  ambito: string;
  /** Autor/firma · año · lugar. */
  subtitulo: string;
  descripcion: string;
  tecnologia: string;
  contexto: string;
  fase: string;
  tipoUsuario: string;
  dimensiones: Record<DimensionInmersion, boolean>;
  /** Ruta bajo /public/casos. */
  imagen: string;
};

export const CASOS_DE_ESTUDIO: CasoDeEstudio[] = [
  {
    codigo: "C-01",
    titulo: ["Headsight", "— HMD"],
    ambito: "Científico / Militar",
    subtitulo: "Comeau & Bryan / Philco Corporation · 1961 · Huntsville, EE. UU.",
    descripcion:
      "Primer HMD funcional de la historia: pantallas individuales por ojo con imagen de una cámara remota, rastreada por campo magnético. No generaba gráficos por computadora, sino video en vivo cuya orientación seguía el movimiento de la cabeza del operador.",
    tecnologia: "HMD con pantallas CRT por ojo · Rastreador de campo magnético · Cámara remota de TV",
    contexto: "Desarrollo militar · Philco Corporation",
    fase: "Observación remota · Telepresencia militar",
    tipoUsuario: "Personal militar · Operadores de defensa",
    dimensiones: { representacional: true, participativa: false, afectiva: false, narrativa: false },
    imagen: withBase("/casos/c-01.png"),
  },
  {
    codigo: "C-02",
    titulo: ["Sensorama"],
    ambito: "Experimental / Diseño",
    subtitulo: "Morton Heilig · 1962 · Nueva York, EE. UU.",
    descripcion:
      "Cabina mecánica que recreaba un paseo en motocicleta combinando pantalla 3D en color, sonido estéreo, aromas, viento y asiento vibratorio. Sin computadoras: todos los canales sensoriales estaban coordinados mecánicamente en una sola experiencia.",
    tecnologia: "Pantalla estereoscópica 3D · Altavoces estéreo · Asiento vibratorio",
    contexto: "Invención independiente · Arte y entretenimiento experimental",
    fase: "Exploración sensorial · Prototipo de experiencia inmersiva",
    tipoUsuario: "Usuarios individuales · Público general en exhibición",
    dimensiones: { representacional: true, participativa: false, afectiva: true, narrativa: true },
    imagen: withBase("/casos/c-02.jpg"),
  },
  {
    codigo: "C-03",
    titulo: ["“Sword of", "Damocles”"],
    ambito: "Experimental / Diseño",
    subtitulo: "Ivan Sutherland / MIT & Universidad de Utah · 1968 · Cambridge, EE. UU.",
    descripcion:
      "Primer HMD con gráficos 3D generados por computadora en tiempo real, suspendido del techo por un brazo mecánico que respondía a la orientación de la cabeza. Introdujo la perspectiva dependiente del usuario que define a todos los HMD posteriores.",
    tecnologia: "HMD con CRT miniatura · Seguimiento óptico y mecánico · Computador gráfico de wireframes",
    contexto: "Investigación académica · MIT y Universidad de Utah",
    fase: "Investigación en gráficos por computadora · Prototipo experimental académico",
    tipoUsuario: "Investigadores · Comunidad científica de computación gráfica",
    dimensiones: { representacional: true, participativa: false, afectiva: false, narrativa: false },
    imagen: withBase("/casos/c-03.jpg"),
  },
  {
    codigo: "C-04",
    titulo: ["VPL Research:", "EyePhone + DataGlove"],
    ambito: "Experimental / Diseño",
    subtitulo: "Jaron Lanier / VPL Research · 1984–1990 · Redwood City, EE. UU.",
    descripcion:
      "Primeros equipos VR de grado consumidor: el EyePhone (HMD estereoscópico) y el DataGlove, un guante con sensores de fibra óptica que extendió la percepción espacial de la cabeza a la mano. Lanier acuñó aquí el término «realidad virtual».",
    tecnologia: "EyePhone HMD estereoscópico · DataGlove de fibra óptica · Rastreador Polhemus",
    contexto: "I+D tecnológico · Primeros equipos VR de grado consumidor",
    fase: "Exploración tecnológica · Prototipo de sistema cuerpo-espacio",
    tipoUsuario: "Investigadores · Primeros adoptantes · Industria del videojuego",
    dimensiones: { representacional: true, participativa: true, afectiva: false, narrativa: false },
    imagen: withBase("/casos/c-04.jpg"),
  },
  {
    codigo: "C-05",
    titulo: ["NASA VIEW", "Workstation"],
    ambito: "Científico / Militar",
    subtitulo: "Scott S. Fisher / NASA Ames Research Center · 1985 · Moffett Field, EE. UU.",
    descripcion:
      "Primer sistema VR multimodal integrado para aplicaciones aeroespaciales: combinó óptica de campo amplio, guante de datos, audio binaural y reconocimiento de voz. Demostró que la percepción espacial coherente requiere sincronizar visión, audio y propiocepción a la vez.",
    tecnologia: "HMD con óptica LEEP · DataGlove · Audio binaural 3D",
    contexto: "Investigación aeroespacial · NASA Ames Research Center",
    fase: "Telepresencia · Visualización de datos · Simulación espacial",
    tipoUsuario: "Investigadores NASA · Ingenieros aeroespaciales",
    dimensiones: { representacional: true, participativa: true, afectiva: false, narrativa: false },
    imagen: withBase("/casos/c-05.jpg"),
  },
  {
    codigo: "C-06",
    titulo: ["Google", "Cardboard"],
    ambito: "Entretenimiento",
    subtitulo: "David Coz & Damien Henry / Google · 2014 · Mountain View, EE. UU.",
    descripcion:
      "Visor estereoscópico de cartón que convertía cualquier smartphone en un dispositivo VR de bajo costo: más de 5 millones de unidades distribuidas en 19 meses. Su aporte fue de acceso — VR básica para el público masivo sin hardware especializado.",
    tecnologia: "Cartón corrugado · Lentes biconvexas · Smartphone (giroscopio)",
    contexto: "Producto de consumo masivo · Distribución global por Google",
    fase: "Consumo de contenido VR 360 · Educación básica",
    tipoUsuario: "Público general · Estudiantes · Consumidores de tecnología",
    dimensiones: { representacional: true, participativa: false, afectiva: true, narrativa: false },
    imagen: withBase("/casos/c-06.png"),
  },
  {
    codigo: "C-07",
    titulo: ["Tilt Brush /", "Open Brush"],
    ambito: "Experimental / Diseño",
    subtitulo: "Google / Skillman & Hackett · 2016 · San Francisco, EE. UU.",
    descripcion:
      "Aplicación de pintura y escultura 3D en VR donde el usuario dibuja dentro del espacio tridimensional que lo rodea. Invierte la relación creador–lienzo: quien diseña habita el espacio de su propia obra, con la mayor presencia espacial medida del corpus.",
    tecnologia: "HMD con controladores 6DoF · Pinceles de luz y partículas · Open Brush (código abierto)",
    contexto: "Arte y diseño · Terapia clínica · Educación creativa",
    fase: "Ideación · Exploración espacial · Intervención terapéutica",
    tipoUsuario: "Artistas y diseñadores · Terapeutas · Estudiantes de diseño",
    dimensiones: { representacional: true, participativa: true, afectiva: true, narrativa: false },
    imagen: withBase("/casos/c-07.png"),
  },
  {
    codigo: "C-08",
    titulo: ["Half-Life:", "Alyx"],
    ambito: "Entretenimiento",
    subtitulo: "Valve Corporation · 2020 · Bellevue, Washington, EE. UU.",
    descripcion:
      "Primer videojuego AAA nativo en VR, usado como caso de estudio para medir cómo distintos niveles de inmersión —incluida una caminadora física— alteran la percepción del tiempo, la consciencia y el sentido de presencia del jugador.",
    tecnologia: "HMD de alta resolución · Controladores 6DoF · Caminadora KAT VR",
    contexto: "Industria del videojuego · Producto comercial AAA",
    fase: "Entretenimiento narrativo · Investigación en cognición espacial",
    tipoUsuario: "Jugadores de VR · Investigadores en cognición y consciencia",
    dimensiones: { representacional: true, participativa: true, afectiva: true, narrativa: true },
    imagen: withBase("/casos/c-08.jpg"),
  },
  {
    codigo: "C-09",
    titulo: ["MIT — Aspen", "Movie Map"],
    ambito: "Experimental / Diseño",
    subtitulo: "Architecture Machine Group, MIT · 1978–1980 · Aspen / Cambridge, EE. UU.",
    descripcion:
      "Sistema hipermedia que permitía navegar virtualmente las calles de Aspen con imágenes capturadas frame a frame desde un automóvil. Primer sistema de navegación virtual interactiva, precursor directo de Google Street View 34 años antes.",
    tecnologia: "Videodisco óptico · Cámaras 16mm estereoscópicas · Interfaz táctil",
    contexto: "Investigación académica MIT · Financiamiento DARPA",
    fase: "Documentación urbana · Navegación interactiva",
    tipoUsuario: "Usuarios generales · Investigadores",
    dimensiones: { representacional: true, participativa: true, afectiva: false, narrativa: false },
    imagen: withBase("/casos/c-09.png"),
  },
  {
    codigo: "C-10",
    titulo: ["Notre-Dame de París", "— Digital Twin"],
    ambito: "Constructivo / Colaborativo",
    subtitulo: "CNRS / MAP-CNRS (Gros, Guillem, De Luca et al.) · 2019–2024 · París, Francia",
    descripcion:
      "Tras el incendio de 2019, un gemelo digital integró fotogrametría, BIM y rastreo espacio-temporal de fragmentos para guiar la reconstrucción de la catedral. Modelar el arco colapsado en VR permitió validar hipótesis antes de intervenir físicamente.",
    tecnologia: "BIM y escáner láser 3D · Fotogrametría · Digital Twin",
    contexto: "Reconstrucción patrimonial · CNRS y consorcio académico francés",
    fase: "Documentación patrimonial · Reconstrucción y gestión de obra",
    tipoUsuario: "Arqueólogos y restauradores · Ingenieros de obra",
    dimensiones: { representacional: true, participativa: true, afectiva: false, narrativa: true },
    imagen: withBase("/casos/c-10.jpg"),
  },
  {
    codigo: "C-11",
    titulo: ["Zaha Hadid Architects", "— Project Correl"],
    ambito: "Firma Internacional",
    subtitulo: "ZHA / ZHVR Group · 2019 · MUAC, Ciudad de México",
    descripcion:
      "Experiencia VR colaborativa multi-presencia donde varios usuarios construyen simultáneamente ensamblajes complejos en tiempo real, impulsada por Unreal Engine. El ZHVR Group fue fundado en 2014 para investigar VR como herramienta de diseño arquitectónico.",
    tecnologia: "Unreal Engine 4 · Cascos HTC Vive · Red multi-usuario en tiempo real",
    contexto: "Exposición académica · Investigación interna de firma de arquitectura",
    fase: "Exploración formal · Diseño colaborativo conceptual",
    tipoUsuario: "Arquitectos de la firma · Visitantes de exposición especializada",
    dimensiones: { representacional: true, participativa: true, afectiva: true, narrativa: false },
    imagen: withBase("/casos/c-11.jpg"),
  },
  {
    codigo: "C-12",
    titulo: ["Gensler — NVIDIA", "HQ en VR"],
    ambito: "Constructivo / Colaborativo",
    subtitulo: "Gensler · 2016–2017 · Santa Clara, California, EE. UU.",
    descripcion:
      "Gensler usó un motor de trazado de rayos en tiempo real y una app VR propia para diseñar la sede de NVIDIA, permitiendo a los clientes recorrer interiores fotorrealistas antes de construir. La detección temprana de conflictos redujo revisiones posteriores.",
    tecnologia: "NVIDIA Iray (ray tracing) · App VR propietaria · Samsung Gear VR",
    contexto: "Firma global de diseño · Proyecto corporativo de alto perfil",
    fase: "Diseño de interiores · Validación con cliente",
    tipoUsuario: "Equipo de diseño Gensler · Cliente corporativo (NVIDIA)",
    dimensiones: { representacional: true, participativa: true, afectiva: true, narrativa: false },
    imagen: withBase("/casos/c-12.jpg"),
  },
  {
    codigo: "C-13",
    titulo: ["KPF — Varjo +", "Twinmotion"],
    ambito: "Experimental / Diseño",
    subtitulo: "Kohn Pedersen Fox Associates (KPF) · 2022– · Nueva York, EE. UU.",
    descripcion:
      "KPF integró cascos de altísima resolución con software de visualización en tiempo real para experimentar materiales, luz y escala con una fidelidad sin precedentes. La calidad visual supera el umbral donde la mente acepta la representación como real.",
    tecnologia: "Varjo XR-3 (51 PPD) · Twinmotion · BIM (Revit)",
    contexto: "Firma global de arquitectura · Proyectos de escala internacional",
    fase: "Diseño de presentación · Venta a clientes premium",
    tipoUsuario: "Arquitectos de KPF · Clientes de proyectos residenciales de lujo",
    dimensiones: { representacional: true, participativa: false, afectiva: true, narrativa: false },
    imagen: withBase("/casos/c-13.png"),
  },
  {
    codigo: "C-14",
    titulo: ["Morphosis — Advanced", "Technology / XR"],
    ambito: "Experimental / Diseño",
    subtitulo: "Morphosis Architects / Advanced Technology Group · 2019 · Los Ángeles, EE. UU.",
    descripcion:
      "Instalación para la Milan Design Week que yuxtaponía maquetas físicas, mockups 1:1 en VR y portales de video en AR conectados a modelos BIM. Uno de los pocos casos del corpus donde las cuatro dimensiones de inmersión conviven en una sola experiencia.",
    tecnologia: "Dassault Systèmes 3DEXPERIENCE · AR en smartphone · Unreal Engine",
    contexto: "Oficina de arquitectura innovadora · I+D en representación",
    fase: "Investigación y desarrollo · Exposición especializada",
    tipoUsuario: "Equipo interno de Morphosis · Público de exposición especializada",
    dimensiones: { representacional: true, participativa: true, afectiva: true, narrativa: true },
    imagen: withBase("/casos/c-14.jpg"),
  },
  {
    codigo: "C-15",
    titulo: ["BIG + UNStudio", "— SpaceForm"],
    ambito: "Constructivo / Colaborativo",
    subtitulo: "Bjarke Ingels Group (BIG) / UNStudio · 2021– · Copenhague / Ámsterdam",
    descripcion:
      "Plataforma WebXR en la nube que carga modelos BIM directamente y los convierte en entornos VR navegables, accesibles desde cualquier dispositivo sin hardware especializado. Los no expertos comprenden mejor el diseño que sobre planos tradicionales.",
    tecnologia: "WebXR · Plataforma cloud propietaria · BIM (Revit / Archicad)",
    contexto: "Plataforma SaaS de arquitectura colaborativa",
    fase: "Revisión de diseño · Colaboración remota",
    tipoUsuario: "Arquitectos y clientes · Equipos distribuidos globalmente",
    dimensiones: { representacional: true, participativa: true, afectiva: false, narrativa: false },
    imagen: withBase("/casos/c-15.jpg"),
  },
  {
    codigo: "C-16",
    titulo: ["Stantec — Hospital", "VR"],
    ambito: "Constructivo / Colaborativo",
    subtitulo: "Stantec Engineering & Design · 2023–2024 · Nuevo México, EE. UU.",
    descripcion:
      "Stantec involucró a enfermeras del turno nocturno en el diseño de un hospital rural antes de construirlo, usando un visor autónomo para revisar el modelo BIM en VR. La respuesta inmersiva reveló preferencias espaciales imposibles de detectar con métodos tradicionales.",
    tecnologia: "Autodesk Workshop XR · Meta Quest 2 · BIM (Revit)",
    contexto: "Práctica profesional · Infraestructura hospitalaria rural",
    fase: "Revisión participativa con usuarios finales · Validación de diseño",
    tipoUsuario: "Personal de salud · Arquitectos de Stantec",
    dimensiones: { representacional: true, participativa: true, afectiva: true, narrativa: false },
    imagen: withBase("/casos/c-16.jpg"),
  },
];

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
