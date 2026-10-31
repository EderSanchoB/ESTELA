import { Helmet } from "react-helmet-async";
import CustomCursor from "@/components/CustomCursor";
import InteriorNav from "@/components/InteriorNav";
import VolverButton from "@/components/VolverButton";
import SiteFooter from "@/components/SiteFooter";

// Hermana de tutoriales/valve-index/page.tsx, tutoriales/htc-vive/page.tsx
// y tutoriales/meta-quest/page.tsx: mismo patrón estructural (CustomCursor
// + InteriorNav + back-bar/hero centrados en la misma columna de 860px +
// SiteFooter al final) aplicado al diseño que trajo Eder en
// tutorial_visor_smartphone.html.
//
// Igual que Valve Index, se construye monocroma desde el inicio ("me
// gusta, pero la guía detallada que no tenga colores"). El acento verde
// (--accent: #34d399) del HTML original se aplana a blanco; donde el
// color distinguía algo (la tarjeta Merge frente a Cardboard, la app "en
// uso" frente a las demás, el "Sí"/"No" de la tabla de transferencia) la
// distinción pasa a ser de PESO visual — borde más marcado
// (--border-strong), superficie más clara (--surface-2), texto más fuerte
// vs. apagado — nunca de tono. Mismo radio de esquinas (--radius-lg/-sm)
// que las otras guías.
const PAGE_CSS = `
.tutorial-smartphone {
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

.tutorial-smartphone .inner {
  max-width: 860px;
  margin: 0 auto;
  padding-left: 40px;
  padding-right: 40px;
}

/* ── VOLVER ── */
.tutorial-smartphone .back-bar {
  padding-top: 20px;
}

/* ── HEADER ── */
.tutorial-smartphone .hero {
  background: linear-gradient(160deg, #181818 0%, #111111 100%);
  border-bottom: 1px solid var(--border);
  padding: 32px 0 40px;
  position: relative;
  overflow: hidden;
}
.tutorial-smartphone .hero::before {
  content: '';
  position: absolute;
  top: -60px; right: -60px;
  width: 320px; height: 320px;
  background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
  pointer-events: none;
}
.tutorial-smartphone .hero-badge {
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
.tutorial-smartphone .hero-badge span {
  width: 6px; height: 6px;
  background: var(--accent);
  border-radius: 50%;
  display: inline-block;
}
.tutorial-smartphone .hero h1 {
  font-family: var(--font-archivo), sans-serif;
  font-size: clamp(26px, 5vw, 42px);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  line-height: 1.1;
  margin-bottom: 12px;
}
.tutorial-smartphone .hero h1 em { color: var(--text-primary); font-weight: 800; font-style: normal; }
.tutorial-smartphone .hero-sub {
  color: var(--text-secondary);
  font-weight: 400;
  font-size: 14px;
  max-width: 600px;
  margin-bottom: 24px;
}
.tutorial-smartphone .tags { display: flex; flex-wrap: wrap; gap: 8px; }
.tutorial-smartphone .tag {
  font-family: var(--font-plex-mono), monospace;
  font-size: 11px;
  padding: 4px 10px;
  letter-spacing: 0.05em;
  border-radius: var(--radius-sm);
}
.tutorial-smartphone .tag-green { background: #fff; color: #111; font-weight: 500; }
.tutorial-smartphone .tag-neutral { background: transparent; color: var(--text-muted); border: 1px solid var(--border); }
.tutorial-smartphone .tag-warn { background: transparent; color: var(--text-primary); border: 1px solid var(--border-strong); }

/* ── LAYOUT ── */
.tutorial-smartphone .container {
  max-width: 860px;
  margin: 0 auto;
  padding: 40px 40px 80px;
}

/* ── ALERT ── */
.tutorial-smartphone .alert {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 14px 18px;
  font-size: 13px;
  font-weight: 400;
  color: var(--text-secondary);
  margin-bottom: 20px;
}
.tutorial-smartphone .alert-warn { border-color: var(--border-strong); }
.tutorial-smartphone .alert strong { color: var(--text-primary); font-weight: 500; }
.tutorial-smartphone .alert a { color: var(--text-primary); text-decoration: underline; }

/* ── SECTION ── */
.tutorial-smartphone .section { margin-bottom: 48px; }
.tutorial-smartphone .section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}
.tutorial-smartphone .section-num {
  font-family: var(--font-plex-mono), monospace;
  font-size: 11px;
  color: var(--text-primary);
  background: var(--accent-dim);
  border: 1px solid var(--border-strong);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}
.tutorial-smartphone .section-title {
  font-family: var(--font-archivo), sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

/* ── STEPS ── */
.tutorial-smartphone .steps { display: flex; flex-direction: column; gap: 12px; }
.tutorial-smartphone .step {
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
.tutorial-smartphone .step:hover { border-color: var(--border-strong); }
.tutorial-smartphone .step-num {
  font-family: var(--font-plex-mono), monospace;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  padding-top: 1px;
}
.tutorial-smartphone .step-content strong {
  font-family: var(--font-archivo), sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  display: block;
  margin-bottom: 4px;
}
.tutorial-smartphone .step-content p { font-size: 14px; font-weight: 400; color: var(--text-secondary); line-height: 1.5; }
.tutorial-smartphone .step-content .note {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-secondary);
  font-family: var(--font-plex-mono), monospace;
  background: var(--surface-2);
  border-left: 2px solid var(--text-primary);
  padding: 6px 10px;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

/* ── COMPARATIVA VISORES ── */
.tutorial-smartphone .visor-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
@media (max-width: 560px) { .tutorial-smartphone .visor-grid { grid-template-columns: 1fr; } }
.tutorial-smartphone .visor-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
}
.tutorial-smartphone .visor-card.highlight { border-color: var(--border-strong); background: var(--surface-2); }
.tutorial-smartphone .visor-label {
  font-family: var(--font-plex-mono), monospace;
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 6px;
}
.tutorial-smartphone .visor-name {
  font-family: var(--font-archivo), sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 10px;
}
.tutorial-smartphone .visor-list { list-style: none; display: flex; flex-direction: column; gap: 5px; }
.tutorial-smartphone .visor-list li { font-size: 13px; font-weight: 400; color: var(--text-secondary); padding-left: 14px; position: relative; }
.tutorial-smartphone .visor-list li::before { content: '–'; position: absolute; left: 0; color: var(--text-muted); }

/* ── FLUJO (pipeline) ── */
.tutorial-smartphone .pipeline { display: flex; align-items: stretch; gap: 0; margin-bottom: 24px; overflow-x: auto; padding-bottom: 4px; }
.tutorial-smartphone .pipe-step {
  flex: 1;
  min-width: 120px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 14px 12px;
  text-align: center;
  position: relative;
}
.tutorial-smartphone .pipe-step + .pipe-step { margin-left: 8px; }
.tutorial-smartphone .pipe-arrow { display: flex; align-items: center; padding: 0 2px; color: var(--text-muted); font-size: 18px; flex-shrink: 0; }
.tutorial-smartphone .pipe-label { font-family: var(--font-plex-mono), monospace; font-size: 9px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 3px; }
.tutorial-smartphone .pipe-name { font-family: var(--font-archivo), sans-serif; font-size: 13px; font-weight: 600; color: var(--text-primary); }

/* ── APPS GRID ── */
.tutorial-smartphone .apps-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; }
.tutorial-smartphone .app-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 16px;
}
/* La app que de hecho se usa en el flujo recomendado: se distingue por
   PESO (mismo tratamiento que .visor-card.highlight), no por color. */
.tutorial-smartphone .app-card.featured { border-color: var(--border-strong); background: var(--surface-2); }
.tutorial-smartphone .app-name { font-family: var(--font-archivo), sans-serif; font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; }
.tutorial-smartphone .app-badge { font-family: var(--font-plex-mono), monospace; font-size: 10px; padding: 2px 7px; border-radius: var(--radius-sm); display: inline-block; margin-bottom: 6px; }
.tutorial-smartphone .app-badge.used { background: #fff; color: #111; font-weight: 500; border: none; }
.tutorial-smartphone .app-badge.free { background: transparent; color: var(--text-secondary); border: 1px solid var(--border); }
.tutorial-smartphone .app-badge.paid { background: transparent; color: var(--text-primary); border: 1px solid var(--border-strong); }
.tutorial-smartphone .app-desc { font-size: 12px; font-weight: 400; color: var(--text-secondary); margin-bottom: 8px; }
.tutorial-smartphone .app-platforms { font-family: var(--font-plex-mono), monospace; font-size: 10px; color: var(--text-muted); }

/* ── RESOURCES ── */
.tutorial-smartphone .resource-list { display: flex; flex-direction: column; gap: 10px; }
.tutorial-smartphone .resource-link {
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
.tutorial-smartphone .resource-link:hover { border-color: var(--border-strong); background: var(--surface-2); }
.tutorial-smartphone .resource-link-title { font-family: var(--font-archivo), sans-serif; font-size: 14px; font-weight: 500; margin-bottom: 2px; }
.tutorial-smartphone .resource-link-desc { font-size: 12px; font-weight: 400; color: var(--text-muted); }
.tutorial-smartphone .resource-link-arrow { font-size: 16px; color: var(--text-muted); flex-shrink: 0; }
.tutorial-smartphone .resource-link:hover .resource-link-arrow { color: var(--text-primary); }

.tutorial-smartphone .yt-block {
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
.tutorial-smartphone .yt-block:hover { border-color: var(--border-strong); }
.tutorial-smartphone .yt-icon {
  width: 48px; height: 48px;
  background: var(--surface-2);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
  color: var(--text-primary);
  flex-shrink: 0;
}
.tutorial-smartphone .yt-info-label { font-family: var(--font-plex-mono), monospace; font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
.tutorial-smartphone .yt-info-title { font-family: var(--font-archivo), sans-serif; font-size: 14px; font-weight: 600; }
.tutorial-smartphone .yt-info-sub { font-size: 12px; font-weight: 400; color: var(--text-muted); margin-top: 2px; }

/* ── FORMAT TABLE ── */
.tutorial-smartphone .format-wrapper {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: 24px;
}
.tutorial-smartphone .format-table { width: 100%; border-collapse: collapse; }
.tutorial-smartphone .format-table th {
  font-family: var(--font-plex-mono), monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  padding: 10px 16px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}
.tutorial-smartphone .format-table td { padding: 10px 16px; font-size: 13px; font-weight: 400; border-bottom: 1px solid var(--border); color: var(--text-secondary); vertical-align: top; }
.tutorial-smartphone .format-table td:first-child { font-family: var(--font-archivo), sans-serif; font-weight: 600; color: var(--text-primary); }
.tutorial-smartphone .format-table tr:last-child td { border-bottom: none; }
/* "Sí" / "No" de la columna "Requiere internet": en vez de verde/rojo, la
   distinción es de PESO — texto fuerte vs. apagado. */
.tutorial-smartphone .check { color: var(--text-primary); font-weight: 500; }
.tutorial-smartphone .cross { color: var(--text-muted); }

.tutorial-smartphone hr { border: none; border-top: 1px solid var(--border); margin: 40px 0; }
`;

