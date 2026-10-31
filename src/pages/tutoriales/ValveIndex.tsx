import { Helmet } from "react-helmet-async";
import CustomCursor from "@/components/CustomCursor";
import InteriorNav from "@/components/InteriorNav";
import VolverButton from "@/components/VolverButton";
import SiteFooter from "@/components/SiteFooter";

// Hermana de tutoriales/htc-vive/page.tsx y tutoriales/meta-quest/page.tsx:
// mismo patrón estructural (CustomCursor + InteriorNav + back-bar/hero
// centrados en la misma columna de 860px + SiteFooter al final — ver los
// comentarios de esos archivos para el porqué de cada pieza, no se repiten
// acá) aplicado al diseño que trajo Eder en tutorial_valveindex.html.
//
// A diferencia del Vive (que llegó con color y hubo que aplanarlo después),
// esta ya se construye monocroma desde el inicio — misma paleta que el
// resto del sitio ("me gusta, pero la guía detallada que no tenga
// colores"). El acento violeta (--accent: #a78bfa) del HTML original se
// aplana a blanco igual que se hizo con el cian del Vive, y donde el color
// distinguía algo (el tag "Finger Tracking", la tarjeta destacada del
// Index frente a la del Vive en la comparación, el control featured) la
// distinción se hace con PESO visual — borde más marcado
// (--border-strong), superficie un tono más clara (--surface-2) — no con
// tono. Mismo radio de esquinas (--radius-lg/-sm) que las otras guías.
const PAGE_CSS = `
.tutorial-index {
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

.tutorial-index .inner {
  max-width: 860px;
  margin: 0 auto;
  padding-left: 40px;
  padding-right: 40px;
}

/* ── VOLVER ── */
.tutorial-index .back-bar {
  padding-top: 20px;
}

/* ── HEADER ── */
.tutorial-index .hero {
  background: linear-gradient(160deg, #181818 0%, #111111 100%);
  border-bottom: 1px solid var(--border);
  padding: 32px 0 40px;
  position: relative;
  overflow: hidden;
}
.tutorial-index .hero::before {
  content: '';
  position: absolute;
  top: -60px; right: -60px;
  width: 320px; height: 320px;
  background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
  pointer-events: none;
}
.tutorial-index .hero-badge {
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
.tutorial-index .hero-badge span {
  width: 6px; height: 6px;
  background: var(--accent);
  border-radius: 50%;
  display: inline-block;
}
.tutorial-index .hero h1 {
  font-family: var(--font-archivo), sans-serif;
  font-size: clamp(28px, 5vw, 44px);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  line-height: 1.1;
  margin-bottom: 12px;
}
.tutorial-index .hero h1 em { color: var(--text-primary); font-weight: 800; font-style: normal; }
.tutorial-index .hero-sub {
  color: var(--text-secondary);
  font-weight: 400;
  font-size: 14px;
  max-width: 600px;
  margin-bottom: 24px;
}
.tutorial-index .tags { display: flex; flex-wrap: wrap; gap: 8px; }
.tutorial-index .tag {
  font-family: var(--font-plex-mono), monospace;
  font-size: 11px;
  padding: 4px 10px;
  letter-spacing: 0.05em;
  border-radius: var(--radius-sm);
}
.tutorial-index .tag-pcvr { background: #fff; color: #111; font-weight: 500; }
.tutorial-index .tag-premium { background: transparent; color: var(--text-primary); border: 1px solid var(--border-strong); font-weight: 500; }
.tutorial-index .tag-warn { background: transparent; color: var(--text-primary); border: 1px solid var(--border-strong); }
.tutorial-index .tag-neutral { background: transparent; color: var(--text-muted); border: 1px solid var(--border); }

/* ── LAYOUT ── */
.tutorial-index .container {
  max-width: 860px;
  margin: 0 auto;
  padding: 40px 40px 80px;
}

/* ── ALERT ── */
.tutorial-index .alert {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 14px 18px;
  font-size: 13px;
  font-weight: 400;
  color: var(--text-secondary);
  margin-bottom: 20px;
}
.tutorial-index .alert strong { color: var(--text-primary); font-weight: 500; }
.tutorial-index .alert a { color: var(--text-primary); text-decoration: underline; }

/* ── SECTION ── */
.tutorial-index .section { margin-bottom: 48px; }
.tutorial-index .section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}
.tutorial-index .section-num {
  font-family: var(--font-plex-mono), monospace;
  font-size: 11px;
  color: var(--text-primary);
  background: var(--accent-dim);
  border: 1px solid var(--border-strong);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}
.tutorial-index .section-title {
  font-family: var(--font-archivo), sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

/* ── STEPS ── */
.tutorial-index .steps { display: flex; flex-direction: column; gap: 12px; }
.tutorial-index .step {
  display: grid;
  grid-template-columns: 36px 1fr;
  gap: 16px;
  align-items: start;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  transition: border-color 0.2s;
}
.tutorial-index .step:hover { border-color: var(--border-strong); }
.tutorial-index .step-num {
  font-family: var(--font-plex-mono), monospace;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  padding-top: 1px;
}
.tutorial-index .step-content strong {
  font-family: var(--font-archivo), sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  display: block;
  margin-bottom: 4px;
}
.tutorial-index .step-content p { font-size: 14px; font-weight: 400; color: var(--text-secondary); line-height: 1.5; }
.tutorial-index .step-content .note {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-secondary);
  font-family: var(--font-plex-mono), monospace;
  background: var(--surface-2);
  border-left: 2px solid var(--text-primary);
  padding: 6px 10px;
  /* Solo las esquinas derechas — ver la misma nota en
     tutoriales/meta-quest/page.tsx sobre por qué no las cuatro. */
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

/* ── HARDWARE CARDS ── */
.tutorial-index .hw-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}
.tutorial-index .hw-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 16px;
}
.tutorial-index .hw-label {
  font-family: var(--font-plex-mono), monospace;
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 6px;
}
.tutorial-index .hw-name {
  font-family: var(--font-archivo), sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}
.tutorial-index .hw-desc { font-size: 12px; font-weight: 400; color: var(--text-secondary); }

/* ── DIFERENCIAS (Index vs Vive) ── */
.tutorial-index .diff-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
@media (max-width: 560px) { .tutorial-index .diff-grid { grid-template-columns: 1fr; } }
.tutorial-index .diff-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 18px 20px;
}
/* Tarjeta del Index (el visor de esta guía): se distingue de la del Vive
   por PESO — borde más marcado y superficie un tono más clara — nunca
   por color, siguiendo la misma regla del resto de la página. */
.tutorial-index .diff-card.highlight { border-color: var(--border-strong); background: var(--surface-2); }
.tutorial-index .diff-label {
  font-family: var(--font-plex-mono), monospace;
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 8px;
}
.tutorial-index .diff-title {
  font-family: var(--font-archivo), sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 10px;
}
.tutorial-index .diff-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
.tutorial-index .diff-list li { font-size: 13px; font-weight: 400; color: var(--text-secondary); padding-left: 14px; position: relative; }
.tutorial-index .diff-list li::before { content: '–'; position: absolute; left: 0; color: var(--text-muted); }

/* ── CONTROLES ── */
.tutorial-index .controller-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}
.tutorial-index .ctrl-item {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 14px 16px;
}
/* El control que distingue al Index (rastreo de dedos): mismo tratamiento
   de peso que .diff-card.highlight, no color. */
.tutorial-index .ctrl-item.featured { border-color: var(--border-strong); background: var(--surface-2); }
.tutorial-index .ctrl-key {
  font-family: var(--font-plex-mono), monospace;
  font-size: 12px;
  color: var(--text-primary);
  margin-bottom: 4px;
  font-weight: 500;
}
.tutorial-index .ctrl-desc { font-size: 13px; font-weight: 400; color: var(--text-secondary); }

/* ── RESOURCES ── */
.tutorial-index .resource-list { display: flex; flex-direction: column; gap: 10px; }
.tutorial-index .resource-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 14px 18px;
  text-decoration: none;
  color: var(--text-primary);
  transition: border-color 0.2s, background 0.2s;
}
.tutorial-index .resource-link:hover { border-color: var(--border-strong); background: var(--surface-2); }
.tutorial-index .resource-link-title { font-family: var(--font-archivo), sans-serif; font-size: 14px; font-weight: 500; margin-bottom: 2px; }
.tutorial-index .resource-link-desc { font-size: 12px; font-weight: 400; color: var(--text-muted); }
.tutorial-index .resource-link-arrow { font-size: 16px; color: var(--text-muted); flex-shrink: 0; }
.tutorial-index .resource-link:hover .resource-link-arrow { color: var(--text-primary); }

.tutorial-index .yt-block {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  text-decoration: none;
  color: var(--text-primary);
  transition: border-color 0.2s;
  margin-bottom: 16px;
}
.tutorial-index .yt-block:hover { border-color: var(--border-strong); }
.tutorial-index .yt-icon {
  width: 48px; height: 48px;
  background: var(--surface-2);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
  color: var(--text-primary);
  flex-shrink: 0;
}
.tutorial-index .yt-info-label { font-family: var(--font-plex-mono), monospace; font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
.tutorial-index .yt-info-title { font-family: var(--font-archivo), sans-serif; font-size: 14px; font-weight: 600; }
.tutorial-index .yt-info-sub { font-size: 12px; font-weight: 400; color: var(--text-muted); margin-top: 2px; }

/* ── SPEC TABLE ── */
.tutorial-index .spec-wrapper {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: 24px;
}
.tutorial-index .spec-table { width: 100%; border-collapse: collapse; }
.tutorial-index .spec-table td { padding: 10px 16px; font-size: 13px; font-weight: 400; border-bottom: 1px solid var(--border); vertical-align: top; }
.tutorial-index .spec-table td:first-child { font-family: var(--font-plex-mono), monospace; color: var(--text-muted); width: 170px; white-space: nowrap; }
.tutorial-index .spec-table td:last-child { color: var(--text-secondary); }
.tutorial-index .spec-table tr:last-child td { border-bottom: none; }

.tutorial-index hr { border: none; border-top: 1px solid var(--border); margin: 40px 0; }
`;

