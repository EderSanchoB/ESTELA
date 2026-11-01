import { withBase } from "@/lib/withBase";
export type VRHeadsetStep = {
  titulo: string;
  texto: string;
};

export type VRHeadsetPlaylist = {
  // A pesar del nombre del tipo, `url` puede apuntar a una playlist
  // completa (Meta Quest, con "list=" en la url) o a un solo video
  // puntual (HTC Vive) — ConfiguraGafas.tsx detecta cuál es mirando si
  // `url` trae "list=" y ajusta la etiqueta "YouTube · Playlist/Video".
  url: string;
  titulo: string;
  subtitulo: string;
  /** id de YouTube — se usa solo para armar la miniatura (img.youtube.com),
   * no hace falta para el enlace en sí (ese es `url`, el playlist/video completo). */
  videoId: string;
};

export type VRHeadset = {
  id: string;
  etiqueta: string;
  /** null mientras no se suba el modelo .glb de este visor (ver nota en
   * ConfiguraGafas.tsx — por ahora solo Meta Quest está completo). */
  modelUrl: string | null;
  pasos: VRHeadsetStep[];
  guiaHref: string | null;
  playlist: VRHeadsetPlaylist | null;
};

// Eder: "la idea es que las oculus estén por default pero que al
// presionar otras gafas cambia a todo lo relacionado con las otras".
// Arrancamos con Meta Quest completo; los otros tres visores quedan acá
// como pestañas reales (ya se puede hacer click y cambiar) pero con
// contenido pendiente — ConfiguraGafas.tsx muestra un aviso de "próximamente"
// en vez de instrucciones/3D cuando `modelUrl`/`pasos` todavía no están.
export const VR_HEADSETS: VRHeadset[] = [
  {
    id: "meta-quest",
    etiqueta: "Meta Quest",
    modelUrl: withBase("/models/meta-quest.glb"),
    pasos: [
      {
        titulo: "Carga y enciende",
        texto:
          "conecta el USB-C al lado izquierdo hasta la luz verde, luego mantén presionado el botón derecho 2–3 segundos.",
      },
      {
        titulo: "Activa los controles",
        texto:
          "retira las lengüetas de plástico de cada control; se emparejan solos al encender el visor.",
      },
      {
        titulo: "Configura desde el teléfono",
        texto:
          'descarga "Meta Quest", inicia sesión y sigue las instrucciones; la app conecta el visor por Bluetooth y Wi-Fi.',
      },
      {
        titulo: "Define tu zona Guardian",
        texto:
          "traza el perímetro de tu espacio libre apuntando al suelo con el control. Si vas a usarlo sentado, elige modo Stationary.",
      },
      {
        titulo: "Conecta a la PC",
        texto:
          "por cable (USB-C 3.0 → habilita Oculus Link) o por Wi-Fi (Air Link desde Configuración rápida). El software de arquitectura detecta el visor automáticamente.",
      },
    ],
    guiaHref: "/tutoriales/meta-quest",
    playlist: {
      url: "https://www.youtube.com/watch?v=YEGg7Nu8RP0&list=PLQbRK2bUOChLBB4LVZDNeF5_ScWyx4sxq",
      titulo: "How to Set up your Meta Quest 3",
      subtitulo: "Playlist oficial de Meta · YouTube",
      videoId: "YEGg7Nu8RP0",
    },
  },
  {
    id: "htc-vive",
    etiqueta: "HTC Vive",
    modelUrl: withBase("/models/htc-vive.glb"),
    pasos: [
      {
        titulo: "Instala SteamVR en la PC",
        texto:
          "descarga Steam, busca SteamVR en Herramientas de tu biblioteca e instálalo; actualiza los drivers de video antes de continuar.",
      },
      {
        titulo: "Coloca las dos estaciones base",
        texto:
          "móntalas en esquinas opuestas de tu espacio, entre 2 y 5 metros de altura, apuntando al centro y sin obstáculos entre sí.",
      },
      {
        titulo: "Conecta el Link Box",
        texto:
          "USB 3.0 a la PC, DisplayPort directo a la GPU (no a la placa madre) y el cable de alimentación a la corriente.",
      },
      {
        titulo: "Enchufa el visor y empareja los controles",
        texto:
          "conecta el HMD al Link Box; mantén presionado el botón System de cada control hasta escuchar el sonido de emparejado.",
      },
      {
        titulo: "Corre el Room Setup",
        texto:
          "desde SteamVR, elige Room-Scale o Standing Only y sigue el asistente para calibrar el piso y el perímetro de tu espacio.",
      },
    ],
    guiaHref: "/tutoriales/htc-vive",
    // Eder cargó este video puntual (no una playlist) para HTC Vive:
    // https://www.youtube.com/watch?v=EBUXPv76E3Q&t=1s — título y canal
    // confirmados vía oEmbed de YouTube ("VIVE Tutorials", canal oficial).
    // ConfiguraGafas.tsx detecta que esta url no trae "list=" y muestra
    // la etiqueta "YouTube · Video" en vez de "· Playlist" para este caso.
    playlist: {
      url: "https://www.youtube.com/watch?v=EBUXPv76E3Q&t=1s",
      titulo: "VIVE Pro - Putting on the VIVE Pro headset",
      subtitulo: "VIVE Tutorials · YouTube",
      videoId: "EBUXPv76E3Q",
    },
  },
  {
    id: "valve-index",
    etiqueta: "Valve Index",
    modelUrl: withBase("/models/valve-index.glb"),
    pasos: [
      {
        titulo: "Instala Steam y SteamVR",
        texto:
          "descarga Steam, busca SteamVR en Herramientas de tu biblioteca e instálalo; actualiza los drivers de video antes de continuar.",
      },
      {
        titulo: "Coloca las estaciones base 2.0",
        texto:
          "en esquinas opuestas de tu espacio, por encima de la cabeza, inclinadas 30°–45° hacia el centro; no necesitan cable entre sí.",
      },
      {
        titulo: "Conecta el visor directo a la PC",
        texto:
          "el cable compuesto lleva USB 3.0 a la placa madre y DisplayPort a la GPU dedicada; no hace falta Link Box.",
      },
      {
        titulo: "Carga los controles Knuckles",
        texto:
          "tienen batería integrada recargable por USB-C; se encienden solos al ajustar la correa a la mano.",
      },
      {
        titulo: "Corre el Room Setup",
        texto:
          "desde SteamVR, elige Room-Scale o Standing Only y sigue el asistente para calibrar el piso y el perímetro de tu espacio.",
      },
    ],
    guiaHref: "/tutoriales/valve-index",
    // Eder cargó este video puntual (no una playlist) para Valve Index:
    // https://www.youtube.com/watch?v=hsPuP4BJNa4 — título y canal
    // confirmados vía oEmbed de YouTube. ConfiguraGafas.tsx detecta que
    // esta url no trae "list=" y muestra "YouTube · Video" en vez de
    // "· Playlist" para este caso (mismo mecanismo que HTC Vive).
    playlist: {
      url: "https://www.youtube.com/watch?v=hsPuP4BJNa4",
      titulo: "First Time Setup of the Valve Index!",
      subtitulo: "HBC2000 · YouTube",
      videoId: "hsPuP4BJNa4",
    },
  },
  {
    id: "smartphone",
    etiqueta: "Visor de smartphone (Cardboard / Merge)",
    modelUrl: withBase("/models/smartphone.glb"),
    pasos: [
      {
        titulo: "Exporta un panorama 360° estéreo",
        texto:
          "desde Twinmotion (Add Pano → 3D Stereo) o Enscape (Render Panorama → Stereo Panorama), en 4K u 8K.",
      },
      {
        titulo: "Pasa la imagen al celular",
        texto:
          "por cable USB para archivos pesados, o por WhatsApp/Drive/QR de Enscape Cloud si prefieres sin cables.",
      },
      {
        titulo: "Ábrela en una app de visor 360°",
        texto:
          "Simple360, Google Cardboard o VeeR VR; activa su modo Cardboard / split-screen para dividir la pantalla en dos.",
      },
      {
        titulo: "Inserta el teléfono en el visor",
        texto:
          "centrado, con la pantalla hacia las lentes; en Cardboard escanea el QR del visor la primera vez para calibrar.",
      },
      {
        titulo: "Mira alrededor",
        texto:
          "la imagen sigue el giroscopio del teléfono; usa el botón magnético (Cardboard) o los botones laterales (Merge) para confirmar.",
      },
    ],
    guiaHref: "/tutoriales/smartphone",
    // Eder cargó esta playlist para visores de smartphone:
    // https://www.youtube.com/watch?v=SxAj2lyX4oU&list=PLcSTi689xElQ —
    // título y canal confirmados vía oEmbed de YouTube sobre la URL de la
    // playlist (no del video individual). Esta url SÍ trae "list=", así
    // que ConfiguraGafas.tsx muestra "YouTube · Playlist" (igual que Meta
    // Quest) en vez de "· Video" (como con HTC Vive y Valve Index).
    playlist: {
      url: "https://www.youtube.com/watch?v=SxAj2lyX4oU&list=PLcSTi689xElQ",
      titulo: "VR on Smartphones",
      subtitulo: "Eder Sabla · YouTube",
      videoId: "SxAj2lyX4oU",
    },
  },
];
