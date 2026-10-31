import { Helmet } from "react-helmet-async";
import CustomCursor from "@/components/CustomCursor";
import InteriorNav from "@/components/InteriorNav";
import VolverButton from "@/components/VolverButton";
import SiteFooter from "@/components/SiteFooter";

// Página propia (no un modal) para que el botón ← Atrás del navegador
// vuelva solo a "Configura tus gafas VR paso a paso" — ver VolverButton.tsx
// y el enlace "Guía detallada" en ConfiguraGafas.tsx. Hermana de
// tutoriales/meta-quest/page.tsx: mismo patrón estructural (CustomCursor +
// InteriorNav + back-bar/hero centrados en la misma columna de 860px +
// SiteFooter al final — ver los comentarios de ese archivo para el porqué
// de cada pieza, no se repiten acá) aplicado al diseño que trajo Eder en
// tutorial_htcvive.html, con las mismas adaptaciones de fuente/reset que
// ya se le hicieron a la de Meta Quest.
//
// Eder: "me gusta, pero la guía detallada que no tenga colores" — el
// diseño original que trajo en tutorial_htcvive.html traía un acento
// propio (cian --accent, más naranja/amarillo en los tags de
// advertencia); se aplana a la misma paleta monocroma que ya usa
// tutoriales/meta-quest/page.tsx (y el resto del sitio) en vez de
// aplicarle color. Donde el color original distinguía algo (una nota de
// advertencia de una informativa, un tag "requiere tal GPU" de uno
// neutral) ahora esa distinción se hace con PESO visual — borde más
// marcado (--border-strong), relleno sólido vs. apenas delineado — no
// con tono. El radio de esquinas (--radius-lg/-sm) se mantiene igual:
// Eder pidió explícitamente que fuera consistente en toda la guía
// detallada, y ese pedido no cambió.
const PAGE_CSS = `
.tutorial-vive {
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

/* Mismo mecanismo de centrado que tutoriales/meta-quest/page.tsx — ver
   el comentario grande ahí sobre por qué el padding horizontal tiene que
   vivir en el MISMO elemento que centra (max-width + margin:auto). */
.tutorial-vive .inner {
  max-width: 860px;
  margin: 0 auto;
  padding-left: 40px;
  padding-right: 40px;
}

/* ── VOLVER ── */
.tutorial-vive .back-bar {
  padding-top: 20px;
}

/* ── HEADER ── */
.tutorial-vive .hero {
  background: linear-gradient(160deg, #181818 0%, #111111 100%);
  border-bottom: 1px solid var(--border);
  padding: 32px 0 40px;
  position: relative;
  overflow: hidden;
}
.tutorial-vive .hero::before {
  content: '';
  position: absolute;
  top: -60px; right: -60px;
  width: 320px; height: 320px;
  background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
  pointer-events: none;
}
.tutorial-vive .hero-badge {
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
.tutorial-vive .hero-badge span {
  width: 6px; height: 6px;
  background: var(--accent);
  border-radius: 50%;
  display: inline-block;
}
.tutorial-vive .hero h1 {
  font-family: var(--font-archivo), sans-serif;
  font-size: clamp(28px, 5vw, 44px);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  line-height: 1.1;
  margin-bottom: 12px;
}
.tutorial-vive .hero h1 em { color: var(--text-primary); font-weight: 800; font-style: normal; }
.tutorial-vive .hero-sub {
  color: var(--text-secondary);
  font-weight: 400;
  font-size: 14px;
  max-width: 580px;
  margin-bottom: 24px;
}
.tutorial-vive .tags { display: flex; flex-wrap: wrap; gap: 8px; }
.tutorial-vive .tag {
  font-family: var(--font-plex-mono), monospace;
  font-size: 11px;
  padding: 4px 10px;
  letter-spacing: 0.05em;
  border-radius: var(--radius-sm);
}
.tutorial-vive .tag-pcvr { background: #fff; color: #111; font-weight: 500; }
.tutorial-vive .tag-neutral { background: transparent; color: var(--text-muted); border: 1px solid var(--border); }
.tutorial-vive .tag-warn { background: transparent; color: var(--text-primary); border: 1px solid var(--border-strong); }

/* ── LAYOUT ── */
.tutorial-vive .container {
  max-width: 860px;
  margin: 0 auto;
  padding: 40px 40px 80px;
}

/* ── ALERT ── */
.tutorial-vive .alert {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 14px 18px;
  font-size: 13px;
  font-weight: 400;
  color: var(--text-secondary);
  margin-bottom: 20px;
}
.tutorial-vive .alert-warn { border-color: var(--border-strong); }
.tutorial-vive .alert strong { color: var(--text-primary); font-weight: 500; }
.tutorial-vive .alert a { color: var(--text-primary); text-decoration: underline; }

/* ── SECTION ── */
.tutorial-vive .section { margin-bottom: 48px; }
.tutorial-vive .section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}
.tutorial-vive .section-num {
  font-family: var(--font-plex-mono), monospace;
  font-size: 11px;
  color: var(--text-primary);
  background: var(--accent-dim);
  border: 1px solid var(--border-strong);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}
.tutorial-vive .section-title {
  font-family: var(--font-archivo), sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

/* ── STEPS ── */
.tutorial-vive .steps { display: flex; flex-direction: column; gap: 12px; }
.tutorial-vive .step {
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
.tutorial-vive .step:hover { border-color: var(--border-strong); }
.tutorial-vive .step-num {
  font-family: var(--font-plex-mono), monospace;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  padding-top: 1px;
}
.tutorial-vive .step-content strong {
  font-family: var(--font-archivo), sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  display: block;
  margin-bottom: 4px;
}
.tutorial-vive .step-content p { font-size: 14px; font-weight: 400; color: var(--text-secondary); line-height: 1.5; }
.tutorial-vive .step-content .note {
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
.tutorial-vive .hw-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}
.tutorial-vive .hw-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 16px;
}
.tutorial-vive .hw-label {
  font-family: var(--font-plex-mono), monospace;
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 6px;
}
.tutorial-vive .hw-name {
  font-family: var(--font-archivo), sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}
.tutorial-vive .hw-desc { font-size: 12px; font-weight: 400; color: var(--text-secondary); }

/* ── CONTROLES ── */
.tutorial-vive .controller-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}
.tutorial-vive .ctrl-item {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 14px 16px;
}
.tutorial-vive .ctrl-key {
  font-family: var(--font-plex-mono), monospace;
  font-size: 12px;
  color: var(--text-primary);
  margin-bottom: 4px;
  font-weight: 500;
}
.tutorial-vive .ctrl-desc { font-size: 13px; font-weight: 400; color: var(--text-secondary); }

/* ── RESOURCES ── */
.tutorial-vive .resource-list { display: flex; flex-direction: column; gap: 10px; }
.tutorial-vive .resource-link {
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
.tutorial-vive .resource-link:hover { border-color: var(--border-strong); background: var(--surface-2); }
.tutorial-vive .resource-link-title { font-family: var(--font-archivo), sans-serif; font-size: 14px; font-weight: 500; margin-bottom: 2px; }
.tutorial-vive .resource-link-desc { font-size: 12px; font-weight: 400; color: var(--text-muted); }
.tutorial-vive .resource-link-arrow { font-size: 16px; color: var(--text-muted); flex-shrink: 0; }
.tutorial-vive .resource-link:hover .resource-link-arrow { color: var(--text-primary); }

.tutorial-vive .yt-block {
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
.tutorial-vive .yt-block:hover { border-color: var(--border-strong); }
.tutorial-vive .yt-icon {
  width: 48px; height: 48px;
  background: var(--surface-2);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
  color: var(--text-primary);
  flex-shrink: 0;
}
.tutorial-vive .yt-info-label { font-family: var(--font-plex-mono), monospace; font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
.tutorial-vive .yt-info-title { font-family: var(--font-archivo), sans-serif; font-size: 14px; font-weight: 600; }
.tutorial-vive .yt-info-sub { font-size: 12px; font-weight: 400; color: var(--text-muted); margin-top: 2px; }

.tutorial-vive hr { border: none; border-top: 1px solid var(--border); margin: 40px 0; }
`;