export default function ValveIndexTutorial() {
  return (
    <div className="tutorial-index">
      <Helmet>
        <title>Tutorial — Valve Index | ESTELA</title>
        <meta name="description" content="Guía detallada para configurar un Valve Index: diferencias con el Vive, estaciones base SteamVR 2.0, controles Knuckles con rastreo de dedos y conexión directa a PC para software de arquitectura en VR." />
        <meta property="og:title" content="Tutorial — Valve Index | ESTELA" />
        <meta property="og:description" content="Guía detallada para configurar un Valve Index: diferencias con el Vive, estaciones base SteamVR 2.0, controles Knuckles con rastreo de dedos y conexión directa a PC para software de arquitectura en VR." />
        <meta property="og:type" content="website" />
      </Helmet>

      <style>{PAGE_CSS}</style>

      <CustomCursor />

      <InteriorNav />

      <div className="back-bar inner">
        <VolverButton />
      </div>

      <div className="hero">
        <div className="inner">
          <div className="hero-badge">
            <span /> Tutorial · Dispositivo VR
          </div>
          <h1>
            Valve <em>Index</em>
          </h1>
          <p className="hero-sub">
            El visor PC-VR de mayor calidad de imagen y precisión disponible.
            Sin Link Box — conexión directa a la PC. Sus controles Knuckles
            incluyen rastreo individual de dedos, diferenciándolo de cualquier
            otro dispositivo.
          </p>
          <div className="tags">
            <span className="tag tag-pcvr">Solo PC-VR</span>
            <span className="tag tag-premium">Finger Tracking</span>
            <span className="tag tag-warn">
              Requiere GTX 1070 / RTX recomendado
            </span>
            <span className="tag tag-neutral">SteamVR nativo</span>
            <span className="tag tag-neutral">FOV 130°</span>
          </div>
        </div>
      </div>

      <div className="container">
        {/* SECCIÓN 0: Diferencias con el Vive */}
        <div className="section">
          <div className="section-header">
            <span className="section-num">00</span>
            <span className="section-title">
              Valve Index vs HTC Vive — ¿cuál es la diferencia?
            </span>
          </div>
          <div className="diff-grid">
            <div className="diff-card">
              <div className="diff-label">HTC Vive / Vive Pro</div>
              <div className="diff-title">Vive</div>
              <ul className="diff-list">
                <li>Requiere Link Box como intermediario</li>
                <li>Controles con trackpad circular</li>
                <li>Sin rastreo de dedos</li>
                <li>90 Hz de refresco</li>
                <li>Campo de visión ~110°</li>
              </ul>
            </div>
            <div className="diff-card highlight">
              <div className="diff-label">Valve Index</div>
              <div className="diff-title">Index</div>
              <ul className="diff-list">
                <li>Conexión directa a la PC (sin Link Box)</li>
                <li>Controles Knuckles con joystick y trackpad</li>
                <li>Rastreo de 5 dedos por mano</li>
                <li>120 / 144 Hz de refresco</li>
                <li>Campo de visión ~130°</li>
              </ul>
            </div>
          </div>
          <div className="alert">
            <strong>Nota:</strong> El Index usa las mismas estaciones base
            SteamVR 2.0 que el Vive Pro. Si ya tienes las estaciones instaladas,
            solo necesitas cambiar el visor y los controles.
          </div>
        </div>

        {/* SECCIÓN 1: Qué viene en la caja */}
        <div className="section">
          <div className="section-header">
            <span className="section-num">01</span>
            <span className="section-title">¿Qué viene en la caja?</span>
          </div>
          <div className="hw-grid">
            <div className="hw-card">
              <div className="hw-label">Visor</div>
              <div className="hw-name">Index HMD</div>
              <div className="hw-desc">
                Pantalla LCD dual 1440×1600 por ojo. Se conecta directamente a
                la PC por cable compuesto (USB + DisplayPort + alimentación).
              </div>
            </div>
            <div className="hw-card">
              <div className="hw-label">× 2 unidades</div>
              <div className="hw-name">Base Stations 2.0</div>
              <div className="hw-desc">
                Estaciones de rastreo láser. Se colocan en esquinas de la sala,
                no necesitan cable entre ellas.
              </div>
            </div>
            <div className="hw-card">
              <div className="hw-label">× 2 unidades</div>
              <div className="hw-name">Index Controllers (Knuckles)</div>
              <div className="hw-desc">
                Controles que se sujetan a la mano con correa. Rastrean cada
                dedo individualmente. Batería recargable integrada.
              </div>
            </div>
            <div className="hw-card">
              <div className="hw-label">Cable del visor</div>
              <div className="hw-name">Cable compuesto 5 m</div>
              <div className="hw-desc">
                Un solo cable que lleva USB 3.0, DisplayPort y alimentación. Va
                de la PC al visor directamente.
              </div>
            </div>
            <div className="hw-card">
              <div className="hw-label">Software</div>
              <div className="hw-name">SteamVR</div>
              <div className="hw-desc">
                Plataforma de Valve que gestiona el sistema completo. Gratuito,
                descargable desde Steam.
              </div>
            </div>
          </div>

          <div className="spec-wrapper">
            <table className="spec-table">
              <tbody>
                <tr>
                  <td>GPU mínima</td>
                  <td>NVIDIA GTX 1070 / AMD RX 5600 XT</td>
                </tr>
                <tr>
                  <td>GPU recomendada</td>
                  <td>NVIDIA RTX 2070 o superior</td>
                </tr>
                <tr>
                  <td>RAM mínima</td>
                  <td>8 GB (16 GB recomendado)</td>
                </tr>
                <tr>
                  <td>Conexión PC</td>
                  <td>DisplayPort 1.2 + USB 3.0 (cable compuesto incluido)</td>
                </tr>
                <tr>
                  <td>Espacio mínimo</td>
                  <td>2 m × 1.5 m libre de obstáculos</td>
                </tr>
                <tr>
                  <td>Sistema operativo</td>
                  <td>Windows 10 / 11 (64-bit)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SECCIÓN 2: Instalación paso a paso */}
        <div className="section">
          <div className="section-header">
            <span className="section-num">02</span>
            <span className="section-title">Instalación paso a paso</span>
          </div>
          <div className="steps">
            <div className="step">
              <span className="step-num">1</span>
              <div className="step-content">
                <strong>Instalar Steam y SteamVR</strong>
                <p>
                  Descarga Steam desde{" "}
                  <a
                    href="https://store.steampowered.com"
                    style={{
                      color: "var(--text-primary)",
                      textDecoration: "underline",
                    }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    store.steampowered.com
                  </a>
                  . En tu biblioteca de Steam ve a <em>Herramientas</em> y busca
                  SteamVR. Instálalo y actualiza los drivers de tu tarjeta de
                  video antes de continuar.
                </p>
              </div>
            </div>
            <div className="step">
              <span className="step-num">2</span>
              <div className="step-content">
                <strong>Colocar las estaciones base 2.0</strong>
                <p>
                  Posiciona las dos estaciones en esquinas opuestas de tu
                  espacio, por encima de la altura de la cabeza, inclinadas
                  entre 30° y 45° hacia abajo apuntando al centro. Conecta cada
                  una a la corriente con su adaptador. No necesitan cable entre
                  sí.
                </p>
                <div className="note">
                  📐 Espacio mínimo recomendado: 2 m × 1.5 m. Máximo de rastreo:
                  5 m × 5 m.
                </div>
              </div>
            </div>
            <div className="step">
              <span className="step-num">3</span>
              <div className="step-content">
                <strong>Conectar el visor directamente a la PC</strong>
                <p>
                  El cable compuesto del Index tiene un conector en la PC y otro
                  en el visor. En la PC conecta el <strong>USB 3.0</strong> a un
                  puerto USB de la placa madre y el <strong>DisplayPort</strong>{" "}
                  a la tarjeta de video dedicada. No se necesita Link Box.
                </p>
                <div className="note">
                  ⚠️ El DisplayPort debe conectarse a la GPU, no a los puertos
                  de la placa madre.
                </div>
              </div>
            </div>
            <div className="step">
              <span className="step-num">4</span>
              <div className="step-content">
                <strong>Cargar los controles Knuckles</strong>
                <p>
                  Los controles Index tienen batería integrada recargable por
                  USB-C. Cárgalos antes del primer uso. Se encienden solos al
                  ajustar la correa a la mano.
                </p>
              </div>
            </div>
            <div className="step">
              <span className="step-num">5</span>
              <div className="step-content">
                <strong>Abrir SteamVR y encender los controles</strong>
                <p>
                  Abre SteamVR desde Steam. Presiona el botón del sistema en
                  cualquier control para encenderlo. SteamVR los detectará
                  automáticamente y mostrará íconos verdes para visor, controles
                  y estaciones base.
                </p>
              </div>
            </div>
            <div className="step">
              <span className="step-num">6</span>
              <div className="step-content">
                <strong>Ejecutar Room Setup</strong>
                <p>
                  En SteamVR ve a <em>Menú → Room Setup</em>. Elige{" "}
                  <em>Room-Scale</em> para rastreo completo de la sala o{" "}
                  <em>Standing Only</em> para uso en un punto fijo. El asistente
                  calibra la altura del suelo y el perímetro de tu espacio. Al
                  terminar, el sistema está listo.
                </p>
                <div className="note">
                  ✅ Solo necesitas hacer el Room Setup una vez, a menos que
                  muevas las estaciones base.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: Controles */}
        <div className="section">
          <div className="section-header">
            <span className="section-num">03</span>
            <span className="section-title">
              Guía de controles Knuckles (Index Controllers)
            </span>
          </div>
          <div className="alert">
            <strong>Lo que hace único al Index:</strong> los controles rastrean
            cada dedo individualmente. En software compatible puedes ver tu mano
            virtual moverse como la real — pellizcar, señalar, agarrar — sin
            presionar botones.
          </div>
          <div className="controller-grid">
            <div className="ctrl-item featured">
              <div className="ctrl-key">Finger Tracking (5 dedos)</div>
              <div className="ctrl-desc">
                El control detecta la posición de cada dedo. En apps
                compatibles, la mano virtual replica tus movimientos reales.
              </div>
            </div>
            <div className="ctrl-item">
              <div className="ctrl-key">Gatillo (índice)</div>
              <div className="ctrl-desc">
                Seleccionar, confirmar, disparar. Botón principal de interacción
                en la mayoría de apps.
              </div>
            </div>
            <div className="ctrl-item">
              <div className="ctrl-key">Grip analógico</div>
              <div className="ctrl-desc">
                Agarrar objetos. Detecta cuánta presión aplicas — agarre suave o
                firme tiene efectos distintos en apps avanzadas.
              </div>
            </div>
            <div className="ctrl-item">
              <div className="ctrl-key">Joystick (pulgar)</div>
              <div className="ctrl-desc">
                Navegar en menús, desplazarse en el espacio virtual o girar la
                vista. Se puede presionar como botón.
              </div>
            </div>
            <div className="ctrl-item">
              <div className="ctrl-key">Trackpad táctil</div>
              <div className="ctrl-desc">
                Panel táctil circular adicional al joystick. Su función varía
                según la aplicación.
              </div>
            </div>
            <div className="ctrl-item">
              <div className="ctrl-key">Botones A / B</div>
              <div className="ctrl-desc">
                Acciones secundarias según el software. En Twinmotion y Enscape:
                menús y opciones.
              </div>
            </div>
            <div className="ctrl-item">
              <div className="ctrl-key">Botón System</div>
              <div className="ctrl-desc">
                Abre el menú principal de SteamVR. Mantener presionado: opciones
                del sistema.
              </div>
            </div>
            <div className="ctrl-item">
              <div className="ctrl-key">Correa ajustable</div>
              <div className="ctrl-desc">
                El control se sujeta a la mano. Puedes abrir la mano
                completamente sin soltar el control — no es necesario aferrarlo.
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 4: Uso en arquitectura */}
        <div className="section">
          <div className="section-header">
            <span className="section-num">04</span>
            <span className="section-title">
              Uso con software de arquitectura
            </span>
          </div>
          <div className="steps">
            <div className="step">
              <span className="step-num">1</span>
              <div className="step-content">
                <strong>Verificar SteamVR activo</strong>
                <p>
                  Antes de abrir cualquier software de diseño, confirma que
                  SteamVR muestra los cuatro componentes en verde: visor,
                  control izquierdo, control derecho y estaciones base.
                </p>
              </div>
            </div>
            <div className="step">
              <span className="step-num">2</span>
              <div className="step-content">
                <strong>Twinmotion → modo VR</strong>
                <p>
                  Abre tu proyecto y ve a <em>Renderizado → VR</em> o usa el
                  ícono de visor en la barra superior. El Index es detectado
                  automáticamente como visor SteamVR. La navegación usa el
                  joystick del control derecho.
                </p>
              </div>
            </div>
            <div className="step">
              <span className="step-num">3</span>
              <div className="step-content">
                <strong>Enscape → VR en tiempo real</strong>
                <p>
                  Desde Revit o SketchUp, abre Enscape y haz clic en el ícono de
                  visor VR. El Index se activa directamente por SteamVR. La
                  escena se actualiza en tiempo real al mover elementos en el
                  modelo.
                </p>
              </div>
            </div>
            <div className="step">
              <span className="step-num">4</span>
              <div className="step-content">
                <strong>D5 Render → VR Preview</strong>
                <p>
                  Ve a <em>Render → VR Preview</em> dentro de D5. Requiere GPU
                  con Ray Tracing. El Index, al tener mayor frecuencia de
                  refresco (120/144 Hz), ofrece una experiencia más fluida que
                  en otros visores.
                </p>
                <div className="note">
                  💡 El finger tracking no está disponible en Twinmotion ni
                  Enscape actualmente, pero sí en apps nativas de SteamVR.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 5: Recursos */}
        <div className="section">
          <div className="section-header">
            <span className="section-num">05</span>
            <span className="section-title">
              Recursos y tutoriales externos
            </span>
          </div>

          <a
            className="yt-block"
            href="https://www.youtube.com/results?search_query=Valve+Index+setup+tutorial+SteamVR+beginners"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="yt-icon">▶</div>
            <div>
              <div className="yt-info-label">
                YouTube · Búsqueda recomendada
              </div>
              <div className="yt-info-title">
                Valve Index setup tutorial SteamVR beginners
              </div>
              <div className="yt-info-sub">
                Canales: Cas and Chary VR · Virtual Reality Oasis · Thrill
                Seeker
              </div>
            </div>
          </a>

          <div className="resource-list">
            <a
              className="resource-link"
              href="https://www.vreddie.com/headsets/valve-index/setup-guide"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div>
                <div className="resource-link-title">
                  Guía paso a paso — VREddie
                </div>
                <div className="resource-link-desc">
                  vreddie.com · La más completa y clara para principiantes, con
                  imágenes
                </div>
              </div>
              <span className="resource-link-arrow">→</span>
            </a>
            <a
              className="resource-link"
              href="https://steamcdn-a.akamaihd.net/steam/apps/1059530/manuals/KitQSG_EN.pdf?t=1556842911"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div>
                <div className="resource-link-title">
                  Manual oficial Valve Index VR Kit (PDF)
                </div>
                <div className="resource-link-desc">
                  Valve / Steam CDN · Descargable · Diagramas de hardware y
                  conexión
                </div>
              </div>
              <span className="resource-link-arrow">↓</span>
            </a>
            <a
              className="resource-link"
              href="https://steamcommunity.com/sharedfiles/filedetails/?id=2985037346"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div>
                <div className="resource-link-title">
                  Cómo usar las base stations — Steam Community
                </div>
                <div className="resource-link-desc">
                  steamcommunity.com · Explica colocación, ángulos y solución de
                  problemas
                </div>
              </div>
              <span className="resource-link-arrow">→</span>
            </a>
            <a
              className="resource-link"
              href="https://techlogging.com/how-do-you-set-a-valve-index-base-station/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div>
                <div className="resource-link-title">
                  Configuración de base stations — TechLogging
                </div>
                <div className="resource-link-desc">
                  techlogging.com · Guía detallada de instalación física con
                  ángulos y distancias
                </div>
              </div>
              <span className="resource-link-arrow">→</span>
            </a>
          </div>
        </div>

        <hr />
        <VolverButton />
      </div>

      {/* Mismo motivo que en tutoriales/meta-quest/page.tsx: el footer
          también vive en las páginas de tutorial, no solo en home. */}
      <SiteFooter />
    </div>
  );
}