export default function SmartphoneTutorial() {
  return (
    <div className="tutorial-smartphone">
      <Helmet>
        <title>Tutorial — Visor de Smartphone (Cardboard / Merge) | ESTELA</title>
        <meta name="description" content="Guía detallada para usar un visor de smartphone (Google Cardboard / Merge VR): flujo completo de exportación de panoramas 360° desde Twinmotion o Enscape, transferencia al celular y apps de visualización." />
        <meta property="og:title" content="Tutorial — Visor de Smartphone (Cardboard / Merge) | ESTELA" />
        <meta property="og:description" content="Guía detallada para usar un visor de smartphone (Google Cardboard / Merge VR): flujo completo de exportación de panoramas 360° desde Twinmotion o Enscape, transferencia al celular y apps de visualización." />
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
            Visor de Smartphone — <em>Cardboard / Merge</em>
          </h1>
          <p className="hero-sub">
            La opción más accesible y democrática: cualquier celular con
            giroscopio se convierte en un visor VR. El flujo de trabajo va del
            software de arquitectura a una imagen 360° en el teléfono — sin PC,
            sin cables.
          </p>
          <div className="tags">
            <span className="tag tag-green">Sin PC requerida</span>
            <span className="tag tag-green">Bajo costo</span>
            <span className="tag tag-neutral">Imagen 360° estereoscópica</span>
            <span className="tag tag-warn">Sin rastreo de posición</span>
            <span className="tag tag-neutral">
              Compatible cualquier smartphone
            </span>
          </div>
        </div>
      </div>

      <div className="container">
        {/* SECCIÓN 0: Cardboard vs Merge */}
        <div className="section">
          <div className="section-header">
            <span className="section-num">00</span>
            <span className="section-title">
              Google Cardboard vs Merge — ¿cuál es la diferencia?
            </span>
          </div>
          <div className="visor-grid">
            <div className="visor-card">
              <div className="visor-label">Económico / DIY</div>
              <div className="visor-name">Google Cardboard</div>
              <ul className="visor-list">
                <li>Cartón o plástico básico, muy barato</li>
                <li>Lentes de plástico incluidas</li>
                <li>Compatible con cualquier teléfono</li>
                <li>Botón magnético de interacción (algunos modelos)</li>
                <li>Sin correa — hay que sostenerlo con las manos</li>
                <li>Ideal para demos rápidas o presentaciones</li>
              </ul>
            </div>
            <div className="visor-card highlight">
              <div className="visor-label">Semi-profesional</div>
              <div className="visor-name">Merge VR / Merge Mini</div>
              <ul className="visor-list">
                <li>Espuma suave y correa ajustable — manos libres</li>
                <li>Lentes de mayor calidad que Cardboard</li>
                <li>Compatible con iPhones y Android</li>
                <li>Botones físicos en los costados</li>
                <li>Más cómodo para sesiones largas</li>
                <li>Ideal para talleres y presentaciones a clientes</li>
              </ul>
            </div>
          </div>
          <div className="alert">
            <strong>Lo importante:</strong> ambos funcionan exactamente igual en
            términos de software. La diferencia es solo ergonómica. Todo el
            proceso de exportación y visualización que se describe abajo aplica
            para los dos.
          </div>
        </div>

        {/* SECCIÓN 1: Flujo de trabajo */}
        <div className="section">
          <div className="section-header">
            <span className="section-num">01</span>
            <span className="section-title">
              Flujo de trabajo completo — del modelo al visor
            </span>
          </div>

          <div className="pipeline">
            <div className="pipe-step">
              <div className="pipe-label">Paso 1</div>
              <div className="pipe-name">Modelo 3D</div>
            </div>
            <div className="pipe-arrow">→</div>
            <div className="pipe-step">
              <div className="pipe-label">Paso 2</div>
              <div className="pipe-name">Exportar panorama 360°</div>
            </div>
            <div className="pipe-arrow">→</div>
            <div className="pipe-step">
              <div className="pipe-label">Paso 3</div>
              <div className="pipe-name">Pasar al celular</div>
            </div>
            <div className="pipe-arrow">→</div>
            <div className="pipe-step">
              <div className="pipe-label">Paso 4</div>
              <div className="pipe-name">Ver en el visor</div>
            </div>
          </div>

          <div className="alert alert-warn">
            <strong>Importante:</strong> los visores de smartphone no corren
            software 3D en tiempo real. Solo visualizan imágenes o videos 360°
            ya renderizados. El proceso siempre es: exportar primero desde la
            PC, luego ver en el teléfono.
          </div>
        </div>

        {/* SECCIÓN 2A: Exportar desde Twinmotion */}
        <div className="section">
          <div className="section-header">
            <span className="section-num">02A</span>
            <span className="section-title">
              Exportar panorama 360° desde Twinmotion
            </span>
          </div>
          <div className="steps">
            <div className="step">
              <span className="step-num">1</span>
              <div className="step-content">
                <strong>
                  Posicionar la cámara en el punto de vista deseado
                </strong>
                <p>
                  Navega dentro de tu modelo hasta el punto desde donde quieres
                  que se vea la experiencia VR. Este punto será el centro de la
                  imagen 360°. Elige una altura de 1.60–1.70 m, que corresponde
                  a la vista de una persona parada.
                </p>
              </div>
            </div>
            <div className="step">
              <span className="step-num">2</span>
              <div className="step-content">
                <strong>Abrir la sección de exportación de panoramas</strong>
                <p>
                  En el panel inferior de Twinmotion (Media Dock), busca el
                  ícono de panorama. Haz clic en <em>Add Pano</em> para capturar
                  el punto de vista actual.
                </p>
              </div>
            </div>
            <div className="step">
              <span className="step-num">3</span>
              <div className="step-content">
                <strong>Configurar el tipo: Stereo 3D</strong>
                <p>
                  En las opciones del panorama, selecciona{" "}
                  <strong>3D (Stereo)</strong> en lugar de Standard. Esto genera
                  dos imágenes ligeramente desplazadas para cada ojo, creando
                  sensación de profundidad real dentro del visor.
                </p>
                <div className="note">
                  📐 Resolución recomendada: 8K (8192 px). Mínimo aceptable para
                  VR: 4K (4096 px).
                </div>
              </div>
            </div>
            <div className="step">
              <span className="step-num">4</span>
              <div className="step-content">
                <strong>Exportar como JPG o PNG</strong>
                <p>
                  Selecciona JPG para archivos más ligeros (recomendado para
                  transfer al celular) o PNG para mayor calidad. Haz clic en{" "}
                  <em>Export</em> y elige la carpeta de destino en tu PC.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2B: Exportar desde Enscape */}
        <div className="section">
          <div className="section-header">
            <span className="section-num">02B</span>
            <span className="section-title">
              Exportar panorama 360° desde Enscape
            </span>
          </div>
          <div className="steps">
            <div className="step">
              <span className="step-num">1</span>
              <div className="step-content">
                <strong>Navegar al punto de vista dentro de Enscape</strong>
                <p>
                  Abre Enscape desde Revit o SketchUp y navega hasta la posición
                  deseada. La cámara de Enscape será el centro de la imagen
                  360°.
                </p>
              </div>
            </div>
            <div className="step">
              <span className="step-num">2</span>
              <div className="step-content">
                <strong>Hacer clic en &quot;Render Panorama&quot;</strong>
                <p>
                  En la barra de herramientas de Enscape, busca el botón{" "}
                  <em>Render Panorama</em>. La flecha al lado del botón permite
                  elegir entre <strong>Mono Panorama</strong> (vista simple) y{" "}
                  <strong>Stereo Panorama</strong> (para VR con profundidad).
                  Elige Stereo para el visor.
                </p>
              </div>
            </div>
            <div className="step">
              <span className="step-num">3</span>
              <div className="step-content">
                <strong>Configurar resolución y exportar</strong>
                <p>
                  En <em>Visual Settings → Output</em> ajusta la resolución del
                  panorama. Recomendado: <strong>Normal (4096 × 8192)</strong> o{" "}
                  <strong>High (8192 × 16384)</strong>. Espera el render y
                  guarda la imagen en tu PC.
                </p>
                <div className="note">
                  ☁️ Alternativa: usa la nube de Chaos. Sube el panorama y
                  Enscape genera un enlace o código QR para abrir directamente
                  desde el navegador del celular sin instalar nada.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: Transferir al celular */}
        <div className="section">
          <div className="section-header">
            <span className="section-num">03</span>
            <span className="section-title">
              Transferir la imagen al celular
            </span>
          </div>

          <div className="format-wrapper" style={{ marginBottom: "16px" }}>
            <table className="format-table">
              <thead>
                <tr>
                  <th>Método</th>
                  <th>Velocidad</th>
                  <th>Requiere internet</th>
                  <th>Mejor para</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Cable USB</td>
                  <td>Muy rápido</td>
                  <td className="cross">No</td>
                  <td>Archivos grandes (8K+), uso en taller</td>
                </tr>
                <tr>
                  <td>WhatsApp / Telegram</td>
                  <td>Rápido</td>
                  <td className="check">Sí</td>
                  <td>Compartir con clientes o compañeros</td>
                </tr>
                <tr>
                  <td>Google Drive / Dropbox</td>
                  <td>Medio</td>
                  <td className="check">Sí</td>
                  <td>Archivos que se reutilizan varias veces</td>
                </tr>
                <tr>
                  <td>AirDrop (Apple)</td>
                  <td>Muy rápido</td>
                  <td className="cross">No</td>
                  <td>Mac → iPhone, sin cable</td>
                </tr>
                <tr>
                  <td>QR de Enscape Cloud</td>
                  <td>Instantáneo</td>
                  <td className="check">Sí</td>
                  <td>Demos en el momento, sin descargar nada</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="alert">
            <strong>Recomendación para talleres:</strong> transfiere por cable
            USB antes del taller. Los archivos 4K–8K pesan entre 5 y 20 MB.
            Depender de Wi-Fi durante una presentación puede generar retrasos.
          </div>
        </div>

        {/* SECCIÓN 4: Apps */}
        <div className="section">
          <div className="section-header">
            <span className="section-num">04</span>
            <span className="section-title">
              Aplicaciones para visualizar en el visor
            </span>
          </div>

          <div className="alert">
            Todas estas apps abren imágenes 360° y las dividen en dos para el
            efecto VR estereoscópico del visor. Algunas también permiten videos
            360°.
          </div>

          <div className="apps-grid">
            <div className="app-card featured">
              <div className="app-name">Simple360</div>
              <span className="app-badge used">En uso</span>
              <div className="app-desc">
                Visor de imágenes y videos 360° con modo Cardboard integrado.
                Interfaz mínima, abre archivos locales directamente. Ideal para
                presentaciones rápidas.
              </div>
              <div className="app-platforms">Android · iOS</div>
            </div>
            <div className="app-card">
              <div className="app-name">Google Cardboard</div>
              <span className="app-badge free">Gratis</span>
              <div className="app-desc">
                App oficial de Google. Incluye demos y permite abrir contenido
                VR de terceros. Escanea el QR del visor para calibrar
                automáticamente los lentes.
              </div>
              <div className="app-platforms">Android · iOS</div>
            </div>
            <div className="app-card">
              <div className="app-name">VeeR VR</div>
              <span className="app-badge free">Gratis</span>
              <div className="app-desc">
                Plataforma y visor de contenido 360°. Permite subir tus propias
                imágenes y compartirlas con un enlace. Modo Cardboard incluido.
              </div>
              <div className="app-platforms">Android · iOS</div>
            </div>
            <div className="app-card">
              <div className="app-name">Merge Explorer</div>
              <span className="app-badge free">Gratis</span>
              <div className="app-desc">
                App oficial del visor Merge. Optimizada para el hardware Merge
                VR/Mini. Incluye su propia galería de contenido 360° y
                educativo.
              </div>
              <div className="app-platforms">Android · iOS</div>
            </div>
            <div className="app-card">
              <div className="app-name">Panorama VR Viewer</div>
              <span className="app-badge free">Gratis</span>
              <div className="app-desc">
                Abre imágenes equirectangulares directamente de la galería del
                teléfono. Sin registro. Muy simple y directo para archivos
                locales.
              </div>
              <div className="app-platforms">Android</div>
            </div>
            <div className="app-card">
              <div className="app-name">Enscape (navegador)</div>
              <span className="app-badge free">Con cuenta</span>
              <div className="app-desc">
                Si exportaste desde Enscape Cloud, el enlace abre el panorama en
                el navegador del celular. Toca el ícono de Cardboard en la
                esquina inferior para activar el modo VR split-screen.
              </div>
              <div className="app-platforms">Android · iOS · Sin instalar</div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 5: Setup físico */}
        <div className="section">
          <div className="section-header">
            <span className="section-num">05</span>
            <span className="section-title">
              Configuración física del visor
            </span>
          </div>
          <div className="steps">
            <div className="step">
              <span className="step-num">1</span>
              <div className="step-content">
                <strong>Descargar la app y abrir la imagen</strong>
                <p>
                  Abre la app que vayas a usar (Simple360, Cardboard, etc.) y
                  carga la imagen 360° que exportaste. Asegúrate de que la
                  imagen se muestra como una esfera panorámica antes de meter el
                  teléfono al visor.
                </p>
              </div>
            </div>
            <div className="step">
              <span className="step-num">2</span>
              <div className="step-content">
                <strong>Activar el modo Cardboard / split-screen</strong>
                <p>
                  Busca el ícono de Cardboard dentro de la app (generalmente un
                  ícono de visor o dos círculos). Esto divide la pantalla en dos
                  mitades — una para cada ojo.
                </p>
              </div>
            </div>
            <div className="step">
              <span className="step-num">3</span>
              <div className="step-content">
                <strong>Insertar el teléfono en el visor</strong>
                <p>
                  Coloca el teléfono centrado en el compartimento del visor con
                  la pantalla hacia las lentes. La pantalla debe quedar alineada
                  con el centro de cada lente. Para el Merge VR, desliza el
                  teléfono por la ranura superior.
                </p>
                <div className="note">
                  📱 Quita la funda del celular antes de insertarlo si es muy
                  gruesa — puede impedir que la pantalla quede alineada con las
                  lentes.
                </div>
              </div>
            </div>
            <div className="step">
              <span className="step-num">4</span>
              <div className="step-content">
                <strong>Escanear el QR del visor (solo Cardboard)</strong>
                <p>
                  Si usas la app oficial de Google Cardboard, el primer uso pide
                  escanear el código QR impreso en el visor. Esto calibra
                  automáticamente la distorsión de lentes para tu modelo
                  específico de Cardboard.
                </p>
              </div>
            </div>
            <div className="step">
              <span className="step-num">5</span>
              <div className="step-content">
                <strong>Mirar y navegar</strong>
                <p>
                  Mueve la cabeza para mirar alrededor. La imagen sigue el
                  movimiento del giroscopio del teléfono. Para cambiar de
                  panorama o confirmar acciones, usa el botón magnético del
                  Cardboard o los botones laterales del Merge VR.
                </p>
                <div className="note">
                  ✅ Si la imagen se ve doble o desalineada, ajusta la posición
                  del teléfono hasta que las dos mitades coincidan correctamente
                  en cada ojo.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 6: Recursos */}
        <div className="section">
          <div className="section-header">
            <span className="section-num">06</span>
            <span className="section-title">Recursos y referencias</span>
          </div>

          <a
            className="yt-block"
            href="https://www.youtube.com/watch?v=38MQhlRx6xQ"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="yt-icon">▶</div>
            <div>
              <div className="yt-info-label">YouTube · Video directo</div>
              <div className="yt-info-title">
                Twinmotion to Google Cardboard 360° VR test
              </div>
              <div className="yt-info-sub">
                Flujo completo: exportación desde Twinmotion y visualización en
                Cardboard
              </div>
            </div>
          </a>

          <div className="resource-list">
            <a
              className="resource-link"
              href="https://dev.epicgames.com/documentation/en-us/twinmotion/export-settings-for-images-and-panoramas-in-twinmotion"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div>
                <div className="resource-link-title">
                  Configuración de exportación de panoramas — Twinmotion
                </div>
                <div className="resource-link-desc">
                  dev.epicgames.com · Documentación oficial de Epic Games sobre
                  resoluciones y formatos
                </div>
              </div>
              <span className="resource-link-arrow">→</span>
            </a>
            <a
              className="resource-link"
              href="https://blog.enscape3d.com/how-to-add-panoramas-to-your-workflow"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div>
                <div className="resource-link-title">
                  Cómo agregar panoramas a tu flujo — Enscape
                </div>
                <div className="resource-link-desc">
                  blog.enscape3d.com · Guía oficial de Enscape: tipos de
                  panorama y exportación
                </div>
              </div>
              <span className="resource-link-arrow">→</span>
            </a>
            <a
              className="resource-link"
              href="https://support.google.com/cardboard/answer/6295046?hl=en"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div>
                <div className="resource-link-title">
                  Configuración oficial de Google Cardboard
                </div>
                <div className="resource-link-desc">
                  support.google.com · Setup del visor y la app paso a paso
                </div>
              </div>
              <span className="resource-link-arrow">→</span>
            </a>
            <a
              className="resource-link"
              href="https://forums.cgarchitect.com/topic/77304-export-an-immersive-scene-for-google-cardboard-with-twinmotion/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div>
                <div className="resource-link-title">
                  Exportar escena inmersiva para Cardboard con Twinmotion
                </div>
                <div className="resource-link-desc">
                  forums.cgarchitect.com · Discusión con flujo de trabajo
                  detallado de la comunidad
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