export default function HtcViveTutorial() {
  return (
    <div className="tutorial-vive">
      <Helmet>
        <title>Tutorial — HTC Vive / Vive Pro | ESTELA</title>
        <meta name="description" content="Guía detallada para configurar un HTC Vive o Vive Pro: estaciones base, Link Box, controles y conexión a PC para software de arquitectura en VR." />
        <meta property="og:title" content="Tutorial — HTC Vive / Vive Pro | ESTELA" />
        <meta property="og:description" content="Guía detallada para configurar un HTC Vive o Vive Pro: estaciones base, Link Box, controles y conexión a PC para software de arquitectura en VR." />
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
            HTC Vive <em>/ Vive Pro</em>
          </h1>
          <p className="hero-sub">
            Visor PC-VR de alta gama con rastreo de sala completo. Requiere PC
            potente, dos estaciones base y un Link Box. Ofrece la experiencia VR
            más precisa y libre de cables de visor.
          </p>
          <div className="tags">
            <span className="tag tag-pcvr">Solo PC-VR</span>
            <span className="tag tag-warn">Requiere RTX / GTX 1070+</span>
            <span className="tag tag-neutral">Rastreo de sala 6DOF</span>
            <span className="tag tag-neutral">
              Compatible Twinmotion · Enscape · D5
            </span>
          </div>
        </div>
      </div>

      <div className="container">
        {/* SECCIÓN 0: ¿Qué viene en la caja? */}
        <div className="section">
          <div className="section-header">
            <span className="section-num">00</span>
            <span className="section-title">¿Qué viene en la caja?</span>
          </div>
          <div className="hw-grid">
            <div className="hw-card">
              <div className="hw-label">Visor</div>
              <div className="hw-name">HMD</div>
              <div className="hw-desc">
                Pantalla de alta resolución con seguimiento de cabeza. Se
                conecta al Link Box mediante cable.
              </div>
            </div>
            <div className="hw-card">
              <div className="hw-label">× 2 unidades</div>
              <div className="hw-name">Estaciones base</div>
              <div className="hw-desc">
                Se montan en las esquinas de la sala para rastrear el visor y
                los controles en el espacio.
              </div>
            </div>
            <div className="hw-card">
              <div className="hw-label">× 2 unidades</div>
              <div className="hw-name">Controles Vive</div>
              <div className="hw-desc">
                Controles inalámbricos que se rastrean en el espacio físico.
                Trackpad circular central.
              </div>
            </div>
            <div className="hw-card">
              <div className="hw-label">Caja de conexión</div>
              <div className="hw-name">Link Box</div>
              <div className="hw-desc">
                Interfaz entre el visor y la PC. Conecta por USB, DisplayPort y
                alimentación.
              </div>
            </div>
            <div className="hw-card">
              <div className="hw-label">Software</div>
              <div className="hw-name">SteamVR</div>
              <div className="hw-desc">
                Plataforma gratuita de Valve que gestiona todo el sistema Vive.
                Debe instalarse antes de conectar el hardware.
              </div>
            </div>
          </div>

          <div className="alert alert-warn">
            <strong>Requisito mínimo de PC:</strong> GPU NVIDIA GTX 1070 / AMD
            RX 5600 XT o superior · 16 GB RAM · Puerto DisplayPort 1.2 · Puerto
            USB 3.0
          </div>
        </div>

        {/* SECCIÓN 1: Instalación del hardware */}
        <div className="section">
          <div className="section-header">
            <span className="section-num">01</span>
            <span className="section-title">Instalación del hardware</span>
          </div>
          <div className="steps">
            <div className="step">
              <span className="step-num">1</span>
              <div className="step-content">
                <strong>Instalar SteamVR en la PC</strong>
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
                  </a>{" "}
                  si aún no lo tienes, luego busca SteamVR en la sección de
                  Herramientas de tu biblioteca e instálalo. Mantén los drivers
                  de video actualizados antes de continuar.
                </p>
              </div>
            </div>
            <div className="step">
              <span className="step-num">2</span>
              <div className="step-content">
                <strong>Colocar las estaciones base</strong>
                <p>
                  Ubica las dos estaciones base en esquinas opuestas de tu
                  espacio de trabajo, a una altura entre 2 y 5 metros, apuntando
                  hacia el centro de la sala. Deben verse entre sí sin
                  obstáculos. Puedes montarlas en la pared, un trípode o un
                  estante alto.
                </p>
                <div className="note">
                  📐 Espacio mínimo recomendado: 2 m × 1.5 m libre de
                  obstáculos.
                </div>
              </div>
            </div>
            <div className="step">
              <span className="step-num">3</span>
              <div className="step-content">
                <strong>Conectar las estaciones base a la corriente</strong>
                <p>
                  Enchufa cada estación base a un toma corriente usando los
                  adaptadores incluidos. Las estaciones se sincronizan entre sí
                  automáticamente por visión directa, o con un cable de
                  sincronía opcional.
                </p>
              </div>
            </div>
            <div className="step">
              <span className="step-num">4</span>
              <div className="step-content">
                <strong>Configurar el Link Box</strong>
                <p>
                  Conecta el Link Box a la PC con tres cables: el{" "}
                  <strong>USB 3.0</strong> a un puerto USB de la PC, el{" "}
                  <strong>DisplayPort</strong> directamente a la tarjeta de
                  video (no a la placa madre), y el cable de{" "}
                  <strong>alimentación</strong> a la corriente. Luego presiona
                  el botón de encendido del Link Box.
                </p>
                <div className="note">
                  ⚠️ El DisplayPort debe ir a la GPU dedicada, no a los puertos
                  de la placa madre.
                </div>
              </div>
            </div>
            <div className="step">
              <span className="step-num">5</span>
              <div className="step-content">
                <strong>Conectar el visor al Link Box</strong>
                <p>
                  Enchufa el cable del visor (HMD) al Link Box. Windows
                  instalará los drivers automáticamente. El visor aparecerá
                  reconocido en SteamVR.
                </p>
              </div>
            </div>
            <div className="step">
              <span className="step-num">6</span>
              <div className="step-content">
                <strong>Encender y emparejar los controles</strong>
                <p>
                  Mantén presionado el botón <em>System</em> (abajo de cada
                  control) hasta escuchar un sonido. En SteamVR, haz clic
                  derecho sobre el ícono del control y selecciona{" "}
                  <em>Pair Controller</em>. Sigue las instrucciones en pantalla.
                </p>
              </div>
            </div>
            <div className="step">
              <span className="step-num">7</span>
              <div className="step-content">
                <strong>Ejecutar Room Setup (calibración de sala)</strong>
                <p>
                  En SteamVR, ve a <em>Menú → Room Setup</em>. Elige{" "}
                  <em>Room-Scale</em> para espacio amplio o{" "}
                  <em>Standing Only</em> para uso fijo. Sigue el asistente para
                  calibrar el nivel del suelo y definir el perímetro de tu
                  espacio de trabajo.
                </p>
                <div className="note">
                  ✅ Después del Room Setup el sistema queda listo para correr
                  cualquier software VR.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: Controles */}
        <div className="section">
          <div className="section-header">
            <span className="section-num">02</span>
            <span className="section-title">Guía de controles Vive</span>
          </div>
          <div className="alert">
            <strong>Nota:</strong> Los controles Vive no tienen mano
            izquierda/derecha diferenciada. Ambos son idénticos. El rastreo es
            por las estaciones base, no por cámaras del visor.
          </div>
          <div className="controller-grid">
            <div className="ctrl-item">
              <div className="ctrl-key">Trackpad (circular)</div>
              <div className="ctrl-desc">
                Tocar o presionar para navegar menús, desplazarse y confirmar
                acciones. Similar a un touchpad de laptop.
              </div>
            </div>
            <div className="ctrl-item">
              <div className="ctrl-key">Gatillo (índice)</div>
              <div className="ctrl-desc">
                Seleccionar objetos, disparar, confirmar. El botón principal de
                interacción.
              </div>
            </div>
            <div className="ctrl-item">
              <div className="ctrl-key">Grip (costados)</div>
              <div className="ctrl-desc">
                Agarrar objetos virtuales. Se activa al apretar el costado del
                control con los dedos medios.
              </div>
            </div>
            <div className="ctrl-item">
              <div className="ctrl-key">Botón System (abajo)</div>
              <div className="ctrl-desc">
                Enciende/apaga el control. Abre el menú principal de SteamVR
                cuando el visor está puesto.
              </div>
            </div>
            <div className="ctrl-item">
              <div className="ctrl-key">Botón Menu (arriba)</div>
              <div className="ctrl-desc">
                Abre menús contextuales dentro de las aplicaciones. Función
                varía según el software.
              </div>
            </div>
            <div className="ctrl-item">
              <div className="ctrl-key">Movimiento físico</div>
              <div className="ctrl-desc">
                Las estaciones base rastrean la posición exacta de los controles
                en el espacio. Sin botones, el movimiento real es movimiento VR.
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: Uso en arquitectura */}
        <div className="section">
          <div className="section-header">
            <span className="section-num">03</span>
            <span className="section-title">
              Usar el Vive con software de arquitectura
            </span>
          </div>
          <div className="steps">
            <div className="step">
              <span className="step-num">1</span>
              <div className="step-content">
                <strong>Verifica que SteamVR esté corriendo</strong>
                <p>
                  Antes de abrir cualquier software, confirma que SteamVR está
                  activo y muestra el visor y los controles como conectados
                  (íconos verdes en la ventana de SteamVR).
                </p>
              </div>
            </div>
            <div className="step">
              <span className="step-num">2</span>
              <div className="step-content">
                <strong>Twinmotion → modo VR</strong>
                <p>
                  Abre tu proyecto en Twinmotion. Ve a <em>Renderizado → VR</em>{" "}
                  o presiona el ícono de visor en la barra superior. Twinmotion
                  detectará el Vive automáticamente y mostrará el modelo en VR.
                </p>
              </div>
            </div>
            <div className="step">
              <span className="step-num">3</span>
              <div className="step-content">
                <strong>Enscape → VR en tiempo real</strong>
                <p>
                  Con el plugin Enscape activo en Revit o SketchUp, abre la
                  ventana de Enscape y haz clic en el ícono del visor VR. El
                  Vive aparece como dispositivo disponible. La escena se carga
                  en tiempo real.
                </p>
              </div>
            </div>
            <div className="step">
              <span className="step-num">4</span>
              <div className="step-content">
                <strong>D5 Render → modo VR</strong>
                <p>
                  Dentro de D5, ve a <em>Render → VR Preview</em>. Requiere GPU
                  con Ray Tracing (RTX). El Vive se activa automáticamente si
                  SteamVR está corriendo.
                </p>
              </div>
            </div>
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
            href="https://www.youtube.com/results?search_query=HTC+Vive+setup+tutorial+beginners+SteamVR"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="yt-icon">▶</div>
            <div>
              <div className="yt-info-label">
                YouTube · Búsqueda recomendada
              </div>
              <div className="yt-info-title">
                HTC Vive setup tutorial beginners SteamVR
              </div>
              <div className="yt-info-sub">
                Canales: Cas and Chary VR · HTC Vive Official · UploadVR
              </div>
            </div>
          </a>

          <div className="resource-list">
            <a
              className="resource-link"
              href="https://www.vive.com/us/setup/vive-pro-hmd/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div>
                <div className="resource-link-title">
                  Guía oficial Vive Pro HMD
                </div>
                <div className="resource-link-desc">
                  vive.com · Configuración oficial paso a paso del hardware
                </div>
              </div>
              <span className="resource-link-arrow">→</span>
            </a>
            <a
              className="resource-link"
              href="https://www.techradar.com/how-to/how-to-set-up-a-htc-vive"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div>
                <div className="resource-link-title">
                  Cómo configurar el HTC Vive — TechRadar
                </div>
                <div className="resource-link-desc">
                  techradar.com · Guía completa con imágenes, incluye base
                  stations y Link Box
                </div>
              </div>
              <span className="resource-link-arrow">→</span>
            </a>
            <a
              className="resource-link"
              href="https://guides.library.ucsc.edu/DS/Resources/HTCViveProGuide"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div>
                <div className="resource-link-title">
                  Guía universitaria HTC Vive Pro — UC Santa Cruz
                </div>
                <div className="resource-link-desc">
                  library.ucsc.edu · Orientada a uso académico y laboratorio,
                  similar al contexto UCR
                </div>
              </div>
              <span className="resource-link-arrow">→</span>
            </a>
            <a
              className="resource-link"
              href="https://vr-expert.com/wp-content/uploads/2020/05/HTC-Vive-pro-VR-Expert-Product-Guide.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div>
                <div className="resource-link-title">
                  Manual rápido HTC Vive Pro (PDF)
                </div>
                <div className="resource-link-desc">
                  vr-expert.com · Descargable · Diagramas de hardware y conexión
                </div>
              </div>
              <span className="resource-link-arrow">↓</span>
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
