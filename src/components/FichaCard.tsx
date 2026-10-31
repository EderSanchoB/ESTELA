import type { CasoDeEstudio } from "@/data/casos-de-estudio";

const DIMENSION_ORDEN = [
  { key: "representacional", label: "Representacional" },
  { key: "participativa", label: "Participativa" },
  { key: "afectiva", label: "Afectiva" },
  { key: "narrativa", label: "Narrativa" },
] as const;

/**
 * Ficha de un caso de estudio: 500x750, imagen de fondo, fade negro
 * transparente encima y texto blanco — el mismo diseño que
 * ficha_C11_v2.html (ver COPIA 2026/02_ESPECIFICO 2 en el drive de la
 * tesis), portado a componente para poder generar las 16 fichas del
 * corpus desde datos en vez de 16 archivos HTML sueltos. Usa las mismas
 * tipografías que el resto del sitio (font-display / font-sans /
 * font-mono, cargadas una sola vez en layout.tsx) en lugar de repetir el
 * <link> de Google Fonts que tenía el HTML original.
 *
 * Siempre se renderiza a su tamaño natural (500x750); quien la use dentro
 * de un carrusel la escala con `transform: scale()` desde afuera, así el
 * contenido interno nunca tiene que recalcular tamaños de fuente.
 */
export default function FichaCard({ caso }: { caso: CasoDeEstudio }) {
  return (
    <div className="relative h-[750px] w-[500px] shrink-0 overflow-hidden rounded-[28px] bg-neutral-900">
      <img
        src={caso.imagen}
        alt={`${caso.titulo.join(" ")} — ${caso.subtitulo}`}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover object-[center_20%]"
      />

      {/* Fade negro transparente: casi nada arriba, casi opaco abajo,
          donde vive todo el texto. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.10) 20%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.72) 58%, rgba(0,0,0,0.90) 72%, rgba(0,0,0,0.97) 100%)",
        }}
      />

      <div className="absolute inset-0 flex flex-col px-5 pb-4 pt-[18px]">
        <span className="mb-auto self-start bg-white px-[11px] py-1 font-mono text-[9px] font-medium tracking-[0.08em] text-neutral-900">
          {caso.codigo.replace("-", " — ")}
        </span>

        <div className="flex flex-col gap-[11px]">
          <div>
            <div className="mb-[5px] font-mono text-[8px] tracking-[0.10em] text-white/55">
              {caso.ambito}
            </div>
            <div className="mb-[5px] font-display text-xl font-bold leading-[1.12] tracking-[-0.01em] text-white">
              {caso.titulo.map((linea, i) => (
                <span key={i}>
                  {i > 0 && <br />}
                  {linea}
                </span>
              ))}
            </div>
            <div className="font-mono text-[8px] tracking-[0.04em] text-white/40">
              {caso.subtitulo}
            </div>
          </div>

          <div className="h-px bg-white/10" />

          <div>
            <div className="mb-1 font-mono text-[7px] font-medium tracking-[0.14em] text-white/45">
              Descripción
            </div>
            <div className="font-sans text-[10px] font-light leading-[1.55] text-white/80">
              {caso.descripcion}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-[10px]">
            <div>
              <div className="mb-1 font-mono text-[7px] font-medium tracking-[0.14em] text-white/45">
                Tecnología
              </div>
              <div className="font-sans text-[10px] font-light leading-[1.55] text-white/80">
                {caso.tecnologia}
              </div>
            </div>
            <div>
              <div className="mb-1 font-mono text-[7px] font-medium tracking-[0.14em] text-white/45">
                Contexto de aplicación
              </div>
              <div className="font-sans text-[10px] font-light leading-[1.55] text-white/80">
                {caso.contexto}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-[10px]">
            <div>
              <div className="mb-1 font-mono text-[7px] font-medium tracking-[0.14em] text-white/45">
                Fase del proceso
              </div>
              <div className="font-sans text-[10px] font-light leading-[1.55] text-white/80">
                {caso.fase}
              </div>
            </div>
            <div>
              <div className="mb-1 font-mono text-[7px] font-medium tracking-[0.14em] text-white/45">
                Tipo de usuario
              </div>
              <div className="font-sans text-[10px] font-light leading-[1.55] text-white/80">
                {caso.tipoUsuario}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1 font-mono text-[7px] font-medium tracking-[0.14em] text-white/45">
              Dimensiones de inmersión
            </div>
            <div className="flex flex-wrap gap-[5px]">
              {DIMENSION_ORDEN.map(({ key, label }) => {
                const on = caso.dimensiones[key];
                return (
                  <span
                    key={key}
                    className={`font-mono text-[8px] ${
                      on
                        ? "border border-white/75 text-white"
                        : "border border-white/[0.18] text-white/20"
                    } px-[9px] py-[3px]`}
                  >
                    {on ? "●" : "○"} {label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
