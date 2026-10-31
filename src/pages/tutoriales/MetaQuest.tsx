import { Helmet } from "react-helmet-async";
import CustomCursor from "@/components/CustomCursor";
import InteriorNav from "@/components/InteriorNav";
import VolverButton from "@/components/VolverButton";
import SiteFooter from "@/components/SiteFooter";

// Página propia (no un modal) para que el botón ← Atrás del navegador
// vuelva solo a "Configura tus gafas VR paso a paso" — ver VolverButton.tsx
// y el enlace "Guía detallada" en ConfiguraGafas.tsx.
//
// El CSS de abajo es el mismo diseño que trajo Eder en tutorial_metaquest.html,
// adaptado para vivir dentro del sitio en vez de como un .html suelto:
//  - Las tipografías (Archivo / IBM Plex Sans / IBM Plex Mono) ya las carga
//    el sitio entero vía Fontsource en src/index.css, así que se reutilizan
//    esas variables (--font-archivo, --font-plex-sans, --font-plex-mono)
//    en vez de agregar un <link> aparte a Google Fonts — un request menos
//    y nada de parpadeo de fuente.
//  - IBM Plex Sans en el sitio solo trae los pesos 400/500/600 (no 300,
//    que es el que pedía el diseño original) — se usa 400 en su lugar,
//    el peso cargado más cercano.
//  - El selector original `body { ... }` y el reset `*, *::before,
//    *::after { margin:0; padding:0; box-sizing:border-box }` se
//    eliminan: ese reset ya lo cubre el preflight de Tailwind para todo
//    el sitio, y `body` queda prefijado a `.tutorial-meta` para no
//    pisarle el fondo blanco al resto del sitio (layout.tsx comparte un
//    solo <body> entre todas las rutas).
const PAGE_CSS = `
.tutorial-meta {
  --bg: #111111;
  --surface: #1a1a1a;
  --surface-2: #212121;
  --border: rgba(255,255,255,0.12);
  --border-strong: rgba(255,255,255,0.22);
  --accent: #ffffff;
  --accent-dim: rgba(255,255,255,0.05);
  --text-primary: #ffffff;
  --text-secondary: rgba(255,255,255,0.55);
  --text-muted: rgba(255,255,255,0.35);
  /* Eder: "hagamos todos los recuadros con esquinas redondeadas, para
     seguir la estética que hemos usado en el home page" — el home usa
     rounded-2xl (16px, ver ConfiguraGafas.tsx/CasosDeEstudio.tsx: las
     tarjetas de workflow y casos de estudio) para tarjetas de contenido,
     y radios más chicos (rounded-md, ~6-8px) para elementos pequeños
     como botones/badges (ver el botón "Más opciones" en Nav.tsx). Estas
     dos variables calcan esa misma escala acá: --radius-lg para las
     tarjetas grandes (steps, method-card, ctrl-item, resource-link,
     alert, yt-block) y --radius-sm para las piezas chicas (tags,
     section-num, el ícono de YouTube, el note). */
  --radius-lg: 16px;
  --radius-sm: 8px;

  background: var(--bg);
  color: var(--text-primary);
  font-family: var(--font-plex-sans), sans-serif;
  font-weight: 400;
  font-size: 15px;
  line-height: 1.6;
  min-height: 100vh;
}

/* Eder: "prefiero que centres esta sección... correr estos textos
   (incluso el 'volver') a la derecha, hasta que quede centrado, como el
   resto de elementos" — ".container" (más abajo) ya centra su contenido
   con max-width:860px + margin:0 auto + padding-left/right:40px; esta
   misma regla es lo que hace que "01 Configuración..." aparezca corrido
   hacia el centro en vez de pegado al borde izquierdo. ".inner" repite
   exactamente esa fórmula para reutilizarla en ".back-bar" y ".hero".
   El padding-left/right vive en ESTA clase (no como shorthand "padding",
   para no pisar el padding-top/bottom propio de cada sección) — tiene
   que quedar en el MISMO elemento que centra (max-width + margin:auto),
   nunca por fuera de él: aplicarlo en un contenedor exterior (como tenía
   ".hero" antes) encoge el ancho disponible ANTES de centrar, lo que
   corre el contenido unos 40px más a la izquierda que ".container" — fue
   exactamente el desalineamiento que Eder marcó con la línea roja. */
.tutorial-meta .inner {
  max-width: 860px;
  margin: 0 auto;
  padding-left: 40px;
  padding-right: 40px;
}

/* ── VOLVER ── */
.tutorial-meta .back-bar {
  padding-top: 20px;
}

/* ── HEADER ── */
.tutorial-meta .hero {
  background: linear-gradient(160deg, #181818 0%, #111111 100%);
  border-bottom: 1px solid var(--border);
  padding: 32px 0 40px;
  position: relative;
  overflow: hidden;
}
.tutorial-meta .hero::before {
  content: '';
  position: absolute;
  top: -60px; right: -60px;
  width: 320px; height: 320px;
  background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
  pointer-events: none;
}
.tutorial-meta .hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-plex-mono), monospace;
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 16px;
}
.tutorial-meta .hero-badge span {
  width: 6px; height: 6px;
  background: var(--accent);
  border-radius: 50%;
  display: inline-block;
}
.tutorial-meta .hero h1 {
  font-family: var(--font-archivo), sans-serif;
  font-size: clamp(28px, 5vw, 44px);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  line-height: 1.1;
  margin-bottom: 12px;
}
.tutorial-meta .hero h1 em {
  color: var(--text-primary);
  font-weight: 800;
  font-style: normal;
}
.tutorial-meta .hero-sub {
  color: var(--text-secondary);
  font-weight: 400;
  font-size: 14px;
  max-width: 560px;
  margin-bottom: 24px;
}
.tutorial-meta .tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tutorial-meta .tag {
  font-family: var(--font-plex-mono), monospace;
  font-size: 11px;
  padding: 4px 10px;
  letter-spacing: 0.05em;
  border-radius: var(--radius-sm);
}
.tutorial-meta .tag-standalone { background: #fff; color: #111; font-weight: 500; }
.tutorial-meta .tag-pcvr { background: transparent; color: var(--text-primary); border: 1px solid var(--border-strong); }
.tutorial-meta .tag-neutral { background: transparent; color: var(--text-muted); border: 1px solid var(--border); }

/* ── LAYOUT ── */
.tutorial-meta .container {
  max-width: 860px;
  margin: 0 auto;
  padding: 40px 40px 80px;
}

/* ── SECTION ── */
.tutorial-meta .section {
  margin-bottom: 48px;
}
.tutorial-meta .section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}
.tutorial-meta .section-num {
  font-family: var(--font-plex-mono), monospace;
  font-size: 11px;
  color: var(--text-primary);
  background: var(--accent-dim);
  border: 1px solid var(--border-strong);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}
.tutorial-meta .section-title {
  font-family: var(--font-archivo), sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

/* ── STEPS ── */
.tutorial-meta .steps { display: flex; flex-direction: column; gap: 12px; }
.tutorial-meta .step {
  display: grid;
  grid-template-columns: 36px 1fr;
  gap: 16px;
  align-items: start;
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 16px 20px;
  border-radius: var(--radius-lg);
  transition: border-color 0.2s;
}
.tutorial-meta .step:hover { border-color: var(--border-strong); }
.tutorial-meta .step-num {
  font-family: var(--font-plex-mono), monospace;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  padding-top: 1px;
}
.tutorial-meta .step-content strong {
  font-family: var(--font-archivo), sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  display: block;
  margin-bottom: 4px;
}
.tutorial-meta .step-content p {
  font-size: 14px;
  font-weight: 400;
  color: var(--text-secondary);
  line-height: 1.5;
}
.tutorial-meta .step-content .note {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-secondary);
  font-family: var(--font-plex-mono), monospace;
  background: var(--surface-2);
  border-left: 2px solid var(--text-primary);
  padding: 6px 10px;
  /* Solo las esquinas derechas: la izquierda la "corta" el acento de
     border-left, redondearla ahí se vería raro con un borde recto
     entrando en una esquina curva. */
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

/* ── MÉTODO TABS ── */
.tutorial-meta .method-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}
@media (max-width: 600px) { .tutorial-meta .method-grid { grid-template-columns: 1fr; } }
.tutorial-meta .method-card {
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 20px;
  border-radius: var(--radius-lg);
}
.tutorial-meta .method-card.highlight { border-color: var(--border-strong); }
.tutorial-meta .method-label {
  font-family: var(--font-plex-mono), monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 6px;
}
.tutorial-meta .method-name {
  font-family: var(--font-archivo), sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}
.tutorial-meta .method-req {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-secondary);
  margin-bottom: 16px;
  line-height: 1.5;
}
.tutorial-meta .method-req strong { color: var(--text-primary); font-weight: 500; }

/* ── CONTROLES ── */
.tutorial-meta .controller-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}
.tutorial-meta .ctrl-item {
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 14px 16px;
  border-radius: var(--radius-lg);
}
.tutorial-meta .ctrl-key {
  font-family: var(--font-plex-mono), monospace;
  font-size: 12px;
  color: var(--text-primary);
  margin-bottom: 4px;
  font-weight: 500;
}
.tutorial-meta .ctrl-desc {
  font-size: 13px;
  font-weight: 400;
  color: var(--text-secondary);
}

/* ── RESOURCES ── */
.tutorial-meta .resource-list { display: flex; flex-direction: column; gap: 10px; }
.tutorial-meta .resource-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 14px 18px;
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: var(--text-primary);
  transition: border-color 0.2s, background 0.2s;
}
.tutorial-meta .resource-link:hover { border-color: var(--border-strong); background: var(--surface-2); }
.tutorial-meta .resource-link-title {
  font-family: var(--font-archivo), sans-serif;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 2px;
}
.tutorial-meta .resource-link-desc {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-muted);
}
.tutorial-meta .resource-link-arrow {
  font-size: 16px;
  color: var(--text-muted);
  flex-shrink: 0;
}
.tutorial-meta .resource-link:hover .resource-link-arrow { color: var(--text-primary); }

/* ── ALERT ── */
.tutorial-meta .alert {
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 14px 18px;
  font-size: 13px;
  font-weight: 400;
  color: var(--text-secondary);
  margin-bottom: 20px;
  border-radius: var(--radius-lg);
}
.tutorial-meta .alert strong { color: var(--text-primary); font-weight: 500; }
.tutorial-meta .alert a { color: var(--text-primary); text-decoration: underline; }

/* ── YOUTUBE BLOCK ── */
.tutorial-meta .yt-block {
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: var(--text-primary);
  transition: border-color 0.2s;
}
.tutorial-meta .yt-block:hover { border-color: var(--border-strong); }
.tutorial-meta .yt-icon {
  width: 48px; height: 48px;
  background: var(--surface-2);
  border: 1px solid var(--border-strong);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  color: var(--text-primary);
  flex-shrink: 0;
  border-radius: var(--radius-sm);
}
.tutorial-meta .yt-info-label {
  font-family: var(--font-plex-mono), monospace;
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 4px;
}
.tutorial-meta .yt-info-title {
  font-family: var(--font-archivo), sans-serif;
  font-size: 14px;
  font-weight: 600;
}
.tutorial-meta .yt-info-sub {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-muted);
  margin-top: 2px;
}

.tutorial-meta hr { border: none; border-top: 1px solid var(--border); margin: 40px 0; }
`;

export default function MetaQuestTutorial() {
  return (
    <div className="tutorial-meta">
      <Helmet>
        <title>Tutorial — Meta Quest 2 / Quest 3 | ESTELA</title>
        <meta name="description" content="Guía detallada para configurar un Meta Quest 2 o Quest 3: carga, controles, Guardian y conexión a PC para software de arquitectura en VR." />
        <meta property="og:title" content="Tutorial — Meta Quest 2 / Quest 3 | ESTELA" />
        <meta property="og:description" content="Guía detallada para configurar un Meta Quest 2 o Quest 3: carga, controles, Guardian y conexión a PC para software de arquitectura en VR." />
        <meta property="og:type" content="website" />
      </Helmet>

      <style>{PAGE_CSS}</style>

      {/* Eder: "quiero que al entrar a las instrucciones de las gafas
          siga apareciendo la top bar pero con colores invertidos...
          que tenga la estética de la página principal (incluyendo el
          mouse de gafas VR)". CustomCursor se auto-invierte por sí solo
          (mix-blend-difference, ver el componente) con tal de quedar
          como hijo directo de un contenedor sin transform/filter/opacity
          entre él y la raíz — que es justo este div — así que basta con
          montarlo acá, nada que configurar aparte. InteriorNav es la
          versión en negativo de Nav.tsx (ver ese archivo). */}
      <CustomCursor />

      <InteriorNav />

      <div className="back-bar inner">
        <VolverButton />
      </div>

      {/* HERO: el fondo/degradado/borde de ".hero" se queda a todo lo
          ancho (sin cambios); solo el contenido de adentro (badge, h1,
          sub, tags) se centra en la misma columna de 860px que ya usa
          ".container" más abajo — ver el comentario de ".inner". */}
      <div className="hero">
        <div className="inner">
          <div className="hero-badge">
            <span /> Tutorial · Dispositivo VR
          </div>
          <h1>
            Meta Quest <em>2 / 3</em>
          </h1>
          <p className="hero-sub">
            Visor autónomo de Meta. Funciona de forma independiente sin PC, y
            también puede conectarse como PC-VR mediante cable o de forma
            inalámbrica.
          </p>
          <div className="tags">
            <span className="tag tag-standalone">Standalone</span>
            <span className="tag tag-pcvr">PC-VR</span>
            <span className="tag tag-neutral">Sin cableado externo</span>
            <span className="tag tag-neutral">
              Compatible Twinmotion · Enscape · D5
            </span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="container">
        {/* SECCIÓN 1: Setup físico */}
        <div className="section">
          <div className="section-header">
            <span className="section-num">01</span>
            <span className="section-title">
              Configuración inicial del visor
            </span>
          </div>
          <div className="steps">
            <div className="step">
              <span className="step-num">1</span>
              <div className="step-content">
                <strong>Cargar el visor</strong>
                <p>
                  Conecta el cable USB-C al puerto del lado izquierdo del visor.
                  La luz naranja indica cargando; verde indica listo. Se
                  recomienda cargarlo por completo antes del primer uso.
                </p>
              </div>
            </div>
            <div className="step">
              <span className="step-num">2</span>
              <div className="step-content">
                <strong>Instalar la app Meta Quest en el teléfono</strong>
                <p>
                  Descarga &quot;Meta Quest&quot; desde la App Store o Google
                  Play. Activa el Bluetooth del teléfono y asegúrate de estar en
                  la misma red Wi-Fi que usará el visor.
                </p>
              </div>
            </div>
            <div className="step">
              <span className="step-num">3</span>
              <div className="step-content">
                <strong>Encender el visor</strong>
                <p>
                  Mantén presionado el botón en el lado derecho del visor por
                  2–3 segundos. Espera a que aparezca el logo de Meta en la
                  pantalla interna.
                </p>
              </div>
            </div>
            <div className="step">
              <span className="step-num">4</span>
              <div className="step-content">
                <strong>Activar los controles</strong>
                <p>
                  Cada control tiene una lengüeta de plástico que protege la
                  batería. Retírala jalando la pestaña. Los controles se
                  encienden y emparejan automáticamente al iniciar el visor.
                </p>
                <div className="note">
                  ⚡ Pasa el lazo de la muñequera antes de ponerte el visor.
                </div>
              </div>
            </div>
            <div className="step">
              <span className="step-num">5</span>
              <div className="step-content">
                <strong>Emparejar con el teléfono</strong>
                <p>
                  Abre la app Meta Quest, inicia sesión o crea una cuenta, y
                  sigue las instrucciones. La app detecta el visor por Bluetooth
                  y muestra un código de confirmación que aparece también dentro
                  del visor.
                </p>
              </div>
            </div>
            <div className="step">
              <span className="step-num">6</span>
              <div className="step-content">
                <strong>Conectarse al Wi-Fi</strong>
                <p>
                  Dentro del visor, apunta el control al menú y selecciona tu
                  red Wi-Fi. Usa el teclado virtual con el gatillo del control
                  para ingresar la contraseña.
                </p>
              </div>
            </div>
            <div className="step">
              <span className="step-num">7</span>
              <div className="step-content">
                <strong>Configurar el Guardian (zona de seguridad)</strong>
                <p>
                  El sistema pide que traces un perímetro alrededor de tu
                  espacio libre apuntando al suelo con el control. Esta línea
                  aparece como advertencia si te acercas al borde. Para uso
                  sentado, selecciona el modo <em>Stationary</em>.
                </p>
              </div>
            </div>
            <div className="step">
              <span className="step-num">8</span>
              <div className="step-content">
                <strong>Ajustar el visor a tu cara</strong>
                <p>
                  Sostén el visor y deslízalo suavemente arriba y abajo hasta
                  que la imagen se vea nítida. Ajusta las correas laterales y la
                  superior con velcro. Si usas lentes, coloca el espaciador
                  incluido en la caja antes de ponerte el visor.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: Controles */}
        <div className="section">
          <div className="section-header">
            <span className="section-num">02</span>
            <span className="section-title">
              Guía de controles (Touch Controllers)
            </span>
          </div>
          <div className="alert">
            <strong>Nota:</strong> Los controles tienen mano izquierda y
            derecha. Cada uno tiene botones propios. El botón de Meta (logo ○)
            solo está en el control derecho.
          </div>
          <div className="controller-grid">
            <div className="ctrl-item">
              <div className="ctrl-key">Gatillo (índice)</div>
              <div className="ctrl-desc">
                Seleccionar objetos, confirmar opciones, interactuar con
                elementos del menú.
              </div>
            </div>
            <div className="ctrl-item">
              <div className="ctrl-key">Grip (costado)</div>
              <div className="ctrl-desc">
                Agarrar objetos virtuales. Úsalo como si cerraras la mano.
              </div>
            </div>
            <div className="ctrl-item">
              <div className="ctrl-key">Joystick (pulgar)</div>
              <div className="ctrl-desc">
                Mover el cursor en menús. En experiencias 3D: desplazarse o
                girar la vista.
              </div>
            </div>
            <div className="ctrl-item">
              <div className="ctrl-key">Botón A / X</div>
              <div className="ctrl-desc">
                Confirmar acciones o entrar a menús según la aplicación.
              </div>
            </div>
            <div className="ctrl-item">
              <div className="ctrl-key">Botón B / Y</div>
              <div className="ctrl-desc">
                Volver a la pantalla o menú anterior.
              </div>
            </div>
            <div className="ctrl-item">
              <div className="ctrl-key">Botón Meta (○) — derecho</div>
              <div className="ctrl-desc">
                Abre y cierra el menú principal del visor. Mantén presionado
                para centrar la vista.
              </div>
            </div>
            <div className="ctrl-item">
              <div className="ctrl-key">Botón Menu (≡) — izquierdo</div>
              <div className="ctrl-desc">
                Abre opciones contextuales dentro de las aplicaciones.
              </div>
            </div>
            <div className="ctrl-item">
              <div className="ctrl-key">Mover físicamente</div>
              <div className="ctrl-desc">
                El visor rastrea tus manos y cabeza en el espacio. No necesitas
                botones para girar la cabeza.
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: Conexión a PC */}
        <div className="section">
          <div className="section-header">
            <span className="section-num">03</span>
            <span className="section-title">
              Conectar a una PC (modo PC-VR)
            </span>
          </div>

          <div className="alert">
            <strong>Requisito previo:</strong> Instala la app{" "}
            <strong>Meta Quest Link</strong> en tu PC desde{" "}
            <a
              href="https://www.meta.com/quest/setup/"
              target="_blank"
              rel="noopener noreferrer"
            >
              meta.com/quest/setup
            </a>
            . Inicia sesión con la misma cuenta Meta del visor.
          </div>

          <div className="method-grid">
            <div className="method-card highlight">
              <div className="method-label">Método A — Recomendado</div>
              <div className="method-name">Cable (Oculus Link)</div>
              <div className="method-req">
                Necesitas: <strong>Cable USB-C 3.0</strong> (o el cable oficial
                Meta Link) y puerto USB 3.0 en la PC.
              </div>
              <div className="steps">
                <div className="step" style={{ padding: "12px 14px" }}>
                  <span className="step-num">1</span>
                  <div className="step-content">
                    <p>
                      Conecta el cable entre la PC y el lado izquierdo del
                      visor.
                    </p>
                  </div>
                </div>
                <div className="step" style={{ padding: "12px 14px" }}>
                  <span className="step-num">2</span>
                  <div className="step-content">
                    <p>
                      Dentro del visor aparece{" "}
                      <em>&quot;Allow Access to Data&quot;</em> → selecciona{" "}
                      <strong>Deny</strong> (no queremos transferir archivos).
                    </p>
                  </div>
                </div>
                <div className="step" style={{ padding: "12px 14px" }}>
                  <span className="step-num">3</span>
                  <div className="step-content">
                    <p>
                      Aparece <em>&quot;Enable Oculus Link&quot;</em> →
                      selecciona <strong>Enable</strong>. El visor entra en modo
                      PC.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="method-card">
              <div className="method-label">Método B — Inalámbrico</div>
              <div className="method-name">Air Link (Wi-Fi)</div>
              <div className="method-req">
                Necesitas: <strong>Wi-Fi 5GHz</strong>. PC y visor en la misma
                red.
              </div>
              <div className="steps">
                <div className="step" style={{ padding: "12px 14px" }}>
                  <span className="step-num">1</span>
                  <div className="step-content">
                    <p>
                      En la app Meta Quest Link de la PC →{" "}
                      <em>Configuración → Beta</em> → activa{" "}
                      <strong>Air Link</strong>.
                    </p>
                  </div>
                </div>
                <div className="step" style={{ padding: "12px 14px" }}>
                  <span className="step-num">2</span>
                  <div className="step-content">
                    <p>
                      En el visor: botón Meta →{" "}
                      <em>Configuración rápida → Link → Air Link</em>. Actívalo.
                    </p>
                  </div>
                </div>
                <div className="step" style={{ padding: "12px 14px" }}>
                  <span className="step-num">3</span>
                  <div className="step-content">
                    <p>
                      Selecciona tu PC de la lista, confirma el código de 4
                      dígitos en ambos lados y presiona <strong>Launch</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="alert">
            Una vez conectado, abre Twinmotion, Enscape o D5 Render desde el
            escritorio virtual del visor. El software reconocerá el Quest como
            visor PC-VR compatible y activará el modo VR automáticamente.
          </div>
        </div>

        {/* SECCIÓN 4: Recursos */}
        <div className="section">
          <div className="section-header">
            <span className="section-num">04</span>
            <span className="section-title">
              Recursos y tutoriales externos
            </span>
          </div>

          <a
            className="yt-block"
            href="https://www.youtube.com/results?search_query=meta+quest+2+setup+beginners+2024"
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginBottom: 16, display: "flex" }}
          >
            <div className="yt-icon">▶</div>
            <div>
              <div className="yt-info-label">
                YouTube · Búsqueda recomendada
              </div>
              <div className="yt-info-title">
                Meta Quest 2 setup for beginners 2024
              </div>
              <div className="yt-info-sub">
                Canales: @MetaQuestVR · UploadVR · BHJT
              </div>
            </div>
          </a>

          <div className="resource-list">
            <a
              className="resource-link"
              href="https://www.meta.com/blog/you-got-a-quest-2-heres-how-to-set-it-up/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div>
                <div className="resource-link-title">
                  Guía oficial de Meta Quest
                </div>
                <div className="resource-link-desc">
                  meta.com · Guía de configuración paso a paso en español
                </div>
              </div>
              <span className="resource-link-arrow">→</span>
            </a>
            <a
              className="resource-link"
              href="https://zybervr.com/blogs/news/how-to-set-up-oculus-quest-2-step-by-step-beginner-guide-2022"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div>
                <div className="resource-link-title">
                  Guía visual para principiantes
                </div>
                <div className="resource-link-desc">
                  ZyberVR · Con imágenes de cada paso, controles incluidos
                </div>
              </div>
              <span className="resource-link-arrow">→</span>
            </a>
            <a
              className="resource-link"
              href="https://vr-expert.com/wp-content/uploads/2023/05/Meta-Quest-2-Quickstart-Guide.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div>
                <div className="resource-link-title">
                  Manual de inicio rápido (PDF)
                </div>
                <div className="resource-link-desc">
                  VR Expert · Descargable · Diagramas de botones y hardware
                </div>
              </div>
              <span className="resource-link-arrow">↓</span>
            </a>
            <a
              className="resource-link"
              href="https://www.meta.com/help/quest/509273027107091/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div>
                <div className="resource-link-title">
                  Configurar Meta Horizon Link y Air Link
                </div>
                <div className="resource-link-desc">
                  meta.com · Guía oficial de conexión a PC
                </div>
              </div>
              <span className="resource-link-arrow">→</span>
            </a>
            <a
              className="resource-link"
              href="https://yogesvr.com/blogs/blog/how-to-use-the-quest-2-controllers-a-comprehensive-guide"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div>
                <div className="resource-link-title">
                  Guía completa de controles Touch
                </div>
                <div className="resource-link-desc">
                  YogesVR · Cada botón explicado con detalle
                </div>
              </div>
              <span className="resource-link-arrow">→</span>
            </a>
          </div>
        </div>

        <hr />
        <VolverButton />
      </div>

      {/* Eder: el footer (con sus mismos enlaces a #workflows, #plantillas,
          #instrucciones-vr, #faq) también debe funcionar desde esta página
          — ver el comentario sobre los anchors "/" en SiteFooter.tsx. */}
      <SiteFooter />
    </div>
  );
}
